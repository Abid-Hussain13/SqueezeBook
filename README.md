**SqueezeBook Introduction**
SqueezeBook is like your personal site where you can write note about book you have read. It is very difficult to memorize important point you have read in book so by using this site you don't need to memorize it but when needed you can see through your notes. You can add new books by isbn number and start writing his notes as well. SqueezeBook is a simple and elegant web application that allows users to view, search, and sort through summarized notes of books. Each book entry includes a title, cover image, summary, rating, and created date.


**💡 Features**

📖 View summarized book notes
🔍 Search books by title
🔠 Sort books alphabetically
⭐ Personal ratings for each book
➕ Add new book summaries
🎨 Clean and responsive UI using Bootstrap
🧠 Summaries designed to capture the essence of each book


**🛠️ Tech Stack**

Frontend: HTML, CSS, Bootstrap, EJS
Backend: Node.js, Express.js
Database: PostgreSQL
Templating: EJS

**⚙️ How to Run Locally**

Clone the repository
git clone https://github.com/your-username/SqueezeBook.git
bash:
cd SqueezeBook
Install dependencies

npm install

Set up your PostgreSQL database

1. Create a database named squeezebook (or as per your configuration)
2. Create a table named bookitems with fields:

sql:
CREATE TABLE bookitems (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  image TEXT,
  summary TEXT,
  rating INTEGER,
  created_date DATE DEFAULT CURRENT_DATE
);

Configure environment (optional)
If you're using environment variables, create a .env file:

ini:
DATABASE_URL=your_database_url
PORT=3000

Run the app

bash:
node index.js
Open in browser

Visit: http://localhost:3000

🧑‍💻 Author
Muhammad Abid
