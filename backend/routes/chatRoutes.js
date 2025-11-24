const {getResponse} = require('../utils/geminiUtils');
const router = require('express').Router();

// Example function to generate a response using Gemini API
// GET /chat
// router.get('/chat', verifySession, async (req, res) => {
router.get('/gemini', async (req, res) => {
	// get the prompt from the body
	const { prompt } = req.body;
	if (!prompt) {
		return res.status(400).json({ message: 'Prompt is required.' });
	}
	try {
		const response = await getResponse(prompt);
		res.json({ response });
	} catch (error) {
		res.status(500).json({ message: 'Error generating response.' });
	}
});

module.exports = router;