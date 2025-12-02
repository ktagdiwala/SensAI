const { pool } = require('../config/dbConnection'); // Import the DB connection

/** getMistakeTypes
 * Retrieves the list of all mistakes for LLM use
 */
async function getMistakeTypes(){
	const sql = 'SELECT * FROM mistake_type';
	try{
		const [rows] = await pool.query(sql);
		return rows;
	}catch(error){
		console.error("Error retrieving mistake types: ", error);
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

module.exports = {
	getMistakeTypes,
	getCorrectAns
}
