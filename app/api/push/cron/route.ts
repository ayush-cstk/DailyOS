import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { adminDb } from "@/lib/firebaseAdmin";
import type { NotificationPrefs } from "@/types";

webpush.setVapidDetails(
  "mailto:" + (process.env.VAPID_EMAIL ?? "admin@dailyos.app"),
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "",
  process.env.VAPID_PRIVATE_KEY ?? ""
);

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns current HH:MM in a given IANA timezone */
function nowHHMM(tz: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

/** Check if a reminder time matches the current minute in the user's timezone */
function matchesNow(time: string, tz: string): boolean {
  return nowHHMM(tz) === time;
}

interface PushSubscription {
  userId: string;
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } };
}

async function sendPush(sub: PushSubscription["subscription"], title: string, body: string, url: string) {
  try {
    await webpush.sendNotification(sub, JSON.stringify({ title, body, url, tag: `${title}-${Date.now()}` }));
  } catch (err: any) {
    // 410 Gone = subscription expired — could clean it up here
    if (err.statusCode !== 410) console.error("Push failed:", err.message);
  }
}

// ── Cron handler ──────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  // Verify Vercel cron secret
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let sent = 0;

  try {
    // Load all push subscriptions + notification prefs in parallel
    const [subsSnap, prefsSnap] = await Promise.all([
      adminDb.collection("push_subscriptions").get(),
      adminDb.collection("notificationPrefs").get(),
    ]);

    // Build a map: userId → prefs
    const prefsMap = new Map<string, NotificationPrefs>();
    prefsSnap.docs.forEach(d => prefsMap.set(d.id, d.data() as NotificationPrefs));

    // Group subscriptions by userId
    const subsByUser = new Map<string, PushSubscription["subscription"][]>();
    subsSnap.docs.forEach(d => {
      const data = d.data() as PushSubscription;
      if (!subsByUser.has(data.userId)) subsByUser.set(data.userId, []);
      subsByUser.get(data.userId)!.push(data.subscription);
    });

    // For each user, check which reminders are due right now
    const tasks: Promise<void>[] = [];

    subsByUser.forEach((subs, userId) => {
      const prefs = prefsMap.get(userId);
      if (!prefs) return;

      const tz = prefs.timezone || "UTC";

      const reminders: Array<{ enabled: boolean; time: string; title: string; body: string; url: string }> = [
        {
          enabled: prefs.mealReminders,
          time: prefs.breakfastTime,
          title: "🍳 Breakfast time",
          body: "Log your breakfast to start tracking nutrition!",
          url: "/dashboard/diet",
        },
        {
          enabled: prefs.mealReminders,
          time: prefs.lunchTime,
          title: "🥗 Lunch reminder",
          body: "Don't forget to log your lunch!",
          url: "/dashboard/diet",
        },
        {
          enabled: prefs.mealReminders,
          time: prefs.dinnerTime,
          title: "🍽 Dinner reminder",
          body: "Log your dinner to hit your daily macro goals.",
          url: "/dashboard/diet",
        },
        {
          enabled: prefs.workoutReminders,
          time: prefs.workoutTime,
          title: "💪 Workout reminder",
          body: "Time to crush your session! Log it to track your progress.",
          url: "/dashboard/workout",
        },
        {
          enabled: prefs.taskReminders,
          time: prefs.taskReminderTime,
          title: "✅ Task reminder",
          body: "You have pending tasks for today. Check them off!",
          url: "/dashboard/tasks",
        },
      ];

      reminders.forEach(r => {
        if (!r.enabled || !matchesNow(r.time, tz)) return;
        subs.forEach(sub => {
          tasks.push(sendPush(sub, r.title, r.body, r.url));
          sent++;
        });
      });
    });

    await Promise.all(tasks);
  } catch (err: any) {
    console.error("Cron error:", err);
    return NextResponse.json({
      error: "Internal error",
      detail: err?.message ?? String(err),
      env: {
        hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
        hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
        keyLength: process.env.FIREBASE_PRIVATE_KEY?.length ?? 0,
        keyHasPemHeader: process.env.FIREBASE_PRIVATE_KEY?.includes("BEGIN PRIVATE KEY") ?? false,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "MISSING",
      },
    }, { status: 500 });
  }

  return NextResponse.json({ ok: true, sent, time: new Date().toISOString() });
}
