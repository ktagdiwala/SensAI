const express = require('express');
const { pool } = require('../config/dbConnection');
const { verifySession } = require('../middleware/sessionMiddleware');
const router = express.Router();

// debug helper removed

// POST /save
// Save chat history for a specific user/quiz/question combination
router.post('/save', verifySession, async (req, res) => {
    const { userId, user } = req.session || {};
    const { quizId, questionId, chat, messages } = req.body || {};

    // minimal validation only

    const chatPayload = chat ?? messages ?? null; // accept either 'chat' or 'messages'
    if (!quizId || !questionId || !chatPayload) {
        return res.status(400).json({ message: 'quizId, questionId, and chat/messages are required.', diagnostics: { quizId, questionId, hasChat: !!chat, hasMessagesArray: Array.isArray(messages) } });
    }

    try {
        const chatJson = JSON.stringify(chatPayload);
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

        return res.status(200).json({ message: 'Chat history saved successfully.' });
    } catch (error) {
        console.error('Error saving chat history:', error);
        return res.status(500).json({ message: 'Error saving chat history.', diagnostics: { code: error?.code, err: error?.message } });
    }
});

// GET /:quizId/:questionId
// Retrieve chat history for a specific user/quiz/question combination
router.get('/:quizId/:questionId', verifySession, async (req, res) => {
    const { userId, user } = req.session || {};
    const { quizId, questionId } = req.params;

    // minimal logging

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
        //

        if (rows.length === 0) {
            return res.status(200).json({ chat: null, diagnostics: { found: 0 } });
        }

        const chatData = rows[0];
        let parsed = [];
        try { parsed = JSON.parse(chatData.chat || '[]'); } catch { parsed = []; }

        return res.status(200).json({
            chat: parsed,
            lastSaved: chatData.lastSaved,
            diagnostics: { found: rows.length }
        });
    } catch (error) {
        console.error('Error retrieving chat history:', error);
        return res.status(500).json({ message: 'Error retrieving chat history.', diagnostics: { code: error?.code, err: error?.message } });
    }
});

// POST /save-batch
// Save multiple chat histories at once (for when user leaves the quiz page)
router.post('/save-batch', verifySession, async (req, res) => {
    const { userId, user } = req.session || {};
    const { chats, items } = req.body || {};

    // minimal logging

    const list = Array.isArray(chats) ? chats : (Array.isArray(items) ? items : null);
    if (!Array.isArray(list) || list.length === 0) {
        return res.status(400).json({ message: 'chats/items array is required.', diagnostics: { hasChatsArray: Array.isArray(chats), hasItemsArray: Array.isArray(items) } });
    }

    try {
        const now = new Date();
        const query = `
            INSERT INTO chat_history (userId, quizId, questionId, chat, lastSaved)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE chat = ?, lastSaved = ?
        `;

        let processed = 0;
        const perItem = [];

        for (const entry of list) {
            const quizId = entry.quizId;
            const questionId = entry.questionId;
            const chatPayload = entry.chat ?? entry.messages;
            if (!quizId || !questionId || !chatPayload) {
                perItem.push({ quizId, questionId, processed: false, reason: 'invalid item' });
                continue;
            }
            const chatJson = JSON.stringify(chatPayload);
            try {
                const [result] = await pool.execute(query, [
                    userId,
                    quizId,
                    questionId,
                    chatJson,
                    now,
                    chatJson,
                    now
                ]);
                processed++;
                perItem.push({ quizId, questionId, processed: true, affectedRows: result?.affectedRows ?? null });
            } catch (e) {
                console.error('Item save error:', e);
                perItem.push({ quizId, questionId, processed: false, error: e?.message, code: e?.code });
            }
        }

        return res.status(200).json({ message: 'All chat histories save attempt complete.', processed });
    } catch (error) {
        console.error('Error saving batch chat history:', error);
        return res.status(500).json({ message: 'Error saving batch chat history.', diagnostics: { code: error?.code, err: error?.message } });
    }
});

// DELETE /:quizId
// Delete all chat history for a specific user/quiz combination
router.delete('/:quizId', verifySession, async (req, res) => {
    const { userId, user } = req.session || {};
    const { quizId } = req.params;

    if (!quizId) {
        return res.status(400).json({ message: 'quizId is required.' });
    }

    try {
        const query = `
            DELETE FROM chat_history
            WHERE userId = ? AND quizId = ?
        `;

        const [result] = await pool.execute(query, [userId, quizId]);

        return res.status(200).json({ message: 'Chat history deleted successfully.', deletedRows: result?.affectedRows ?? 0 });
    } catch (error) {
        console.error('Error deleting chat history:', error);
        return res.status(500).json({ message: 'Error deleting chat history.', diagnostics: { code: error?.code, err: error?.message } });
    }
});

module.exports = router;
