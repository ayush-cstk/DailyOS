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

  const prompt = `You are an expert nutritionist specializing in Indian cuisine and South Asian foods.
Carefully analyze this meal photo and estimate macronutrients with high accuracy.

Step 1 — Identify every item you can see (be specific: e.g. "2 whole wheat chapatis ~60g each", "3 boiled eggs", "roasted soyabean ~100g", "carrot-onion-tomato raita ~150g").

Step 2 — For each identified item, estimate calories, protein, carbs, fat based on typical Indian home-cooked portions.

Step 3 — Sum them all up and return a single JSON response.

Important guidelines:
- Indian chapati/roti: ~100 kcal, 3g protein, 18g carbs, 2g fat each (medium size)
- Boiled egg (large): ~78 kcal, 6g protein, 0.6g carbs, 5g fat each
- Soyabean/soy nuggets (100g dry): ~336 kcal, 52g protein, 25g carbs, 1g fat
- Raita (150g): ~75 kcal, 3g protein, 6g carbs, 4g fat
- Count visible quantities carefully (number of eggs, chapatis, bowl sizes)
- A standard katori/bowl is ~150-200ml
- A thali plate portion is ~200-300g

Provide your response as a JSON object with EXACTLY this structure (no markdown, just raw JSON):
{
  "name": "Detailed meal description listing all items",
  "calories": <total number>,
  "proteinG": <total number>,
  "carbsG": <total number>,
  "fatG": <total number>,
  "confidence": "low|medium|high",
  "notes": "List each item and its estimated portion, e.g. 3 boiled eggs + 2 chapati + ..."
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
