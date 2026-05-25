import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { doc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any)?.id ?? session.user?.email ?? "";
  const { subscription } = await req.json();

  if (!subscription?.endpoint) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  // Store subscription keyed by endpoint hash so multiple devices work
  const key = Buffer.from(subscription.endpoint).toString("base64").slice(-32);
  await setDoc(doc(db, "push_subscriptions", `${userId}_${key}`), {
    userId,
    subscription,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any)?.id ?? session.user?.email ?? "";
  const { endpoint } = await req.json();

  if (!endpoint) return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });

  const key = Buffer.from(endpoint).toString("base64").slice(-32);
  await deleteDoc(doc(db, "push_subscriptions", `${userId}_${key}`));

  return NextResponse.json({ ok: true });
}
