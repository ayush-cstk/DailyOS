"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Plus, Dumbbell, Trash2, ChevronDown, ChevronUp, Sparkles, Scale, Clock,
  Save, History, X, Loader2, Flame, Activity, PersonStanding, Bike,
  Mountain, Waves, Footprints, Timer, MapPin, TrendingUp,
} from "lucide-react";
import { cn, generateId, todayString, formatDate, localDateString } from "@/lib/utils";
import { saveWorkoutSession, getWorkoutSessions, getBodyWeightEntries, logBodyWeight } from "@/lib/firestore";
import { useToast } from "@/components/ui/Toast";
import { MarkdownText } from "@/components/ui/MarkdownText";
import type { WorkoutSession, ExerciseLog, SetLog, WeightUnit, BodyWeightEntry, CardioLog, CardioActivity } from "@/types";

// ── Cardio config ─────────────────────────────────────────────────────────────
const CARDIO_META: Record<CardioActivity, { label: string; icon: React.ElementType; color: string; met: number; unit: string }> = {
  walking:          { label: "Walking",          icon: Footprints,      color: "text-emerald-400 bg-emerald-500/10", met: 3.5,  unit: "km" },
  running:          { label: "Running",           icon: PersonStanding,  color: "text-orange-400 bg-orange-500/10",   met: 9.8,  unit: "km" },
  cycling:          { label: "Cycling",           icon: Bike,            color: "text-blue-400 bg-blue-500/10",       met: 7.5,  unit: "km" },
  hiking:           { label: "Hiking",            icon: TrendingUp,      color: "text-amber-400 bg-amber-500/10",     met: 5.3,  unit: "km" },
  mountain_climbing:{ label: "Mountain Climbing", icon: Mountain,        color: "text-red-400 bg-red-500/10",         met: 8.0,  unit: "m elev" },
  swimming:         { label: "Swimming",          icon: Waves,           color: "text-cyan-400 bg-cyan-500/10",       met: 7.0,  unit: "km" },
  jump_rope:        { label: "Jump Rope",         icon: Activity,        color: "text-pink-400 bg-pink-500/10",       met: 11.8, unit: "skips" },
  elliptical:       { label: "Elliptical",        icon: Activity,        color: "text-violet-400 bg-violet-500/10",   met: 5.0,  unit: "km" },
  stair_climbing:   { label: "Stair Climbing",    icon: TrendingUp,      color: "text-rose-400 bg-rose-500/10",       met: 9.0,  unit: "floors" },
  rowing:           { label: "Rowing",            icon: Waves,           color: "text-indigo-400 bg-indigo-500/10",   met: 7.0,  unit: "km" },
};

function calcCardioCals(activity: CardioActivity, durationMinutes: number, weightKg: number): number {
  const met = CARDIO_META[activity]?.met ?? 5.0;
  return Math.round(met * weightKg * (durationMinutes / 60));
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function WorkoutPage() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id ?? session?.user?.email ?? "";
  const { toast } = useToast();

  const [view, setView] = useState<"log" | "history">("log");
  const [pastSessions, setPastSessions] = useState<WorkoutSession[]>([]);
  const [bodyWeightEntries, setBodyWeightEntries] = useState<BodyWeightEntry[]>([]);

  // Strength
  const [exercises, setExercises] = useState<ExerciseLog[]>([]);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState("");

  // Cardio
  const [cardioLogs, setCardioLogs] = useState<CardioLog[]>([]);
  const [showAddCardio, setShowAddCardio] = useState(false);

  // Session meta
  const [duration, setDuration] = useState<number>(0);
  const [bodyWeight, setBodyWeight] = useState<string>("");
  const [date, setDate] = useState(todayString());

  // Body weight modal
  const [showBodyWeightModal, setShowBodyWeightModal] = useState(false);
  const [newBodyWeight, setNewBodyWeight] = useState("");

  // AI + save
  const [summarizing, setSummarizing] = useState(false);
  const [summaryResult, setSummaryResult] = useState<string>("");
  const [caloriesBurned, setCaloriesBurned] = useState<number | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!userId) return;
    getWorkoutSessions(userId).then(setPastSessions);
    getBodyWeightEntries(userId).then((entries) => {
      setBodyWeightEntries(entries);
      if (entries.length > 0) setBodyWeight(String(entries[0].weightKg));
    });
  }, [userId]);

  const totalSets = exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  const totalReps = exercises.reduce((acc, ex) => acc + ex.sets.reduce((s, set) => s + (set.reps || 0), 0), 0);
  const bwKg = parseFloat(bodyWeight) || 70;
  const totalCardioCals = cardioLogs.reduce((sum, c) => sum + (c.caloriesBurned ?? 0), 0);
  const hasAnything = exercises.length > 0 || cardioLogs.length > 0;

  // ── Strength handlers ──
  const addExercise = () => {
    if (!newExerciseName.trim()) return;
    setExercises((prev) => [...prev, { id: generateId(), name: newExerciseName.trim(), sets: [newSet()] }]);
    setNewExerciseName(""); setShowAddExercise(false);
  };
  const removeExercise = (id: string) => setExercises((prev) => prev.filter((e) => e.id !== id));
  const addSet = (exId: string) => setExercises((prev) => prev.map((ex) => ex.id === exId ? { ...ex, sets: [...ex.sets, newSet()] } : ex));
  const removeSet = (exId: string, setId: string) => setExercises((prev) => prev.map((ex) => ex.id === exId ? { ...ex, sets: ex.sets.filter((s) => s.id !== setId) } : ex));
  const updateSet = (exId: string, setId: string, updates: Partial<SetLog>) => setExercises((prev) => prev.map((ex) => ex.id === exId ? { ...ex, sets: ex.sets.map((s) => s.id === setId ? { ...s, ...updates } : s) } : ex));

  // ── Cardio handlers ──
  const addCardioLog = (log: Omit<CardioLog, "id">) => {
    setCardioLogs((prev) => [...prev, { ...log, id: generateId() }]);
    setShowAddCardio(false);
  };
  const removeCardioLog = (id: string) => setCardioLogs((prev) => prev.filter((c) => c.id !== id));

  // ── AI Summary ──
  const handleSummarize = async () => {
    if (!hasAnything) return;
    setSummarizing(true);
    try {
      const res = await fetch("/api/summarize-workout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exercises, cardioLogs, durationMinutes: duration, bodyWeightKg: bodyWeight ? parseFloat(bodyWeight) : null }),
      });
      const data = await res.json();
      if (data.summary) {
        setSummaryResult(data.summary);
        setCaloriesBurned(data.caloriesBurned ?? null);
        // Update calorie counts on cardio logs from server response
        if (data.cardioWithCalories?.length) {
          setCardioLogs((prev) => prev.map((c) => {
            const updated = data.cardioWithCalories.find((u: any) => u.id === c.id);
            return updated ? { ...c, caloriesBurned: updated.caloriesBurned } : c;
          }));
        }
        setShowSummary(true);
        toast("AI summary generated!", "success");
      } else {
        toast("Couldn't generate summary", "error");
      }
    } catch { toast("Something went wrong", "error"); }
    finally { setSummarizing(false); }
  };

  // ── Save ──
  const handleSave = async () => {
    if (!hasAnything) return;
    setSaving(true);
    try {
      const session_data: Omit<WorkoutSession, "id"> = {
        userId, date, exercises, durationMinutes: duration, createdAt: Date.now(),
      };
      if (cardioLogs.length > 0) session_data.cardioLogs = cardioLogs;
      if (bodyWeight) session_data.bodyWeightKg = parseFloat(bodyWeight);
      if (summaryResult) session_data.summary = summaryResult;
      const saved = await saveWorkoutSession(session_data);
      setPastSessions((prev) => [saved, ...prev]);
      setExercises([]); setCardioLogs([]); setDuration(0);
      setSummaryResult(""); setCaloriesBurned(null); setShowSummary(false);
      toast("Workout saved! 💪", "success");
    } catch { toast("Failed to save workout", "error"); }
    finally { setSaving(false); }
  };

  const handleLogBodyWeight = async () => {
    if (!newBodyWeight) return;
    const entry = await logBodyWeight({ userId, date: todayString(), weightKg: parseFloat(newBodyWeight), createdAt: Date.now() });
    setBodyWeightEntries((prev) => [entry, ...prev]);
    setBodyWeight(newBodyWeight); setNewBodyWeight(""); setShowBodyWeightModal(false);
    toast(`Body weight logged: ${entry.weightKg} kg`, "success");
  };

  return (
    <div className="animate-fade-in">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: "var(--text-1)" }}>Workout</h1>
          <p className="text-sm mt-0.5 font-medium" style={{ color: "var(--text-3)" }}>Log and track your training</p>
        </div>
        <button onClick={() => setShowBodyWeightModal(true)}
          className="btn-secondary text-sm flex items-center gap-1.5 flex-shrink-0">
          <Scale className="w-3.5 h-3.5 text-blue-500" />
          {bodyWeight
            ? <span className="font-bold text-blue-600">{bodyWeight} kg</span>
            : <span className="hidden sm:inline">Log weight</span>}
        </button>
      </div>

      {/* ── View toggle ── */}
      <div className="flex gap-1 p-1 rounded-xl mb-6 w-fit" style={{ background: "var(--surface-2)", border: "1px solid var(--border-subtle)" }}>
        {(["log", "history"] as const).map((v) => (
          <button key={v} onClick={() => setView(v)}
            className="px-5 py-2 rounded-lg text-sm font-bold capitalize transition-all duration-150"
            style={view === v ? { background: "var(--surface-0)", color: "var(--text-1)", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" } : { color: "var(--text-3)" }}>
            {v === "log" ? "Log Workout" : "History"}
          </button>
        ))}
      </div>

      {view === "log" ? (
        <div className="space-y-4">
          {/* Date & Duration */}
          <div className="card">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Date</label>
                <input type="date" className="input text-sm" value={date}
                  onChange={(e) => setDate(e.target.value)} />
              </div>
              <div>
                <label className="label flex items-center gap-1"><Clock className="w-3 h-3 flex-shrink-0" /><span className="truncate">Duration (min)</span></label>
                <input type="number" inputMode="numeric" className="input text-sm" min={0} placeholder="e.g. 60"
                  value={duration || ""} onChange={(e) => setDuration(Number(e.target.value))} />
              </div>
            </div>
          </div>

          {/* Stats bar */}
          {hasAnything && (
            <div className="grid grid-cols-4 gap-2 animate-slide-down">
              {[
                { label: "Exercises", val: exercises.length, icon: Dumbbell, color: "text-blue-500 bg-blue-500/10" },
                { label: "Sets",      val: totalSets,        icon: Activity,   color: "text-violet-500 bg-violet-500/10" },
                { label: "Reps",      val: totalReps,        icon: Flame,      color: "text-orange-500 bg-orange-500/10" },
                { label: "Cardio Cal",val: totalCardioCals,  icon: Timer,      color: "text-emerald-500 bg-emerald-500/10" },
              ].map((s) => (
                <div key={s.label} className="card text-center py-3 px-1">
                  <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center mx-auto mb-1", s.color)}>
                    <s.icon className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-lg font-black" style={{ color: "var(--text-1)" }}>{s.val}</p>
                  <p className="text-[9px] font-bold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* ── STRENGTH SECTION ── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Dumbbell className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <h2 className="text-sm font-black uppercase tracking-wider" style={{ color: "var(--text-2)" }}>Strength</h2>
            </div>

            {exercises.length === 0 && !showAddExercise && (
              <div className="card border-2 border-dashed border-blue-100 dark:border-blue-900/40 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 dark:from-blue-950/20 dark:to-indigo-950/10 text-center py-6 animate-fade-in">
                <p className="font-bold text-sm" style={{ color: "var(--text-2)" }}>No strength exercises yet</p>
                <p className="text-xs mt-0.5 mb-3" style={{ color: "var(--text-3)" }}>Bench, squats, deadlifts — add them here</p>
                <button onClick={() => setShowAddExercise(true)}
                  className="inline-flex items-center gap-2 btn-primary text-sm px-4 py-2">
                  <Plus className="w-3.5 h-3.5" /> Add exercise
                </button>
              </div>
            )}

            <div className="space-y-3">
              {exercises.map((ex) => (
                <ExerciseCard key={ex.id} exercise={ex}
                  onAddSet={() => addSet(ex.id)}
                  onRemoveSet={(sId) => removeSet(ex.id, sId)}
                  onUpdateSet={(sId, u) => updateSet(ex.id, sId, u)}
                  onRemove={() => removeExercise(ex.id)} />
              ))}
            </div>

            {showAddExercise ? (
              <div className="card flex items-center gap-2 mt-3">
                <input autoFocus className="input flex-1 text-sm" placeholder="Exercise name (e.g. Bench Press)"
                  value={newExerciseName} onChange={(e) => setNewExerciseName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addExercise()} />
                <button onClick={addExercise} className="btn-primary text-sm px-4">Add</button>
                <button onClick={() => setShowAddExercise(false)} className="btn-ghost p-2"><X className="w-4 h-4" /></button>
              </div>
            ) : exercises.length > 0 ? (
              <button onClick={() => setShowAddExercise(true)}
                className="w-full card border-dashed border-2 flex items-center justify-center gap-2 text-sm font-semibold hover:text-blue-400 hover:border-blue-500/30 hover:bg-blue-500/5 py-3 mt-3 transition-all"
                style={{ borderColor: "var(--border)", color: "var(--text-3)" }}>
                <Plus className="w-4 h-4" /> Add exercise
              </button>
            ) : null}
          </div>

          {/* ── CARDIO SECTION ── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                <Footprints className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <h2 className="text-sm font-black uppercase tracking-wider" style={{ color: "var(--text-2)" }}>Cardio</h2>
              {totalCardioCals > 0 && (
                <span className="ml-auto flex items-center gap-1 text-xs font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full">
                  <Flame className="w-3 h-3" /> {totalCardioCals} kcal
                </span>
              )}
            </div>

            {cardioLogs.length === 0 && !showAddCardio && (
              <div className="card border-2 border-dashed border-emerald-100 dark:border-emerald-900/40 bg-gradient-to-br from-emerald-50/50 to-teal-50/30 dark:from-emerald-950/20 dark:to-teal-950/10 text-center py-6 animate-fade-in">
                <p className="font-bold text-sm" style={{ color: "var(--text-2)" }}>No cardio logged yet</p>
                <p className="text-xs mt-0.5 mb-3" style={{ color: "var(--text-3)" }}>Walking, cycling, running — track it all</p>
                <button onClick={() => setShowAddCardio(true)}
                  className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-400 active:scale-[0.97] transition-all">
                  <Plus className="w-3.5 h-3.5" /> Add cardio
                </button>
              </div>
            )}

            <div className="space-y-2">
              {cardioLogs.map((c) => (
                <CardioCard key={c.id} log={c} onRemove={() => removeCardioLog(c.id)} />
              ))}
            </div>

            {!showAddCardio && cardioLogs.length > 0 && (
              <button onClick={() => setShowAddCardio(true)}
                className="w-full card border-dashed border-2 flex items-center justify-center gap-2 text-sm font-semibold hover:text-emerald-400 hover:border-emerald-500/30 hover:bg-emerald-500/5 py-3 mt-3 transition-all"
                style={{ borderColor: "var(--border)", color: "var(--text-3)" }}>
                <Plus className="w-4 h-4" /> Add cardio
              </button>
            )}

            {showAddCardio && (
              <AddCardioForm
                bodyWeightKg={bwKg}
                onAdd={addCardioLog}
                onCancel={() => setShowAddCardio(false)}
              />
            )}
          </div>

          {/* Actions */}
          {hasAnything && (
            <div className="flex gap-3 pt-1">
              <button onClick={handleSummarize} disabled={summarizing}
                className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold px-4 py-3 rounded-xl border transition-all active:scale-[0.97] disabled:opacity-60"
                style={{ background: "var(--surface-2)", borderColor: "rgba(99,102,241,0.3)", color: "var(--text-1)" }}>
                {summarizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-indigo-400" />}
                {summarizing ? "Analyzing..." : "AI Summary"}
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 btn-primary flex items-center justify-center gap-2 text-sm py-3">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? "Saving..." : "Save Workout"}
              </button>
            </div>
          )}

          {/* AI Summary */}
          {showSummary && summaryResult && (
            <div className="card border-none bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 dark:from-indigo-950/40 dark:via-purple-950/40 dark:to-blue-950/40 animate-slide-up">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-bold text-sm" style={{ color: "var(--text-1)" }}>Coach Report</span>
                </div>
                <div className="flex items-center gap-2">
                  {caloriesBurned && (
                    <div className="flex items-center gap-1.5 bg-orange-100 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 px-3 py-1.5 rounded-full border border-orange-200 dark:border-orange-500/20">
                      <Flame className="w-3.5 h-3.5" />
                      <span className="text-xs font-black">{caloriesBurned} kcal</span>
                    </div>
                  )}
                  <button onClick={() => setShowSummary(false)} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="rounded-xl p-4" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                <MarkdownText text={summaryResult} />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {pastSessions.length === 0 ? (
            <div className="text-center py-16 card">
              <History className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-3)" }} />
              <p className="font-bold" style={{ color: "var(--text-2)" }}>No workouts logged yet</p>
              <p className="text-sm mt-1" style={{ color: "var(--text-3)" }}>Your history will appear here</p>
            </div>
          ) : pastSessions.map((s) => <PastWorkoutCard key={s.id} session={s} />)}
        </div>
      )}

      {/* Body Weight Modal */}
      {showBodyWeightModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pt-4 pb-24 sm:p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowBodyWeightModal(false)} />
          <div className="relative rounded-2xl shadow-2xl w-full max-w-sm p-5 animate-slide-up max-h-[80dvh] overflow-y-auto"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)", boxShadow: "0 24px 80px rgba(0,0,0,0.4)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold" style={{ color: "var(--text-1)" }}>Log Body Weight</h3>
              <button onClick={() => setShowBodyWeightModal(false)} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Weight (kg)</label>
                <input autoFocus type="number" step="0.1" className="input text-lg font-bold text-center" placeholder="75.0"
                  value={newBodyWeight} onChange={(e) => setNewBodyWeight(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogBodyWeight()} />
              </div>
              {bodyWeightEntries.slice(0, 3).length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>Recent</p>
                  {bodyWeightEntries.slice(0, 3).map((e) => (
                    <div key={e.id} className="flex justify-between items-center text-sm px-3 py-2 rounded-xl"
                      style={{ background: "var(--surface-0)", border: "1px solid var(--border-subtle)" }}>
                      <span style={{ color: "var(--text-2)" }}>{formatDate(e.date)}</span>
                      <span className="font-bold" style={{ color: "var(--text-1)" }}>{e.weightKg} kg</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={() => setShowBodyWeightModal(false)} className="btn-secondary flex-1 text-sm">Cancel</button>
                <button onClick={handleLogBodyWeight} disabled={!newBodyWeight} className="btn-primary flex-1 text-sm">Log</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Add Cardio Form ────────────────────────────────────────────────────────────
function AddCardioForm({ bodyWeightKg, onAdd, onCancel }: {
  bodyWeightKg: number;
  onAdd: (log: Omit<CardioLog, "id">) => void;
  onCancel: () => void;
}) {
  const [activity, setActivity] = useState<CardioActivity>("walking");
  const [duration, setDuration] = useState("");
  const [distance, setDistance] = useState("");

  const meta = CARDIO_META[activity];
  const durationNum = parseFloat(duration) || 0;
  const estCals = durationNum > 0 ? calcCardioCals(activity, durationNum, bodyWeightKg) : 0;

  const handleAdd = () => {
    if (!duration || durationNum <= 0) return;
    onAdd({
      activity,
      durationMinutes: durationNum,
      distanceKm: distance ? parseFloat(distance) : undefined,
      caloriesBurned: estCals,
    });
  };

  return (
    <div className="card mt-3 animate-slide-up space-y-4" style={{ borderColor: "rgba(16,185,129,0.2)" }}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold" style={{ color: "var(--text-1)" }}>Add Cardio Activity</p>
        <button onClick={onCancel} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
      </div>

      {/* Activity picker */}
      <div>
        <label className="label">Activity</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {(Object.keys(CARDIO_META) as CardioActivity[]).map((act) => {
            const m = CARDIO_META[act];
            const Icon = m.icon;
            const isSelected = activity === act;
            return (
              <button key={act} onClick={() => setActivity(act)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all",
                  isSelected
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                    : "hover:bg-white/5"
                )}
                style={isSelected ? undefined : { borderColor: "var(--border)", color: "var(--text-2)" }}>
                <span className={cn("w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0", m.color.split(" ")[1])}>
                  <Icon className={cn("w-3.5 h-3.5", m.color.split(" ")[0])} />
                </span>
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Duration + Distance */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label flex items-center gap-1"><Timer className="w-3 h-3" /> Duration (min)</label>
          <input type="number" inputMode="numeric" min={1} placeholder="30" className="input text-sm font-bold"
            value={duration} onChange={(e) => setDuration(e.target.value)} />
        </div>
        <div>
          <label className="label flex items-center gap-1"><MapPin className="w-3 h-3" /> Distance ({meta.unit})</label>
          <input type="number" inputMode="decimal" step="0.1" min={0} placeholder="optional" className="input text-sm font-bold"
            value={distance} onChange={(e) => setDistance(e.target.value)} />
        </div>
      </div>

      {/* Calorie preview */}
      {estCals > 0 && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20">
          <Flame className="w-4 h-4 text-orange-400 flex-shrink-0" />
          <div>
            <p className="text-xs font-black text-orange-400">{estCals} kcal estimated</p>
            <p className="text-[10px] text-orange-400/70">Based on {bodyWeightKg} kg body weight · MET {meta.met}</p>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={onCancel} className="btn-secondary flex-1 text-sm">Cancel</button>
        <button onClick={handleAdd} disabled={!duration || durationNum <= 0}
          className="flex-1 text-sm font-semibold px-4 py-2.5 rounded-xl bg-emerald-500 text-white hover:bg-emerald-400 active:scale-[0.97] transition-all disabled:opacity-40">
          Add Cardio
        </button>
      </div>
    </div>
  );
}

// ── CardioCard ─────────────────────────────────────────────────────────────────
function CardioCard({ log, onRemove }: { log: CardioLog; onRemove: () => void }) {
  const meta = CARDIO_META[log.activity];
  const Icon = meta.icon;
  const [iconBg, iconText] = meta.color.split(" ");
  return (
    <div className="card flex items-center gap-3 animate-slide-up" style={{ borderLeftWidth: "3px", borderLeftColor: "#10B981" }}>
      <span className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0", iconText.replace("text-", "bg-").replace("-400", "-500/10"))}>
        <Icon className={cn("w-4.5 h-4.5", iconText)} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold" style={{ color: "var(--text-1)" }}>{meta.label}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-xs font-semibold flex items-center gap-1" style={{ color: "var(--text-3)" }}>
            <Timer className="w-3 h-3" /> {log.durationMinutes} min
          </span>
          {log.distanceKm != null && (
            <span className="text-xs font-semibold flex items-center gap-1" style={{ color: "var(--text-3)" }}>
              <MapPin className="w-3 h-3" /> {log.distanceKm} {meta.unit}
            </span>
          )}
          {log.caloriesBurned != null && log.caloriesBurned > 0 && (
            <span className="text-xs font-bold flex items-center gap-1 text-orange-400">
              <Flame className="w-3 h-3" /> {log.caloriesBurned} kcal
            </span>
          )}
        </div>
      </div>
      <button onClick={onRemove} className="btn-ghost p-1.5 text-gray-400 hover:text-red-400 flex-shrink-0">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ── ExerciseCard ───────────────────────────────────────────────────────────────
function ExerciseCard({ exercise, onAddSet, onRemoveSet, onUpdateSet, onRemove }: {
  exercise: ExerciseLog; onAddSet: () => void; onRemoveSet: (id: string) => void;
  onUpdateSet: (id: string, u: Partial<SetLog>) => void; onRemove: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="card animate-slide-up" style={{ borderLeftWidth: "3px", borderLeftColor: "#3B82F6" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-500/10 rounded-lg flex items-center justify-center">
            <Dumbbell className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <h3 className="font-bold text-sm" style={{ color: "var(--text-1)" }}>{exercise.name}</h3>
          <span className="badge bg-blue-500/10 text-blue-400 text-xs border border-blue-500/20">{exercise.sets.length} sets</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setCollapsed(!collapsed)} className="btn-ghost p-1.5">
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          <button onClick={onRemove} className="btn-ghost p-1.5 hover:text-red-400">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {!collapsed && (
        <>
          <div className="flex items-center gap-2 mb-2 px-1">
            <span className="w-6 text-center text-[10px] font-bold uppercase tracking-wide flex-shrink-0" style={{ color: "var(--text-3)" }}>#</span>
            <span className="flex-1 text-[10px] font-bold uppercase tracking-wide text-center" style={{ color: "var(--text-3)" }}>Reps</span>
            <span className="flex-[1.4] text-[10px] font-bold uppercase tracking-wide text-center" style={{ color: "var(--text-3)" }}>Weight</span>
            <span className="flex-1 text-[10px] font-bold uppercase tracking-wide text-center" style={{ color: "var(--text-3)" }}>Unit</span>
            <span className="w-8 flex-shrink-0" />
          </div>
          <div className="space-y-2">
            {exercise.sets.map((s, i) => (
              <SetRow key={s.id} set={s} index={i} onUpdate={(u) => onUpdateSet(s.id, u)} onRemove={() => onRemoveSet(s.id)} />
            ))}
          </div>
          <button onClick={onAddSet}
            className="w-full mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold hover:text-blue-400 py-2.5 rounded-xl border border-dashed hover:border-blue-500/30 hover:bg-blue-500/5 transition-all"
            style={{ color: "var(--text-3)", borderColor: "var(--border)" }}>
            <Plus className="w-3.5 h-3.5" /> Add set
          </button>
        </>
      )}
    </div>
  );
}

// ── SetRow ─────────────────────────────────────────────────────────────────────
function SetRow({ set, index, onUpdate, onRemove }: { set: SetLog; index: number; onUpdate: (u: Partial<SetLog>) => void; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-black w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ color: "var(--text-3)", background: "var(--surface-2)" }}>{index + 1}</span>
      <input type="number" inputMode="numeric" min={0} placeholder="0" value={set.reps || ""}
        onChange={(e) => onUpdate({ reps: Number(e.target.value) })}
        className="flex-1 input text-sm text-center py-2.5 px-1 font-bold min-w-0" />
      <input type="number" inputMode="decimal" min={0} step={0.5} placeholder="—"
        value={set.unit === "bodyweight" ? "" : (set.weight || "")}
        disabled={set.unit === "bodyweight"}
        onChange={(e) => onUpdate({ weight: Number(e.target.value) })}
        className="flex-[1.4] input text-sm text-center py-2.5 px-1 font-bold disabled:opacity-40 min-w-0" />
      <select value={set.unit} onChange={(e) => onUpdate({ unit: e.target.value as WeightUnit })}
        className="flex-1 input text-xs py-2.5 px-1 font-semibold min-w-0">
        <option value="kg">kg</option>
        <option value="lbs">lbs</option>
        <option value="bodyweight">BW</option>
      </select>
      <button onClick={onRemove}
        className="w-8 h-8 flex items-center justify-center rounded-lg hover:text-red-400 hover:bg-red-500/10 active:scale-90 transition-all flex-shrink-0"
        style={{ color: "var(--text-3)" }}>
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── PastWorkoutCard ────────────────────────────────────────────────────────────
function PastWorkoutCard({ session: s }: { session: WorkoutSession }) {
  const [expanded, setExpanded] = useState(false);
  const totalSets = s.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  const totalCardioCals = (s.cardioLogs ?? []).reduce((sum, c) => sum + (c.caloriesBurned ?? 0), 0);
  return (
    <div className="card transition-all duration-200">
      <div className="flex items-start justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <Dumbbell className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="font-bold text-sm" style={{ color: "var(--text-1)" }}>{formatDate(s.date)}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {s.exercises.length > 0 && <span className="badge text-xs font-bold" style={{ background: "var(--surface-2)", color: "var(--text-2)", border: "1px solid var(--border)" }}>{s.exercises.length} exercises · {totalSets} sets</span>}
              {(s.cardioLogs ?? []).length > 0 && <span className="badge text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{s.cardioLogs!.length} cardio</span>}
              {s.durationMinutes > 0 && <span className="badge text-xs font-bold" style={{ background: "var(--surface-2)", color: "var(--text-2)", border: "1px solid var(--border)" }}>{s.durationMinutes} min</span>}
              {totalCardioCals > 0 && <span className="badge text-xs font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center gap-1"><Flame className="w-3 h-3" />{totalCardioCals} kcal</span>}
            </div>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-3)" }} /> : <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-3)" }} />}
      </div>
      {expanded && (
        <div className="mt-4 space-y-3 pt-4 animate-fade-in" style={{ borderTop: "1px solid var(--border-subtle)" }}>
          {/* Strength */}
          {s.exercises.map((ex) => (
            <div key={ex.id}>
              <p className="text-xs font-bold mb-2" style={{ color: "var(--text-2)" }}>{ex.name}</p>
              <div className="flex flex-wrap gap-1.5">
                {ex.sets.map((set, i) => (
                  <span key={set.id} className="badge bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20">
                    {i + 1}: {set.reps}r {set.unit === "bodyweight" ? "BW" : `× ${set.weight}${set.unit}`}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {/* Cardio */}
          {(s.cardioLogs ?? []).length > 0 && (
            <div>
              <p className="text-xs font-bold mb-2 flex items-center gap-1.5" style={{ color: "var(--text-2)" }}>
                <Footprints className="w-3 h-3 text-emerald-400" /> Cardio
              </p>
              <div className="flex flex-wrap gap-1.5">
                {s.cardioLogs!.map((c) => {
                  const meta = CARDIO_META[c.activity];
                  return (
                    <span key={c.id} className="badge bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 flex items-center gap-1">
                      {meta.label} · {c.durationMinutes}min
                      {c.distanceKm ? ` · ${c.distanceKm}${meta.unit}` : ""}
                      {c.caloriesBurned ? ` · ${c.caloriesBurned}kcal` : ""}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
          {s.summary && (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 rounded-xl p-4 border border-indigo-100 dark:border-indigo-900/40">
              <p className="text-xs font-bold mb-3 flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                <Sparkles className="w-3.5 h-3.5" /> Coach Report
              </p>
              <MarkdownText text={s.summary} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function newSet(): SetLog {
  return { id: generateId(), reps: 0, unit: "kg", completed: false };
}
