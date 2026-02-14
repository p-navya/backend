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
  const systemPrompt = getSystemPrompt(mode, contextData, message);

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

  const systemPrompt = getSystemPrompt(mode, contextData, message);

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

/**
 * Simple "Vector-less" Retrieval (Keyword Matching)
 * Splits text into chunks and finds best matches for the query.
 */
const getRelevantContext = (fullText, query, maxChunks = 3, chunkSize = 1500) => {
  if (!fullText) return '';

  // STRATEGY: ChatGPT-like Context Window
  // If the text is small enough (e.g. Resume, Article < 6000 chars),
  // JUST SEND IT ALL. This provides the best reasoning capabilities.
  if (fullText.length < 6000) {
    console.log(`Context is small (${fullText.length} chars). Sending full text for maximum accuracy.`);
    return fullText;
  }

  // 1. Split into chunks (roughly by paragraphs or fixed size)
  const paragraphs = fullText.split(/\n\s*\n/);
  const chunks = [];
  let currentChunk = '';

  for (const p of paragraphs) {
    if ((currentChunk + p).length > chunkSize) {
      if (currentChunk) chunks.push(currentChunk);
      currentChunk = p;
    } else {
      currentChunk += (currentChunk ? '\n' + p : p);
    }
  }
  if (currentChunk) chunks.push(currentChunk);

  // If text is short, just return it all
  if (chunks.length <= maxChunks) return fullText;

  // 2. Score chunks based on unique keyword overlap
  const uniqueKeywords = [...new Set(query.toLowerCase().match(/\w{4,}/g) || [])];

  const scoredChunks = chunks.map(chunk => {
    const text = chunk.toLowerCase();
    let score = 0;
    uniqueKeywords.forEach(word => {
      if (text.includes(word)) score++;
    });
    return { chunk, score };
  });

  // 3. Sort by score and pick top N
  scoredChunks.sort((a, b) => b.score - a.score);
  const topChunks = scoredChunks.slice(0, maxChunks).map(c => c.chunk);

  console.log(`RAG: Retrieved ${topChunks.length} relevant chunks for query: "${query}"`);
  return topChunks.join('\n\n[...]\n\n');
};

/**
 * System Prompts based on Mode
 */
const getSystemPrompt = (mode, contextData, userMessage = '') => {
  // For PDF-QA or Resume Review, specific optimization:
  let processedContext = contextData;

  // If Context is HUGE (>2000 chars) and we have a specific user query, try to shrink it
  if ((mode === 'pdf-qa' || mode === 'resume-review' || mode === 'resume-builder') && contextData.length > 2000 && userMessage) {
    processedContext = getRelevantContext(contextData, userMessage);
  }

  const basePrompts = {
    'mental-support': `You are StudyBuddy AI, a friendly and empathetic conversational companion.
      Role: Engage in a warm, casual, and supportive conversation with the student.
      Tone: Friendly, casual, understanding, like a caring friend.
      Key Actions:
      - Chat about their day, feelings, or general topics.
      - Offer simple words of encouragement if they are stressed.
      - Keep the conversation flowing naturally.
      - Do NOT act like a clinical therapist; just be a supportive friend.`,

    'resume-builder': `You are StudyBuddy AI Resume Architect.
      Role: Help students build professional, ATS-friendly resumes from scratch.
      Tone: Professional, encouraging, expert, detail-oriented.
      Key Actions:
      - Ask for details (education, experience, skills) if missing.
      - Draft sections with strong action verbs.
      - Optimization for ATS (keywords).
      - Advise on layout and structure.`,

    'resume-review': `You are StudyBuddy AI, an expert Resume Editor & Career Coach.
      Role: CRITICALLY ANALYZE and REWRITE the user's resume for maximum impact.
      Context: The user has uploaded a resume (content below):
      """
      ${processedContext}
      """
      Tone: Professional, Action-Oriented, Direct.
      Instruction:
      - If the user asks to "fix" or "improve", DO NOT just summarize.
      - REWRITE weak bullet points to be results-oriented (xyz% increase, led team of n).
      - Correct grammar and formatting inconsistencies.
      - Provide specific, actionable feedback on what to change.
      - Output the REVISED sections clearly.`,

    'pdf-qa': `You are StudyBuddy AI Document Assistant.
      Role: Helpful assistant for analyzing documents.
      Context: The user has uploaded a document. Relevant excerpts:
      """
      ${processedContext}
      """
      Instruction:
      - Answer based ONLY on the provided text.
      - If the user asks to "fix", "summarize", or "rewrite" the document, PERFORM THAT ACTION on the provided text.
      - Do not just describe the document; engage with it (e.g., rewrite it, analyze it).`,

    'studybuddy-ai': `You are StudyBuddy AI, a highly capable and intelligent learning assistant.
      Role: Act as the primary interface for students to solve problems, learn concepts, and manage their academic life.
      Tone: Intelligent, proactive, structured, and encouraging.
      Key Actions: Provide high-quality explanations, help with scheduling, synthesize information from various sources, and act as a central hub for all student needs.`,

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

