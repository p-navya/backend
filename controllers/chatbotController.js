import { getChatbotResponse, getAvailableModels, extractTextFromPDF } from '../services/chatbotService.js';

/**
 * Chat endpoint - handles mental support, resume builder, resume review, and PDF QA
 * POST /api/chatbot/chat
 * Body: { message: string, conversationHistory: Array, mode: string }
 * File: Optional (for resume-review or pdf-qa)
 */
export const chat = async (req, res) => {
  try {
    const { message, conversationHistory = [], mode = 'student-helper' } = req.body;
    let contextData = '';

    // Handle file upload if present
    if (req.file) {
      if (req.file.mimetype === 'application/pdf') {
        contextData = await extractTextFromPDF(req.file.buffer);
      } else {
        // Simple text decoding for other types if needed, or error
        return res.status(400).json({ success: false, message: 'Only PDF files are currently supported' });
      }
    }

    // Validate message (it might be empty if just uploading a file for initial analysis)
    if ((!message || typeof message !== 'string' || message.trim().length === 0) && !req.file) {
      return res.status(400).json({
        success: false,
        message: 'Message is required unless uploading a file'
      });
    }

    const parsedHistory = typeof conversationHistory === 'string'
      ? JSON.parse(conversationHistory)
      : conversationHistory;

    // Get chatbot response
    const result = await getChatbotResponse(message || 'Please analyze this document.', parsedHistory, mode, contextData);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.message || 'Failed to get chatbot response',
        error: result.error
      });
    }

    res.json({
      success: true,
      data: {
        response: result.message,
        model: result.model || 'unknown',
        usage: result.usage || {}
      }
    });
  } catch (error) {
    console.error('Chat controller error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

/**
 * Get available models
 * GET /api/chatbot/models
 */
export const getModels = async (req, res) => {
  try {
    const models = getAvailableModels();

    res.json({
      success: true,
      data: {
        models,
        recommended: process.env.GROQ_API_KEY ? 'groq' : 'ollama'
      }
    });
  } catch (error) {
    console.error('Get models error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get available models'
    });
  }
};


