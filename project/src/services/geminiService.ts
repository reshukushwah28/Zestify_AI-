import type { ChatResponse } from '../types';

const SYSTEM_PROMPT = `You are Zestify AI — an elite, all-purpose AI assistant created by Reshu Kushwah, powered by Google Gemini.

You expertly handle ANY topic:
- Programming & debugging (Python, JavaScript, C++, Java, SQL, and all others)
- Mathematics — always show complete step-by-step working
- Writing — emails, essays, stories, summaries, proofreading, tone adjustments
- Science, history, geography, logic, general knowledge
- Recipes, grocery lists, meal planning, nutrition, dietary advice
- Productivity, scheduling, goal-setting, life advice
- Any other question the user brings up

RESPONSE FORMATTING — strictly apply every time:
- Use ## for main section headings
- Use ### for sub-headings
- Use bullet points (- item) for unordered lists
- Use numbered lists (1. step) for procedures and sequences
- Wrap all code in fenced code blocks with the language label: \`\`\`python
- Use **bold** to highlight key terms or important conclusions
- Always leave a blank line between sections
- Never write a wall of unbroken text — break everything into readable chunks
- Be accurate, concise, warm, and genuinely helpful`;

const CREATOR_TRIGGERS = [
  'who made you', 'who created you', 'who built you', 'who developed you',
  'who is your creator', 'who programmed you', 'who designed you',
  'tell me about yourself', 'who are you', 'what are you', 'your creator',
];

const CREATOR_RESPONSE = `🌟 **I'm Zestify AI, created by Reshu Kushwah!** 🌟

Reshu Kushwah is a talented developer who built me as your all-purpose intelligent assistant.

## My Creator's Vision

- Powered by **Google Gemini AI** technology
- Designed as a **universal assistant** — no topic is off-limits
- Built to deliver clean, structured, genuinely useful answers

## What I Can Do

- **Code & Debug** — any language: write, explain, refactor, fix bugs
- **Math & Reasoning** — step-by-step solutions to any problem
- **Write Anything** — emails, essays, summaries, creative writing
- **General Knowledge** — science, history, logic, trivia
- **Food & Meals** — recipes, grocery lists, meal planning, nutrition
- **Daily Planning** — schedules, goals, productivity, advice

What can I help you with today? ⚡`;

export async function generateAIResponse(userMessage: string): Promise<ChatResponse> {
  const lower = userMessage.toLowerCase().trim();
  if (CREATOR_TRIGGERS.some(t => lower.includes(t))) {
    return { text: CREATOR_RESPONSE };
  }

  // Read the API key dynamically on each call to prevent early module evaluation bugs in Vite
  const apiKey = (import.meta.env.VITE_GEMINI_API_KEY || '').trim();
  if (!apiKey) {
    return {
      text: '',
      error: 'API key missing. Please add VITE_GEMINI_API_KEY to your .env file and restart.',
    };
  }

  try {
    const prompt = `${SYSTEM_PROMPT}\n\nUser: ${userMessage}\n\nAssistant:`;
    
    // Call Gemini API directly via native fetch to bypass SDK browser blocks and CORS issues
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.85,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      let errText = '';
      try {
        const errJson = await response.json();
        errText = errJson?.error?.message || response.statusText;
      } catch {
        errText = `HTTP ${response.status}`;
      }
      throw new Error(errText);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!text) {
      return {
        text: '',
        error: 'The AI returned an empty response. Please rephrase your question.',
      };
    }

    return { text };

  } catch (err: unknown) {
    const msg = (err as Error)?.message ?? '';
    console.error('[Gemini API Error]:', msg);

    if (msg.includes('429') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('rate')) {
      return { text: '', error: 'Rate limit reached. Please wait a few seconds and try again.' };
    }
    if (msg.includes('API_KEY') || msg.includes('401') || msg.includes('403') || msg.toLowerCase().includes('key')) {
      return { text: '', error: 'Invalid API key. Check your VITE_GEMINI_API_KEY in .env.' };
    }
    return { text: '', error: `Fetch error: ${msg || 'Failed to connect to AI server.'}` };
  }
}