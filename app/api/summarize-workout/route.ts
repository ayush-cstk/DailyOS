import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { exercises, durationMinutes, bodyWeightKg } = await req.json();

  const exerciseText = exercises
    .map((ex: any) => {
      const setsText = ex.sets
        .map((s: any, i: number) => {
          const weightStr = s.unit === "bodyweight" ? "bodyweight" : `${s.weight}${s.unit}`;
          return `  Set ${i + 1}: ${s.reps} reps × ${weightStr}`;
        })
        .join("\n");
      return `${ex.name}:\n${setsText}`;
    })
    .join("\n\n");

  const prompt = `You are a professional fitness coach. Analyze this workout and provide a concise, motivating summary.

Athlete body weight: ${bodyWeightKg ? `${bodyWeightKg} kg` : "not provided"}
Workout duration: ${durationMinutes} minutes

Exercises performed:
${exerciseText}

Please provide a structured summary with:
1. **Overall Performance** – how was this workout overall (1-2 sentences)
2. **What You Did Well** – specific strengths (2-3 bullet points)
3. **Intensity Level** – rate it as exactly one of: Low / Moderate / High / Very High — and give a brief explanation
4. **Areas to Improve** – actionable suggestions (2-3 bullet points)
5. **Next Session Tip** – one specific recommendation for next time

Keep it encouraging, specific, and under 250 words.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
    });

    const summary = completion.choices[0].message.content ?? "";

    // ── Estimate calories burned using MET × weight × time ──────────────────
    // Parse intensity from the AI response to pick an appropriate MET value
    const lowerSummary = summary.toLowerCase();
    let met = 5.0; // default: moderate resistance training
    if (lowerSummary.includes("very high")) met = 8.5;
    else if (lowerSummary.includes("high")) met = 6.5;
    else if (lowerSummary.includes("moderate")) met = 5.0;
    else if (lowerSummary.includes("low")) met = 3.5;

    const weight = bodyWeightKg ?? 70; // fallback to 70 kg if not provided
    const hours = durationMinutes / 60;
    const caloriesBurned = Math.round(met * weight * hours);

    return NextResponse.json({ summary, caloriesBurned });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
