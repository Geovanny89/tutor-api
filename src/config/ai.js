'use strict';

require('dotenv').config();

/**
 * AI Services Configuration
 * Manages free-tier AI APIs with usage tracking
 * 
 * Free tiers used:
 * - Groq: 14,400 req/day, Llama 3 model (conversational AI)
 * - Google Gemini Flash: 15 RPM, 1M tokens/day (feedback & evaluation)
 */

const AI_CONFIG = {
  // ─── Groq Configuration ───────────────────────────────────────────────────
  groq: {
    apiKey: process.env.GROQ_API_KEY,
    model: 'openai/gpt-oss-20b',
    maxTokens: parseInt(process.env.AI_TOKENS_PER_REQUEST) || 350,
    temperature: 0.75,
    systemPrompt: `You are a warm, highly engaging native English tutor practicing real spoken English with a student.
Student's CEFR Level: {level}.

Your mission is to carry on an authentic, enjoyable, continuous conversation:
1. Empathize & React: Respond directly and with genuine personality to whatever the student just said (1-2 sentences).
2. Add Value & Context: Share a quick personal opinion, a cultural fact, or an interesting related observation (1 sentence).
3. Gentle Correction (only when needed): If the student had a grammar or vocabulary slip, add a friendly tip: "💡 Quick tip: Instead of '...', native speakers usually say '...'."
4. Keep the Ball Rolling: ALWAYS ask a thought-provoking, open-ended question connected to what they said, so they are excited to speak next!
5. Match Level: Speak clearly with vocabulary suited for {level}. Do NOT give dry one-line answers. Be vibrant, encouraging, and conversational!
`,
  },

  // ─── Google Gemini Configuration ──────────────────────────────────────────
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    model: 'gemini-1.5-flash',     // Más rápido y económico
    maxTokens: parseInt(process.env.AI_TOKENS_PER_REQUEST) || 150,
    temperature: 0.5,
  },

  // ─── Usage Limits per User ────────────────────────────────────────────────
  limits: {
    dailyInteractions: parseInt(process.env.AI_DAILY_LIMIT) || 20,
    tokensPerRequest: parseInt(process.env.AI_TOKENS_PER_REQUEST) || 150,
    cacheExpirationSeconds: 3600,  // 1 hora de caché
  },

  // ─── Fallback (when AI limits exceeded) ───────────────────────────────────
  fallbackMessages: [
    "Great effort! Keep practicing! 🌟",
    "You're doing amazing! Try again tomorrow for more AI practice! 💪",
    "Excellent work today! Rest and come back stronger! 🎯",
    "Daily AI practice limit reached. Review your notes and keep going! 📚",
  ],
};

module.exports = AI_CONFIG;
