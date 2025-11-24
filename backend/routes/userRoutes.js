const express = require('express');
const router = express.Router();
const { verifySession } = require('../middleware/sessionMiddleware');
const {hasUserApiKey,
	getUserById,
	updateUser
} = require('../utils/userUtils');

// =====================
// User Profile Routes
// =====================

/** GET /api/user/profile
 * Retrieves the current user's profile information (requires authentication)
 * @returns {object} - User profile data (without sensitive info like password/apiKey)
 */
router.get('/user/profile', verifySession, async (req, res) => {
	try {
		const { userId } = req.session;
		const user = await getUserById(userId);

		if (!user) {
			return res.status(404).json({ message: 'User not found' });
		}

		return res.status(200).json({
			success: true,
			user: user
		});
	} catch (error) {
		console.error('Error retrieving user profile:', error);
		return res.status(500).json({ message: 'Internal server error' });
	}
});

/** PUT /user 
 * Updates the current user's profile information (requires authentication)
 * @param {object} req.body - { name: string, email: string, password: string, apiKey: string }
 * All fields are optional; only provided fields will be updated.
 * @returns {object} - Success message
*/
router.put('/user', verifySession, async (req, res) => {
	try {
		const { userId } = req.session;
		const { name, email, password, apiKey } = req.body;
		const updatedUser = await updateUser(userId, name, email, password, apiKey);

		if (!updatedUser) {
			return res.status(404).json({ message: 'User not found or no changes made' });
		}
		return res.status(200).json({
			success: true,
			message: 'User profile updated successfully'
		});

	} catch (error) {
		if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Email already registered.' });
        }
		console.error('Error updating user profile:', error);
		return res.status(500).json({ message: 'Internal server error' });
	}
});

/** GET /api/user/has-api-key
 * Checks if the current user has an API key set (useful for frontend UI)
 * This endpoint returns a boolean without exposing the actual key
 * @returns {object} - { hasApiKey: boolean }
 */
router.get('/user/has-api-key', verifySession, async (req, res) => {
	try {
		const { userId } = req.session;

		const hasKey = await hasUserApiKey(userId);

		return res.status(200).json({
			success: true,
			hasApiKey: hasKey
		});
	} catch (error) {
		console.error('Error checking API key status:', error);
		return res.status(500).json({ message: 'Internal server error' });
	}
});

module.exports = router;
