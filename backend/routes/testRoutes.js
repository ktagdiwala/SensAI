const express = require('express');
const router = express.Router();
const { cleanupUserAttempts, cleanupUser } = require('../utils/testUtils');

// DELETE /test/cleanup-attempts
// Delete all attempts for a specific user (used by E2E tests)
router.delete('/cleanup-attempts', async (req, res) => {
	const { userId } = req.body;
	
	if (!userId) {
		return res.status(400).json({ message: 'userId is required' });
	}

	try {
		const result = await cleanupUserAttempts(userId);
		return res.status(200).json({ 
			message: 'Attempts deleted successfully',
			deletedRows: result.deletedRows 
		});
	} catch (error) {
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
		const result = await cleanupUser(userId);
		return res.status(200).json({ 
			message: 'User deleted successfully',
			deletedRows: result.deletedRows 
		});
	} catch (error) {
		return res.status(500).json({ message: 'Error deleting user' });
	}
});

module.exports = router;
