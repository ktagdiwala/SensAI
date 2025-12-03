const express = require('express');
const { pool } = require('../config/dbConnection');
const { verifySession } = require('../middleware/sessionMiddleware');
const router = express.Router();

// POST /save
// Save chat history for a specific user/quiz/question combination
router.post('/save', verifySession, async (req, res) => {
    const { userId } = req.session;
    const { quizId, questionId, chat } = req.body;

    if (!quizId || !questionId || !chat) {
        return res.status(400).json({ message: 'quizId, questionId, and chat are required.' });
    }

    try {
        const chatJson = JSON.stringify(chat);
        const now = new Date();

        // Insert or update chat history
        const query = `
            INSERT INTO chat_history (userId, quizId, questionId, chat, lastSaved)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE chat = ?, lastSaved = ?
        `;

        await pool.execute(query, [
            userId,
            quizId,
            questionId,
            chatJson,
            now,
            chatJson,
            now
        ]);

        return res.status(200).json({ message: 'Chat history saved successfully.' });
    } catch (error) {
        console.error('Error saving chat history:', error);
        return res.status(500).json({ message: 'Error saving chat history.' });
    }
});

// GET /:quizId/:questionId
// Retrieve chat history for a specific user/quiz/question combination
router.get('/:quizId/:questionId', verifySession, async (req, res) => {
    const { userId } = req.session;
    const { quizId, questionId } = req.params;

    if (!quizId || !questionId) {
        return res.status(400).json({ message: 'quizId and questionId are required.' });
    }

    try {
        const query = `
            SELECT chat, lastSaved
            FROM chat_history
            WHERE userId = ? AND quizId = ? AND questionId = ?
        `;

        const [rows] = await pool.execute(query, [userId, quizId, questionId]);

        if (rows.length === 0) {
            return res.status(200).json({ chat: null });
        }

        const chatData = rows[0];
        const chat = JSON.parse(chatData.chat);

        return res.status(200).json({
            chat,
            lastSaved: chatData.lastSaved
        });
    } catch (error) {
        console.error('Error retrieving chat history:', error);
        return res.status(500).json({ message: 'Error retrieving chat history.' });
    }
});

// POST /save-batch
// Save multiple chat histories at once (for when user leaves the quiz page)
router.post('/save-batch', verifySession, async (req, res) => {
    const { userId } = req.session;
    const { chats } = req.body;

    if (!Array.isArray(chats) || chats.length === 0) {
        return res.status(400).json({ message: 'chats array is required.' });
    }

    try {
        const now = new Date();
        const query = `
            INSERT INTO chat_history (userId, quizId, questionId, chat, lastSaved)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE chat = ?, lastSaved = ?
        `;

        // Execute all inserts/updates
        const promises = chats.map(({ quizId, questionId, chat }) => {
            if (!quizId || !questionId || !chat) {
                return Promise.reject(new Error('Invalid chat data'));
            }
            const chatJson = JSON.stringify(chat);
            return pool.execute(query, [
                userId,
                quizId,
                questionId,
                chatJson,
                now,
                chatJson,
                now
            ]);
        });

        await Promise.all(promises);

        return res.status(200).json({ message: 'All chat histories saved successfully.' });
    } catch (error) {
        console.error('Error saving batch chat history:', error);
        return res.status(500).json({ message: 'Error saving batch chat history.' });
    }
});

module.exports = router;
