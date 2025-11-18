const { pool } = require('../config/dbConnection'); // Import the DB connection
const { faker } = require('@faker-js/faker'); // For generating random access code

/** generateAccessCode
 * Generate a unique access code for a quiz
 */
function generateAccessCode(){
	return faker.string.alphanumeric(6); // Generates an 8 character alphanumeric string
}

/** createQuiz
 * Inserts new quiz record into quiz table
 * @param {string} title
 * @param {string} accessCode
 * @param {string} prompt
 * @param {int} courseId
 */
async function createQuiz(title, accessCode, prompt, courseId){
	// If no access code provided, generate one
	if(!accessCode){
		accessCode = generateAccessCode();
	}
	let sql = 'INSERT INTO quiz (title, accessCode, prompt, courseId) VALUES (?, ?, ?, ?)';
	if(!prompt){
		sql = 'INSERT INTO quiz (title, accessCode, courseId) VALUES (?, ?, ?)';
	}

	try {
		if(!prompt){
			const [result] = await pool.query(sql, [title, accessCode, courseId]);
			// returns the new record's quizId
			return result.insertId;
		}

		const [result] = await pool.query(sql, [title, accessCode, prompt, courseId]);
		// returns the new record's quizId
		return result.insertId;

	} catch (error) {
		console.error("Error inserting quiz: ", error);
		return null;
	}
}

/** TODO: addQuestionsToQuiz
 * Inserts records into the quiz_questions table to associate questions with a quiz
 * @param {int} quizId
 * @param {Array<int>} questionIds
 */

/** getQuizById
 * Retrieves quiz record by its id
 * @param {int} quizId
 */
async function getQuizById(quizId){
	const sql = 'SELECT * FROM quiz WHERE quizId = ?';
	try{
		const[result] = await pool.query(sql, [quizId]);
		return result[0];
	} catch (error) {
		console.error("Error getting quiz by id: ", error);
		return null;
	}
}

/** getQuizByIdAndAccessCode
 * Retrieves a quiz record by its Id and access code
 * @param {int} quizId
 * @param {string} accessCode
 */
async function getQuizByIdAndAccessCode(quizId, accessCode){
	const sql = 'SELECT * FROM quiz WHERE quizId = ? AND accessCode = ?';
	try{
		const[result] = await pool.query(sql, [quizId, accessCode]);
		return result[0];
	} catch (error) {
		console.error("Error getting quiz by id and access code: ", error);
		return null;
	}
}

/** getAllQuizzes
 * Retrieves the list of all quizzes (accessible to all instructors)
 */
async function getAllQuizzes(){
	try{
		// Most recently created quizzes appear at the top of the list
		const[result] = await pool.query('SELECT quizId, quiz.title AS quizTitle, accessCode, course.title AS courseTitle FROM quiz JOIN course ON quiz.courseId = course.courseId ORDER BY quizId DESC');
		return result;
	} catch (error) {
		console.error("Error getting all quizzes: ", error);
		return null;
	}
}

/** getAllQuizzesForCourse
 * Retrieves list of all quizzes in a particular course
 * @param {int} courseId
*/
async function getAllQuizzesForCourse(courseId){
	const sql = 'SELECT quizId, quiz.title AS quizTitle, accessCode, course.title AS courseTitle FROM quiz JOIN course ON quiz.courseId = course.courseId WHERE courseId = ?';
	try{
		const[result] = await pool.query(sql, [courseId]);
		return result;
	} catch (error) {
		console.error("Error getting all quizzes in this course: ", error);
		return null;
	}
}

/** updateQuiz
 * Updates a quiz record
 * @param {int} quizId
 * @param {string} title
 * @param {string} prompt
 * @param {string} accessCode
 * @param {int} courseId
 */
async function updateQuiz(quizId, title, prompt, accessCode, courseId){
	if(!quizId){
		return null;
	}
	// Updates only fields that are provided (ignores fields left blank)
	const sql = 'UPDATE quiz SET title = COALESCE(?, title), prompt = COALESCE(?, prompt), accessCode = COALESCE(?, accessCode), courseId = COALESCE(?, courseId) WHERE quizId = ?';
	try{
		const[result] = await pool.query(sql, [title, prompt, accessCode, courseId, quizId]);
		return result;
	} catch (error) {
		return null;
	}
}

/** deleteQuiz
 * Deletes a quiz record by id
 * @param {int} quizId
 */
async function deleteQuiz(quizId){
	const sql = 'DELETE FROM quiz WHERE quizId = ?'
	try{
		const[result] = await pool.query(sql, [quizId]);
		return result;
	} catch (error) {
		console.error("Error deleting quiz by id: ", error);
		return null;
	}
}


module.exports = {
	createQuiz,
	getQuizById,
	getQuizByIdAndAccessCode,
	getAllQuizzes,
	getAllQuizzesForCourse,
	updateQuiz,
	deleteQuiz
}