const express = require('express');
const { pool } = require('../config/dbConnection'); // Import DB connection
const router = express.Router();
const {verifySession, verifySessionInstructor, verifySessionStudent} = require('../middleware/sessionMiddleware');
const {createQuiz, getQuizById, getQuizByIdAndAccessCode, getAllQuizzes, getAllQuizzesForCourse, updateQuiz, deleteQuiz} = require('../utils/quizUtils');


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