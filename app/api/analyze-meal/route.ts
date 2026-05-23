import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are a precise nutritionist AI specializing in Indian and South Asian cuisine.
Your job is to analyze a meal photo and return accurate macro estimates.
You must follow the reference values exactly. Do NOT guess—use the values given.
Return ONLY raw JSON with no markdown, no explanation, no code block.`;

const USER_PROMPT = `Analyze the meal in this photo.

=== STEP 1: IDENTIFY EVERY ITEM ===
List each visible food item, estimated portion size, and cooking state.
Be specific: "3 medium chapatis (no ghee visible)", "~120g cooked soy nuggets in curry", "small katori dal (~150ml)", etc.

=== STEP 2: APPLY EXACT REFERENCE VALUES ===

CHAPATI/ROTI (per piece):
- No ghee: 80 kcal, 3g P, 15g C, 1g F
- With ghee: 110 kcal, 3g P, 15g C, 3.5g F

SOY CHUNKS/NUGGETS — ALWAYS use COOKED weight (they absorb 2.5x water):
- 100g cooked: 112 kcal, 15g P, 8g C, 0.5g F  (NOT the dry-weight 52g protein value)
- Typical katori (~150g cooked): 168 kcal, 22g P, 12g C, 0.8g F
- Add ~60 kcal for oil if cooked in masala

PANEER (per 100g): 265 kcal, 18g P, 3g C, 20g F
DAL/LENTILS (per 200ml cooked): 150 kcal, 10g P, 25g C, 2g F
RICE (per 150g cooked): 195 kcal, 4g P, 43g C, 0.4g F
POHA (per 150g cooked): 180 kcal, 3g P, 36g C, 3g F
UPMA (per 150g): 190 kcal, 5g P, 32g C, 5g F
IDLI (per piece, 40g): 40 kcal, 1.5g P, 8g C, 0.2g F
DOSA (plain, medium): 130 kcal, 3g P, 24g C, 2g F
SAMBAR (per 150ml): 60 kcal, 3g P, 10g C, 1g F
CURD/YOGURT (per 100g): 60 kcal, 3g P, 5g C, 3g F
RAITA (per 150g): 75 kcal, 3g P, 6g C, 4g F
RAW SALAD (per 100g mixed veg): 35 kcal, 1g P, 7g C, 0.2g F
POTATO sabzi (per 100g): 90 kcal, 2g P, 20g C, 0.5g F
EGG boiled (per egg): 78 kcal, 6g P, 0.6g C, 5g F
CHICKEN curry (per 150g): 230 kcal, 28g P, 5g C, 10g F
PARATHA plain (per piece): 150 kcal, 3g P, 22g C, 6g F

PORTION RULES:
- A standard katori = ~150ml
- A small bowl = ~100-150g
- A plate typically holds 2-4 chapatis
- Home-cooked Indian meal: 400-800 kcal total
- DO NOT overestimate — home-cooked portions are moderate

=== STEP 3: VERIFY ===
Re-check: Does the total kcal seem reasonable for what you see? A single plate should rarely exceed 800 kcal unless it is clearly a very large meal.

Return this exact JSON format:
{
  "name": "Short descriptive meal name",
  "calories": <integer>,
  "proteinG": <integer>,
  "carbsG": <integer>,
  "fatG": <integer>,
  "confidence": "high|medium|low",
  "notes": "Item breakdown: item1 (Xkcal, Yg P) + item2 (Xkcal, Yg P) + ..."
}`;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { imageBase64, mimeType } = body;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0,          // deterministic — no hallucination drift
      max_tokens: 450,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: USER_PROMPT },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${imageBase64}`,
                detail: "high",
              },
            },
          ],
        },
      ],
    });

    const content = completion.choices[0].message.content ?? "{}";
    // Strip markdown code blocks if the model adds them despite instructions
    const cleaned = content.replace(/```(?:json)?\n?|\n?```/g, "").trim();

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // Attempt to extract JSON object from any surrounding text
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in response");
      parsed = JSON.parse(jsonMatch[0]);
    }

    // Sanitise: ensure numbers are integers
    const result = {
      name:       String(parsed.name ?? "Scanned meal"),
      calories:   Math.round(Number(parsed.calories ?? 0)),
      proteinG:   Math.round(Number(parsed.proteinG ?? 0)),
      carbsG:     Math.round(Number(parsed.carbsG ?? 0)),
      fatG:       Math.round(Number(parsed.fatG ?? 0)),
      confidence: String(parsed.confidence ?? "medium"),
      notes:      String(parsed.notes ?? ""),
    };

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("analyze-meal error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
