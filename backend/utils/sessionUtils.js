const { pool } = require('../config/dbConnection'); // Import the DB connection

/** generateSessionId
 * Generates a secure random session ID.
 * @return {string} - A random session ID.
 */
function generateSessionId(){
	return require('crypto').randomBytes(32).toString('hex');
}

/** createSession
 * Creates a new user session and stores it in the database.
 * @param {int} userId
 */
async function createSession(userId){
	const sessionId = generateSessionId();
	const sql = 'INSERT INTO session (sessionId, userId) VALUES (?, ?)';

	try {
		// Store session in database
		const [result] = await pool.query(sql, [sessionId, userId]);

		// Success response
		return sessionId;

	} catch (error) {
		console.error("Error creating session:", error);
		return null;
	}
}

/** validateSession
 * Validates if a session is valid and not expired.
 * @param {string} sessionId
 * @return 
 */
async function validateSession(sessionId){
	const sql = 'SELECT session.*, user.userId, role.name as userRole FROM session JOIN user ON session.userId = user.userId JOIN role ON user.roleId = role.roleId WHERE sessionId = ? AND expiresAt > NOW()';

	try{
		const [result] = await pool.query(sql, [sessionId]);

		if(result.length ===0){
			return null;
		}
		return result[0];
	} catch (error) {
		console.error("Error validating session:", error);
		return null;
	}
}


/** deleteSession
 * Deletes a user session from the database. Either on logout or expiration.
 * @param {string} sessionId
 */
async function deleteSession(sessionId){
	const sql = 'DELETE FROM session WHERE sessionId = ?';
	try{
		const [result] = await pool.query(sql, [sessionId]);
	}catch (error){
		console.error("Error deleting session:", error);
	}
}

module.exports = {
	createSession,
	validateSession,
	deleteSession
};