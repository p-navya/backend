import { Ollama } from 'ollama';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import { analyzeATSCompatibility, callPublicATSAPI } from './atsService.js';

/**
 * Chatbot Service using Ollama API
 * Supports: Chat, Resume Building, Resume Review, PDF Q&A
 */

// Initialize Ollama client
// If OLLAMA_API_URL is set, use it. Otherwise default to localhost:11434
const ollamaHost = process.env.OLLAMA_API_URL || 'http://localhost:11434';
const ollama = new Ollama({ host: ollamaHost });

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
  // Try Ollama
  try {
    return await getOllamaResponse(message, conversationHistory, mode, contextData);
  } catch (error) {
    console.error('Ollama connection failed:', error.message);
    return {
      success: false,
      message: 'Local AI (Ollama) is not reachable. Please make sure the Ollama app is running on your computer.',
      error: error.message
    };
  }
};

/**
 * Get response from Ollama
 */
const getOllamaResponse = async (message, conversationHistory, mode, contextData) => {
  const systemPrompt = await getSystemPrompt(mode, contextData, message);

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
      model: modelName,
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
    console.error(`Ollama Error with model ${process.env.OLLAMA_MODEL}:`, error);
    throw new Error(`Ollama API error: ${error.message} (Make sure Ollama is running)`);
  }
};

/**
 * Simple "Vector-less" Retrieval (Keyword Matching)
 * Splits text into chunks and finds best matches for the query.
 */
const getRelevantContext = (fullText, query, maxChunks = 3, chunkSize = 1500) => {
  if (!fullText) return '';

  if (fullText.length < 6000) {
    return fullText;
  }

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

  if (chunks.length <= maxChunks) return fullText;

  const uniqueKeywords = [...new Set(query.toLowerCase().match(/\w{4,}/g) || [])];

  const scoredChunks = chunks.map(chunk => {
    const text = chunk.toLowerCase();
    let score = 0;
    uniqueKeywords.forEach(word => {
      if (text.includes(word)) score++;
    });
    return { chunk, score };
  });

  scoredChunks.sort((a, b) => b.score - a.score);
  const topChunks = scoredChunks.slice(0, maxChunks).map(c => c.chunk);

  return topChunks.join('\n\n[...]\n\n');
};

/**
 * Heuristic ATS Scoring Logic
 * Provides a baseline score based on structural elements and keyword matching.
 */
const calculateATSHeuristic = async (text) => {
  return await callPublicATSAPI(text);
};

/**
 * System Prompts based on Mode
 */
const getSystemPrompt = async (mode, contextData, userMessage = '') => {
  let processedContext = contextData;

  if ((mode === 'pdf-qa' || mode === 'resume-review' || mode === 'resume-builder') && contextData.length > 2000 && userMessage) {
    processedContext = getRelevantContext(contextData, userMessage);
  }

  const atsAnalysis = mode === 'resume-review' ? await calculateATSHeuristic(contextData) : null;
  const heuristicScore = atsAnalysis ? atsAnalysis.overallScore : 0;
  const atsAnalysisJson = atsAnalysis ? JSON.stringify(atsAnalysis) : '{}';

  const basePrompts = {
    'mental-support': `You are StudyBuddy AI's Wellness Companion, a warm, empathetic, and supportive friend.
      
      YOUR ROLE:
      - Listen without judgment.
      - Validate the user's feelings (e.g., "It makes sense that you feel that way").
      - Offer gentle encouragement and practical, small steps if asked.
      - NEVER give medical advice. If the user mentions self-harm or severe crisis, gently urge them to seek professional help.
      
      SCENARIO GUIDES:
      1. MOTIVATION: Be energetic but grounded. Remind them of their potential. Use quotes or metaphors about growth.
      2. VENTING/STRESS: Use active listening. Ask open-ended questions like "What's weighing on you the most right now?" Don't rush to "fix" it unless asked.
      3. ANXIETY: Guide them through grounding techniques (e.g., "Let's take a deep breath together. 4-7-8 method..."). Be calm and slow-paced.
      4. CASUAL CHAT: Be friendly, curious, and lighthearted. Ask about their day, hobbies, or interests.
      
      Tone: Warm, safe, non-clinical, and human-like.`,
    'resume-builder': `You are StudyBuddy AI Resume Architect.`,
    'resume-review': `You are StudyBuddy AI, a professional ATS Optimizer, mimicking advanced tools like Enhancv.
      
      CORE RULE: You MUST return a JSON object that matches the structure of a premium resume analysis report.
      
      A computer heuristic has calculated the following baseline stats for this resume:
      ${atsAnalysisJson}
      
      Your task:
      1. Refine the baseline "overallScore" based on qualitative quality (Action verbs, Impact, Clarity).
      2. Refine the status/descriptions of each item in the categories (CONTENT, SECTIONS, ATS ESSENTIALS).
      3. Add high-impact issues if you find them.
      
      MANDATORY RESPONSE FORMAT (Strict JSON only):
      {
        "overallScore": [Score 0-100],
        "issuesCount": [Total issues],
        "categories": {
          "CONTENT": {
            "score": [0-100],
            "items": [
              { "label": "ATS Parse Rate", "status": "success", "issues": 0, "description": "..." },
              { "label": "Quantifying Impact", "status": "...", "issues": X, "description": "..." },
              { "label": "Repetition", "status": "...", "issues": X, "description": "..." },
              { "label": "Spelling & Grammar", "status": "...", "issues": X, "description": "..." }
            ]
          },
          "SECTIONS": {
             "score": [0-100],
             "items": [...]
          },
          "ATS ESSENTIALS": {
             "score": [0-100],
             "items": [...]
          }
        }
      }

      Wait! If the user asks a normal question about their resume, answer it normally INSTEAD of this JSON. But if they just upload/ask for a review, use this JSON format.

      Resume Content: ${processedContext}`,
    'pdf-qa': `You are StudyBuddy AI Document Assistant.
      Context: ${processedContext}`,
    'resume-optimize': `Rewrite this resume content to be high-impact and ATS-optimized. 
      Return ONLY a JSON object (no preamble):
      {
        "fullName": "...", "title": "...", "email": "...", "phone": "...", "address": "...", "linkedin": "...", "portfolio": "...", "github": "...", "summary": "...",
        "skills": { "languages": "...", "frameworks": "...", "tools": "..." },
        "experience": [{ "role": "...", "company": "...", "location": "...", "period": "...", "highlights": ["..."] }],
        "projects": [{ "name": "...", "description": "..." }],
        "education": [{ "degree": "...", "university": "...", "period": "...", "cgpa": "..." }],
        "achievements": ["..."]
      }
      Context: ${processedContext}`,
    'studybuddy-ai': `You are StudyBuddy AI, a highly capable learning assistant.`,
    'student-helper': `You are StudyBuddy AI, an all-in-one academic assistant.`
  };

  return basePrompts[mode] || basePrompts['student-helper'];
};

export const getAvailableModels = () => {
  return [
    { id: 'mistral', name: 'Mistral 7B', provider: 'Ollama' },
    { id: 'llama3', name: 'Llama 3 8B', provider: 'Ollama' }
  ];
};
