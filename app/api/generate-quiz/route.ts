import { NextRequest, NextResponse } from "next/server";

// Server-side only — GEMINI_API_KEY never reaches the browser.
// Set this in Vercel → Project → Settings → Environment Variables.
const GEMINI_MODEL = "gemini-3.6-flash";

interface GeneratedQuestion {
  text: string;
  options: string[];
  correctIndex: number;
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not set on the server." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const topic: string = (body.topic || "").trim();
    const count: number = Math.min(Math.max(Number(body.count) || 5, 1), 20);
    const language: string = body.language || "English";
    const difficulty: string = body.difficulty || "medium";

    if (!topic) {
      return NextResponse.json({ error: "Topic is required." }, { status: 400 });
    }

    const prompt = `You are a quiz question generator. Create exactly ${count} multiple choice quiz questions about the topic: "${topic}".
Write the questions and options in ${language}.
Difficulty level: ${difficulty}.

Return ONLY a valid JSON array, with no markdown code fences, no explanation, no extra text — just the raw JSON. Use exactly this structure:
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
- Keep question text and options concise.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || !data.candidates?.[0]) {
      console.error("Gemini error:", JSON.stringify(data));
      return NextResponse.json(
        { error: data.error?.message || "AI service did not return a result." },
        { status: 502 }
      );
    }

    let text: string = data.candidates[0].content.parts[0].text || "";
    text = text.replace(/```json/gi, "").replace(/```/g, "").trim();

    let parsed: GeneratedQuestion[];
    try {
      parsed = JSON.parse(text);
    } catch {
      console.error("Failed to parse Gemini output:", text);
      return NextResponse.json(
        { error: "AI returned an unexpected format. Try again." },
        { status: 502 }
      );
    }

    // Validate + sanitize shape before handing back to the client.
    const questions = parsed
      .filter(
        (q) =>
          q &&
          typeof q.text === "string" &&
          Array.isArray(q.options) &&
          q.options.length === 4 &&
          typeof q.correctIndex === "number" &&
          q.correctIndex >= 0 &&
          q.correctIndex <= 3
      )
      .map((q) => ({
        text: q.text.trim(),
        options: q.options.map((o) => String(o).trim()),
        correctIndex: q.correctIndex,
      }));

    if (questions.length === 0) {
      return NextResponse.json(
        { error: "AI did not return any valid questions. Try a different topic." },
        { status: 502 }
      );
    }

    return NextResponse.json({ questions });
  } catch (err) {
    console.error("generate-quiz route error:", err);
    return NextResponse.json(
      { error: "Something went wrong generating the quiz." },
      { status: 500 }
    );
  }
}
