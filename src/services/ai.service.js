'use strict';

const Groq = require('groq-sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const AI_CONFIG = require('../config/ai');
const CacheService = require('../utils/cache');

/**
 * AI Service
 * Manages every AI interaction using FREE tier providers.
 *
 * Provider chain (per request):
 *   1. Cache hit (when the task is deterministic)  → 0 tokens
 *   2. Groq (openai/gpt-oss-20b)                   → primary
 *   3. Google Gemini Flash                         → fallback
 *   4. Friendly canned message                     → last resort only
 *
 * Every public method returns `provider` so the UI can tell the student
 * whether the tutor is really connected or running in degraded mode.
 */

let groqClient = null;
let geminiClient = null;
let lastProviderError = null;

const isPlaceholder = (value) => !value || /your_.*_here/i.test(value);

// Gemini API keys always start with "AIza". Anything else is an OAuth token
// and will fail, so we skip it instead of burning a request on every message.
const isValidGeminiKey = (key) => typeof key === 'string' && key.startsWith('AIza');

const getGroqClient = () => {
  if (!groqClient && !isPlaceholder(process.env.GROQ_API_KEY)) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
};

const getGeminiClient = () => {
  if (!geminiClient && isValidGeminiKey(process.env.GEMINI_API_KEY)) {
    geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return geminiClient;
};

const fill = (template, values) =>
  Object.entries(values).reduce(
    (acc, [key, value]) => acc.replace(new RegExp(`\\{${key}\\}`, 'g'), value ?? ''),
    template
  );

const levelGuide = (level) => AI_CONFIG.levelGuide[level] || AI_CONFIG.levelGuide.A1;

/**
 * Extract the first JSON object found in a model answer.
 * LLMs sometimes wrap JSON in markdown fences or add a preamble.
 */
const parseJson = (raw = '') => {
  const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
};

const AiService = {
  /**
   * Which providers are actually available right now
   */
  getProviderStatus() {
    const groqReady = !!getGroqClient();
    const geminiReady = !!getGeminiClient();
    return {
      groq: groqReady,
      gemini: geminiReady,
      connected: groqReady || geminiReady,
      active: groqReady ? 'groq' : geminiReady ? 'gemini' : 'offline',
      last_error: lastProviderError,
    };
  },

  // ─── Low level text generation ────────────────────────────────────────────
  /**
   * Generate free text, trying Groq first and Gemini as fallback.
   * @returns {{ text: string, provider: string, tokensUsed: number }}
   */
  async generateText({ systemPrompt, messages = [], temperature, maxTokens }) {
    const groq = getGroqClient();
    if (groq) {
      try {
        const completion = await groq.chat.completions.create({
          model: AI_CONFIG.groq.model,
          messages: [{ role: 'system', content: systemPrompt }, ...messages],
          max_tokens: maxTokens || AI_CONFIG.groq.maxTokens,
          temperature: temperature ?? AI_CONFIG.groq.temperature,
          reasoning_effort: AI_CONFIG.groq.reasoningEffort,
        });
        const text = completion.choices[0]?.message?.content?.trim() || '';
        if (text) {
          lastProviderError = null;
          return { text, provider: 'groq', tokensUsed: completion.usage?.total_tokens || 80 };
        }
        lastProviderError = 'groq: empty completion (raise AI_TOKENS_PER_REQUEST)';
        console.warn('[AI] Groq returned an empty completion → trying Gemini');
      } catch (error) {
        lastProviderError = `groq: ${error.message}`;
        console.warn('[AI] Groq failed → trying Gemini:', error.message);
      }
    }

    const genAI = getGeminiClient();
    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({
          model: AI_CONFIG.gemini.model,
          systemInstruction: systemPrompt,
        });
        const conversation = messages
          .map((m) => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`)
          .join('\n');
        const result = await model.generateContent(conversation || 'Hello!');
        const text = result.response.text()?.trim() || '';
        if (text) {
          lastProviderError = null;
          return { text, provider: 'gemini', tokensUsed: 75 };
        }
      } catch (error) {
        lastProviderError = `gemini: ${error.message}`;
        console.warn('[AI] Gemini failed:', error.message);
      }
    }

    return { text: '', provider: 'offline', tokensUsed: 0 };
  },

  /**
   * Generate a JSON object. Always resolves: never throws, never returns null text.
   */
  async generateJson({ systemPrompt, userPrompt, cacheKey = null, ttl = 3600, maxTokens = 900 }) {
    if (cacheKey) {
      const cached = CacheService.get(cacheKey);
      if (cached) return { data: cached, provider: 'cache', fromCache: true, tokensUsed: 0 };
    }

    const groq = getGroqClient();
    let raw = '';
    let provider = 'offline';
    let tokensUsed = 0;

    if (groq) {
      const payload = {
        model: AI_CONFIG.groq.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: maxTokens,
        temperature: 0.6,
        reasoning_effort: AI_CONFIG.groq.reasoningEffort,
      };

      // Try native JSON mode first (cleanest output), then retry as plain text
      // when the provider rejects it with "json_validate_failed".
      for (const useJsonMode of [true, false]) {
        try {
          const completion = await groq.chat.completions.create(
            useJsonMode ? { ...payload, response_format: { type: 'json_object' } } : payload
          );
          raw = completion.choices[0]?.message?.content || '';
          provider = 'groq';
          tokensUsed = completion.usage?.total_tokens || 300;
          if (raw) break;
        } catch (error) {
          lastProviderError = `groq: ${error.message}`;
          console.warn(
            `[AI] Groq JSON failed (json_mode=${useJsonMode})${useJsonMode ? ' → retrying without JSON mode' : ' → trying Gemini'}:`,
            error.message
          );
        }
      }
    }

    if (!raw) {
      const genAI = getGeminiClient();
      if (genAI) {
        try {
          const model = genAI.getGenerativeModel({
            model: AI_CONFIG.gemini.model,
            systemInstruction: systemPrompt,
          });
          const result = await model.generateContent(userPrompt);
          raw = result.response.text() || '';
          provider = 'gemini';
          tokensUsed = 250;
        } catch (error) {
          lastProviderError = `gemini: ${error.message}`;
          console.warn('[AI] Gemini JSON failed:', error.message);
        }
      }
    }

    const data = parseJson(raw);
    if (!data) return { data: null, provider, fromCache: false, tokensUsed };

    if (cacheKey) CacheService.set(cacheKey, data, ttl);
    return { data, provider, fromCache: false, tokensUsed };
  },

  // ─── 1. Live conversation with the tutor ──────────────────────────────────
  /**
   * @param {string} userMessage - what the student said
   * @param {string} level - CEFR level
   * @param {Array} history - [{ role: 'user'|'assistant', content }]
   * @param {object} options - { mode: 'conversation'|'lesson'|'technical', persona, context, domain }
   */
  async generateResponse(userMessage, level = 'A1', history = [], options = {}) {
    const { mode = 'conversation', persona = 'Beyli (Friendly Native Tutor)', context = '', domain = 'general professional English' } = options;

    const systemPrompt =
      mode === 'technical'
        ? fill(AI_CONFIG.technicalPrompt, { level, levelGuide: levelGuide(level), domain })
        : mode === 'lesson'
          ? fill(AI_CONFIG.lessonPrompt, { level, levelGuide: levelGuide(level), context: context || 'general English lesson' })
          : fill(AI_CONFIG.conversationPrompt, { level, levelGuide: levelGuide(level), persona });

    const messages = [
      ...history.slice(-8).map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: mode === 'conversation' && context ? `[Contexto: ${context}]\n${userMessage}` : userMessage },
    ];

    const { text, provider, tokensUsed } = await this.generateText({ systemPrompt, messages });

    if (!text) {
      const fallback = AI_CONFIG.fallbackMessages[Math.floor(Math.random() * AI_CONFIG.fallbackMessages.length)];
      return { text: fallback, tokensUsed: 0, fromCache: false, provider: 'fallback' };
    }

    return { text, tokensUsed, fromCache: false, provider };
  },

  // ─── 2. Grade pronunciation / written answer ──────────────────────────────
  /**
   * @returns {{ score, accuracy, feedback, corrections, mispronounced_words, next_tip, provider, usedAi }}
   */
  async gradeAnswer(studentAnswer, expectedAnswer, level = 'A1') {
    const normalizedStudent = String(studentAnswer || '').toLowerCase().trim();
    const normalizedExpected = String(expectedAnswer || '').toLowerCase().trim();

    const normalize = (text) =>
      text
        .replace(/[.,!?;:¡¿"']/g, '')
        .replace(/\s+/g, ' ')
        .replace(/\bdon't\b/g, 'do not')
        .replace(/\bdoesn't\b/g, 'does not')
        .replace(/\bcan't\b/g, 'cannot')
        .replace(/\bi'm\b/g, 'i am')
        .trim();

    const a = normalize(normalizedStudent);
    const b = normalize(normalizedExpected);

    // ── 1. Exact match after normalization: zero AI cost ────────────────────
    if (a && a === b) {
      return {
        score: 100, accuracy: 100,
        feedback: '¡Perfecto! Pronunciación y frase exactas. 🌟',
        corrections: [], mispronounced_words: [],
        next_tip: 'Sigue así: prueba una frase un poco más larga.',
        provider: 'local', fromCache: false, usedAi: false, tokensUsed: 0,
      };
    }

    // ── 2. Local word-overlap scoring: gives instant feedback and a baseline ─
    const expectedWords = b.split(' ').filter(Boolean);
    const studentWords = a.split(' ').filter(Boolean);
    const matched = expectedWords.filter((w) => studentWords.includes(w));
    const overlap = expectedWords.length ? Math.round((matched.length / expectedWords.length) * 100) : 0;

    // Very high overlap → accept locally, no AI needed
    if (overlap >= 92) {
      return {
        score: overlap, accuracy: overlap,
        feedback: '¡Muy bien! Se entiende perfectamente. 👏',
        corrections: [], mispronounced_words: [],
        next_tip: 'Cuida la entonación final de la frase.',
        provider: 'local', fromCache: false, usedAi: false, tokensUsed: 0,
      };
    }

    // ── 3. Detailed AI feedback (per-word pronunciation guidance) ───────────
    const cacheKey = `grade:${level}:${Buffer.from(`${a}|${b}`).toString('base64').slice(0, 40)}`;
    const { data, provider, fromCache, tokensUsed } = await this.generateJson({
      systemPrompt: AI_CONFIG.gradeSystemPrompt,
      userPrompt: fill(AI_CONFIG.gradePrompt, {
        level,
        expected: expectedAnswer,
        student: studentAnswer,
      }),
      cacheKey,
      ttl: 7200,
      maxTokens: 900,
    });

    if (data) {
      const score = Math.max(0, Math.min(100, Number(data.score) || overlap));
      return {
        score,
        accuracy: Number(data.accuracy) || score,
        feedback: data.feedback || '¡Buen intento! Sigue practicando tu pronunciación. 💪',
        corrections: Array.isArray(data.corrections) ? data.corrections : [],
        mispronounced_words: Array.isArray(data.mispronounced_words) ? data.mispronounced_words : [],
        next_tip: data.next_tip || '',
        usedAi: !fromCache && provider !== 'local',
        fromCache,
        provider,
        tokensUsed,
      };
    }

    // ── 4. Local fallback grading (never blocks the student) ────────────────
    const missing = expectedWords.filter((w) => !studentWords.includes(w));
    return {
      score: overlap,
      accuracy: overlap,
      feedback: overlap >= 60
        ? '¡Buen intento! Escucha de nuevo y repite despacio. 🎧'
        : 'Casi lo tienes. Divide la frase en trozos cortos y repítela. 💪',
      corrections: [],
      mispronounced_words: missing.slice(0, 3).map((w) => ({ said: '—', expected: w })),
      next_tip: missing.length ? `Repite despacio estas palabras: ${missing.slice(0, 3).join(', ')}.` : '',
      usedAi: false,
      fromCache: false,
      provider: 'local',
      tokensUsed: 0,
    };
  },

  // ─── 3. Explain a lesson concept (in-lesson tutor) ────────────────────────
  async explainLessonConcept(lessonTitle, grammarRule, studentQuestion = '', level = 'A1') {
    const systemPrompt = `You are Beyli, a warm, highly pedagogical native English tutor guiding a Spanish-speaking student step-by-step through their English lesson.
CEFR Level: ${level} — ${levelGuide(level)}
Lesson topic: "${lessonTitle}"
Grammar structure: "${grammarRule}"
${studentQuestion ? `The student specifically asks: "${studentQuestion}"` : 'Explain this topic clearly from scratch so the student truly understands it.'}

Structure your explanation:
1. Greet enthusiastically: "¡Hola! Vamos a dominar este tema paso a paso 🌟".
2. Explain the concept simply in Spanish, with English examples, and WHY it works that way.
3. Show the exact formulas: afirmativo, negativo e interrogativo.
4. Point out the #1 mistake Spanish speakers make with this structure.
5. Give 2 real-life sentences they can use today, with Spanish translation.
6. End with a short challenge inviting them to practice right now.

Be clear, encouraging and practical. Keep it under 350 words.`;

    const { text, provider, tokensUsed } = await this.generateText({
      systemPrompt,
      messages: [{ role: 'user', content: 'Explícame este tema, por favor.' }],
      maxTokens: 800,
      temperature: 0.7,
    });

    if (!text) {
      return {
        text: `¡Hola! En esta lección de ${lessonTitle}, recuerda la regla principal: ${grammarRule}. Practica repitiendo en voz alta cada ejemplo y pregúntame cualquier duda. ¡Estás haciendo un gran trabajo!`,
        tokensUsed: 0,
        provider: 'fallback',
      };
    }

    return { text, tokensUsed, provider };
  },

  // ─── 4. Practice engine: generate exercises for a module/lesson ───────────
  /**
   * @param {object} params - { level, topic, type, count, context }
   * @returns {{ title, exercises: Array, provider, fromCache }}
   */
  async generatePractice({ level = 'A1', topic = 'general English', type = 'fill_blank', count = 5, context = '' }) {
    const safeCount = Math.max(1, Math.min(10, Number(count) || 5));
    const allowedTypes = ['fill_blank', 'pronunciation', 'technical', 'vocabulary'];
    const safeType = type === 'mixed' ? 'mixed' : allowedTypes.includes(type) ? type : 'fill_blank';

    // Force a single exercise type unless the student asked for a mix,
    // otherwise the model happily returns a bit of everything.
    const typeDirective = safeType === 'mixed'
      ? 'Mix the exercise types freely among the allowed ones below for extra variety.'
      : `ALL ${safeCount} exercises MUST be of type "${safeType}". Do not use any other type.`;

    const cacheKey = `practice:${level}:${safeType}:${safeCount}:${Buffer.from(topic).toString('base64').slice(0, 24)}`;

    const { data, provider, fromCache, tokensUsed } = await this.generateJson({
      systemPrompt: AI_CONFIG.practiceSystemPrompt,
      userPrompt: fill(AI_CONFIG.practiceGeneratePrompt, {
        count: safeCount,
        typeDirective,
        level,
        levelGuide: levelGuide(level),
        topic,
        extraContext: context ? `Extra context from the lesson: ${context}` : '',
      }),
      cacheKey,
      ttl: 1800,
      maxTokens: 2000,
    });

    const exercises = Array.isArray(data?.exercises) ? data.exercises : [];

    if (exercises.length === 0) {
      return { title: topic, exercises: [], provider: provider || 'offline', fromCache, tokensUsed, generated: false };
    }

    return {
      title: data.title || topic,
      exercises: exercises.slice(0, safeCount).map((exercise, index) => ({
        id: `${safeType}-${index}-${Date.now()}`,
        type: exercise.type || safeType,
        ...exercise,
      })),
      provider,
      fromCache,
      tokensUsed,
      generated: true,
    };
  },

  // ─── 5. Practice engine: validate a student's answer ─────────────────────
  /**
   * @returns {{ correct, score, feedback, expected, tip, improvement, provider, usedAi }}
   */
  async checkPracticeAnswer({ level = 'A1', type = 'fill_blank', sentence = '', expected = '', studentAnswer = '' }) {
    const normalize = (text) =>
      String(text || '')
        .toLowerCase()
        .replace(/[.,!?;:¡¿"']/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    const student = normalize(studentAnswer);
    const target = normalize(expected);

    // Instant local validation when the answer matches exactly
    if (student && student === target) {
      return {
        correct: true, score: 100,
        feedback: '¡Correcto! Excelente trabajo. 🌟',
        expected, tip: '', improvement: '',
        provider: 'local', usedAi: false,
      };
    }

    const cacheKey = `check:${level}:${type}:${Buffer.from(`${target}|${student}`).toString('base64').slice(0, 40)}`;

    const { data, provider, fromCache } = await this.generateJson({
      systemPrompt: AI_CONFIG.gradeSystemPrompt,
      userPrompt: fill(AI_CONFIG.practiceCheckPrompt, {
        level, type, sentence, expected, student: studentAnswer,
      }),
      cacheKey,
      ttl: 7200,
      maxTokens: 900,
    });

    if (data) {
      return {
        correct: !!data.correct,
        score: Math.max(0, Math.min(100, Number(data.score) || (data.correct ? 90 : 40))),
        feedback: data.feedback || (data.correct ? '¡Correcto! 👏' : 'Casi. Inténtalo de nuevo. 💪'),
        expected: data.expected || expected,
        tip: data.tip || '',
        improvement: data.improvement || '',
        provider,
        usedAi: !fromCache,
      };
    }

    // Local lenient fallback
    const words = target.split(' ').filter(Boolean);
    const said = student.split(' ').filter(Boolean);
    const hit = words.filter((w) => said.includes(w)).length;
    const ratio = words.length ? hit / words.length : 0;

    return {
      correct: ratio >= 0.8,
      score: Math.round(ratio * 100),
      feedback: ratio >= 0.8
        ? '¡Muy cerca! La respuesta es prácticamente correcta. 👏'
        : `Revisa la respuesta correcta: "${expected}".`,
      expected,
      tip: 'Repite la frase completa en voz alta para fijarla.',
      improvement: '',
      provider: 'local',
      usedAi: false,
    };
  },

  // ─── 6. Quick Translation ────────────────────────────────────────────────
  async translate(text, targetLang = 'Spanish') {
    const systemPrompt = `You are a professional translator. Translate the following English text to ${targetLang}. 
    Provide ONLY the translated text, no explanations, no quotes, no conversational filler. 
    If the text is already in ${targetLang}, return it as is.`;
    
    const { text: translated, provider, tokensUsed } = await this.generateText({
      systemPrompt,
      messages: [{ role: 'user', content: text }],
      maxTokens: 300,
      temperature: 0.3,
    });

    return { text: translated, provider, tokensUsed };
  },
};

module.exports = AiService;
