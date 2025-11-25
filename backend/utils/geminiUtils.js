const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();	// For loading GEMINI_API_KEY from .env file
const { getQuizById } = require('./quizUtils');
const { getQuestionById } = require('./questionUtils');
const { getCorrectAns } = require('./attemptUtils');
const { getUserApiKey } = require('./userUtils');

// The client gets the API key from the environment variable `GEMINI_API_KEY`.
const apiKeyFromEnv = process.env.GEMINI_API_KEY || null;

// This will be made more efficient later using caching https://ai.google.dev/gemini-api/docs/caching?lang=node
/* You can view usage and rate limits for your current API key by going to 
   https://aistudio.google.com/api-keys > Usage and Billing > Rate Limit*/

/** getResponse
 * Generates a response from the Gemini API based on the student's message and quiz context.
 * @param {string} studentMessage
 * @param {string} quizId
 * @param {int} questionId
 * @param {string} chatHistory OPTIONAL
 * @returns 
 */
async function getResponse(userId, studentMessage, quizId, questionId, chatHistory=""){
	const {title: quizTitle, prompt: quizPrompt} = await getQuizById(quizId);
	const {title: questionText, prompt: questionPrompt} = await getQuestionById(questionId);
	const correctAns = await getCorrectAns(questionId);
	if(!quizTitle || correctAns === null || !questionText){
		throw new Error("Error retrieving quiz or question details.");
	}
	
	const role = `You are SensAI (like the Japanese word "sensei" for teacher), an AI assistant that helps students
			who are struggling on a quiz question. You do not provide the answer directly, but instead guide the student
			to reach the correct answer by asking leading questions, providing hints, and explaining concepts.
			The quiz the student is currently working on is titled: ${quizTitle}. Here is the instructor's prompt for this quiz
			(if this is empty, you can ignore it): ${quizPrompt}
			This is the question the student is currently working on: ${questionText}. The correct answer is: ${correctAns}
			Here is the instructor's prompt for this particular question (if this is empty, you can ignore it): ${questionPrompt}
			Here is the chat history between you and the student so far (if empty, you can ignore it): ${chatHistory}`;
	const prompt = "Here is the student's latest message, which you need to respond to: " + studentMessage + " | Check if the student made any mistakes in their message, gently correct them if needed.";
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
  	// console.log(response.text);
  	return response.text;
}

module.exports = { getResponse };