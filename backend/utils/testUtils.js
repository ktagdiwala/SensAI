const { pool } = require('../config/dbConnection');

/**
 * Delete all attempts for a specific user (used by E2E tests)
 * @param {number} userId - The user ID
 * @returns {Object} Result of the delete operation
 */
async function cleanupUserAttempts(userId) {
    try {
        const [result] = await pool.query('DELETE FROM question_attempt WHERE userId = ?', [userId]);
        return { success: true, deletedRows: result?.affectedRows ?? 0 };
    } catch (error) {
        console.error('Error deleting attempts:', error);
        throw error;
    }
}

/**
 * Delete a specific user (used by E2E tests)
 * @param {number} userId - The user ID
 * @returns {Object} Result of the delete operation
 */
async function cleanupUser(userId) {
    try {
        const [result] = await pool.query('DELETE FROM user WHERE userId = ?', [userId]);
        return { success: true, deletedRows: result?.affectedRows ?? 0 };
    } catch (error) {
        console.error('Error deleting user:', error);
        throw error;
    }
}

module.exports = {
    cleanupUserAttempts,
    cleanupUser
};
