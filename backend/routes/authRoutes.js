const express = require('express');
const router = express.Router();
const { pool } = require('../config/dbConnection'); // Import the DB connection
const bcrypt = require('bcrypt'); // For password verification
require('dotenv').config(); // Load environment variables
const {createSession, deleteSession} = require('../utils/sessionUtils')
const {verifySession} = require('../middleware/sessionMiddleware');

// === Business Logic Functions ===

/** verifyPassword
* Verifies a plaintext password against a stored hash using bcrypt.
* @param {string} plaintextPassword - the password provided by user during login
* @param {string} storedHash - the hashed password stored in the database
* @return {Promise<boolean>}
*/
async function verifyPassword(plaintextPassword, storedHash) {
    // Returns true if the passwords match, false otherwise.
    return await bcrypt.compare(plaintextPassword, storedHash);
}

/** roleRedirect
 * @param {string} roleName - The name of the user's role
 * @returns {string} - The path to redirect based on role
 */
function roleRedirect(roleName){
	switch(roleName){
		case "Instructor":
			return '/instructors';
		case "Student":
			return '/students';
		default:
			return '/';
	}
}

// === Route Definition ===

// POST /login (Path accessed as /api/login)
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        // Find the user in the database
        const query = 'SELECT userId, email, password, user.roleId, role.name AS roleName FROM user JOIN role ON user.roleId = role.roleId WHERE email = ? ';

		const [rows] = await pool.query(query, [email]);
		if(rows.length === 0){
            return res.status(401).json({ message: 'User not found.' });
        }
        const user = rows[0];
        const storedHash = user.password;

        // Verify the password using bcrypt
        const isMatch = await verifyPassword(password, storedHash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        // Generate a session for the user
		const sessionId = await createSession(user.userId);
		if(!sessionId){
			return res.status(500).json({ message: 'Error creating user session.' });
		}

		console.log("User logged in successfully: ", email);
		const url = roleRedirect(user.roleName);
		console.log("Redirecting to: ", url);

		// Browser stores sessionId as a cookie so it is sent with future requests
		res.cookie('sessionId', sessionId, {httpOnly: true, secure: false, sameSite: 'lax'});

        // Success Response
        return res.status(200).json({
            message: 'Login successful',
            userId: user.userId,
			userRole: user.roleName,
			redirectUrl: url
        });

    } catch (error) {
        console.error('Server error during login:', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
});

router.post('/logout', async (req, res) => {
	const {sessionId} = req.cookies;
	if (!sessionId){
		return res.status(400).json({message: 'No active session'});
	}
	await deleteSession(sessionId);
	res.clearCookie('sessionId');
	return res.status(200).json({message: "Logout successful."});
});

// GET /me (Path accessed as /api/me)
// Public endpoint to check if user is authenticated (can be used by the frontend)
// TODO: Use verifySession from sessionMiddleware.js for routes that should only be accessible to authenticated users
router.get('/me', verifySession, (req, res) => {
	// If we reach here, the middleware validated the session
	// req.session will have {sessionId, userId, createdAt, expiresAt}
	return res.status(200).json({
		userId: req.session.userId,
		createdAt: req.session.createdAt,
		expiresAt: req.session.expiresAt
	});
});

// Export the router
module.exports = router;