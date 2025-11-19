const express = require('express');
const router = express.Router();
const {verifySession, verifySessionInstructor, verifySessionStudent} = require('../middleware/sessionMiddleware');
const {createQuestion, getQuestionById, getQuestionsByCourseId, getQuestionsByQuizId, getQuestionsByQuizIdAndAccessCode, updateQuestion, deleteQuestion, addQuestionToQuiz, removeQuestionFromQuiz} = require('../utils/questionUtils');

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
// Gets questions for a particular quiz (instructor only)
router.get('/quiz/:quizId', verifySessionInstructor, (req, res) => {
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

// GET /quiz/:quizId/accessCode/:accessCode
// Gets questions for a particular quiz with accessCode (student access)
router.get('/quiz/:quizId/accessCode/:accessCode', verifySessionStudent, (req, res) => {
	const {quizId, accessCode} = req.params;
	getQuestionsByQuizIdAndAccessCode(quizId, accessCode).then((questions) => {
		if(questions){
			return res.status(200).json({questions});
		}else{
			return res.status(404).json({message: 'Questions not found in this quiz or incorrect access code.'});
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

// POST /addToQuiz
// Add a question to a quiz (for instructor)
router.post('/addToQuiz', verifySessionInstructor, (req, res) => {
	const {quizId, questionId} = req.body;

	if(!quizId || !questionId){
		return res.status(400).json({message: 'quizId and questionId are required'});
	}

	addQuestionToQuiz(quizId, questionId).then((result) => {
		if(result?.error === 'invalid_params'){
			return res.status(400).json({message: result.message});
		}
		if(result?.error === 'duplicate'){
			return res.status(409).json({message: result.message});
		}
		if(result?.error === 'notfound'){
			return res.status(404).json({message: result.message});
		}
		if(result && result.affectedRows > 0) {
			return res.status(201).json({message: 'Question added to quiz successfully.'});
		}
		return res.status(500).json({message: 'Error adding question to quiz.'});
	}).catch((error) => {
		return res.status(500).json({message: 'Server error'});
	})
})

// DELETE /removeFromQuiz
// Remove a question from a quiz (for instructor)
router.delete('/removeFromQuiz', verifySessionInstructor, (req, res) => {
	const {quizId, questionId} = req.body;

	if(!quizId || !questionId){
		return res.status(400).json({message: 'quizId and questionId are required'});
	}

	removeQuestionFromQuiz(quizId, questionId).then((result) => {
		if(result?.error === 'invalid_params'){
			return res.status(400).json({message: result.message});
		}
		if(result && result.affectedRows > 0) {
			return res.status(200).json({message: 'Question removed from quiz successfully.'});
		}else if(result?.affectedRows === 0){
			return res.status(404).json({message: 'Question not found in quiz.'});
		}
		return res.status(500).json({message: 'Error removing question from quiz.'});
	}).catch((error) => {
		return res.status(500).json({message: 'Server error'});
	})
})

module.exports = router;