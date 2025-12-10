const express = require('express');
const router = express.Router();
const {verifySessionInstructor, verifySessionStudent} = require('../middleware/sessionMiddleware');
const {sensaiMetrics, quizStats, questionInsights} = require('../utils/analyticUtils');

// GET /metrics
// Get overall Sensai platform metrics (for instructors)
router.get('/metrics', verifySessionInstructor, async (req, res) => {
	try{
		const metrics = await sensaiMetrics();
		return res.status(200).json({metrics});
	}catch (error){
		return res.status(500).json({message: 'Error retrieving Sensai metrics.'});
	}
})

// GET /quizStats/:quizId
// Get detailed statistics for a specific quiz (for instructors)
router.get('/quizStats/:quizId', verifySessionInstructor, async (req, res) => {
	const quizId = req.params.quizId;
	try{
		const stats = await quizStats(quizId);
		return res.status(200).json({stats});
	}catch (error){
		return res.status(500).json({message: 'Error retrieving quiz statistics.'});
	}
});

// GET /questionStats/:quizId
// Get detailed statistics for questions within a specific quiz (for instructors)
router.get('/questionStats/:quizId', verifySessionInstructor, async (req, res) => {
	const quizId = req.params.quizId;
	try{
		const insights = await questionInsights(quizId);
		return res.status(200).json({insights});
	}catch (error){
		return res.status(500).json({message: 'Error retrieving question insights.'});
	}
});

module.exports = router;