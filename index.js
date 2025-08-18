import express from "express";
import { Pool } from "pg";
import bodyParser from "body-parser";
import axios from "axios";
import dotenv from "dotenv";
import session from "express-session";
import passport from "passport";
import GoogleStrategy from "passport-google-oauth2";
import { Strategy } from "passport-local";
import bcrypt from "bcrypt";
import flash from "express-flash";

const app = express();
const port = process.env.PORT || 3000;
dotenv.config({ path: "./.env" });

import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  })

);

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

const pool = new Pool({
 connectionString: process.env.DATABASE_URL,
  // ssl: {
  //   rejectUnauthorized: false,
  // },
});

db.connect()
  .then(() => console.log("Database Connected Successfully"))
  .catch(err => {
    console.error("Error connecting Database", err.message);

    process.exit(1);

  });

app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
})

app.get("/", async (req, res) => {
  const sortBy = req.query.sort;
  const searchTerm = req.query.q;
  const page = parseInt(req.query.page) || 1;
  const limit = 8;
  const offset = (page - 1) * limit;

  let baseQuery = "SELECT * FROM bookitems WHERE status = $1";
  const values = ["public"];
  let bookCountQuery = "Select count(*) from bookitems where status = $1";

  if (searchTerm) {
    baseQuery += " AND title ILIKE $2";
    bookCountQuery += " AND title ILike $2";
    values.push(`%${searchTerm}%`);
  }

  if (sortBy === "title") {
    baseQuery += " ORDER BY title ASC";
  } else if (sortBy === "rating") {
    baseQuery += " ORDER BY rating DESC";
  }
  baseQuery += ` Limit ${limit} Offset ${offset}`;

  try {
    const result = await db.query(baseQuery, values);
    const books = result.rows;
    const countQueryResult = await db.query(bookCountQuery, values);
    const totalBooks = parseInt(countQueryResult.rows[0].count);
    const totalPages = Math.ceil(totalBooks / limit);

    res.render("index.ejs", {
      book: books,
      searchTerm: searchTerm || "",
      totalPages: totalPages,
      currentPage: page,
      sortBy: sortBy,
    });
  } catch (err) {
    console.error("Error while fetching books in / ", err);
    res.status(500).send("Error Loading Books")
  }

});

app.get("/add", async (req, res) => {
  if (req.isAuthenticated()) {
    res.render("add.ejs", {
      book: {
        isbn: "",
        rating: "",
        status: "",
        summary: "",
        notes: "",
      },
      error: null
    });

  } else {
    req.session.error = "Login to add book";

    res.redirect("/signup#login");

  }
});

app.post("/add", async (req, res) => {
  const { isbn, rating, summary, notes, status, id } = req.body;
  const imageUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;

  if (!req.user) {
    return res.redirect("/signup#login");
  }

  if (id) {
    try {
      await db.query(
        `UPDATE bookitems 
         SET rating = $1, summary = $2, notes = $3, isbn = $5, image = $6, status = $7, user_id = $8 
         WHERE id = $4`,
        [rating, summary, notes, id, isbn, imageUrl, status, req.user.id]
      );
      res.redirect("/");
    } catch (err) {
      console.error("Error updating book:", err.message);
      res.render("add.ejs", {
        error: "Failed to update book. Please try again.",
      });
    }
  } else {
    try {
      const response = await axios.get(`https://openlibrary.org/isbn/${isbn}.json`);
      const data = response.data;

      let authorName = "Unknown";
      if (data.authors?.[0]?.key) {
        const authorRes = await axios.get(`https://openlibrary.org${data.authors[0].key}.json`);
        authorName = authorRes.data.name;
      }

      await db.query(
        `INSERT INTO bookitems 
        (title, author, rating, isbn, summary, notes, image, status, user_id) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          data.title,
          authorName,
          rating,
          isbn,
          summary,
          notes,
          imageUrl,
          status,
          req.user.id,
        ]
      );

      res.redirect("/");
    } catch (err) {
      console.error("Failed to fetch book data:", err.message);
      res.render("add.ejs", {
        error: "Failed to fetch book details. Please check ISBN.",
      });
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
      book: data.rows,
      searchTerm: "",
      totalPages: "",
    });
  } catch (err) {
    console.error("Error deleting book:", err.message);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/edit/:id", async (req, res) => {
  const id = req.params.id;
  if (isNaN(id)) {
    return res.status(400).send("Invalid book ID");
  }
  try {
    const result = await db.query("SELECT * FROM bookitems WHERE id = $1;", [
      id,
    ]);
    console.log(result.rows[0]);
    res.render("add.ejs", {
      book: result.rows[0],
    });
  } catch (err) {
    console.error("Error fetching book:", err.message);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/viewBook/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const user_id = req.user? req.user.id : null;
  console.log(user_id);
  if (isNaN(id)) {
    return res.status(400).send("Invalid book ID");
  }
  try {
    const result = await db.query("SELECT * FROM bookitems WHERE id = $1;", [
      id,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).send("Book not found");
    }
    res.render("viewBook.ejs", {
      book: result.rows[0],
      user_id: user_id,
    });
  } catch (err) {
    console.error("Error fetching book:", err.message);

    res.status(500).send("Internal Server Error");

  }
});

app.get("/myBooks", async (req, res) => {
  try{
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.redirect("/signup#login");
  }else{
    const sortBy = req.query.sort;
  const searchTerm = req.query.q;
  const page = parseInt(req.query.page) || 1;
  const limit = 8;
  const offset = (page - 1) * limit;

  let baseQuery = "SELECT * FROM bookitems WHERE user_id = $1";
  const values = [req.user.id];
  let bookCountQuery = "Select count(*) from bookitems where user_id = $1";

  if (searchTerm) {
    baseQuery += " AND title ILIKE $2";
    bookCountQuery += " AND title ILike $2";
    values.push(`%${searchTerm}%`);
  }
  if (sortBy === "title") {
    baseQuery += " ORDER BY title ASC";
  } else if (sortBy === "rating") {
    baseQuery += " ORDER BY rating DESC";
  }
  baseQuery += ` Limit ${limit} Offset ${offset}`;

    const result = await db.query(baseQuery, values);
    const books = result.rows;
    const countQueryResult = await db.query(bookCountQuery, values);
    const totalBooks = parseInt(countQueryResult.rows[0].count);
    const totalPages = Math.ceil(totalBooks / limit);
  res.render("myBooks.ejs", {
    book: books,
    searchTerm: searchTerm || "",
    totalPages: totalPages,
    currentPage: page,
    sortBy: sortBy
  })
  }

  
}catch (err) {
    console.error("Error while fetching books in /myBooks ", err);
    res.status(500).send("Error Loading Books")
  }
});

app.get("/exploreBooks", async (req, res) => {
  const sortBy = req.query.sortBy;
  const searchTerm = req.query.q;
  const limit = 8;
  const page = parseInt( req.query.page) || 1 ;
  const offset = (page - 1) * limit;

  let baseQuery = "Select * from bookitems where status = $1 ";
  let values = ["public"];
  let bookCountQuery = "Select count(*) from bookitems where status = $1 ";

  if (searchTerm) {
    baseQuery += "and title ILike $2";
    bookCountQuery += "And title ILike $2";
    values.push(`%${searchTerm}%`);
  }
  if (sortBy) {
    if (sortBy == "title") {
      baseQuery += "Order by title ASC";
    } else if (sortBy == "rating") {
      baseQuery += "Order by rating DESC";
    }
  }
  baseQuery += ` Limit ${limit} offset ${offset}`;
  try {
    const result = await db.query(baseQuery, values);
    const data = result.rows;
    const countQueryResult = await db.query(bookCountQuery, values);
    const totalBooks = parseInt(countQueryResult.rows[0].count);
    const totalPages = Math.ceil( totalBooks / limit);

    res.render("exploreBooks.ejs", {
      book: data,
      searchTerm: searchTerm || "",
      totalPages: totalPages,
      currentPage: page,
      sortBy: sortBy
    })
  } catch (err) {
    console.error("Error while Sorting: ", err);
  }
});

app.get("/howItWork", (req, res) => {
  res.render("howItWork.ejs");
});

app.get("/signup", (req, res) => {
  const error = req.session.error;
  req.session.error = null;
  res.render("signup.ejs", { error });
});

app.post("/signup", async (req, res) => {
  const { fName, lName, email, password } = req.body;
  try {
    const result = await db.query("Select * from users where email = $1", [
      email,
    ]);
    if (result.rows.length > 0) {
      return res.redirect("/signup#login");
    } else {
      const hashedPassword = await bcrypt.hash(password, 13);
      await db.query(
        "INSERT INTO users (fName, lName, email, password) VALUES ($1, $2, $3, $4)",
        [fName, lName, email, hashedPassword]
      );
      return res.redirect("/myBooks");
    }

  } catch (err) {
    console.error(err);
    res.status(500).send("Something went wrong during signup");
  }
});

app.get("/logout", (req, res) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  })
})

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/myBooks",
    failureRedirect: "/signup#login",
  })
);

passport.use(
  "local",
  new Strategy({ usernameField: "email", passwordField: "password" },
    async function verify(email, password, cb) {
      try {
        const result = await db.query("Select * from users where email=$1", [
          email,
        ]);
        if (result.rows.length > 0) {
          const user = result.rows[0];
          const hashedPassword = user.password;
          bcrypt.compare(password, hashedPassword, (err, valid) => {
            if (err) {
              console.error("Error comparing password: ", err);
              return cb(err);
            } else {
              if (valid) {
                return cb(null, user);
              } else {
                return cb(null, false);
              }
            }
          });

        } else {
          return cb(null, false, { message: "User not found" });
        }
      } catch (err) {
        console.error("err");
      }
    })
);

app.get("/auth/google", passport.authenticate("Google",
  {
    scope: ["profile", "email"]
  }
));

app.get("/auth/google/squeezebook",
  passport.authenticate("Google", {
    successRedirect: "/myBooks",
    failureRedirect: "/signup"
  }),
);



passport.use("Google",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "https://squeezebook.onrender.com/auth/google/squeezebook",
    }, async function (accessToken, refreshToken, profile, cb) {
      const email = profile.emails?.[0]?.value || "";
      const photo = profile.photos?.[0]?.value || "";
      const fName = profile.given_name;
      const lName = profile.family_name;
      try {
        // console.log(profile);
        const result = await db.query("SELECT * FROM users WHERE email = $1", [
          email
        ]);
        if (result.rows.length === 0) {
          const newUser = await db.query(
            "INSERT INTO users (fName, lName, email, password, profile_pic) VALUES ($1, $2,$3, $4, $5)",
            [fName, lName, email, "oAuth", photo]
          );
          return cb(null, newUser.rows[0]);
        } else {
          return cb(null, result.rows[0]);
        }
      } catch (err) {
        return cb(err);
      }
    })
)

passport.serializeUser((user, cb) => {
  cb(null, user.id);
});

passport.deserializeUser(async (id, cb) => {
  const result = await db.query("SELECT * FROM users WHERE id = $1", [id]);
  console.log(result.rows[0]);
  cb(null, result.rows[0]);
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}.`);
});