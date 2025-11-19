const express = require('express');
const router = express.Router();
const {verifySession, verifySessionInstructor, verifySessionStudent} = require('../middleware/sessionMiddleware');
const {checkAnswer,	recordQuestionAttempt,
	recordQuizAttempt, getAttemptsByQuestion,
	getAttemptsByQuiz, getAttemptsByStudent,
	getAttemptsByStudentAndQuestion, getAttemptsByStudentAndQuiz,
	getStudentQuizAttempts} = require('../utils/attemptUtils');

// Export the router
module.exports = router;