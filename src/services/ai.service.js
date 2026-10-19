'use strict';

const Groq = require('groq-sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const AI_CONFIG = require('../config/ai');
const CacheService = require('../utils/cache');

/**
 * AI Service
 * Manages all AI interactions with FREE tier APIs
 * 
 * Priority order:
 * 1. Cache hit → return cached response (FREE)
 * 2. Groq Llama3 → fast and generous free tier
 * 3. Gemini Flash → fallback if Groq fails
 * 4. Fallback message → if both fail or limits exceeded
 */

let groqClient = null;
let geminiClient = null;

// Initialize AI clients (lazy init to avoid errors on startup)
const getGroqClient = () => {
  if (!groqClient && process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your_groq_api_key_here') {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
};

const getGeminiClient = () => {
  if (!geminiClient && process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
    geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return geminiClient;
};

const AiService = {
  /**
   * Generate AI conversational response
   * Used for: voice conversation practice, feedback
   * 
   * @param {string} userMessage - What the student said
   * @param {string} level - CEFR level (A1, A2, B1...)
   * @param {Array} history - Previous messages [{ role, content }]
   * @param {string} context - Optional lesson context
   * @returns {{ text: string, tokensUsed: number, fromCache: boolean }}
   */
  async generateResponse(userMessage, level = 'A1', history = [], context = '') {
    const systemPrompt = AI_CONFIG.groq.systemPrompt.replace('{level}', level);
    const contextNote = context ? `\nContext/Topic: ${context}` : '';

    const messages = [
      { role: 'system', content: systemPrompt + contextNote },
      // Include recent conversation history (last 6 turns) so it flows naturally
      ...history.slice(-6).map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: userMessage },
    ];

    // 1. Try Groq (primary - ultrafast 20B conversational tutor)
    try {
      const groq = getGroqClient();
      if (groq) {
        const completion = await groq.chat.completions.create({
          model: AI_CONFIG.groq.model,
          messages,
          max_tokens: AI_CONFIG.groq.maxTokens,
          temperature: AI_CONFIG.groq.temperature,
        });

        const text = completion.choices[0]?.message?.content || '';
        const tokensUsed = completion.usage?.total_tokens || 80;

        return { text, tokensUsed, fromCache: false, provider: 'groq' };
      }
    } catch (groqError) {
      console.warn('[AI Service] Groq failed, trying Gemini:', groqError.message);
    }

    // 3. Try Gemini Flash (fallback)
    try {
      const genAI = getGeminiClient();
      if (genAI) {
        const model = genAI.getGenerativeModel({ model: AI_CONFIG.gemini.model });
        const prompt = `${systemPrompt}\n\nStudent says: ${userMessage}\n\nRespond briefly (2-3 sentences max):`;
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        CacheService.set(cacheKey, text, 3600);

        return { text, tokensUsed: 75, fromCache: false, provider: 'gemini' };
      }
    } catch (geminiError) {
      console.warn('[AI Service] Gemini failed:', geminiError.message);
    }

    // 4. Fallback response (no API available)
    const fallbacks = AI_CONFIG.fallbackMessages;
    const fallbackText = fallbacks[Math.floor(Math.random() * fallbacks.length)];
    return { text: fallbackText, tokensUsed: 0, fromCache: false, provider: 'fallback' };
  },

  /**
   * Grade a student's spoken/written answer
   * Uses lightweight evaluation - minimal tokens
   * 
   * @param {string} studentAnswer - Student's answer
   * @param {string} expectedAnswer - Correct answer
   * @param {string} level - CEFR level
   * @returns {{ score: number, feedback: string, corrections: Array }}
   */
  async gradeAnswer(studentAnswer, expectedAnswer, level = 'A1') {
    // For simple answers, use local logic (no AI tokens!)
    const normalizedStudent = studentAnswer.toLowerCase().trim();
    const normalizedExpected = expectedAnswer.toLowerCase().trim();

    // Exact match
    if (normalizedStudent === normalizedExpected) {
      return { score: 100, feedback: 'Perfect! Excellent work! 🌟', corrections: [], usedAi: false };
    }

    // Check key words match (for beginner levels)
    if (level === 'A1' || level === 'A2') {
      const expectedWords = normalizedExpected.split(' ');
      const studentWords = normalizedStudent.split(' ');
      const matchedWords = expectedWords.filter((w) => studentWords.includes(w));
      const score = Math.round((matchedWords.length / expectedWords.length) * 100);

      if (score >= 70) {
        return {
          score,
          feedback: score === 100 ? 'Perfect! 🎉' : 'Good job! Small differences are okay at your level! 👍',
          corrections: [],
          usedAi: false,
        };
      }
    }

    // For complex evaluation, use AI (B1 and above, or when local check fails)
    const cacheKey = `grade:${level}:${Buffer.from(studentAnswer.slice(0, 30)).toString('base64')}`;
    const cached = CacheService.get(cacheKey);
    if (cached) return { ...cached, fromCache: true };

    try {
      const groq = getGroqClient();
      if (groq) {
        const prompt = `You are evaluating an English student's pronunciation and spoken answer.
CEFR Level: ${level}
Expected phrase: "${expectedAnswer}"
Student actually said: "${studentAnswer}"

Evaluate their accuracy and provide a JSON response in this exact format:
{
  "score": 85,
  "feedback": "Great pronunciation! Very clear.",
  "corrections": []
}`;

        const completion = await groq.chat.completions.create({
          model: AI_CONFIG.groq.model,
          messages: [
            {
              role: 'system',
              content: 'You are an English speech evaluator. Always reply with a valid JSON object containing "score" (number from 0 to 100) and "feedback" (short string under 15 words).',
            },
            { role: 'user', content: prompt },
          ],
          max_tokens: 250,
          temperature: 0.3,
        });

        const rawContent = completion.choices[0]?.message?.content || '';
        let result = {};

        try {
          // Extract JSON block even if model wraps in markdown
          const match = rawContent.match(/\{[\s\S]*?\}/);
          if (match) {
            result = JSON.parse(match[0]);
          } else {
            result = JSON.parse(rawContent);
          }
        } catch (parseErr) {
          // If JSON parse fails, extract score with regex
          const scoreMatch = rawContent.match(/\b([0-9]{1,3})\b/);
          const extractedScore = scoreMatch ? Math.min(100, Math.max(0, parseInt(scoreMatch[1], 10))) : 80;
          result = {
            score: extractedScore,
            feedback: 'Good pronunciation effort! Keep speaking!',
            corrections: [],
          };
        }

        const response = {
          score: typeof result.score === 'number' ? result.score : 80,
          feedback: result.feedback || 'Good effort! Keep practicing your pronunciation!',
          corrections: Array.isArray(result.corrections) ? result.corrections : [],
          usedAi: true,
          tokensUsed: completion.usage?.total_tokens || 40,
        };

        CacheService.set(cacheKey, response, 7200);
        return response;
      }
    } catch (error) {
      console.warn('[AI Service] Grade answer failed:', error.message);
    }

    // Local fallback grading
    return {
      score: 65,
      feedback: 'Good effort! Review the lesson and try again! 💪',
      corrections: [],
      usedAi: false,
    };
  },

  /**
   * Explain a lesson concept step-by-step
   * Acts as an in-lesson private teacher for the student
   */
  async explainLessonConcept(lessonTitle, grammarRule, studentQuestion = '', level = 'A1') {
    const groq = getGroqClient();
    const prompt = `You are Beyli, a warm, highly pedagogical native English tutor guiding a Spanish-speaking student step-by-step through their English lesson.
CEFR Level: ${level}
Lesson Topic: "${lessonTitle}"
Grammar Structure/Rule: "${grammarRule}"
${studentQuestion ? `Student specifically asks: "${studentQuestion}"` : 'Explain this topic clearly from scratch so the student truly understands it.'}

Your explanation should:
1. Greet the student enthusiastically: "¡Hola! Vamos a dominar este tema juntos paso a paso 🌟".
2. Explain the concept simply in Spanish with English examples, breaking down WHY it works this way.
3. Show the exact structure formulas: Afirmativo, Negativo e Interrogativo.
4. Highlight the #1 common mistake made by native Spanish speakers (e.g., omitting 'it', confusing 'do/does', saying 'I have 20 years').
5. Give 2 real-life, practical sentences they can use right away with Spanish translation.
6. End with a friendly, short challenge inviting them to practice right now!

Keep your tone enthusiastic, pedagogical, clear, and highly encouraging. Use emojis to make it lively.`;

    if (groq) {
      try {
        const completion = await groq.chat.completions.create({
          model: AI_CONFIG.groq.model,
          messages: [{ role: 'system', content: prompt }],
          max_tokens: 800,
          temperature: 0.7,
        });
        const text = completion.choices[0]?.message?.content || '';
        return { text, tokensUsed: 150 };
      } catch (err) {
        console.warn('[AI Service] Explain failed in Groq:', err.message);
      }
    }
    return {
      text: `¡Hola! En esta lección de ${lessonTitle}, recuerda la regla principal: ${grammarRule}. Practica repitiendo en voz alta cada ejemplo y pregúntame cualquier duda. ¡Estás haciendo un gran trabajo!`,
      tokensUsed: 0,
    };
  },
};

module.exports = AiService;

