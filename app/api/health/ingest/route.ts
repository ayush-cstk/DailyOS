import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

const ACTIVITY_MAP: Record<string, string> = {
  run: "running", running: "running", jog: "running", treadmill: "running",
  walk: "walking", walking: "walking", steps: "walking",
  cycle: "cycling", cycling: "cycling", bike: "cycling", biking: "cycling", ride: "cycling",
  hike: "hiking", hiking: "hiking",
  swim: "swimming", swimming: "swimming",
  row: "rowing", rowing: "rowing",
  elliptical: "elliptical",
  "jump rope": "jump_rope", jump_rope: "jump_rope", skipping: "jump_rope", "jump-rope": "jump_rope",
  stairs: "stair_climbing", stair_climbing: "stair_climbing", "stair climbing": "stair_climbing",
  "mountain climbing": "mountain_climbing", mountain_climbing: "mountain_climbing",
};
const CARDIO = new Set(Object.values(ACTIVITY_MAP));

const genId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const todayISO = () => new Date().toISOString().slice(0, 10);

// Normalise a HAE v2 payload ({ data: { metrics[], workouts[] } }) into our flat format.
function normaliseHAE(raw: any): { workouts: any[]; bodyWeightKg?: number; steps?: number; date?: string } {
  const metrics: any[] = raw.data?.metrics ?? [];
  const haeWorkouts: any[] = raw.data?.workouts ?? [];

  // Steps — HAE metric name: "step_count"
  let steps: number | undefined;
  let date: string | undefined;
  const stepMetric = metrics.find((m: any) => m.name === "step_count");
  if (stepMetric?.data?.length) {
    const latest = stepMetric.data[stepMetric.data.length - 1];
    steps = Math.round(Number(latest.qty));
    date = String(latest.date ?? "").slice(0, 10) || undefined;
  }

  // Body weight — HAE metric name: "body_mass" or "weight_body_mass"
  let bodyWeightKg: number | undefined;
  const weightMetric = metrics.find((m: any) =>
    m.name === "body_mass" || m.name === "weight_body_mass",
  );
  if (weightMetric?.data?.length) {
    const latest = weightMetric.data[weightMetric.data.length - 1];
    let kg = Number(latest.qty);
    if ((weightMetric.units ?? "").toLowerCase().startsWith("lb")) kg *= 0.453592;
    bodyWeightKg = Math.round(kg * 10) / 10;
  }

  // Workouts
  const workouts = haeWorkouts.map((w: any) => {
    const rawType = String(w.name ?? "").toLowerCase().trim();
    // HAE duration is in minutes (decimal)
    const durationMin = Math.round(Number(w.duration ?? 0));
    let distanceKm = Number(w.distance ?? 0) || undefined;
    if (distanceKm && String(w.distanceUnit ?? "").toLowerCase().includes("mi")) {
      distanceKm = Math.round(distanceKm * 1.60934 * 100) / 100;
    }
    const calories = w.activeEnergy != null ? Math.round(Number(w.activeEnergy)) : undefined;
    const avgHr = w.avgHeartRate ?? w.averageHeartRate ?? undefined;
    // HAE start: "2026-06-18 08:00:00 +0530" — grab date portion
    const wDate = w.start ? String(w.start).slice(0, 10) : undefined;
    return { type: rawType, durationMin, distanceKm, calories, avgHr, externalId: w.id, date: wDate };
  });

  return { workouts, bodyWeightKg, steps, date };
}

// POST /api/health/ingest  (token via "Authorization: Bearer <token>" or ?token=)
// Accepts two formats:
//   1. Flat (our own / test):  { date?, bodyWeightKg?, steps?, workouts?: [{type, durationMin, ...}] }
//   2. Health Auto Export v2:  { data: { metrics: [...], workouts: [...] } }
export async function POST(req: NextRequest) {
  const token =
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ||
    req.nextUrl.searchParams.get("token") ||
    "";
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 401 });

  const tokDoc = await adminDb.collection("healthTokens").doc(token).get();
  if (!tokDoc.exists) return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  const userId = (tokDoc.data() as any).userId as string;

  let raw: any;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Detect and normalise HAE v2 format
  const body: any = raw?.data ? normaliseHAE(raw) : raw;

  const result = { workouts: 0, skipped: 0, bodyWeight: 0, steps: 0 };

  // ── Workouts → cardio sessions (de-duped by externalId) ──
  const workouts = Array.isArray(body.workouts) ? body.workouts : [];
  for (const w of workouts) {
    const rawType = String(w.type ?? "").toLowerCase().trim();
    const activity = ACTIVITY_MAP[rawType] ?? (CARDIO.has(rawType) ? rawType : null);
    if (!activity) { result.skipped++; continue; }

    const externalId = w.externalId != null ? String(w.externalId) : null;
    if (externalId) {
      const dup = await adminDb.collection("workouts")
        .where("userId", "==", userId).where("externalId", "==", externalId).limit(1).get();
      if (!dup.empty) { result.skipped++; continue; }
    }

    const durationMinutes = Math.max(0, Math.round(Number(w.durationMin ?? w.durationMinutes ?? 0)));
    const cardio: any = { id: genId(), activity, durationMinutes };
    if (w.distanceKm != null && !Number.isNaN(Number(w.distanceKm))) cardio.distanceKm = Math.round(Number(w.distanceKm) * 100) / 100;
    if (w.calories != null && !Number.isNaN(Number(w.calories))) cardio.caloriesBurned = Math.round(Number(w.calories));

    const session: any = {
      userId,
      date: String(w.date ?? body.date ?? todayISO()).slice(0, 10),
      exercises: [],
      cardioLogs: [cardio],
      durationMinutes,
      createdAt: Date.now(),
      source: "watch",
    };
    if (externalId) session.externalId = externalId;
    if (w.avgHr != null) session.notes = `Avg HR ${Math.round(Number(w.avgHr))} bpm · synced`;

    await adminDb.collection("workouts").add(session);
    result.workouts++;
  }

  // ── Body weight → one entry per day (upsert) ──
  if (body.bodyWeightKg != null && !Number.isNaN(Number(body.bodyWeightKg))) {
    const date = String(body.date ?? todayISO()).slice(0, 10);
    const data = { userId, date, weightKg: Number(body.bodyWeightKg), createdAt: Date.now(), source: "watch" };
    const dup = await adminDb.collection("bodyweight")
      .where("userId", "==", userId).where("date", "==", date).limit(1).get();
    if (!dup.empty) await dup.docs[0].ref.set(data, { merge: true });
    else await adminDb.collection("bodyweight").add(data);
    result.bodyWeight = 1;
  }

  // ── Steps → daily activity (upsert by user+date) ──
  if (body.steps != null && !Number.isNaN(Number(body.steps))) {
    const date = String(body.date ?? todayISO()).slice(0, 10);
    await adminDb.collection("healthActivity").doc(`${userId}_${date}`).set(
      { userId, date, steps: Math.round(Number(body.steps)), source: "watch", updatedAt: Date.now() },
      { merge: true },
    );
    result.steps = 1;
  }

  return NextResponse.json({ ok: true, ...result });
}
