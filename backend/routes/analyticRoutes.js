const express = require('express');
const router = express.Router();
const {verifySessionInstructor, verifySessionStudent} = require('../middleware/sessionMiddleware');
const {sensaiMetrics} = require('../utils/analyticUtils');

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

module.exports = router;