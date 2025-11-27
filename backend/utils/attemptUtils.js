const { pool } = require('../config/dbConnection'); // Import the DB connection

// === Helper Functions ===
function isInt(str) {
	const num = parseInt(str);
	return !isNaN(num);
}

function isFloat(str) {
	return !isNaN(parseFloat(str)) && isFinite(str);
}

// === Utility Functions ===

/** getStudents
 * Retrieves the list of all students for instructor use
 */
async function getStudents(){
	const sql = 'SELECT userId, name, email FROM user WHERE roleId = 2';
	try{
		const [rows] = await pool.query(sql);
		return rows;
	}catch(error){
		console.error("Error retrieving students: ", error);
		return [];
	}
}

/** getCorrectAns
 * Used by checkAnswer to get the correct answer from the database
 * Also used by geminiUtils to provide the correct answer to the AI
 * @param {int} questionId
 */
async function getCorrectAns(questionId){
	const sql = 'SELECT correctAns FROM question WHERE questionId = ?';
	try{
		const [rows] = await pool.query(sql, [questionId]);
		if(rows.length === 0){
			console.error("Question not found");
			return null;
		}
		return rows[0].correctAns;
	}catch(error){
		console.error("Error retrieving correct answer: ", error);
		return null;
	}
}

/** checkAnswer
 * @param {int} questionId
 * @param {string} givenAnswer
 */
async function checkAnswer(questionId, givenAns){
	const correctAns = await getCorrectAns(questionId);
	if(correctAns === null){
		console.error("Could not retrieve correct answer");
		return 0;
	}

	if(isFloat(correctAns) && isFloat(givenAns)){
		// Compare as decimals
		return parseFloat(correctAns) === parseFloat(givenAns) ? 1 : 0;
	}else if(isInt(correctAns) && isInt(givenAns)){
		// Compare as integers
		return parseInt(correctAns) === parseInt(givenAns) ? 1 : 0;
	}else{
		// Compare as strings (case-insensitive)
		return correctAns.trim().toLowerCase() === givenAns.trim().toLowerCase() ? 1 : 0;
	}
}

/** recordQuestionAttempt
 * @param {int} userId
 * @param {int} questionId
 * @param {int} quizId
 * @param {string} givenAnswer
 * @param {int} numMsgs
 */
async function recordQuestionAttempt(userId, questionId, quizId, givenAnswer, numMsgs){
	const sql = `INSERT INTO question_attempt 
		(dateTime, userId, questionId, quizId, isCorrect, numMsgs) 
		VALUES (?, ?, ?, ?, ?, ?)`;
	const isCorrect = await checkAnswer(questionId, givenAnswer);
	// Use now for dateTime
	const dateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
	if(!userId || !questionId || !quizId || isCorrect === null){
		console.error("Invalid parameters for recording question attempt.");
		return null;
	}
	try{
		const [result] = await pool.query(sql, [dateTime, userId, questionId, quizId, isCorrect, numMsgs]);
		return { insertId: result.insertId, isCorrect };
	}catch(error){
		console.error("Error recording question attempt: ", error);
		return null;
	}
}

/** recordQuizAttempt
 * Calls the recordQuestionAttempt for each question in the questionArray
 * @param {*} userId 
 * @param {*} quizId 
 * @param {*} questionArray 
 */
	async function recordQuizAttempt(userId, quizId, questionArray){
		let score = 0;
		let questionFeedback = [];
		for(const question of questionArray){
			const { questionId, givenAnswer, numMsgs } = question;
			const { insertId, isCorrect } = await recordQuestionAttempt(userId, questionId, quizId, givenAnswer, numMsgs);
			questionFeedback.push({ questionId, isCorrect });
			score += isCorrect;
	}
	return {
		success: true,
		questionFeedback: questionFeedback,
		totalQuestions: questionArray.length,
		score: score
	}
}

/** getAttemptsByQuestion
 * @param {int} questionId
 */
async function getAttemptsByQuestion(questionId){
	const sql = `		
		SELECT dateTime, quiz.quizId AS quizId, question.questionId AS questionId, 
			quiz.title AS quizTitle, question.title AS questionTitle, 
			correctAns, otherAns, userId, isCorrect, numMsgs
		FROM question_attempt 
		JOIN quiz ON question_attempt.quizId = quiz.quizId 
		JOIN question ON question_attempt.questionId = question.questionId
		WHERE question.questionId = ?`;
	try{
		const [rows] = await pool.query(sql, [questionId]);
		return rows;
	}catch(error){
		console.error("Error retrieving attempts by question: ", error);
		return [];
	}
}

/** getAttemptsByQuiz
 * @param {int} quizId
 */
async function getAttemptsByQuiz(quizId){
	const sql = `		
		SELECT dateTime, quiz.quizId AS quizId, question.questionId AS questionId, 
			quiz.title AS quizTitle, question.title AS questionTitle, 
			correctAns, otherAns, userId, isCorrect, numMsgs
		FROM question_attempt 
		JOIN quiz ON question_attempt.quizId = quiz.quizId 
		JOIN question ON question_attempt.questionId = question.questionId
		WHERE quiz.quizId = ?`;
	try{
		const [rows] = await pool.query(sql, [quizId]);
		return rows;
	}catch(error){
		console.error("Error retrieving attempts by quiz: ", error);
		return [];
	}
}

/** getAttemptsByStudent
 * @param {int} userId
 */
async function getAttemptsByStudent(userId){
	const sql = `
		SELECT dateTime, quiz.quizId AS quizId, question.questionId AS questionId, 
				quiz.title AS quizTitle, question.title AS questionTitle, 
				correctAns, otherAns, userId, isCorrect, numMsgs
		FROM question_attempt 
		JOIN quiz ON question_attempt.quizId = quiz.quizId 
		JOIN question ON question_attempt.questionId = question.questionId
		WHERE userId = ?`;
	try{
		const [rows] = await pool.query(sql, [userId]);
		return rows;
	}catch(error){
		console.error("Error retrieving attempts by student: ", error);
		return [];
	}
}

/** getAttemptsByStudentAndQuestion
 * @param {int} userId
 * @param {int} questionId
 */
async function getAttemptsByStudentAndQuestion(userId, questionId){
	const sql = `SELECT dateTime, quiz.quizId AS quizId, question.questionId AS questionId,
			quiz.title AS quizTitle, question.title AS questionTitle, 
			correctAns, otherAns, userId, isCorrect, numMsgs
		FROM question_attempt 
		JOIN quiz ON question_attempt.quizId = quiz.quizId 
		JOIN question ON question_attempt.questionId = question.questionId
		WHERE userId = ? AND question.questionId = ?`;
	try{
		const [rows] = await pool.query(sql, [userId, questionId]);
		return rows;
	}catch(error){
		console.error("Error retrieving attempts by student and question: ", error);
		return [];
	}
}

/** getAttemptsByStudentAndQuiz
 * @param {int} userId
 * @param {int} quizId
 */
async function getAttemptsByStudentAndQuiz(userId, quizId){
	const sql = `SELECT dateTime, quiz.quizId AS quizId, question.questionId AS questionId,
			quiz.title AS quizTitle, question.title AS questionTitle, 
			correctAns, otherAns, userId, isCorrect, numMsgs
		FROM question_attempt 
		JOIN quiz ON question_attempt.quizId = quiz.quizId 
		JOIN question ON question_attempt.questionId = question.questionId 
		WHERE userId = ? AND quiz.quizId = ?`;
	try{
		const [rows] = await pool.query(sql, [userId, quizId]);
		return rows;
	}catch(error){
		console.error("Error retrieving attempts by student and quiz: ", error);
		return [];
	}
}

/** getStudentQuizAttempts
 * Retrieves a list of unique dateTimes where the student attempted a quiz
 * Only returns quizId if at least two different question records with the same timestamp exist
 * @param {int} userId
 */
async function getStudentQuizAttempts(userId){
	const sql = `SELECT quiz.quizId AS quizId, quiz.title AS quizTitle, dateTime, COUNT(*) as questionCount 
		FROM question_attempt 
		JOIN quiz ON question_attempt.quizId = quiz.quizId
		JOIN question ON question_attempt.questionId = question.questionId
		WHERE userId = ? GROUP BY quiz.quizId, dateTime 
		HAVING questionCount >= 2`;
	try{
		const [rows] = await pool.query(sql, [userId]);
		return rows;
	}catch(error){
		console.error("Error retrieving student quiz attempts: ", error);
		return [];
	}
}

/** getStudentQuestionAttemptsForQuiz
 * Retrieves all question attempts for a student for a specific quiz at a specific dateTime
 * @param {int} userId
 * @param {int} quizId
 * @param {string} dateTime
 */
async function getStudentQuestionAttemptsForQuiz(userId, quizId, dateTime){
	const sql = `SELECT dateTime, quiz.quizId AS quizId, question.questionId AS questionId,
			quiz.title AS quizTitle, question.title AS questionTitle, 
			correctAns, otherAns, userId, isCorrect, numMsgs
		FROM question_attempt
		JOIN quiz ON question_attempt.quizId = quiz.quizId
		JOIN question ON question_attempt.questionId = question.questionId
		WHERE userId = ? AND quiz.quizId = ? AND dateTime = ?`;
	try{
		const [rows] = await pool.query(sql, [userId, quizId, dateTime]);
		return rows;
	}catch(error){
		console.error("Error retrieving student question attempts for quiz: ", error);
		return [];
	}
}

module.exports = {
	getStudents,
	getCorrectAns,
	checkAnswer,
	recordQuestionAttempt,
	recordQuizAttempt,
	getAttemptsByQuestion,
	getAttemptsByQuiz,
	getAttemptsByStudent,
	getAttemptsByStudentAndQuestion,
	getAttemptsByStudentAndQuiz,
	getStudentQuizAttempts,
	getStudentQuestionAttemptsForQuiz
}