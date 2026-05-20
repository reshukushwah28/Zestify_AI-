import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ChatResponse } from '../types';

export interface ImageFile {
  base64Data: string;
  mimeType: string;
}

/**
 * Google GenAI Service Configuration
 * 
 * Initializes the Gemini API client with a fallback mechanism for model targeting.
 * This ensures that specific model requests ('gemini-1.5-flash') map seamlessly 
 * to the most up-to-date available endpoint ('gemini-flash-latest').
 */
export class GoogleGenAI {
  private genAI: GoogleGenerativeAI;
  constructor(config: { apiKey: string }) {
    this.genAI = new GoogleGenerativeAI(config.apiKey);
  }
  getGenerativeModel(config: { model: string }) {
    const targetModel = config.model === 'gemini-1.5-flash' ? 'gemini-flash-latest' : config.model;
    return this.genAI.getGenerativeModel({ model: targetModel });
  }
}

// Initialize the API Client with the required API Key
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

const SYSTEM_PROMPT = `You are Zestify AI — an elite, all-purpose AI assistant created by Reshu Kushwah, powered by Google Gemini.

You are built for general purposes. If a user asks for real-time information you do not have access to (such as live stock prices, real-time trading data, or current news), do not crash, fail, or refuse. Instead, gracefully explain your role as a general assistant, explain that you do not have live-market tracking, and provide helpful general concepts, educational advice, general predictions, or analytical frameworks related to their query instead.

If a request is excessively broad (e.g., 'all math formulas' or 'every code language'), provide a beautifully structured summary of the most important elements and politely invite the user to narrow down their request, rather than trying to generate a massive text payload that might time out.

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

const GENERATE_TRIGGERS = [
  'generate an image', 'generate a photo', 'generate a picture',
  'create an image', 'create a photo', 'create a picture',
  'draw a picture', 'draw an image', 'draw me a', 'generate a drawing',
  'generate art', 'create art', 'make an image of', 'generate image',
  'generate photo', 'generate picture', 'create image', 'create photo',
  'create picture', 'draw picture', 'draw image', 'make image', 'draw me'
];

export async function generateAIResponse(
  userMessage: string,
  imageFile?: ImageFile
): Promise<ChatResponse & { isImageGen?: boolean }> {
  const lower = userMessage.toLowerCase().trim();

  if (CREATOR_TRIGGERS.some(t => lower.includes(t))) {
    return { text: CREATOR_RESPONSE };
  }

  if (GENERATE_TRIGGERS.some(t => lower.includes(t))) {
    const cleanPrompt = userMessage
      .replace(/(generate|create|draw|make|me)\s+(an\s+)?(image|photo|picture|drawing|art)?\s*(of\s+)?/gi, '')
      .trim();

    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt || userMessage)}?width=800&height=800&nologo=true&seed=${Math.floor(Math.random() * 100000)}`;
    return {
      text: imageUrl,
      isImageGen: true,
    };
  }

  try {
    const textPrompt = userMessage.trim() || 'Analyze this image in detail and provide a useful explanation.';
    const promptText = `${SYSTEM_PROMPT}\n\nUser: ${textPrompt}\n\nAssistant:`;

    const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });

    let result;
    if (imageFile) {
      result = await model.generateContent([
        promptText,
        {
          inlineData: {
            data: imageFile.base64Data,
            mimeType: imageFile.mimeType,
          },
        },
      ]);
    } else {
      result = await model.generateContent(promptText);
    }

    const response = await result.response;
    const text = response.text()?.trim();

    if (!text) {
      return {
        text: '',
        error: 'The AI returned an empty response. Please rephrase your question.',
      };
    }

    return { text };

  } catch (err: any) {
    return { text: '', error: err.message || 'Failed to connect to AI server.' };
  }
}

export { generateAIResponse as askZestify };