const { pool } = require('../config/dbConnection'); // Import the DB connection
const { getCorrectAns } = require('./dbQueries');
// Note: getMistake is imported inside recordQuestionAttempt to avoid circular dependency

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

/** checkAnswer
 * @param {int} questionId
 * @param {string} givenAns
 */
async function checkAnswer(questionId, givenAns){
	const correctAns = await getCorrectAns(questionId);
	// console.log(`checkAnswer - questionId: ${questionId}, correctAns: "${correctAns}", givenAns: "${givenAns}"`);
	if(correctAns === null || correctAns === undefined){
		console.error("Could not retrieve correct answer");
		return 0;
	}
	if(givenAns === null || givenAns === undefined || givenAns === ""){
		console.error("givenAns is null, undefined, or empty (unanswered)");
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
 * @param {string} givenAns
 * @param {string} chatHistory
 * @param {int} numMsgs
 * @param {int} selfConfidence
 */
async function recordQuestionAttempt(userId, questionId, quizId, givenAns, chatHistory="", numMsgs=0, selfConfidence=null){
	const sql = `INSERT INTO question_attempt 
		(userId, questionId, quizId, dateTime, isCorrect, givenAns, numMsgs, selfConfidence, mistakeId) 
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
	const isCorrect = await checkAnswer(questionId, givenAns);
	var mistakeId = null;
	if(isCorrect === null){
		console.error("Could not determine if answer is correct");
		return null;
	}else if(isCorrect === 0){
		// Determine mistakeId for incorrect answers
		try{
			// Lazy import to avoid circular dependency
			const { getMistake } = require('./geminiUtils');
			mistakeId = await getMistake(questionId, givenAns, selfConfidence, chatHistory, userId);
		}catch (error){
			console.error("Error determining mistake ID: ", error);
		}
	}
	// Use now for dateTime
	const dateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
	if(!userId || !questionId || !quizId || isCorrect === null){
		console.error("Invalid parameters for recording question attempt.");
		return null;
	}
	try{
		const [result] = await pool.query(sql, [userId, questionId, quizId, dateTime, isCorrect, givenAns, numMsgs, selfConfidence, mistakeId]);
		// console.log(`Successfully recorded question attempt - userId: ${userId}, questionId: ${questionId}, isCorrect: ${isCorrect}, mistakeId: ${mistakeId}`);
		return { isCorrect, mistakeId };
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
		const { questionId, givenAns, numMsgs=0, chatHistory="", selfConfidence=null } = question;
		const { isCorrect, mistakeId } = await recordQuestionAttempt(userId, questionId, quizId, givenAns, chatHistory, numMsgs, selfConfidence);
		questionFeedback.push({ questionId, givenAns, isCorrect, mistakeId });
		score += isCorrect;
	}

	// Call the Gemini API to generate feedback summary

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
			correctAns, otherAns, userId, isCorrect, numMsgs, givenAns, selfConfidence, mistake_type.label AS mistakeTypeLabel
		FROM question_attempt 
		JOIN quiz ON question_attempt.quizId = quiz.quizId 
		JOIN question ON question_attempt.questionId = question.questionId
		LEFT JOIN mistake_type ON question_attempt.mistakeId = mistake_type.mistakeId
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
			correctAns, otherAns, userId, isCorrect, numMsgs, givenAns, selfConfidence, mistake_type.label AS mistakeTypeLabel
		FROM question_attempt 
		JOIN quiz ON question_attempt.quizId = quiz.quizId 
		JOIN question ON question_attempt.questionId = question.questionId
		LEFT JOIN mistake_type ON question_attempt.mistakeId = mistake_type.mistakeId
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
				correctAns, otherAns, userId, isCorrect, numMsgs, givenAns, selfConfidence, mistake_type.label AS mistakeTypeLabel
		FROM question_attempt 
		JOIN quiz ON question_attempt.quizId = quiz.quizId 
		JOIN question ON question_attempt.questionId = question.questionId
		LEFT JOIN mistake_type ON question_attempt.mistakeId = mistake_type.mistakeId
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
			correctAns, otherAns, userId, isCorrect, numMsgs, givenAns, selfConfidence, mistake_type.label AS mistakeTypeLabel
		FROM question_attempt 
		JOIN quiz ON question_attempt.quizId = quiz.quizId 
		JOIN question ON question_attempt.questionId = question.questionId
		LEFT JOIN mistake_type ON question_attempt.mistakeId = mistake_type.mistakeId
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
			correctAns, otherAns, userId, isCorrect, numMsgs, givenAns, selfConfidence, mistake_type.label AS mistakeTypeLabel
		FROM question_attempt 
		JOIN quiz ON question_attempt.quizId = quiz.quizId 
		JOIN question ON question_attempt.questionId = question.questionId 
		LEFT JOIN mistake_type ON question_attempt.mistakeId = mistake_type.mistakeId
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
			correctAns, otherAns, userId, isCorrect, numMsgs, givenAns, selfConfidence, mistake_type.label AS mistakeTypeLabel
		FROM question_attempt
		JOIN quiz ON question_attempt.quizId = quiz.quizId
		JOIN question ON question_attempt.questionId = question.questionId
		LEFT JOIN mistake_type ON question_attempt.mistakeId = mistake_type.mistakeId
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