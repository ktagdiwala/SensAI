const { GoogleGenAI } = require('@google/genai');
const { pool } = require('../config/dbConnection'); // Import the DB connection
require('dotenv').config();	// For loading GEMINI_API_KEY from .env file
const { getQuizById } = require('./quizUtils');
const { getQuestionById } = require('./questionUtils');
const { getCorrectAns, getMistakeTypes } = require('./dbQueries');
const { getUserApiKey } = require('./userUtils');

// The client gets the API key from the environment variable `GEMINI_API_KEY`.
const apiKeyFromEnv = process.env.GEMINI_API_KEY || null;

// This will be made more efficient later using caching https://ai.google.dev/gemini-api/docs/caching?lang=node
/* You can view usage and rate limits for your current API key by going to 
   https://aistudio.google.com/api-keys > Usage and Billing > Rate Limit*/

/** getChatResponse
 * Generates a response from the Gemini API based on the student's message and quiz context.
 * @param {string} studentMessage
 * @param {string} quizId
 * @param {int} questionId
 * @param {string} chatHistory OPTIONAL
 * @returns 
 */
async function getChatResponse(userId, studentMessage, quizId, questionId, chatHistory=""){
	const {title: quizTitle, prompt: quizPrompt} = await getQuizById(quizId);
	const {title: questionText, prompt: questionPrompt} = await getQuestionById(questionId);
	const correctAns = await getCorrectAns(questionId);
	if(!quizTitle || correctAns === null || correctAns === undefined || !questionText){
		throw new Error("Error retrieving quiz or question details.");
	}
	
	const role = `You are SensAI (like the Japanese word "sensei" for teacher), an AI assistant that helps students
			who are struggling on a quiz question. You do not provide the answer directly, but instead guide the student
			to reach the correct answer by asking leading questions, providing hints, and explaining concepts.
			If the student asks whether their answer is correct, you should not say 'yes' or 'no', but instead guide them to evaluate
			their own answer. Be encouraging and patient, as the student may be frustrated.
			Your responses shouldn't be too long (max 50 words).
			The quiz the student is currently working on is titled: ${quizTitle}. Here is the instructor's prompt for this quiz
			(if this is empty, you can ignore it): ${quizPrompt}
			This is the question the student is currently working on: ${questionText}. The correct answer is: ${correctAns}
			Here is the instructor's prompt for this particular question (if this is empty, you can ignore it): ${questionPrompt}
			Here is the chat history between you and the student so far (if empty, you can ignore it): ${chatHistory}`;
	const prompt = `Here is the student's latest message, which you need to respond to: "${studentMessage}" 
			| Check if the student made any mistakes in their message, gently correct them if needed.
			Please provide your answer as plain text only, do not use any markdown formatting characters like asterisks, # symbols, or dollar signs ($).`;
	const apiKey = await getUserApiKey(userId) || apiKeyFromEnv;
	const ai = new GoogleGenAI({apiKey: apiKey});
	
  	const response = await ai.models.generateContent({
		model: "gemini-2.5-flash",
		config: {
			thinkingConfig: {
			thinkingBudget: 0, // Disables thinking, uses too many tokens otherwise
			},
			systemInstruction: role,
			maxOutputTokens: 150, // Limit response length
		},
		contents: prompt
  	});
  	// console.log(response.text);
  	return response.text;
}

/** getMistake
 * Determines the mistake the student made for a particular question based on their answer and chat history.
 * @param {int} questionId
 * @param {string} givenAnswer
 * @param {int} selfConfidence
 * @param {string} chatHistory
 * @param {int} userId
 */
async function getMistake(questionId, givenAnswer, selfConfidence, chatHistory="", userId){
	// This function is called only if the student answer was incorrect.
	// Thus, if their selfConfidence is 0, we assume the student guessed the answer.
	const mistakeTypes = await getMistakeTypes();
	// If selfConfidence is 0, we directly return the MistakeId for "No Attempt or Guess"
	// determine which mistake id corresponds to no attempt or guess
	const noAttemptMistake = mistakeTypes.find(mistake => mistake.label.toLowerCase() === "no attempt or guess");
	if(selfConfidence === 0){
			return noAttemptMistake ? noAttemptMistake.mistakeId : 1;
	}
	const {title: questionText, correctAns} = await getQuestionById(questionId);
	if(!questionText || correctAns === null || correctAns === undefined){
		throw new Error("Error retrieving question details.");
	}
	if(mistakeTypes === null){
		throw new Error("Error retrieving mistake types.");
	} else if(mistakeTypes.length === 0){
		throw new Error("No mistake types found in the database.");
	}
	// Parse the mistake response into a list for the prompt
	let mistakeList = "";
	mistakeTypes.forEach((mistake) => {
		mistakeList += `(${mistake.mistakeId}) ${mistake.label}: ${mistake.description}\n`;
	});
	const prompt = `A student answered the following question incorrectly: ${questionText}.
	The correct answer is: ${correctAns}. The student's answer was: ${givenAnswer}. And their self-reported confidence level was: ${selfConfidence} (0 - low, 1- medium, 2- high).
	Based on the self confidence, given answer, and the chat history between the AI assistant and student (if there is chat history), identify the main type of mistake the student made.
	Chat History: ${chatHistory}
	Here is the list of possible mistakes in (id) label: description format:
	${mistakeList}
	Respond with only the mistake ID that best describes the student's mistake.`;
	const apiKey = await getUserApiKey(userId) || apiKeyFromEnv;
	const ai = new GoogleGenAI({apiKey: apiKey});
	const response = await ai.models.generateContent({
		model: "gemini-2.5-flash",
		config: {
			thinkingConfig: {
			thinkingBudget: 0, // Disables thinking, uses too many tokens otherwise
			},
			systemInstruction: "You are an educational AI assistant that helps identify student mistakes."
		},
		contents: prompt
  	});
	// console.log("Question# " + questionId + " Mistake Identification Response: ", response.text);
	// Extract the mistakeId from the response
	var mistakeId;
	try{
		mistakeId = parseInt(response.text.trim());
		if(isNaN(mistakeId)){
			console.warn("Gemini returned non-numeric mistake ID:", response.text);
			// Default to a generic mistake type if parsing fails
			mistakeId = null;
		}
	} catch (error){
		console.error("Error parsing mistake ID from Gemini response:", error);
		mistakeId = null;
	}
	return mistakeId;
}

/** getQuizSummary
 * Generates a summary of the quiz performance using Gemini API.
 * @param {*} quizResult
 * @param {int} userId
 */
async function getQuizSummary(quizResult, userId){
	// Parse quizResult to extract quiz questions, correct answers, student answers, mistake types
	const {questionFeedback, totalQuestions, score} = quizResult;
	let quizAttempt;
	// Get the question title for each question in questionFeedback 
	// and the mistake label if applicable
	try{
		for(const feedback of questionFeedback){
			let mistakeLabel;
			// Identifies the mistake label if answer was incorrect
			if(feedback.isCorrect === 0){
				mistakeLabel = await pool.query('SELECT label FROM mistake_type WHERE mistakeId = ?', [feedback.mistakeId])
					.then(([rows]) => rows.length > 0 ? rows[0].label : 'Unknown Mistake');
			}
			const question = await getQuestionById(feedback.questionId);
			quizAttempt = (quizAttempt || "") + `Question: ${question.title}\tCorrect Answer: ${question.correctAns}\tStudent Answer: ${feedback.givenAns}\tMistake Type: ${mistakeLabel || "N/A"}\n\n`;
		}
	} catch (error){
		throw new Error("Error retrieving question or mistake details for quiz summary.");
	}

	const role = `You are an educational AI assistant that provides insightful feedback to students based on their quiz performance.`;
	const prompt = `The student has completed a quiz with the following details:\n\n${quizAttempt}
	Out of a total of ${totalQuestions} questions, the student scored ${score}.
	Provide a constructive summary (max 150 words across 2 paragraphs) of the student's performance, highlighting areas of strength and suggesting 
	specific topics or concepts that the student should revisit/review based on the mistakes made. If the student performed well, 
	offer encouragement and suggest advanced topics for further study.`;
	const apiKey = await getUserApiKey(userId) || apiKeyFromEnv;
	const ai = new GoogleGenAI({apiKey: apiKey});
	const response = await ai.models.generateContent({
		model: "gemini-2.5-flash",
		config: {
			thinkingConfig: {
			thinkingBudget: 0, // Disables thinking, uses too many tokens otherwise
			},
			systemInstruction: role
		},
		contents: prompt
  	});
	// console.log("Quiz Summary Response: ", response.text);
	return response.text;
}

module.exports = { getChatResponse, getMistake, getQuizSummary };