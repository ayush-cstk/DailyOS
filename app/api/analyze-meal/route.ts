import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { imageBase64, mimeType } = body;

  const prompt = `You are an expert nutritionist specializing in Indian cuisine and South Asian home-cooked meals.
Carefully analyze this meal photo and estimate macronutrients accurately.

Step 1 — Identify every item visible. Be specific about quantity and cooking state (e.g. "3 medium chapatis", "~100g cooked soy nuggets", "small bowl salad with carrot/onion/cucumber").

Step 2 — For each item, calculate macros using the reference values below. Pay special attention to cooking state — cooked weights are much heavier than dry weights due to water absorption.

Step 3 — Sum everything and return JSON.

=== CRITICAL REFERENCE VALUES ===

CHAPATI/ROTI (Indian flatbread):
- 1 medium chapati (no ghee): 80 kcal, 3g protein, 15g carbs, 1g fat
- 1 medium chapati (with ghee/oil): 110 kcal, 3g protein, 15g carbs, 3.5g fat

SOY NUGGETS / SOYA CHUNKS (COOKED - after rehydration):
- ALWAYS use COOKED weight values. Dry soy nuggets absorb 2.5x water when cooked.
- 100g COOKED soy nuggets: 112 kcal, 15g protein, 8g carbs, 0.5g fat
- 150g COOKED soy nuggets (typical serving): 168 kcal, 22g protein, 12g carbs, 0.8g fat
- DO NOT use dry weight protein values (52g/100g dry) — the cooked nuggets are much lower.
- If cooked with oil/spices add ~50-80 kcal for oil.

BOILED EGG: 78 kcal, 6g protein, 0.6g carbs, 5g fat each

SALAD (carrot, onion, cucumber, tomato, raw vegetables):
- Small bowl (~100g): 35 kcal, 1g protein, 7g carbs, 0.2g fat
- Large bowl (~200g): 70 kcal, 2g protein, 14g carbs, 0.4g fat

POTATO (cooked, in sabzi):
- Small portion (~50g): 45 kcal, 1g protein, 10g carbs, 0.1g fat

RAITA (yogurt+veg, ~150g): 75 kcal, 3g protein, 6g carbs, 4g fat

DAL (cooked lentils, ~200ml): 150 kcal, 10g protein, 25g carbs, 2g fat

RICE (cooked, ~150g): 195 kcal, 4g protein, 43g carbs, 0.4g fat

=== RULES ===
- Count chapatis by how many are stacked/visible
- For soy nuggets, always estimate COOKED portion size from the bowl/plate visible
- Do not assume large dry-weight portions unless clearly a very large serving
- A standard katori/small bowl = ~150ml cooked food
- Be conservative — home-cooked Indian meals typically range 400-800 kcal for a full plate

Return ONLY raw JSON, no markdown:
{
  "name": "Brief meal name",
  "calories": <number>,
  "proteinG": <number>,
  "carbsG": <number>,
  "fatG": <number>,
  "confidence": "low|medium|high",
  "notes": "Item breakdown: e.g. 3 chapati (330kcal, 9P) + 150g cooked soy nuggets (168kcal, 22P) + salad (35kcal, 1P)"
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${imageBase64}`, detail: "high" },
            },
          ],
        },
      ],
      max_tokens: 300,
    });

    const content = completion.choices[0].message.content ?? "{}";
    // Strip markdown code blocks if present
    const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return NextResponse.json(parsed);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
