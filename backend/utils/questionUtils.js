const { pool } = require('../config/dbConnection'); // Import the DB connection

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

module.exports = {
	createQuestion,
	getQuestionById,
	getQuestionsByQuizId,
	getQuestionsByCourseId,
	updateQuestion,
	deleteQuestion
}