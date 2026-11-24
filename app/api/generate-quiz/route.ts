import { NextRequest, NextResponse } from "next/server";

// Server-side only — keys never reach the browser.
// Set whichever of these you have in Vercel → Project → Settings →
// Environment Variables. You don't need all of them, but having 2+ set
// means that when one provider's free-tier limit runs out mid-day (which
// WILL happen once real traffic shows up), quiz generation just quietly
// moves to the next provider instead of failing for the person waiting
// on it.
//
//   GROQ_API_KEY        — free, no card, from https://console.groq.com/keys
//   GEMINI_API_KEY      — free, from https://aistudio.google.com/apikey
//   OPENROUTER_API_KEY  — free, no card, from https://openrouter.ai/keys
//
// Pollinations needs no key at all and is tried last as a final safety
// net — lower quality/reliability, but it means quiz generation never
// fully dies even with zero keys configured.
//
// Large requests (e.g. 20 questions) are split into small batches
// internally — asking a free model for 20 questions in one shot is what
// causes the "asked for 20, got 3" truncation problem. Batches of ~6 are
// far more likely to come back complete.

export const maxDuration = 60; // batching means this can take a while — give it room

interface GeneratedQuestion {
  text: string;
  options: string[];
  correctIndex: number;
}

function buildPrompt(
  topic: string,
  count: number,
  language: string,
  difficulty: string,
  avoidTexts: string[]
) {
  const avoidBlock =
    avoidTexts.length > 0
      ? `\nDo NOT repeat or rephrase any of these already-used questions:\n${avoidTexts.map((t) => `- ${t}`).join("\n")}\n`
      : "";

  return `Create exactly ${count} multiple choice quiz questions STRICTLY about this exact topic: "${topic}". Every single question must be directly about "${topic}" — do not drift to a different subject.
Write the questions and options in ${language}.
Difficulty level: ${difficulty}.
${avoidBlock}
Return ONLY a valid JSON array, with no markdown code fences, no explanation, no extra text before or after — just the raw JSON, nothing else. Use exactly this structure:
[
  {
    "text": "question text here",
    "options": ["option A", "option B", "option C", "option D"],
    "correctIndex": 0
  }
]

Rules:
- Exactly 4 options per question.
- "correctIndex" is the 0-based index (0, 1, 2, or 3) of the correct option inside "options".
- Do not repeat questions.
- Keep question text and options concise.
- Do not include any text that is not part of the JSON array.`;
}

const SYSTEM_PROMPT =
  "You are a strict JSON API for a quiz app. You only ever output a raw JSON array — never markdown, never commentary, never text outside the JSON. You always follow the requested topic exactly.";

// --- Groq — OpenAI-compatible chat completions ---
async function callGroq(prompt: string): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || null;
}

// --- Gemini — Google's generateContent endpoint ---
async function callGemini(prompt: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${SYSTEM_PROMPT}\n\n${prompt}` }] }],
      }),
    }
  );
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
}

// --- OpenRouter — one key, its own free-model fallback list ---
async function callOpenRouter(prompt: string): Promise<string | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      models: [
        "meta-llama/llama-3.3-70b-instruct:free",
        "google/gemma-2-9b-it:free",
        "qwen/qwen3-coder:free",
      ],
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenRouter ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || null;
}

// --- Pollinations — no key required, last-resort free fallback ---
async function callPollinations(prompt: string): Promise<string | null> {
  try {
    const res = await fetch("https://text.pollinations.ai/openai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (res.ok) {
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content;
      if (text) return text;
    }
  } catch {
    // fall through to the GET-style endpoint below
  }

  const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=openai`;
  const res2 = await fetch(url);
  if (!res2.ok) throw new Error(`Pollinations ${res2.status}`);
  return await res2.text();
}

const PROVIDERS: { name: string; call: (prompt: string) => Promise<string | null> }[] = [
  { name: "groq", call: callGroq },
  { name: "gemini", call: callGemini },
  { name: "openrouter", call: callOpenRouter },
  { name: "pollinations", call: callPollinations },
];

function extractQuestions(raw: string): GeneratedQuestion[] {
  const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  const isValid = (q: unknown): q is GeneratedQuestion =>
    !!q &&
    typeof q === "object" &&
    typeof (q as GeneratedQuestion).text === "string" &&
    Array.isArray((q as GeneratedQuestion).options) &&
    (q as GeneratedQuestion).options.length === 4 &&
    typeof (q as GeneratedQuestion).correctIndex === "number" &&
    (q as GeneratedQuestion).correctIndex >= 0 &&
    (q as GeneratedQuestion).correctIndex <= 3;

  // Attempt 1: the whole thing parses as one clean JSON array.
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start !== -1 && end !== -1) {
    try {
      const parsed = JSON.parse(cleaned.slice(start, end + 1));
      if (Array.isArray(parsed)) {
        const valid = parsed.filter(isValid);
        if (valid.length > 0) return valid;
      }
    } catch {
      // fall through to recovery below
    }
  }

  // Attempt 2 (recovery): free models sometimes get cut off mid-question or
  // leak a stray bit of text at the end. Walk brace-depth manually and keep
  // only the individual {...} objects that are themselves complete and
  // valid, so one broken question doesn't throw away every good one before it.
  const recovered: GeneratedQuestion[] = [];
  let depth = 0;
  let objStart = -1;
  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (ch === "{") {
      if (depth === 0) objStart = i;
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0 && objStart !== -1) {
        try {
          const obj = JSON.parse(cleaned.slice(objStart, i + 1));
          if (isValid(obj)) recovered.push(obj);
        } catch {
          // broken object — skip it, keep going
        }
        objStart = -1;
      }
    }
  }
  return recovered;
}

// --- Abuse protection -------------------------------------------------------
// The route spends free-tier AI quota, so it is only available to signed-in
// users, and each user is limited to a few generations per 10 minutes.
async function verifyFirebaseUser(req: NextRequest): Promise<string | null> {
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!token || !apiKey) return null;
  try {
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: token }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.users?.[0]?.localId ?? null;
  } catch {
    return null;
  }
}

const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 8;
const hits = new Map<string, number[]>();

function rateLimited(uid: string): boolean {
  const now = Date.now();
  const recent = (hits.get(uid) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX) {
    hits.set(uid, recent);
    return true;
  }
  recent.push(now);
  hits.set(uid, recent);
  return false;
}

const ALLOWED_DIFFICULTY = new Set(["easy", "medium", "hard", "Beginner", "Intermediate", "Advanced"]);

export async function POST(req: NextRequest) {
  try {
    const uid = await verifyFirebaseUser(req);
    if (!uid) {
      return NextResponse.json({ error: "Please sign in to generate quizzes with AI." }, { status: 401 });
    }
    if (rateLimited(uid)) {
      return NextResponse.json(
        { error: "You're generating quizzes too fast. Please wait a few minutes and try again." },
        { status: 429 }
      );
    }

    const body = await req.json();
    // Keep user text on one line and short, so it can't smuggle extra instructions into the prompt.
    const topic: string = String(body.topic || "").replace(/[\r\n]+/g, " ").trim().slice(0, 120);
    const totalRequested: number = Math.min(Math.max(Number(body.count) || 5, 1), 30);
    const language: string = String(body.language || "English").replace(/[^\p{L}\p{N} \-()]/gu, "").slice(0, 30) || "English";
    const difficulty: string = ALLOWED_DIFFICULTY.has(body.difficulty) ? body.difficulty : "medium";

    if (!topic) {
      return NextResponse.json({ error: "Topic is required." }, { status: 400 });
    }

    const collected: GeneratedQuestion[] = [];
    const seen = new Set<string>();
    const batchSize = 6; // small batches = far less truncation on free models
    const maxAttempts = Math.ceil(totalRequested / 3) + 6; // generous retry budget across all providers
    const attemptLog: string[] = [];
    let attempts = 0;

    while (collected.length < totalRequested && attempts < maxAttempts) {
      attempts++;
      const remaining = totalRequested - collected.length;
      const askFor = Math.min(batchSize, remaining + 2); // ask a couple extra to offset dedupe loss
      const prompt = buildPrompt(
        topic,
        askFor,
        language,
        difficulty,
        collected.map((q) => q.text)
      );

      let batchQuestions: GeneratedQuestion[] = [];

      // Try each provider in order for THIS batch — if Groq is rate-limited
      // right now, fall through to Gemini, then OpenRouter, then Pollinations.
      for (const provider of PROVIDERS) {
        try {
          const raw = await provider.call(prompt);
          if (!raw) continue; // key not set, skip silently
          const qs = extractQuestions(raw);
          if (qs.length > 0) {
            batchQuestions = qs;
            attemptLog.push(`batch ${attempts}: ${provider.name} → ${qs.length} question(s)`);
            break;
          }
        } catch (err) {
          attemptLog.push(
            `batch ${attempts}: ${provider.name} failed (${err instanceof Error ? err.message : "error"})`
          );
        }
      }

      for (const q of batchQuestions) {
        const key = q.text.trim().toLowerCase();
        if (!seen.has(key) && collected.length < totalRequested) {
          seen.add(key);
          collected.push({
            text: q.text.trim(),
            options: q.options.map((o) => String(o).trim()),
            correctIndex: q.correctIndex,
          });
        }
      }

      if (batchQuestions.length === 0 && attemptLog.length === attempts) {
        // every provider was either unconfigured or failed for this batch
        attemptLog.push(`batch ${attempts}: no provider returned anything`);
      }
    }

    if (collected.length === 0) {
      console.error("generate-quiz: produced nothing.", attemptLog.join(" | "));
      const anyKeySet =
        process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENROUTER_API_KEY;
      return NextResponse.json(
        {
          error: anyKeySet
            ? "All AI providers are currently unavailable or rate-limited. Try again in a minute."
            : "No AI provider is configured, and the free no-key fallback didn't return usable questions either. Set GROQ_API_KEY (recommended, free) in your environment variables.",
        },
        { status: 502 }
      );
    }

    // Partial success (e.g. asked for 20, only 14 came back after retries) is
    // still returned — a shorter-than-requested quiz beats a hard failure.
    return NextResponse.json({
      questions: collected,
      requested: totalRequested,
      received: collected.length,
    });
  } catch (err) {
    console.error("generate-quiz route error:", err);
    return NextResponse.json(
      { error: "Something went wrong generating the quiz." },
      { status: 500 }
    );
  }
}
