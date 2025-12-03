const express = require('express');
const router = express.Router();
const {verifySessionInstructor, verifySessionStudent} = require('../middleware/sessionMiddleware');
const {getStudents, recordQuestionAttempt,
	recordQuizAttempt, getAttemptsByQuestion,
	getAttemptsByQuiz, getAttemptsByStudent,
	getAttemptsByStudentAndQuestion, getAttemptsByStudentAndQuiz,
	getStudentQuizAttempts, getStudentQuestionAttemptsForQuiz} = require('../utils/attemptUtils');
const {getQuizSummary} = require('../utils/geminiUtils');

// === Helper Functions ===

/**
 * Validates that a parameter is a positive integer
 * @param {*} value
 * @returns {boolean}
 */
function isValidPositiveInt(value) {
	const num = parseInt(value, 10);
	return !isNaN(num) && num > 0 && String(num) === String(value);
}

/**
 * Validates dateTime format (YYYY-MM-DD HH:MM:SS)
 * @param {string} dateTime
 * @returns {boolean}
 */
function isValidDateTime(dateTime) {
	const dateTimeRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
	return dateTimeRegex.test(dateTime);
}

// POST /submit
// Record a student's attempt at answering a question
router.post('/submit', verifySessionStudent, async (req, res) => {
	const {userId} = req.session;
	const {quizId, questionId, givenAns, numMsgs, chatHistory="", selfConfidence=null} = req.body;

	if(!quizId || !questionId || givenAns === undefined){
		return res.status(400).json({message: 'quizId, questionId, and givenAns are required.'});
	}

	if(!isValidPositiveInt(quizId) || !isValidPositiveInt(questionId)){
		return res.status(400).json({message: 'quizId and questionId must be positive integers.'});
	}

	try{
		const result = await recordQuestionAttempt(userId, questionId, quizId, givenAns, chatHistory, numMsgs, selfConfidence);
		
		if(!result){
			return res.status(400).json({message: 'Failed to record question attempt. Please check your input parameters.'});
		}
		const { isCorrect } = result;
		return res.status(201).json({message: 'Question attempt recorded.', isCorrect});
	}catch(error){
		console.error('Error recording question attempt:', error);
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

	if(!isValidPositiveInt(quizId)){
		return res.status(400).json({message: 'quizId must be a positive integer.'});
	}

	// Validate each question in the array
	for(let i = 0; i < questionArray.length; i++){
		const {questionId, givenAns} = questionArray[i];
		if(!questionId || givenAns === undefined){
			return res.status(400).json({message: `Question at index ${i} is missing questionId or givenAns.`});
		}
		if(!isValidPositiveInt(questionId)){
			return res.status(400).json({message: `Question at index ${i} has invalid questionId.`});
		}
	}

	try{
		const result = await recordQuizAttempt(userId, quizId, questionArray);
		if(!result){
			return res.status(400).json({message: 'Failed to record quiz attempt. Please check your input parameters.'});
		}
		const summary = await getQuizSummary(result, userId);
		return res.status(201).json({message: 'Quiz attempt recorded.', result, summary});
	}catch(error){
		console.error('Error recording quiz attempt or getting summary:', error);
		return res.status(500).json({message: 'Error recording quiz attempt or getting summary.'});
	}
});

// GET /question/:questionId
// Retrieve all attempts for a specific question (instructor use)
router.get('/question/:questionId', verifySessionInstructor, async (req, res) => {
	const {questionId} = req.params;

	if(!isValidPositiveInt(questionId)){
		return res.status(400).json({message: 'questionId must be a positive integer.'});
	}

	try{
		const attempts = await getAttemptsByQuestion(questionId);
		return res.status(200).json({attempts});
	}catch(error){
		console.error('Error retrieving attempts by question:', error);
		return res.status(500).json({message: 'Error retrieving attempts by question.'});
	}
});

// GET /quiz/:quizId
// Retrieve all attempts for a specific quiz (instructor use)
router.get('/quiz/:quizId', verifySessionInstructor, async (req, res) => {
	const {quizId} = req.params;

	if(!isValidPositiveInt(quizId)){
		return res.status(400).json({message: 'quizId must be a positive integer.'});
	}

	try{
		const attempts = await getAttemptsByQuiz(quizId);
		return res.status(200).json({attempts});
	}catch(error){
		console.error('Error retrieving attempts by quiz:', error);
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
		console.error('Error retrieving attempts by student:', error);
		return res.status(500).json({message: 'Error retrieving attempts by student.'});
	}
});

// GET /student/:studentId
// Retrieve all attempts for a specific student (instructor use)
router.get('/student/:studentId', verifySessionInstructor, async (req, res) => {
	const {studentId} = req.params;

	if(!isValidPositiveInt(studentId)){
		return res.status(400).json({message: 'studentId must be a positive integer.'});
	}

	try{
		const attempts = await getAttemptsByStudent(studentId);
		return res.status(200).json({attempts});
	}catch(error){
		console.error('Error retrieving attempts by student:', error);
		return res.status(500).json({message: 'Error retrieving attempts by student.'});
	}
});

// GET /students
// Returns list of students (userId, name, email) (instructor use)
router.get('/students', verifySessionInstructor, async (req, res) => {
	try{
		const students = await getStudents();
		return res.status(200).json({students});
	}catch(error){
		console.error('Error retrieving students:', error);
		return res.status(500).json({message: 'Error retrieving students.'});
	}
});

// GET /student/:studentId/question/:questionId
// Retrieve attempts for a specific student and question (instructor use)
router.get('/student/:studentId/question/:questionId', verifySessionInstructor, async (req, res) => {
	const {studentId, questionId} = req.params;

	if(!isValidPositiveInt(studentId) || !isValidPositiveInt(questionId)){
		return res.status(400).json({message: 'studentId and questionId must be positive integers.'});
	}

	try{
		const attempts = await getAttemptsByStudentAndQuestion(studentId, questionId);
		return res.status(200).json({attempts});
	}catch(error){
		console.error('Error retrieving attempts by student and question:', error);
		return res.status(500).json({message: 'Error retrieving attempts by student and question.'});
	}
});

// GET /student/:studentId/quiz/:quizId
// Retrieve attempts for a specific student and quiz (instructor use)
router.get('/student/:studentId/quiz/:quizId', verifySessionInstructor, async (req, res) => {
	const {studentId, quizId} = req.params;

	if(!isValidPositiveInt(studentId) || !isValidPositiveInt(quizId)){
		return res.status(400).json({message: 'studentId and quizId must be positive integers.'});
	}

	try{
		const attempts = await getAttemptsByStudentAndQuiz(studentId, quizId);
		return res.status(200).json({attempts});
	}catch(error){
		console.error('Error retrieving attempts by student and quiz:', error);
		return res.status(500).json({message: 'Error retrieving attempts by student and quiz.'});
	}
});

// GET /student/:studentId/attempted-quizzes
// Retrieve all quizzes attempted by a specific student (instructor use)
router.get('/student/:studentId/attempted-quizzes', verifySessionInstructor, async (req, res) => {
	const {studentId} = req.params;

	if(!isValidPositiveInt(studentId)){
		return res.status(400).json({message: 'studentId must be a positive integer.'});
	}

	try{
		const quizzes = await getStudentQuizAttempts(studentId);
		return res.status(200).json({quizzes});
	}catch(error){
		console.error('Error retrieving attempted quizzes for student:', error);
		return res.status(500).json({message: 'Error retrieving attempted quizzes for student.'});
	}
});

// GET /student/attempted-quizzes
// Retrieve all quizzes attempted by the logged-in student
router.get('/student/attempted-quizzes', verifySessionStudent, async (req, res) => {
	const {userId} = req.session;
	try{
		const quizzes = await getStudentQuizAttempts(userId);
		return res.status(200).json({quizzes});
	}catch(error){
		console.error('Error retrieving attempted quizzes for student:', error);
		return res.status(500).json({message: 'Error retrieving attempted quizzes for student.'});
	}
});

// GET /student/:studentId/quiz/:quizId/attempts?dateTime=...
// Retrieve all question attempts for specific student for specific quiz at specific time (instructor use)
router.get('/student/:studentId/quiz/:quizId/attempts', verifySessionInstructor, async (req, res) => {
	const {studentId, quizId} = req.params;
	const {dateTime} = req.query;

	if(!isValidPositiveInt(studentId) || !isValidPositiveInt(quizId)){
		return res.status(400).json({message: 'studentId and quizId must be positive integers.'});
	}

	if(!dateTime){
		return res.status(400).json({message: 'dateTime query parameter is required.'});
	}

	if(!isValidDateTime(dateTime)){
		return res.status(400).json({message: 'dateTime must be in format YYYY-MM-DD HH:MM:SS.'});
	}

	try{
		const attempts = await getStudentQuestionAttemptsForQuiz(studentId, quizId, dateTime);
		return res.status(200).json({attempts});
	}catch(error){
		console.error('Error retrieving question attempts for student quiz at specified time:', error);
		return res.status(500).json({message: 'Error retrieving question attempts for student quiz at specified time.'});
	}
});

// GET /student/quiz/:quizId/attempts?dateTime=...
// Retrieve all question attempts for logged-in student for specific quiz at specific time
router.get('/student/quiz/:quizId/attempts', verifySessionStudent, async (req, res) => {
	const {userId} = req.session;
	const {quizId} = req.params;
	const {dateTime} = req.query;

	if(!isValidPositiveInt(quizId)){
		return res.status(400).json({message: 'quizId must be a positive integer.'});
	}

	if(!dateTime){
		return res.status(400).json({message: 'dateTime query parameter is required.'});
	}

	if(!isValidDateTime(dateTime)){
		return res.status(400).json({message: 'dateTime must be in format YYYY-MM-DD HH:MM:SS.'});
	}

	try{
		const attempts = await getStudentQuestionAttemptsForQuiz(userId, quizId, dateTime);
		return res.status(200).json({attempts});
	}catch(error){
		console.error('Error retrieving question attempts for student quiz at specified time:', error);
		return res.status(500).json({message: 'Error retrieving question attempts for student quiz at specified time.'});
	}
});

// Export the router
module.exports = router;