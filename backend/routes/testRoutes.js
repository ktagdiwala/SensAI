const express = require('express');
const router = express.Router();
const { pool } = require('../config/dbConnection');

// DELETE /test/cleanup-attempts
// Delete all attempts for a specific user (used by E2E tests)
router.delete('/cleanup-attempts', async (req, res) => {
	const { userId } = req.body;
	
	if (!userId) {
		return res.status(400).json({ message: 'userId is required' });
	}

	try {
		await pool.query('DELETE FROM question_attempt WHERE userId = ?', [userId]);
		return res.status(200).json({ message: 'Attempts deleted successfully' });
	} catch (error) {
		console.error('Error deleting attempts:', error);
		return res.status(500).json({ message: 'Error deleting attempts' });
	}
});

// DELETE /test/cleanup-user
// Delete a specific user (used by E2E tests)
router.delete('/cleanup-user', async (req, res) => {
	const { userId } = req.body;
	
	if (!userId) {
		return res.status(400).json({ message: 'userId is required' });
	}

	try {
		await pool.query('DELETE FROM user WHERE userId = ?', [userId]);
		return res.status(200).json({ message: 'User deleted successfully' });
	} catch (error) {
		console.error('Error deleting user:', error);
		return res.status(500).json({ message: 'Error deleting user' });
	}
});

module.exports = router;
