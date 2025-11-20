const express = require('express');
const router = express.Router();
const {verifySession, verifySessionInstructor, verifySessionStudent} = require('../middleware/sessionMiddleware');
const {checkAnswer,	recordQuestionAttempt,
	recordQuizAttempt, getAttemptsByQuestion,
	getAttemptsByQuiz, getAttemptsByStudent,
	getAttemptsByStudentAndQuestion, getAttemptsByStudentAndQuiz,
	getStudentQuizAttempts} = require('../utils/attemptUtils');

// POST /submit
// Record a student's attempt at answering a question
router.post('/submit', verifySessionStudent, async (req, res) => {
	const {userId} = req.session;
	const {quizId, questionId, givenAns, numMsgs} = req.body;

	if(!quizId || !questionId || givenAns === undefined){
		return res.status(400).json({message: 'quizId, questionId, and givenAns are required.'});
	}

	try{
		const {insertId, isCorrect} = await recordQuestionAttempt(userId, quizId, questionId, givenAns, numMsgs);
		return res.status(201).json({message: 'Question attempt recorded.', attemptId: insertId, isCorrect});
	}catch(error){
		return res.status(500).json({message: 'Error recording question attempt.'});
	}
});

// POST /submit-quiz
// Record a student's attempt at completing a quiz
router.post('/submit-quiz', verifySessionStudent, async (req, res) => {
	const {userId} = req.session;
	// questionArray should include questionId, givenAnswer, numMsgs (optional) for each question
	const {quizId, questionArray} = req.body;

	if(!quizId || !questionArray || !Array.isArray(questionArray) || questionArray.length === 0){
		return res.status(400).json({message: 'quizId and non-empty questionArray are required.'});
	}

	try{
		const result = await recordQuizAttempt(userId, quizId, questionArray);
		// Result includes success, totalQuestions, and score
		return res.status(201).json({message: 'Quiz attempt recorded.', result});
	}catch(error){
		return res.status(500).json({message: 'Error recording quiz attempt.'});
	}
});

// GET /question/:questionId
// Retrieve all attempts for a specific question (instructor use)
router.get('/question/:questionId', verifySessionInstructor, async (req, res) => {
	const {questionId} = req.params;
	try{
		const attempts = await getAttemptsByQuestion(questionId);
		return res.status(200).json({attempts});
	}catch(error){
		return res.status(500).json({message: 'Error retrieving attempts by question.'});
	}
});

// GET /quiz/:quizId
// Retrieve all attempts for a specific quiz (instructor use)
router.get('/quiz/:quizId', verifySessionInstructor, async (req, res) => {
	const {quizId} = req.params;
	try{
		const attempts = await getAttemptsByQuiz(quizId);
		return res.status(200).json({attempts});
	}catch(error){
		return res.status(500).json({message: 'Error retrieving attempts by quiz.'});
	}
});

// GET /student
// Retrieve all attempts for the logged-in student
router.get('/student', verifySessionStudent, async (req, res) => {
	const {userId} = req.session;
	try{
		const attempts = await getAttemptsByStudent(userId);
		return res.status(200).json({attempts});
	}catch(error){
		return res.status(500).json({message: 'Error retrieving attempts by student.'});
	}
});

// GET /student/:studentId
// Retrieve all attempts for a specific student (instructor use)
router.get('/student/:studentId', verifySessionInstructor, async (req, res) => {
	const {studentId} = req.params;
	try{
		const attempts = await getAttemptsByStudent(studentId);
		return res.status(200).json({attempts});
	}catch(error){
		return res.status(500).json({message: 'Error retrieving attempts by student.'});
	}
});

// GET /student/:studentId/question/:questionId
// Retrieve attempts for a specific student and question (instructor use)
router.get('/student/:studentId/question/:questionId', verifySessionInstructor, async (req, res) => {
	const {studentId, questionId} = req.params;
	try{
		const attempts = await getAttemptsByStudentAndQuestion(studentId, questionId);
		return res.status(200).json({attempts});
	}catch(error){
		return res.status(500).json({message: 'Error retrieving attempts by student and question.'});
	}
});

// GET /student/:studentId/quiz/:quizId
// Retrieve attempts for a specific student and quiz (instructor use)
router.get('/student/:studentId/quiz/:quizId', verifySessionInstructor, async (req, res) => {
	const {studentId, quizId} = req.params;
	try{
		const attempts = await getAttemptsByStudentAndQuiz(studentId, quizId);
		return res.status(200).json({attempts});
	}catch(error){
		return res.status(500).json({message: 'Error retrieving attempts by student and quiz.'});
	}
});

// Export the router
module.exports = router;