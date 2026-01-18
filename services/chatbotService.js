import { Ollama } from 'ollama';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import fs from 'fs';

/**
 * Chatbot Service using Ollama API
 * Supports: Chat, Resume Building, Resume Review, PDF Q&A
 */

// Initialize Ollama client
// If OLLAMA_API_URL is set, use it. Otherwise default to localhost:11434
const ollamaHost = process.env.OLLAMA_API_URL || 'http://localhost:11434';
const ollama = new Ollama({ host: ollamaHost });

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Parse PDF buffer to text
 */
export const extractTextFromPDF = async (buffer) => {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    console.error('PDF Parse Error:', error);
    throw new Error('Failed to parse PDF file');
  }
};

/**
 * Get chatbot response
 * @param {string} message - User's message or query
 * @param {Array} conversationHistory - Previous conversation messages
 * @param {string} mode - 'mental-support', 'resume-builder', 'resume-review', 'pdf-qa', 'student-helper'
 * @param {string} contextData - Optional context text (e.g. parsed PDF content)
 */
export const getChatbotResponse = async (message, conversationHistory = [], mode = 'mental-support', contextData = '') => {
  // 1. Try Ollama (Preferred if running)
  if (process.env.OLLAMA_API_URL) {
    try {
      return await getOllamaResponse(message, conversationHistory, mode, contextData);
    } catch (error) {
      console.warn('Ollama connection failed, falling back to Groq/Cloud:', error.message);
      // Fall through to Groq if defined
    }
  }

  // 2. Fallback to Groq API (Cloud)
  if (process.env.GROQ_API_KEY) {
    try {
      return await getGroqResponse(message, conversationHistory, mode, contextData);
    } catch (error) {
      console.error('Groq API error:', error);
      return {
        success: false,
        message: 'Both local AI and backup cloud AI failed. Please check server logs.',
        error: error.message
      };
    }
  }

  // 3. No service available
  return {
    success: false,
    message: 'No AI service configured (Ollama or Groq).',
    error: 'Configuration missing'
  };
};

/**
 * Get response from Ollama
 */
const getOllamaResponse = async (message, conversationHistory, mode, contextData) => {
  const systemPrompt = getSystemPrompt(mode, contextData);

  // Format messages for Ollama
  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    { role: 'user', content: message }
  ];

  try {
    const modelName = process.env.OLLAMA_MODEL || 'mistral';
    console.log(`Using Ollama Model: ${modelName}`);

    const response = await ollama.chat({
      model: modelName, // Default to mistral if not specified
      messages: messages,
      stream: false,
    });

    return {
      success: true,
      message: response.message.content,
      model: response.model,
      usage: {
        total_duration: response.total_duration,
        eval_count: response.eval_count
      }
    };
  } catch (error) {
    // If specific model fails, try falling back to 'llama3' or generic 'mistral'
    console.error(`Ollama Error with model ${process.env.OLLAMA_MODEL}:`, error);
    throw new Error(`Ollama API error: ${error.message} (Make sure Ollama is running)`);
  }
};

/**
 * Get response from Groq API (Fallback)
 */
const getGroqResponse = async (message, conversationHistory, mode, contextData) => {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) throw new Error('GROQ_API_KEY is not set');

  const systemPrompt = getSystemPrompt(mode, contextData);

  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    { role: 'user', content: message }
  ];

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-70b-versatile',
      messages: messages,
      temperature: 0.7,
      max_tokens: 2048,
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || `Groq API error: ${response.status}`);
  }

  const data = await response.json();

  return {
    success: true,
    message: data.choices[0]?.message?.content,
    model: 'llama-3.1-70b-versatile (Groq)'
  };
};

/**
 * System Prompts based on Mode
 */
const getSystemPrompt = (mode, contextData) => {
  const basePrompts = {
    'mental-support': `You are StudyBuddy AI Mental Support Assistant.
      Role: Provide emotional support, stress management advice, and empathetic listening for students.
      Tone: Warm, non-judgmental, supportive, reassuring.
      Key Actions: Listen actively, offer coping strategies, encourage self-care.
      Safety: If the user mentions self-harm or severe crisis, gently urge them to seek professional help immediately.`,

    'resume-builder': `You are StudyBuddy AI Resume Architect.
      Role: Help students build professional, ATS-friendly resumes from scratch.
      Tone: Professional, encouraging, expert, detail-oriented.
      Key Actions:
      - Ask for details (education, experience, skills) if missing.
      - Draft sections with strong action verbs.
      - Optimization for ATS (keywords).
      - Advise on layout and structure.`,

    'resume-review': `You are StudyBuddy AI Resume Reviewer.
      Role: Critique and improve an existing resume provided by the student.
      Context: The student has uploaded a resume with the following content:
      """
      ${contextData}
      """
      Tone: Constructive, direct, professional.
      Key Actions:
      - Highlight strengths and weaknesses.
      - Suggest specific rewrites for bullet points (make them results-oriented).
      - Check for formatting consistency and ATS compatibility.
      - Identify missing key sections or skills relevant to their field.`,

    'pdf-qa': `You are StudyBuddy AI Document Assistant.
      Role: Answer questions based strictly on the provided document content.
      Context: The user has uploaded a document with the following content:
      """
      ${contextData}
      """
      Tone: Helpful, precise, clear.
      Key Actions:
      - Answer the user's question using ONLY the provided context.
      - If the answer is not in the document, state that clearly.
      - Summarize complex parts if asked.`,

    'student-helper': `You are StudyBuddy AI, an all-in-one academic assistant.
      Role: specific academic questions, explanation of concepts, or general study advice.
      Tone: Educational, knowledgeable, patient.
      Key Actions: Explain complex topics simply, provide study tips, solve problems.`
  };

  return basePrompts[mode] || basePrompts['student-helper'];
};

export const getAvailableModels = () => {
  return [
    { id: 'mistral', name: 'Mistral 7B', provider: 'Ollama' },
    { id: 'llama3', name: 'Llama 3 8B', provider: 'Ollama' },
    { id: 'llama-3.1-70b-versatile', name: 'Llama 3.1 (Groq)', provider: 'Groq' }
  ];
};
