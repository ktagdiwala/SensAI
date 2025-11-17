const express = require('express');
const router = express.Router();
const { pool } = require('../config/dbConnection');
const bcrypt = require('bcrypt'); // For password hashing
require('dotenv').config(); // Load environment variables

// === Business Logic Functions ===

/** hashPassword
* Hashes a plaintext password for secure storage.
* @param {string} plaintextPassword - The password to hash.
* @returns {Promise<string>} The resulting password hash.
*/
async function hashPassword(plaintextPassword) {
    const saltRounds = parseInt(process.env.SALT_ROUNDS) || 10; // Standard cost factor (higher is slower, more secure)
    return await bcrypt.hash(plaintextPassword, saltRounds);
}

/** getRoleId
* Determines roleId based on role string
* @param {string} role - The role name (e.g., "Instructor", "Student")
* @returns {Promise<number|null>} The roleId or null if not found
*/
async function getRoleId(role) {
	const query = 'SELECT roleId FROM role WHERE name = ?';
	try {
		const [rows] = await pool.query(query, [role]);
		if (rows.length === 0) {
			console.log("Role not found for: ", role);
			return null;
		}
		return rows[0].roleId;
	} catch (error) {
		console.error("Error fetching role ID:", error);
		throw error;
	}
}

// === Route Definition ===

// POST /register (Path accessed as /api/register)
router.post('/register', async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    try {
        // Hash the password
        const passwordHash = await hashPassword(password);

		// Determine roleId from string
		const roleId = await getRoleId(role);
		if (!roleId) {
			// Return error if role is invalid
			return res.status(400).json({ message: 'Invalid role specified.' });
		}

        // Insert the new user into the database
        const sql = 'INSERT INTO user (name, email, password, roleId) VALUES (?, ?, ?, ?)';

		const [result] = await pool.query(sql, [name, email, passwordHash, roleId]);

        // Success Response
		console.log("User registered successfully: ", email);
        return res.status(201).json({
            message: 'User registered successfully',
            email: email,
            userId: result.insertId
        });

    } catch (error) {
        console.error('Registration error:', error.message);

        // Handle specific error message for the frontend
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Email already registered.' });
        }

        return res.status(500).json({ message: 'Internal server error during registration.' });
    }
});

// Export the router
module.exports = router;