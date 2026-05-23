"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Plus, Dumbbell, Trash2, ChevronDown, ChevronUp, Sparkles, Scale, Clock, Save, History, X, Loader2, Flame, Activity } from "lucide-react";
import { cn, generateId, todayString, formatDate } from "@/lib/utils";
import { saveWorkoutSession, getWorkoutSessions, updateWorkoutSession, getBodyWeightEntries, logBodyWeight } from "@/lib/firestore";
import { useToast } from "@/components/ui/Toast";
import { MarkdownText } from "@/components/ui/MarkdownText";
import type { WorkoutSession, ExerciseLog, SetLog, WeightUnit, BodyWeightEntry } from "@/types";

export default function WorkoutPage() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id ?? session?.user?.email ?? "";
  const { toast } = useToast();

  const [view, setView] = useState<"log" | "history">("log");
  const [pastSessions, setPastSessions] = useState<WorkoutSession[]>([]);
  const [bodyWeightEntries, setBodyWeightEntries] = useState<BodyWeightEntry[]>([]);

  const [exercises, setExercises] = useState<ExerciseLog[]>([]);
  const [duration, setDuration] = useState<number>(0);
  const [bodyWeight, setBodyWeight] = useState<string>("");
  const [date, setDate] = useState(todayString());
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState("");
  const [showBodyWeightModal, setShowBodyWeightModal] = useState(false);
  const [newBodyWeight, setNewBodyWeight] = useState("");
  const [summarizing, setSummarizing] = useState(false);
  const [summaryResult, setSummaryResult] = useState<string>("");
  const [caloriesBurned, setCaloriesBurned] = useState<number | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSessionId, setSavedSessionId] = useState<string>("");

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

  const addExercise = () => {
    if (!newExerciseName.trim()) return;
    setExercises((prev) => [...prev, { id: generateId(), name: newExerciseName.trim(), sets: [newSet()] }]);
    setNewExerciseName(""); setShowAddExercise(false);
  };

  const removeExercise = (id: string) => setExercises((prev) => prev.filter((e) => e.id !== id));
  const addSet = (exId: string) => setExercises((prev) => prev.map((ex) => ex.id === exId ? { ...ex, sets: [...ex.sets, newSet()] } : ex));
  const removeSet = (exId: string, setId: string) => setExercises((prev) => prev.map((ex) => ex.id === exId ? { ...ex, sets: ex.sets.filter((s) => s.id !== setId) } : ex));
  const updateSet = (exId: string, setId: string, updates: Partial<SetLog>) => setExercises((prev) => prev.map((ex) => ex.id === exId ? { ...ex, sets: ex.sets.map((s) => s.id === setId ? { ...s, ...updates } : s) } : ex));

  const handleSummarize = async () => {
    if (exercises.length === 0) return;
    setSummarizing(true);
    try {
      const res = await fetch("/api/summarize-workout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exercises, durationMinutes: duration, bodyWeightKg: bodyWeight ? parseFloat(bodyWeight) : null }),
      });
      const data = await res.json();
      if (data.summary) { setSummaryResult(data.summary); setCaloriesBurned(data.caloriesBurned ?? null); setShowSummary(true); toast("AI summary generated!", "success"); }
      else toast("Couldn't generate summary", "error");
    } catch { toast("Something went wrong", "error"); }
    finally { setSummarizing(false); }
  };

  const handleSave = async () => {
    if (exercises.length === 0) return;
    setSaving(true);
    try {
      const session_data: Omit<WorkoutSession, "id"> = { userId, date, exercises, durationMinutes: duration, createdAt: Date.now() };
      if (bodyWeight) session_data.bodyWeightKg = parseFloat(bodyWeight);
      if (summaryResult) session_data.summary = summaryResult;
      const saved = await saveWorkoutSession(session_data);
      setSavedSessionId(saved.id);
      setPastSessions((prev) => [saved, ...prev]);
      setExercises([]); setDuration(0); setSummaryResult(""); setCaloriesBurned(null); setShowSummary(false);
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
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Workout</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5 font-medium">Log and track your training</p>
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
            className={cn("px-5 py-2 rounded-lg text-sm font-bold capitalize transition-all duration-150")}
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

          {/* Workout stats bar */}
          {exercises.length > 0 && (
            <div className="grid grid-cols-3 gap-3 animate-slide-down">
              {[
                { label: "Exercises", val: exercises.length, icon: Dumbbell, color: "text-blue-600 bg-blue-50" },
                { label: "Sets", val: totalSets, icon: Activity, color: "text-violet-600 bg-violet-50" },
                { label: "Total Reps", val: totalReps, icon: Flame, color: "text-orange-600 bg-orange-50" },
              ].map((s) => (
                <div key={s.label} className="card text-center py-3">
                  <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-1", s.color)}>
                    <s.icon className="w-4 h-4" />
                  </div>
                  <p className="text-xl font-black text-gray-900 dark:text-white">{s.val}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Exercises */}
          {exercises.map((ex) => (
            <ExerciseCard key={ex.id} exercise={ex}
              onAddSet={() => addSet(ex.id)}
              onRemoveSet={(sId) => removeSet(ex.id, sId)}
              onUpdateSet={(sId, u) => updateSet(ex.id, sId, u)}
              onRemove={() => removeExercise(ex.id)} />
          ))}

          {/* Empty state */}
          {exercises.length === 0 && !showAddExercise && (
            <div className="card border-2 border-dashed border-blue-100 dark:border-blue-900/40 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 dark:from-blue-950/20 dark:to-indigo-950/10 text-center py-8 animate-fade-in">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-200/40 dark:shadow-blue-900/40">
                <Dumbbell className="w-7 h-7 text-white" />
              </div>
              <p className="font-black text-gray-800 dark:text-white text-base">Start your session</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 mb-4">Add your first exercise to begin logging</p>
              <button onClick={() => setShowAddExercise(true)}
                className="inline-flex items-center gap-2 btn-primary text-sm px-5 py-2.5">
                <Plus className="w-4 h-4" /> Add exercise
              </button>
            </div>
          )}

          {/* Add exercise */}
          {showAddExercise ? (
            <div className="card flex items-center gap-2">
              <input autoFocus className="input flex-1 text-sm" placeholder="Exercise name (e.g. Bench Press)"
                value={newExerciseName} onChange={(e) => setNewExerciseName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addExercise()} />
              <button onClick={addExercise} className="btn-primary text-sm px-4">Add</button>
              <button onClick={() => setShowAddExercise(false)} className="btn-ghost p-2"><X className="w-4 h-4" /></button>
            </div>
          ) : (
            <button onClick={() => setShowAddExercise(true)}
              className="w-full card border-dashed border-2 flex items-center justify-center gap-2 text-sm font-semibold hover:text-blue-400 hover:border-blue-500/30 hover:bg-blue-500/5 py-4 transition-all"
              style={{ borderColor: "var(--border)", color: "var(--text-3)" }}>
              <Plus className="w-4 h-4" /> Add exercise
            </button>
          )}

          {/* Actions */}
          {exercises.length > 0 && (
            <div className="flex gap-3 pt-1">
              <button onClick={handleSummarize} disabled={summarizing}
                className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold px-4 py-3 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 active:scale-[0.97] transition-all disabled:opacity-60">
                {summarizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {summarizing ? "Analyzing..." : "AI Summary"}
              </button>
              <button onClick={handleSave} disabled={saving || exercises.length === 0}
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
                  <span className="font-bold text-gray-900 dark:text-white text-sm">Coach Report</span>
                </div>
                <div className="flex items-center gap-2">
                  {caloriesBurned && (
                    <div className="flex items-center gap-1.5 bg-orange-100 text-orange-700 px-3 py-1.5 rounded-full border border-orange-200">
                      <Flame className="w-3.5 h-3.5" />
                      <span className="text-xs font-black">{caloriesBurned} kcal burned</span>
                    </div>
                  )}
                  <button onClick={() => setShowSummary(false)} className="btn-ghost p-1.5 text-gray-400">
                    <X className="w-4 h-4" />
                  </button>
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
              <History className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="font-bold text-gray-500">No workouts logged yet</p>
              <p className="text-gray-400 text-sm mt-1">Your history will appear here</p>
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
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Recent</p>
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

function ExerciseCard({ exercise, onAddSet, onRemoveSet, onUpdateSet, onRemove }: {
  exercise: ExerciseLog; onAddSet: () => void; onRemoveSet: (id: string) => void; onUpdateSet: (id: string, u: Partial<SetLog>) => void; onRemove: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="card animate-slide-up" style={{ borderLeftWidth: "3px", borderLeftColor: "#3B82F6" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
            <Dumbbell className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <h3 className="font-bold text-gray-900 dark:text-white text-sm">{exercise.name}</h3>
          <span className="badge bg-blue-100 text-blue-700 text-xs">{exercise.sets.length} sets</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setCollapsed(!collapsed)} className="btn-ghost p-1.5">
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          <button onClick={onRemove} className="btn-ghost p-1.5 text-gray-400 hover:text-red-500">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {!collapsed && (
        <>
          <div className="flex items-center gap-2 mb-2 px-1">
            <span className="w-6 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wide flex-shrink-0">#</span>
            <span className="flex-1 text-[10px] font-bold text-gray-400 uppercase tracking-wide text-center">Reps</span>
            <span className="flex-[1.4] text-[10px] font-bold text-gray-400 uppercase tracking-wide text-center">Weight</span>
            <span className="flex-1 text-[10px] font-bold text-gray-400 uppercase tracking-wide text-center">Unit</span>
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

function SetRow({ set, index, onUpdate, onRemove }: { set: SetLog; index: number; onUpdate: (u: Partial<SetLog>) => void; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-2">
      {/* Set number */}
      <span className="text-xs font-black w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ color: "var(--text-3)", background: "var(--surface-2)" }}>{index + 1}</span>

      {/* Reps */}
      <input type="number" inputMode="numeric" min={0} placeholder="0" value={set.reps || ""}
        onChange={(e) => onUpdate({ reps: Number(e.target.value) })}
        className="flex-1 input text-sm text-center py-2.5 px-1 font-bold min-w-0" />

      {/* Weight */}
      <input type="number" inputMode="decimal" min={0} step={0.5} placeholder="—"
        value={set.unit === "bodyweight" ? "" : (set.weight || "")}
        disabled={set.unit === "bodyweight"}
        onChange={(e) => onUpdate({ weight: Number(e.target.value) })}
        className="flex-[1.4] input text-sm text-center py-2.5 px-1 font-bold disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-300 min-w-0" />

      {/* Unit */}
      <select value={set.unit} onChange={(e) => onUpdate({ unit: e.target.value as WeightUnit })}
        className="flex-1 input text-xs py-2.5 px-1 font-semibold min-w-0">
        <option value="kg">kg</option>
        <option value="lbs">lbs</option>
        <option value="bodyweight">BW</option>
      </select>

      {/* Delete */}
      <button onClick={onRemove}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 active:scale-90 transition-all flex-shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

function PastWorkoutCard({ session: s }: { session: WorkoutSession }) {
  const [expanded, setExpanded] = useState(false);
  const totalSets = s.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  return (
    <div className="card transition-all duration-200 hover:shadow-md">
      <div className="flex items-start justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <Dumbbell className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="font-bold text-sm" style={{ color: "var(--text-1)" }}>{formatDate(s.date)}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="badge text-xs font-bold" style={{ background: "var(--surface-2)", color: "var(--text-2)", border: "1px solid var(--border)" }}>{s.exercises.length} exercises</span>
              <span className="badge text-xs font-bold" style={{ background: "var(--surface-2)", color: "var(--text-2)", border: "1px solid var(--border)" }}>{totalSets} sets</span>
              {s.durationMinutes > 0 && <span className="badge bg-blue-100 text-blue-700">{s.durationMinutes} min</span>}
              {s.bodyWeightKg && <span className="badge bg-emerald-100 text-emerald-700">{s.bodyWeightKg} kg</span>}
            </div>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
      </div>
      {expanded && (
        <div className="mt-4 space-y-3 pt-4 animate-fade-in" style={{ borderTop: "1px solid var(--border-subtle)" }}>
          {s.exercises.map((ex) => (
            <div key={ex.id}>
              <p className="text-xs font-bold mb-2" style={{ color: "var(--text-2)" }}>{ex.name}</p>
              <div className="flex flex-wrap gap-1.5">
                {ex.sets.map((set, i) => (
                  <span key={set.id} className="badge bg-blue-50 text-blue-700 font-bold">
                    {i + 1}: {set.reps}r {set.unit === "bodyweight" ? "BW" : `× ${set.weight}${set.unit}`}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {s.summary && (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 rounded-xl p-4 border border-indigo-100 dark:border-indigo-900">
              <p className="text-xs font-bold text-indigo-700 dark:text-indigo-400 mb-3 flex items-center gap-1.5">
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
