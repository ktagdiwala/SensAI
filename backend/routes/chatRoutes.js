const express = require('express');
const { verifySession } = require('../middleware/sessionMiddleware');
const { 
    saveChatHistory, 
    deleteChatHistory, 
    getChatHistory, 
    saveChatHistoryBatch 
} = require('../utils/chatUtils');
const router = express.Router();

// POST /save
// Save chat history for a specific user/quiz/question combination
router.post('/save', verifySession, async (req, res) => {
    const { userId } = req.session || {};
    const { quizId, questionId, chat, messages } = req.body || {};

    const chatPayload = chat ?? messages ?? null;
    if (!quizId || !questionId || !chatPayload) {
        return res.status(400).json({ 
            message: 'quizId, questionId, and chat/messages are required.', 
            diagnostics: { quizId, questionId, hasChat: !!chat, hasMessagesArray: Array.isArray(messages) } 
        });
    }

    try {
        await saveChatHistory(userId, quizId, questionId, chatPayload);
        return res.status(200).json({ message: 'Chat history saved successfully.' });
    } catch (error) {
        return res.status(500).json({ 
            message: 'Error saving chat history.', 
            diagnostics: { code: error?.code, err: error?.message } 
        });
    }
});

// DELETE /:quizId
// Delete all chat history for a specific user/quiz combination
router.delete('/:quizId', verifySession, async (req, res) => {
    const { userId } = req.session || {};
    const { quizId } = req.params;

    if (!quizId) {
        return res.status(400).json({ message: 'quizId is required.' });
    }

    try {
        const result = await deleteChatHistory(userId, quizId);
        return res.status(200).json({ 
            message: 'Chat history deleted successfully.', 
            deletedRows: result.deletedRows 
        });
    } catch (error) {
        return res.status(500).json({ 
            message: 'Error deleting chat history.', 
            diagnostics: { code: error?.code, err: error?.message } 
        });
    }
});

// GET /:quizId/:questionId
// Retrieve chat history for a specific user/quiz/question combination
router.get('/:quizId/:questionId', verifySession, async (req, res) => {
    const { userId } = req.session || {};
    const { quizId, questionId } = req.params;

    if (!quizId || !questionId) {
        return res.status(400).json({ message: 'quizId and questionId are required.' });
    }

    try {
        const result = await getChatHistory(userId, quizId, questionId);
        
        return res.status(200).json({
            chat: result.chat,
            lastSaved: result.lastSaved,
            diagnostics: { found: result.chat ? 1 : 0 }
        });
    } catch (error) {
        return res.status(500).json({ 
            message: 'Error retrieving chat history.', 
            diagnostics: { code: error?.code, err: error?.message } 
        });
    }
});

// POST /save-batch
// Save multiple chat histories at once (for when user leaves the quiz page)
router.post('/save-batch', verifySession, async (req, res) => {
    const { userId } = req.session || {};
    const { chats, items } = req.body || {};

    const list = Array.isArray(chats) ? chats : (Array.isArray(items) ? items : null);
    if (!Array.isArray(list) || list.length === 0) {
        return res.status(400).json({ 
            message: 'chats/items array is required.', 
            diagnostics: { hasChatsArray: Array.isArray(chats), hasItemsArray: Array.isArray(items) } 
        });
    }

    try {
        const result = await saveChatHistoryBatch(userId, list);
        return res.status(200).json({ 
            message: 'All chat histories save attempt complete.', 
            processed: result.processed,
            total: result.total
        });
    } catch (error) {
        return res.status(500).json({ 
            message: 'Error saving batch chat history.', 
            diagnostics: { code: error?.code, err: error?.message } 
        });
    }
});

module.exports = router;
