const {getChatResponse} = require('../utils/geminiUtils');
const {verifySession} = require('../middleware/sessionMiddleware');
const router = require('express').Router();

// Generates a response using Gemini API
router.get('/gemini', verifySession, async (req, res) => {
	const { userId } = req.session;
	// get the studentMessage, quizId, questionId, and chatHistory from the body
	const { studentMessage, quizId, questionId, chatHistory } = req.body;
	if (!studentMessage || !quizId || !questionId) {
		return res.status(400).json({ message: 'Student message, quiz ID, and question ID are required.' });
	}
	try {
		const response = await getChatResponse(userId, studentMessage, quizId, questionId, chatHistory);
		res.json({ response });
	} catch (error) {
		console.log(error);
		res.status(500).json({ message: 'Error generating response.' });
	}
});

module.exports = router;