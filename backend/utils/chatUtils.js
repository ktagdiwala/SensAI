const { pool } = require('../config/dbConnection');

/**
 * Save chat history for a specific user/quiz/question combination
 * @param {number} userId - The user ID
 * @param {string|number} quizId - The quiz ID
 * @param {string|number} questionId - The question ID
 * @param {Array} chat - The chat messages array
 * @returns {Object} Result of the save operation
 */
async function saveChatHistory(userId, quizId, questionId, chat) {
    try {
        const chatJson = JSON.stringify(chat);
        const now = new Date();

        const query = `
            INSERT INTO chat_history (userId, quizId, questionId, chat, lastSaved)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE chat = ?, lastSaved = ?
        `;

        const [result] = await pool.execute(query, [
            userId,
            quizId,
            questionId,
            chatJson,
            now,
            chatJson,
            now
        ]);

        return { success: true, result };
    } catch (error) {
        console.error('Error saving chat history:', error);
        throw error;
    }
}

/**
 * Delete all chat history for a specific user/quiz combination
 * @param {number} userId - The user ID
 * @param {string|number} quizId - The quiz ID
 * @returns {Object} Result with deleted rows count
 */
async function deleteChatHistory(userId, quizId) {
    try {
        const query = `
            DELETE FROM chat_history
            WHERE userId = ? AND quizId = ?
        `;

        const [result] = await pool.execute(query, [userId, quizId]);

        return { success: true, deletedRows: result?.affectedRows ?? 0 };
    } catch (error) {
        console.error('Error deleting chat history:', error);
        throw error;
    }
}

/**
 * Retrieve chat history for a specific user/quiz/question combination
 * @param {number} userId - The user ID
 * @param {string|number} quizId - The quiz ID
 * @param {string|number} questionId - The question ID
 * @returns {Object} Chat data and metadata
 */
async function getChatHistory(userId, quizId, questionId) {
    try {
        const query = `
            SELECT chat, lastSaved
            FROM chat_history
            WHERE userId = ? AND quizId = ? AND questionId = ?
        `;

        const [rows] = await pool.execute(query, [userId, quizId, questionId]);

        if (rows.length === 0) {
            return { chat: null, lastSaved: null };
        }

        const chatData = rows[0];
        let parsed = [];
        try {
            parsed = JSON.parse(chatData.chat || '[]');
        } catch (parseError) {
            console.error('Error parsing chat JSON:', parseError);
            parsed = [];
        }

        return {
            chat: parsed,
            lastSaved: chatData.lastSaved
        };
    } catch (error) {
        console.error('Error retrieving chat history:', error);
        throw error;
    }
}

/**
 * Save multiple chat histories at once (batch operation)
 * @param {number} userId - The user ID
 * @param {Array} chats - Array of chat objects with quizId, questionId, and chat
 * @returns {Object} Result with processed count and per-item details
 */
async function saveChatHistoryBatch(userId, chats) {
    try {
        const now = new Date();
        const query = `
            INSERT INTO chat_history (userId, quizId, questionId, chat, lastSaved)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE chat = ?, lastSaved = ?
        `;

        let processed = 0;
        const perItem = [];

        for (const entry of chats) {
            const quizId = entry.quizId;
            const questionId = entry.questionId;
            const chatPayload = entry.chat ?? entry.messages;
            
            if (!quizId || !questionId || !chatPayload) {
                perItem.push({ quizId, questionId, processed: false, reason: 'invalid item' });
                continue;
            }
            
            const chatJson = JSON.stringify(chatPayload);
            try {
                await pool.execute(query, [
                    userId,
                    quizId,
                    questionId,
                    chatJson,
                    now,
                    chatJson,
                    now
                ]);
                processed++;
                perItem.push({ quizId, questionId, processed: true });
            } catch (itemError) {
                console.error(`Error saving chat for quiz ${quizId}, question ${questionId}:`, itemError);
                perItem.push({ quizId, questionId, processed: false, reason: itemError.message });
            }
        }

        return { success: true, processed, total: chats.length, perItem };
    } catch (error) {
        console.error('Error in batch save chat history:', error);
        throw error;
    }
}

module.exports = {
    saveChatHistory,
    deleteChatHistory,
    getChatHistory,
    saveChatHistoryBatch
};
