const express = require('express');
const router = express.Router();
const db = require('../config/dbConnection'); // Import the DB connection
const bcrypt = require('bcrypt'); // For password verification
const jwt = require('jsonwebtoken'); // For token generation
require('dotenv').config(); // Load environment variables
const session = require('express-session');

// Load secret key from environment variable (sing dotenv)
const SECRET_KEY = process.env.JWT_SECRET;

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

// TODO: Session management for specific page access
// /** verifySession
//  * Middleware to verify if a user is logged in via session.
//  * @param {string} directPath - The path to continue to if session is valid.
//  * @return 
//  */
// function verifySession(directPath){
// 	return (req,res,next) =>{
// 		if(req.session && req.session.userId){
// 			// Session is valid, proceed to directPath
// 			return res.redirect(directPath);
// 		}else{
// 			// No valid session, redirect to login
// 			return res.redirect('/login');
// 		}
// 	}
// }

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

		const [rows] = await db.pool.query(query, [email]);
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

        // Generate a JSON Web Token (JWT)
        const token = jwt.sign(
            { userId: user.userId, email: user.email },
            SECRET_KEY,
            // { expiresIn: '1h' }
        );

		console.log("User logged in successfully: ", email);
		const url = roleRedirect(user.roleName);
		console.log("Redirecting to: ", url);

        // Success Response
        return res.status(200).json({
            message: 'Login successful',
            token: token,
            userId: user.userId,
			userRole: user.roleName,
			redirectUrl: url
        });

    } catch (error) {
        console.error('Server error during login:', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
});

// Export the router
module.exports = router;