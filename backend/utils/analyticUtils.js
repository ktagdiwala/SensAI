const { pool } = require('../config/dbConnection'); // Import the DB connection

// This file contains utility functions for overall metrics
// and per-quiz Key Performance Indicator (KPI) analytics

/** sensaiMetrics
 * Fetches overall Sensai platform metrics including:
 * - Total users (students and instructors)
 * - Total quizzes
 * - Total courses
 * - Total questions per quiz
 * - Total questions per course
 * - Total attempts per quiz
 */
async function sensaiMetrics(){
	// initialize a json object to hold all metrics
	let metrics = {};
	let sql1 = `SELECT * FROM
		(SELECT COUNT(*) AS user_count FROM user) AS totalUsers,
		(SELECT COUNT(*) AS student_count FROM user WHERE roleId = (SELECT roleId FROM role WHERE name='Student')) AS totalStudents,
		(SELECT COUNT(*) AS instructor_count FROM user WHERE roleId = (SELECT roleId FROM role WHERE name='Instructor')) AS totalInstructors,
		(SELECT COUNT(*) AS quiz_count FROM quiz) AS totalQuizzes,
		(SELECT COUNT(*) AS course_count FROM course) AS totalCourses;`;

	let sql2 = `SELECT 
		course.courseId,
		course.title AS courseName,
		quiz.quizId,
		quiz.title AS quizTitle,
		COUNT(*) AS question_count
	FROM quiz_questions
	JOIN quiz ON quiz_questions.quizId = quiz.quizId
	JOIN course ON quiz.courseId = course.courseId
	GROUP BY course.courseId, course.title, quiz.quizId, quiz.title
	ORDER BY course.courseId, quiz.quizId;`;
	
	let sql2Total = `SELECT 
		course.courseId,
		course.title AS courseName,
		COUNT(*) AS total_questions_per_course
	FROM quiz_questions
	JOIN quiz ON quiz_questions.quizId = quiz.quizId
	JOIN course ON quiz.courseId = course.courseId
	GROUP BY course.courseId, course.title
	ORDER BY course.courseId;`;
	
	let sql3 = `SELECT quiz.quizId AS quizId, quiz.title AS quizTitle, COUNT(*) AS attempt_count FROM question_attempt JOIN quiz ON question_attempt.quizId = quiz.quizId GROUP BY question_attempt.quizId;`;
	try{
		const [result1] = await pool.query(sql1);
		metrics.totals= {...result1[0]};
		const [result2] = await pool.query(sql2);
		metrics.questionsByQuiz = result2;
		const [result2Total] = await pool.query(sql2Total);
		metrics.questionsByCourse = result2Total;
		const [result3] = await pool.query(sql3);
		metrics.totalAttempts = result3;
		// console.log(metrics);
		return metrics;
	} catch (error){
		console.error("Error retrieving Sensai metrics:", error);
		throw error;
	}
}

/** quizStats
 * Fetches basic statistics for a given quiz. Including:
 * - Total quiz attempts
 * - Average score
 * - Completion rate (percentage of students who completed the quiz)
 * - Average attempts per question
 * - Average AI messages per question in this quiz
 */
async function quizStats(quizId){
	let sql = `SELECT 
			userId, 
			datetime,
			quizId,
			SUM(isCorrect) AS score,
			AVG(numMsgs) AS avgMsgs
		FROM question_attempt
		WHERE quizId = ${quizId}
		GROUP BY userId, datetime, quizId
		HAVING COUNT(*) >= 2`;

	// Retrieve students who completed the quiz
	let sql2 = `SELECT DISTINCT userId 
			FROM question_attempt
			WHERE quizId = ${quizId}
			GROUP BY userId, dateTime, quizId
			HAVING COUNT(*) >= 2;`;

	// Retrive total number of students
	let sql3 = `SELECT COUNT(*) AS student_count FROM user WHERE roleId = 
				(SELECT roleId FROM role WHERE name='Student')`;

	try{
		const [rows] = await pool.query(sql);
		const totalAttempts = rows.length;
		if(totalAttempts === 0){
			return {
				totalAttempts: 0,
				averageScore: 0,
				completionRate: 0,
				avgAIMessages: 0
			};
		}
		const averageScore = Math.round(rows.reduce((acc, curr) => acc + parseInt(curr.score), 0)/ (totalAttempts) *100) /100;
		const avgAIMessages = Math.round(rows.reduce((acc, curr) => acc + parseFloat(curr.avgMsgs), 0) / (totalAttempts) *100) /100;

		const [completedRows] = await pool.query(sql2);
		const completedCount = completedRows.length;
		const [studentCountRows] = await pool.query(sql3);
		const totalStudents = studentCountRows[0].student_count;
		if(totalStudents === 0){
			return {
				totalAttempts: 0,
				averageScore: 0,
				completionRate: 0,
				avgAIMessages: 0
			};
		}
		const completionRate = Math.round((parseFloat(completedCount) / totalStudents) * 100 *100) / 100;

		return {
			totalAttempts,
			averageScore,
			completionRate,
			avgAIMessages
		};
	} catch (error) {
		console.error("Error retrieving quiz stats:", error);
		throw error;
	}
}

module.exports = {
	sensaiMetrics,
	quizStats
};