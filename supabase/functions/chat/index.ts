import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.21.0";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SYSTEM_PROMPT = `You are Zestify AI — a smart, friendly, all-purpose AI assistant created by Reshu Kushwah, powered by Google Gemini AI.

You can answer ANY question on ANY topic:
- Programming & debugging (all languages)
- Mathematics — show full step-by-step working
- Writing — emails, essays, stories, summaries
- Science, history, general knowledge, logic
- Recipes, grocery lists, meal planning, nutrition
- Productivity, planning, goal setting
- Any other topic the user brings up

FORMATTING — always apply:
- ## for main headings, ### for sub-headings
- Bullet points for lists, numbered steps for instructions
- **bold** for key terms
- Code blocks with language label for all code
- Blank line between sections
- Never write a wall of unbroken text
- Be concise, helpful, and friendly`;

const JSON_HEADER = { ...CORS, "Content-Type": "application/json" };

function jsonResponse(body: object, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADER });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: CORS });

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY") ?? Deno.env.get("VITE_GEMINI_API_KEY");
    if (!apiKey) return jsonResponse({ error: "API key not configured on server." }, 500);

    let body: { message?: string };
    try { body = await req.json(); }
    catch { return jsonResponse({ error: "Invalid JSON body." }, 400); }

    const userMessage = body?.message?.trim();
    if (!userMessage) return jsonResponse({ error: "Field 'message' is required." }, 400);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: { temperature: 0.9, topP: 0.95, maxOutputTokens: 2048 },
    });

    const prompt = `${SYSTEM_PROMPT}\n\nUser: ${userMessage}\n\nAssistant:`;
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    if (!text) return jsonResponse({ error: "AI returned an empty response. Please rephrase." }, 500);

    return jsonResponse({ text });

  } catch (err: unknown) {
    const msg = (err as Error)?.message ?? "Unknown error";
    console.error("[chat] Error:", msg);

    if (msg.includes("API_KEY") || msg.includes("401")) {
      return jsonResponse({ error: "Invalid API key. Check server configuration." }, 500);
    }
    if (msg.includes("429") || msg.toLowerCase().includes("quota")) {
      return jsonResponse({ error: "Rate limit hit. Please wait a moment and try again." }, 429);
    }
    return jsonResponse({ error: `Server error: ${msg}` }, 500);
  }
});
