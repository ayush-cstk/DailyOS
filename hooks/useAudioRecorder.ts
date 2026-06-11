"use client";
import { useEffect, useRef, useState } from "react";

// Pick a MediaRecorder mime type the current browser actually supports
// (webm on Chrome/Android, mp4/aac on iOS Safari).
function pickMime(): string {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/aac"];
  for (const c of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(c)) return c;
  }
  return "";
}

/**
 * Records mic audio via MediaRecorder. Calls `onComplete(blob)` when recording stops.
 * `start()` resolves to an error string on failure, or null on success.
 */
export function useAudioRecorder(onComplete: (blob: Blob) => void) {
  const [seconds, setSeconds] = useState(0);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Stop everything if the component unmounts mid-recording
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const start = async (): Promise<string | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = pickMime();
      const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        if (timerRef.current) clearInterval(timerRef.current);
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || mime || "audio/webm" });
        onCompleteRef.current(blob);
      };
      recorderRef.current = mr;
      mr.start();
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
      return null;
    } catch {
      return "Microphone access was blocked. Allow mic permission and try again.";
    }
  };

  const stop = () => {
    recorderRef.current?.stop();
  };

  return { seconds, start, stop };
}

/** Derive a sensible upload filename extension from a recorded blob's mime type. */
export function audioExt(type: string): string {
  if (type.includes("mp4") || type.includes("aac") || type.includes("m4a")) return "m4a";
  if (type.includes("mpeg") || type.includes("mp3")) return "mp3";
  if (type.includes("wav")) return "wav";
  return "webm";
}
