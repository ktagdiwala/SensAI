require('dotenv').config();	// Load environment variables, make sure .env file exists
const express = require('express');
const app = express();
app.use(express.urlencoded({ extended: true }));
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
// Used because the database connection does not establish immediately on script load
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
})();

// Export a function to handle database test queries
async function testDatabaseConnection() {
	if (!conn) {
		// Get a fresh connection from the pool if needed
		conn = await pool.getConnection();
		console.log("New DB connection established for test.")
	}
	try {
		let sql = "SELECT CURDATE()";
		let sql2 = 'SELECT * FROM course'
		const [rows] = await conn.query(sql2);
		return rows;
	} catch (error) {
		throw error;
	}
}

// Export the pool of connection for use in other modules
module.exports = {
	pool,
	testDatabaseConnection
};