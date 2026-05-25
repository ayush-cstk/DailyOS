"use client";
import { useEffect, useRef, useCallback } from "react";

export type NotificationPermission = "default" | "granted" | "denied";

// ── Helpers ──────────────────────────────────────────────────────────────────
function now() { return new Date(); }
function todayAt(hours: number, minutes = 0): Date {
  const d = new Date(); d.setHours(hours, minutes, 0, 0); return d;
}
function msUntil(target: Date): number {
  return Math.max(0, target.getTime() - Date.now());
}

function showNotification(title: string, body: string, url = "/dashboard", tag?: string) {
  if (typeof window === "undefined" || Notification.permission !== "granted") return;
  const n = new Notification(title, {
    body,
    icon: "/BrandLogo_Header.png",
    badge: "/BrandLogo_Header.png",
    tag: tag || `dailyos-${Date.now()}`,
    requireInteraction: false,
    vibrate: [100, 50, 100],
  } as NotificationOptions);
  n.onclick = () => { window.focus(); window.location.href = url; n.close(); };
}

// ── Hook ──────────────────────────────────────────────────────────────────────
interface UseNotificationsOptions {
  userId: string;
  lastMealAt?: number | null;    // Unix ms of last logged meal (any date)
  lastWorkoutAt?: number | null; // Unix ms of last logged workout
  pendingTasksCount?: number;
}

export function useNotifications({ userId, lastMealAt, lastWorkoutAt, pendingTasksCount }: UseNotificationsOptions) {
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearAll = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const schedule = useCallback((delayMs: number, fn: () => void) => {
    if (delayMs <= 0) return;
    timers.current.push(setTimeout(fn, delayMs));
  }, []);

  // ── Register service worker ───────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  // ── Meal reminders ────────────────────────────────────────────────────────
  // If no meal logged in past 3 hours, nudge the user
  useEffect(() => {
    if (!userId || Notification.permission !== "granted") return;

    const THREE_HOURS = 3 * 60 * 60 * 1000;
    const now_ms = Date.now();

    // Determine when the last meal was relative to now
    const sinceLastMeal = lastMealAt ? now_ms - lastMealAt : Infinity;
    const mealsDueIn = sinceLastMeal >= THREE_HOURS
      ? 0                               // overdue now
      : THREE_HOURS - sinceLastMeal;    // due in future

    const MEAL_MESSAGES = [
      { delay: 0, title: "🍽 Time to log your meal?", body: "It's been 3+ hours. Had something? Log it to stay on track!" },
      { delay: 3 * 60 * 60 * 1000, title: "🥗 Meal check-in", body: "Another 3 hours have passed. Don't forget to log your meals for accurate nutrition tracking." },
      { delay: 6 * 60 * 60 * 1000, title: "⚠ Meal log overdue", body: "You haven't logged a meal in 6+ hours. Keep your nutrition data accurate — log now!" },
    ];

    MEAL_MESSAGES.forEach(({ delay, title, body }) => {
      schedule(mealsDueIn + delay, () =>
        showNotification(title, body, "/dashboard/diet", "meal-reminder")
      );
    });

    return clearAll;
  }, [userId, lastMealAt, schedule]);

  // ── Workout reminders ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId || Notification.permission !== "granted") return;

    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const workoutLogged = lastWorkoutAt ? lastWorkoutAt >= todayStart.getTime() : false;

    if (workoutLogged) return; // already logged today

    const morning = todayAt(9, 0);
    const evening = todayAt(18, 30);
    const n = now();

    // 9am reminder
    if (n < morning) {
      schedule(msUntil(morning), () =>
        showNotification(
          "💪 Morning check-in",
          "Have you completed your workout? Log it now to get your AI coach report!",
          "/dashboard/workout",
          "workout-morning"
        )
      );
    }

    // 6:30pm reminder if still not logged
    if (n < evening) {
      schedule(msUntil(evening), () => {
        const todayStart2 = new Date(); todayStart2.setHours(0, 0, 0, 0);
        const logged = lastWorkoutAt ? lastWorkoutAt >= todayStart2.getTime() : false;
        if (!logged) {
          showNotification(
            "🏋 Evening workout reminder",
            "No workout logged yet today. Fill in your session to unlock a personalized coach review!",
            "/dashboard/workout",
            "workout-evening"
          );
        }
      });
    }

    return clearAll;
  }, [userId, lastWorkoutAt, schedule]);

  // ── Task reminders ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId || Notification.permission !== "granted") return;
    if (!pendingTasksCount || pendingTasksCount === 0) return;

    // 8pm reminder for pending tasks
    const eightPm = todayAt(20, 0);
    const n = now();

    if (n < eightPm) {
      schedule(msUntil(eightPm), () => {
        if (pendingTasksCount > 0) {
          showNotification(
            "✅ Tasks pending",
            `You have ${pendingTasksCount} task${pendingTasksCount > 1 ? "s" : ""} due today. Check them off!`,
            "/dashboard/tasks",
            "task-reminder"
          );
        }
      });
    }

    return clearAll;
  }, [userId, pendingTasksCount, schedule]);

  // ── Subscribe / Unsubscribe ───────────────────────────────────────────────
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (typeof window === "undefined" || !("Notification" in window)) return "denied";
    const result = await Notification.requestPermission();
    return result as NotificationPermission;
  }, []);

  const subscribePush = useCallback(async (): Promise<boolean> => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) return false; // VAPID not configured, skip silently

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub }),
      });
      return true;
    } catch (err) {
      console.warn("Push subscribe failed:", err);
      return false;
    }
  }, []);

  return { requestPermission, subscribePush };
}

// ── Utility ───────────────────────────────────────────────────────────────────
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const arr = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) arr[i] = rawData.charCodeAt(i);
  return arr.buffer;
}
