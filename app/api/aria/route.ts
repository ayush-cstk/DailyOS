import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const BASE_SYSTEM = `You are Orbit — the AI life coach built into DailyOS, a personal operating system for tasks, workouts, and nutrition.

You help users with:
- 🏋️ Workout programming, exercise form, progressive overload, recovery
- 🥗 Nutrition, macro tracking, meal planning, Indian food macros
- ✅ Productivity, task prioritization, daily habits, focus
- 📊 Connecting the dots between fitness, diet, and productivity

Personality: encouraging, knowledgeable, concise, and practical. You give specific actionable advice, not vague tips.
Format: use **bold** for key points and - for bullet lists. Keep responses under 180 words unless asked for more.
You are aware of Indian cuisine and lifestyle contexts.`;

const MODE_CONTEXT: Record<string, string> = {
  workout: `\n\nThe user is asking about WORKOUTS. Focus on: exercise selection, sets/reps/weight progression, muscle groups, recovery, workout splits, form cues, and how training connects to their goals. Reference common gym exercises and real programming principles.`,
  diet: `\n\nThe user is asking about DIET & NUTRITION. Focus on: macro targets, meal timing, specific food recommendations (especially Indian foods), calorie calculations, protein sources, and how nutrition supports their fitness goals. Give practical meal suggestions.`,
  tasks: `\n\nThe user is asking about TASKS & PRODUCTIVITY. Focus on: prioritization frameworks, habit building, time blocking, reducing overwhelm, breaking goals into daily actions, and maintaining consistency. Give tactical, immediately actionable advice.`,
};

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { messages, mode, dietContext } = await req.json();

  let systemPrompt = BASE_SYSTEM + (mode && MODE_CONTEXT[mode] ? MODE_CONTEXT[mode] : "");

  // Inject today's real meal data when available in diet mode
  if (mode === "diet" && dietContext) {
    const { date, meals, totals, goals } = dietContext;
    const mealLines = meals.length > 0
      ? meals.map((m: any) => `  - ${m.name}: ${m.calories} kcal | ${m.proteinG}g P | ${m.carbsG}g C | ${m.fatG}g F`).join("\n")
      : "  (no meals logged yet)";

    systemPrompt += `

=== USER'S ACTUAL DATA FOR ${date} ===
Meals logged today:
${mealLines}

Totals so far: ${totals.calories} kcal | ${totals.proteinG}g protein | ${totals.carbsG}g carbs | ${totals.fatG}g fat
Daily goals:   ${goals.calories} kcal | ${goals.proteinG}g protein | ${goals.carbsG}g carbs | ${goals.fatG}g fat
Remaining:     ${Math.max(0, goals.calories - totals.calories)} kcal | ${Math.max(0, goals.proteinG - totals.proteinG)}g protein | ${Math.max(0, goals.carbsG - totals.carbsG)}g carbs | ${Math.max(0, goals.fatG - totals.fatG)}g fat

Use this REAL data to answer questions about what the user has eaten, what they should eat next, and how to hit their remaining macros. Be specific and reference the actual meals listed.`
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      max_tokens: 400,
      temperature: 0.7,
    });

    const reply = completion.choices[0].message.content ?? "";
    return NextResponse.json({ reply });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
