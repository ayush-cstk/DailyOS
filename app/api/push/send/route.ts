import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import webpush from "web-push";

// Configure VAPID — set these in .env.local
webpush.setVapidDetails(
  "mailto:" + (process.env.VAPID_EMAIL ?? "admin@dailyos.app"),
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "",
  process.env.VAPID_PRIVATE_KEY ?? ""
);

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { subscription, title, body, url, tag } = await req.json();

  if (!subscription || !title) {
    return NextResponse.json({ error: "Missing subscription or title" }, { status: 400 });
  }

  const payload = JSON.stringify({ title, body, url, tag });

  try {
    await webpush.sendNotification(subscription, payload);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Push send error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
