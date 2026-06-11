import { NextRequest, NextResponse } from "next/server";
import Groq, { toFile } from "groq-sdk";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const runtime = "nodejs";

// Transcribe a spoken workout, then parse it into structured exercises + sets.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let transcript = "";

  try {
    const form = await req.formData();
    const audio = form.get("audio") as File | null;
    if (!audio) return NextResponse.json({ error: "No audio" }, { status: 400 });

    // ── 1. Transcribe with Whisper ──
    const buf = Buffer.from(await audio.arrayBuffer());
    const type = audio.type || "audio/webm";
    const ext =
      type.includes("mp4") || type.includes("m4a") || type.includes("aac") ? "m4a"
      : type.includes("mpeg") || type.includes("mp3") ? "mp3"
      : type.includes("wav") ? "wav"
      : "webm";
    const file = await toFile(buf, `workout.${ext}`, { type });

    const tr = await groq.audio.transcriptions.create({
      file,
      model: "whisper-large-v3-turbo",
      language: "en",
      prompt: "A spoken gym workout log with exercises, sets, reps and weights in kg or lbs.",
    });
    transcript = (tr.text ?? "").trim();

    if (!transcript) {
      return NextResponse.json({ transcript: "", exercises: [] });
    }

    // ── 2. Parse transcript into structured exercises ──
    const parsePrompt = `You convert a spoken gym workout into structured JSON.

TRANSCRIPT: "${transcript}"

Extract every exercise and its sets. Rules:
- "3 sets of 10 at 60 kg" → 3 identical sets, each reps 10, weight 60, unit "kg".
- If different reps or weights are given per set ("10, 8 and 6 reps"), create one set for each.
- Bodyweight moves (push ups, pull ups, plank, dips, crunches with no weight mentioned) → unit "bodyweight" and omit weight.
- Default unit is "kg" unless "lbs" or "pounds" is said.
- "plank for 30 seconds" → reps 30, unit "bodyweight" (treat seconds as reps).
- Ignore filler words. Use clean, properly-capitalised exercise names.
- If the transcript has no exercises, return {"exercises":[]}.

Return ONLY raw JSON, no markdown, exactly in this shape:
{"exercises":[{"name":"Bench Press","sets":[{"reps":10,"weight":60,"unit":"kg"}]}]}`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: parsePrompt }],
      max_tokens: 800,
      temperature: 0,
    });

    const content = completion.choices[0].message.content ?? "{}";
    const cleaned = content.replace(/```(?:json)?\n?|\n?```/g, "").trim();

    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("No JSON in parse response");
      parsed = JSON.parse(match[0]);
    }

    // ── 3. Normalise / sanitise ──
    const exercises = Array.isArray(parsed.exercises) ? parsed.exercises : [];
    const clean = exercises
      .filter((e: any) => e && typeof e.name === "string" && e.name.trim())
      .map((e: any) => {
        const rawSets = Array.isArray(e.sets) && e.sets.length ? e.sets : [{ reps: 0, unit: "kg" }];
        const sets = rawSets.map((s: any) => {
          const unit = s.unit === "lbs" || s.unit === "bodyweight" ? s.unit : "kg";
          const set: { reps: number; unit: string; weight?: number } = {
            reps: Math.max(0, Math.round(Number(s.reps) || 0)),
            unit,
          };
          if (unit !== "bodyweight" && s.weight != null && !Number.isNaN(Number(s.weight))) {
            set.weight = Number(s.weight);
          }
          return set;
        });
        return { name: e.name.trim(), sets };
      });

    return NextResponse.json({ transcript, exercises: clean });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Failed to process audio", transcript }, { status: 500 });
  }
}
