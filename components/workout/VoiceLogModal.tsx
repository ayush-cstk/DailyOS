"use client";
import { useState, useRef, useEffect } from "react";
import { Mic, Square, Loader2, X, Check, Trash2, RotateCcw, Sparkles } from "lucide-react";
import { cn, generateId } from "@/lib/utils";
import type { ExerciseLog } from "@/types";

type Phase = "idle" | "recording" | "processing" | "review" | "error";

interface ParsedSet { reps: number; weight?: number; unit: string }
interface ParsedExercise { name: string; sets: ParsedSet[] }

// Pick a MediaRecorder mime type the current browser actually supports.
function pickMime(): string {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/aac"];
  for (const c of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(c)) return c;
  }
  return "";
}

function setSummary(sets: ParsedSet[]): string {
  if (!sets.length) return "no sets";
  const allSame = sets.every(
    (s) => s.reps === sets[0].reps && s.weight === sets[0].weight && s.unit === sets[0].unit,
  );
  const w = (s: ParsedSet) => (s.unit === "bodyweight" ? "BW" : s.weight != null ? `${s.weight}${s.unit}` : "—");
  if (allSame) {
    return `${sets.length} × ${sets[0].reps}${sets[0].unit === "bodyweight" ? " (BW)" : ` @ ${w(sets[0])}`}`;
  }
  return sets.map((s) => `${s.reps}@${w(s)}`).join(", ");
}

export default function VoiceLogModal({
  onAdd,
  onClose,
}: {
  onAdd: (exercises: ExerciseLog[]) => void;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [seconds, setSeconds] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [parsed, setParsed] = useState<ParsedExercise[]>([]);
  const [error, setError] = useState("");

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const startRecording = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = pickMime();
      const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || mime || "audio/webm" });
        processAudio(blob);
      };
      recorderRef.current = mr;
      mr.start();
      setPhase("recording");
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      setError("Microphone access was blocked. Allow mic permission and try again.");
      setPhase("error");
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    recorderRef.current?.stop();
    setPhase("processing");
  };

  const processAudio = async (blob: Blob) => {
    try {
      const type = blob.type;
      const ext = type.includes("mp4") || type.includes("aac") || type.includes("m4a") ? "m4a" : "webm";
      const fd = new FormData();
      fd.append("audio", blob, `workout.${ext}`);

      const res = await fetch("/api/voice-workout", { method: "POST", body: fd });
      const data = await res.json();

      if (data.error) {
        setError(data.error);
        setPhase("error");
        return;
      }
      setTranscript(data.transcript || "");
      setParsed(Array.isArray(data.exercises) ? data.exercises : []);
      setPhase("review");
    } catch {
      setError("Something went wrong processing your recording. Try again.");
      setPhase("error");
    }
  };

  const reset = () => {
    setTranscript("");
    setParsed([]);
    setError("");
    setSeconds(0);
    setPhase("idle");
  };

  const removeParsed = (i: number) => setParsed((prev) => prev.filter((_, idx) => idx !== i));

  const handleAdd = () => {
    const logs: ExerciseLog[] = parsed.map((p) => ({
      id: generateId(),
      name: p.name,
      sets: (p.sets.length ? p.sets : [{ reps: 0, unit: "kg" }]).map((s) => ({
        id: generateId(),
        reps: Number(s.reps) || 0,
        weight: s.unit === "bodyweight" ? undefined : s.weight != null ? Number(s.weight) : undefined,
        unit: (s.unit === "lbs" || s.unit === "bodyweight" ? s.unit : "kg") as ExerciseLog["sets"][number]["unit"],
        completed: false,
      })),
    }));
    onAdd(logs);
  };

  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pt-4 pb-24 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative rounded-2xl shadow-2xl w-full max-w-md p-5 animate-slide-up max-h-[80dvh] overflow-y-auto"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border)", boxShadow: "0 24px 80px rgba(0,0,0,0.4)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold flex items-center gap-2" style={{ color: "var(--text-1)" }}>
            <Mic className="w-4 h-4 text-blue-500" /> Log by voice
          </h3>
          <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
        </div>

        {/* ── Idle ── */}
        {phase === "idle" && (
          <div className="text-center py-4">
            <button
              onClick={startRecording}
              className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mx-auto shadow-lg active:scale-95 transition-transform"
            >
              <Mic className="w-8 h-8 text-white" />
            </button>
            <p className="text-sm font-bold mt-4" style={{ color: "var(--text-1)" }}>Tap to start speaking</p>
            <p className="text-xs mt-1.5 leading-relaxed px-4" style={{ color: "var(--text-3)" }}>
              Say something like<br />
              <span className="italic" style={{ color: "var(--text-2)" }}>
                “Bench press 3 sets of 10 at 60 kilos, then pull ups 3 sets of 12.”
              </span>
            </p>
          </div>
        )}

        {/* ── Recording ── */}
        {phase === "recording" && (
          <div className="text-center py-4">
            <button
              onClick={stopRecording}
              className="relative w-20 h-20 rounded-full bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center mx-auto shadow-lg active:scale-95 transition-transform"
            >
              <span className="absolute inset-0 rounded-full bg-rose-500/40 animate-ping" />
              <Square className="w-7 h-7 text-white relative z-10" fill="white" />
            </button>
            <p className="text-2xl font-black mt-4 tabular-nums" style={{ color: "var(--text-1)" }}>{mmss}</p>
            <p className="text-xs mt-1 font-semibold text-rose-500">Listening… tap to finish</p>
          </div>
        )}

        {/* ── Processing ── */}
        {phase === "processing" && (
          <div className="text-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
            <p className="text-sm font-bold mt-4" style={{ color: "var(--text-1)" }}>Transcribing &amp; understanding…</p>
            <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>Turning your words into sets</p>
          </div>
        )}

        {/* ── Error ── */}
        {phase === "error" && (
          <div className="text-center py-6">
            <p className="text-sm font-semibold text-red-500 px-4">{error}</p>
            <button onClick={reset} className="btn-secondary text-sm mt-4 inline-flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" /> Try again
            </button>
          </div>
        )}

        {/* ── Review ── */}
        {phase === "review" && (
          <div className="space-y-4">
            {transcript && (
              <div className="rounded-xl px-3 py-2.5" style={{ background: "var(--surface-3)" }}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-3)" }}>
                  Heard
                </p>
                <p className="text-xs italic" style={{ color: "var(--text-2)" }}>“{transcript}”</p>
              </div>
            )}

            {parsed.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm font-semibold" style={{ color: "var(--text-2)" }}>
                  Couldn’t pick out any exercises
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>
                  Try again and mention the exercise, sets, reps and weight.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-500">
                  <Sparkles className="w-3.5 h-3.5" />
                  Found {parsed.length} exercise{parsed.length !== 1 ? "s" : ""}
                </div>
                <div className="space-y-2">
                  {parsed.map((ex, i) => (
                    <div
                      key={i}
                      className="card flex items-center gap-3"
                      style={{ borderLeftColor: "#3B82F6", borderLeftWidth: "3px" }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate" style={{ color: "var(--text-1)" }}>{ex.name}</p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>{setSummary(ex.sets)}</p>
                      </div>
                      <button
                        onClick={() => removeParsed(i)}
                        className="p-2 rounded-lg hover:text-red-400 hover:bg-red-500/10 active:scale-90 transition-all flex-shrink-0"
                        style={{ color: "var(--text-3)" }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="flex gap-2 pt-1">
              <button onClick={reset} className="btn-secondary flex-1 text-sm inline-flex items-center justify-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5" /> Redo
              </button>
              <button
                onClick={handleAdd}
                disabled={parsed.length === 0}
                className="btn-primary flex-1 text-sm inline-flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Add to workout
              </button>
            </div>
            <p className="text-[11px] text-center" style={{ color: "var(--text-3)" }}>
              You can fine-tune every set after adding.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
