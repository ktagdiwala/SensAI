const { pool } = require('../config/dbConnection'); // Import the DB connection

// === Helper Functions ===
function parseAndShuffleOptions(result){
	// Perform function on all questions in result array 
	for (let k = 0; k < result.length; k++){
		const {correctAns, otherAns} = result[k];
		let options = [];
		options.push(correctAns);
		// delimiter for otherAns is {|}
		const otherOptions = otherAns.split('{|}').map(opt => opt.trim());
		options = options.concat(otherOptions);

		// Shuffle options
		for (let i = options.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[options[i], options[j]] = [options[j], options[i]];
		}

		// Return the result without correctAns and otherAns, but with shuffled options
		result[k].options = options;
		delete result[k].correctAns;
		delete result[k].otherAns;
	}

	return result;
}



/** createQuiz
 * Inserts new quiz record into quiz table
 * @param {string} title
 * @param {string} correctAns
 * @param {string} otherAns
 * @param {string} prompt
 * @param {int} courseId
 */
async function createQuestion(title, correctAns, otherAns, prompt, courseId){
	if (!title || !correctAns || !courseId){
		return null;
	}
	let sql, params;

	// For future use (fill-in-the-blank questions, etc)
	// if(!otherAns && !prompt){
	// 	sql = 'INSERT INTO question (title, correctAns, courseId) VALUES (?, ?, ?);';
	// 	params = [title, correctAns, courseId];
	// }
	if(!prompt){
		sql = 'INSERT INTO question (title, correctAns, otherAns, courseId) VALUES (?, ?, ?, ?)';
		params = [title, correctAns, otherAns, courseId];
	}else{
		sql = 'INSERT INTO question (title, correctAns, otherAns, prompt, courseId) VALUES (?, ?, ?, ?, ?)';
		params = [title, correctAns, otherAns, prompt, courseId];
	}

	try {
		const [result] = await pool.query(sql, params);
		// returns the new question id
		return result.insertId;

	} catch (error) {
		console.error("Error inserting question: ", error);
		return null;
	}

}

/** getQuestionById
 * @param {int} questionId
 */
async function getQuestionById(questionId){
	const sql='SELECT * FROM question WHERE questionId = ?';
	try {
		const [result] = await pool.query(sql, [questionId]);
		return result[0];
	} catch (error) {
		console.error("Error retrieving question: ", error);
		return null;
	}
}

/** getQuestionsByQuizId
 * @param {int} quizId
 */
async function getQuestionsByQuizId(quizId){
	const sql='SELECT quizId, question.questionId AS questionId, title, correctAns, otherAns, prompt, question.courseId AS courseId FROM quiz_questions JOIN question ON quiz_questions.questionId = question.questionId WHERE quizId = ?';
	try {
		const [result] = await pool.query(sql, [quizId]);
		return result;
	} catch (error) {
		console.error("Error retrieving questions for this quiz: ", error);
		return null;
	}
}

/** getQuestionsByQuizIdAndAccessCode
 * @param {int} quizId
 * @param {string} accessCode
 */
async function getQuestionsByQuizIdAndAccessCode(quizId, accessCode){
	const sql='SELECT quiz.quizId AS quizId, question.questionId AS questionId, question.title AS title, correctAns, otherAns, question.courseId AS courseId FROM quiz_questions JOIN question ON quiz_questions.questionId = question.questionId JOIN quiz ON quiz.quizId = quiz_questions.quizId WHERE quiz.quizId = ? AND accessCode = ?';
	try {
		const [result] = await pool.query(sql, [quizId, accessCode]);
		// If result is empty, return null
		if(result.length === 0){
			console.error("No questions found for this quiz with the provided access code.");
			return null;
		}
		const newResult = parseAndShuffleOptions(result);
		return newResult;
	} catch (error) {
		console.error("Error retrieving questions for this quiz: ", error);
		return null;
	}
}

/** getQuestionsByCourseId
 * @param {int} courseId
 */
async function getQuestionsByCourseId(courseId){
	const sql='SELECT * FROM question WHERE courseId = ?';
	try {
		const [result] = await pool.query(sql, [courseId]);
		return result;
	} catch (error) {
		console.error("Error retrieving questions for this course: ", error);
		return null;
	}
}

/** updateQuestion
 * @param {int} questionId
 * @param {string} title
 * @param {string} correctAns
 * @param {string} otherAns
 * @param {string} prompt
 * @param {int} courseId
 */
async function updateQuestion(questionId, title, correctAns, otherAns, prompt, courseId){
	let sql = 'UPDATE question SET title = COALESCE(?, title), correctAns = COALESCE(?, correctAns), otherAns = COALESCE(?, otherAns), prompt = COALESCE(?, prompt), courseId = COALESCE(?, courseId) WHERE questionId = ?';
	try{
		const [result] = await pool.query(sql, [title, correctAns, otherAns, prompt, courseId, questionId]);
		return result;
	}catch (error) {
		console.error("Error updating question: ", error);
		return null;
	}
}

/** deleteQuestion
 * @param {int} questionId
 */
async function deleteQuestion(questionId){
	const sql = 'DELETE FROM question WHERE questionId = ?';
	try{
		const [result] = await pool.query(sql, [questionId]);
		return result;
	}catch (error) {
		console.error("Error deleting question: ", error);
		return null;
	}
}

/** addQuestionToQuiz
 * @param {int} quizId
 * @param {int} questionId
 */
async function addQuestionToQuiz(quizId, questionId){
	if(!quizId || !questionId){
		return {error: 'invalid_params', message: 'quizId and questionId are required'};
	}
	const sql = 'INSERT INTO quiz_questions (quizId, questionId) VALUES (?, ?)';
	try{
		const [result] = await pool.query(sql, [quizId, questionId]);
		return result;
	}catch (error) {
		if(error.code === 'ER_DUP_ENTRY'){
			console.error("Question already added to this quiz: ", error.message);
			return {error: 'duplicate', message: 'Question already in quiz'};
		} else if(error.code === 'ER_NO_REFERENCED_ROW' || error.code === 'ER_NO_REFERENCED_ROW_2'){
			console.error("Quiz or Question does not exist: ", error.message);
			return {error: 'notfound', message: 'Quiz or Question not found'};
		}
		console.error("Error adding question to quiz: ", error);
		return null;
	}
}

/** removeQuestionFromQuiz
 * @param {int} quizId
 * @param {int} questionId
 */
async function removeQuestionFromQuiz(quizId, questionId){
	if(!quizId || !questionId){
		return {error: 'invalid_params', message: 'quizId and questionId are required'};
	}
	const sql = 'DELETE FROM quiz_questions WHERE quizId = ? AND questionId = ?';
	try{
		const [result] = await pool.query(sql, [quizId, questionId]);
		return result;
	}catch (error) {
		console.error("Error removing question from quiz: ", error);
		return null;
	}
}

module.exports = {
	createQuestion,
	getQuestionById,
	getQuestionsByQuizId,
	getQuestionsByQuizIdAndAccessCode,
	getQuestionsByCourseId,
	updateQuestion,
	deleteQuestion,
	addQuestionToQuiz,
	removeQuestionFromQuiz
}