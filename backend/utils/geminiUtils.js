const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();	// For loading GEMINI_API_KEY from .env file

// The client gets the API key from the environment variable `GEMINI_API_KEY`.
const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});

async function getResponse(prompt) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });
  console.log(response.text);
  return response.text;
}

module.exports = { getResponse };