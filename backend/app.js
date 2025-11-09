require('dotenv').config();
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.urlencoded({extended:true}));
const mysql = require('mysql2/promise');

const dbhost = process.env.DB_HOST || "localhost";
const dbuser = process.env.DB_USER;
const dbpass = process.env.DB_PASS;

// Setting up database connection pool
const pool = mysql.createPool({
  host: dbhost,
  user: dbuser,
  password: dbpass,
  database: "sensai",
  connectionLimit: 10,
  waitForConnections: true,
});
let conn = null;

// IIFE (Immediately invoked function expression) to handle asynchronous setup tasks
(async () => {
  try {
    conn = await pool.getConnection();
    console.log("Database connection established.");
    // Release the connection back to the pool after the check
    conn.release(); 
  } catch (error) {
    console.error("Error connecting to the database:", error.message);
    // Exit the process if the initial connection fails
    process.exit(1); 
  }

  // Start server after database connection setup
  app.listen(PORT, () => {
    console.log('Server is running on port ' + PORT)
  });
})();

app.get("/dbTest", async(req, res) => {
    let sql = "SELECT CURDATE()";
    const [rows] = await conn.query(sql);
    res.send(rows);
});//dbTest


app.get('/', (req, res) => {
    res.send('This is the SensAI backend.');
})

app.listen(PORT, () => {
    console.log('Server is running on port ' + PORT)
})

