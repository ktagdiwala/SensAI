const express = require('express');
const router = express.Router();
const {verifySession, verifySessionInstructor, verifySessionStudent} = require('../middleware/sessionMiddleware');
const {createQuestion, getQuestionById, getQuestionsByCourseId, getQuestionsByQuizId, updateQuestion, deleteQuestion} = require('../utils/questionUtils');

// GET /:questionId
router.get('/:questionId', verifySessionInstructor, (req, res) => {
	const {questionId} = req.params;
	getQuestionById(questionId).then((question) => {
		if(question){
			return res.status(200).json({question});
		}else{
			return res.status(404).json({message: 'Question not found.'});
		}
	}).catch((error) => {
		return res.status(500).json({message: 'Error retrieving question.'});
	})
})

// GET /quiz/:quizId
// Accessible to both instructors and students
router.get('/quiz/:quizId', verifySession, (req, res) => {
	const {quizId} = req.params;
	getQuestionsByQuizId(quizId).then((questions) => {
		if(questions){
			return res.status(200).json({questions});
		}else{
			return res.status(404).json({message: 'Questions not found in this quiz.'});
		}
	}).catch((error) => {
		return res.status(500).json({message: 'Error retrieving quiz questions.'});
	})
})

// GET /course/:courseId
router.get('/course/:courseId', verifySessionInstructor, (req, res) => {
	const {courseId} = req.params;
	getQuestionsByCourseId(courseId).then((questions) => {
		if(questions){
			return res.status(200).json({questions});
		}else{
			return res.status(404).json({message: 'Questions not found in this course.'});
		}
	}).catch((error) => {
		return res.status(500).json({message: 'Error retrieving course questions.'});
	})
})

// POST /create
// Create a new question (for instructors)
router.post('/create', verifySessionInstructor, (req, res) => {
	const {title, correctAns, otherAns, prompt, courseId} = req.body;

	if(!title || !correctAns || !otherAns || !courseId){
		return res.status(400).json({message: 'Title, correctAns, otherAns, and courseId are required.'});
	}

	createQuestion(title, correctAns, otherAns, prompt, courseId).then((questionId) => {
		if(questionId){
			return res.status(201).json({questionId});
		}else{
			return res.status(500).json({message: 'Error creating question.'});
		}
	})
})

// PUT /update/:questionId
router.put('/update/:questionId', verifySessionInstructor, (req, res) => {
	const {questionId} = req.params;
	const {title, correctAns, otherAns, prompt, courseId} = req.body;
	updateQuestion(questionId, title, correctAns, otherAns, prompt, courseId).then((success) => {
		if(success && success.affectedRows > 0) {
			return res.status(200).json({message: 'Question updated successfully.'});
		}else if (success.affectedRows === 0){
			return res.status(404).json({message: 'Question not found.'});
		}else{
			return res.status(500).json({message: 'Error updating question.'});
		}
	})
})

// DELETE /delete/:questionId
router.delete('/delete/:questionId', verifySessionInstructor, (req, res) => {
	const {questionId} = req.params;
	deleteQuestion(questionId).then((success) => {
		if(success && success.affectedRows > 0) {
			return res.status(200).json({message: 'Question deleted successfully.'});
		}else if (success.affectedRows === 0){
			return res.status(404).json({message: 'Question not found.'});
		}else{
			return res.status(500).json({message: 'Error deleting question.'});
		}
	})
})

module.exports = router;