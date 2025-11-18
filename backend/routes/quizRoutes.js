const express = require('express');
const { pool } = require('../config/dbConnection'); // Import DB connection
const router = express.Router();
const {verifySession, verifySessionInstructor, verifySessionStudent} = require('../middleware/sessionMiddleware');
const {createQuiz, getQuizById, getQuizByIdAndAccessCode, getAllQuizzes, getAllQuizzesForCourse, updateQuiz, deleteQuiz} = require('../utils/quizUtils');

// GET /course/:courseId
// Get all quizzes for a specific course (for instructors)
router.get('/course/:courseId', verifySessionInstructor, (req, res) => {
	const {courseId} = req.params;
	getAllQuizzesForCourse(courseId).then((quizzes) => {
		return res.status(200).json({quizzes});
	}).catch((error) => {
		return res.status(500).json({message: 'Error retrieving quizzes for course.'});
	})
})


// GET /id/:quizId
// Get quiz by id (for instructors)
router.get('/id/:quizId', verifySessionInstructor, (req, res) => {
	const {quizId} = req.params;
	getQuizById(quizId).then((quiz) => {
		if(quiz){
			return res.status(200).json({quiz});
		}else{
			return res.status(404).json({message: 'Quiz not found.'});
		}
	}).catch((error) => {
		return res.status(500).json({message: 'Error retrieving quiz.'});
	})
})

// GET /:quizId/:accessCode
// Get quiz by id and access code (for students)
router.get('/:quizId/:accessCode', verifySessionStudent, (req, res) => {
	const {quizId, accessCode} = req.params;
	getQuizByIdAndAccessCode(quizId, accessCode).then((quiz) => {
		if(quiz){
			return res.status(200).json({quiz});
		}else{
			return res.status(404).json({message: 'Quiz not found or access code invalid.'});
		}
	}).catch((error) => {
		return res.status(500).json({message: 'Error retrieving quiz.'});
	})
})


// GET /
// Get all quizzes (for instructors)
router.get('/', verifySessionInstructor, (req, res) => {
	getAllQuizzes().then((quizzes) => {
		return res.status(200).json({quizzes});
	}).catch((error) => {
		return res.status(500).json({message: 'Error retrieving quizzes.'});
	})
})

// POST /create
router.post('/create', verifySessionInstructor, (req, res) => {
	// If we reach here, the middleware validated the session
	const {title, accessCode, prompt, courseId}  = req.body;

	if(!title || !courseId){
		return res.status(400).json({message: 'Title and courseId are required.'});
	}

	createQuiz(title, accessCode, prompt, courseId).then(({quizId, accessCode}) => {
		if(quizId){
			return res.status(201).json({quizId, accessCode});
		}else{
			return res.status(500).json({message: 'Error creating quiz.'});
		}
	});
});

// PUT /update/:quizId
router.put('/update/:quizId', verifySessionInstructor, (req, res) => {
	const {quizId} = req.params;
	const {title, prompt, accessCode, courseId} = req.body;
	updateQuiz(quizId, title, prompt, accessCode, courseId).then((success) => {
		if(success && success.affectedRows > 0){
			return res.status(200).json({message: 'Quiz updated successfully.'});
		}else if (success.affectedRows === 0){
			return res.status(404).json({message: 'Quiz not found.'});
		}else{
			return res.status(500).json({message: 'Error updating quiz.'});
		}
	})
})

// DELETE /delete/:quizId
router.delete('/delete/:quizId', verifySessionInstructor, (req, res) => {
	const {quizId} = req.params;
	deleteQuiz(quizId).then((success) => {
		if(success && success.affectedRows > 0){
			return res.status(200).json({message: 'Quiz deleted successfully.'});
		}else if (success.affectedRows === 0){
			return res.status(404).json({message: 'Quiz not found.'});
		}else{
			return res.status(500).json({message: 'Error deleting quiz.'});
		}
	})
})


module.exports = router;