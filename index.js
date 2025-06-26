import express from "express";
import pg from "pg";
import bodyParser from "body-parser";
import axios from "axios";
import dotenv from "dotenv";
import session from "express-session";

const app = express();
const port = 3000;
dotenv.config({ path: "./env.env" });

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let db;
try {
  db = new pg.Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT),

  });
  db.connect();
} catch (err) {
  console.error("Error connecting Database", err.message);
}

app.use(session({
  secret: 'your-secret-key',  
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } 
}));

app.get("/", async (req, res) => {
  const result = await db.query("SELECT * FROM bookitems");
  const data = result.rows;
  res.render("index.ejs",
    {
      book: data,
      searchTerm : ''
    }
  );
});

app.get("/add", async (req, res) => {
  res.render("add.ejs",{
    book : null
  });
});

app.post("/add", async (req, res) => {
  const { isbn, rating, summary, notes } = req.body;
  //   9781501197277
  if(req.body.id){
    await db.query("update bookitems set rating = $1, summary = $2, notes = $3,isbn = $5, image = $6 where id = $4", 
      [rating, summary, notes, req.body.id, isbn, `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`]);
    const result = await db.query("SELECT * FROM bookitems");
    const book = result.rows;
    req.session.bookData = req.body;
    res.render("index.ejs", {
      book: book,
    })
  }
  else{
    try {
      const response = await axios.get(`https://openlibrary.org/isbn/${isbn}.json`);
      const data = response.data;
      console.log(data);
      // Get author name
      let authorName = "Unknown";
      if (data.authors && data.authors[0] && data.authors[0].key) {
        const authorRes = await axios.get(`https://openlibrary.org${data.authors[0].key}.json`);
        authorName = authorRes.data.name;
      }
      await db.query(
        "INSERT INTO bookitems (title, author, rating, isbn, summary, notes, image) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;",
        [data.title, authorName, rating, isbn, summary, notes, `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`]
      );
      const result = await db.query("SELECT * FROM bookitems");
      const book = result.rows;
      req.session.bookData = req.body;
      res.render("index.ejs", {
        book: book,
      })
    } catch (err) {
      console.error("Failed to fetch book data:", err.message);
      res.render("add.ejs", { error: "Failed to fetch book details. Please check ISBN." });
    }
  }
  
});

app.get("/delete/:id", async (req, res) => {
  const id = req.params.id;
  if (isNaN(id)) {
    return res.status(400).send("Invalid book ID");
  }
  try {
    await db.query("DELETE FROM bookitems WHERE id = $1;", [id]);
    const data = await db.query("select * from bookitems;");
    res.render("index.ejs", {
      book: data.rows
    })
  } catch (err) {
    console.error("Error deleting book:", err.message);
    res.status(500).send("Internal Server Error");
  }
})

app.get("/edit/:id", async (req, res) => {
  const id = req.params.id;
  if (isNaN(id)) {
    return res.status(400).send("Invalid book ID");
  }
  try {
    const result = await db.query("SELECT * FROM bookitems WHERE id = $1;", [id]);
    res.render("add.ejs", {
      book: result.rows[0]
    });
  } catch (err) {
    console.error("Error fetching book:", err.message);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/sortByTitle", (req, res) =>{
  const query = "SELECT * FROM bookitems ORDER BY title ASC";
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching books:", err);
      return res.status(500).send("Database error");
    }
    res.render("index.ejs", { 
      book: results.rows,
      searchTerm : ''
     });
  });
})

app.get("/sortByRating",async (req, res) => {
  const result = await db.query("SELECT * FROM bookitems ORDER BY rating DESC");
  const data = result.rows;
  res.render("index.ejs", {
    book: data,
    searchTerm : ''
  });
})

app.get("/search", async (req, res) => {
  const searchTerm = req.query.query;
  const result = await db.query("SELECT * FROM bookitems WHERE title ILIKE $1", [`%${searchTerm}%`]);
  const data = result.rows;
  res.render("index.ejs", {
    book: data,
    searchTerm : searchTerm
  });
})

app.get("/viewBook/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    return res.status(400).send("Invalid book ID");
  }

  try {
    const result = await db.query("SELECT * FROM bookitems WHERE id = $1;", [id]);

    if (result.rows.length === 0) {
      return res.status(404).send("Book not found");
    }

    res.render("viewBook.ejs", {
      book: result.rows[0]
    });
  } catch (err) {
    console.error("Error fetching book:", err.message);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}.`);
})