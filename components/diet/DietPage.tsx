"use client";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  Plus, Utensils, Camera, Trash2, X, Loader2, Settings,
  Flame, ChevronLeft, ChevronRight, Sparkles, CheckCircle2
} from "lucide-react";
import { cn, todayString, formatDate } from "@/lib/utils";
import { getMeals, addMeal, deleteMeal, getMacroGoals, saveMacroGoals } from "@/lib/firestore";
import { useToast } from "@/components/ui/Toast";
import type { MealEntry, MealMacros, MacroGoals } from "@/types";

const defaultGoals: MacroGoals = { calories: 2000, proteinG: 150, carbsG: 200, fatG: 65 };

// ── SVG Ring ─────────────────────────────────────────────────────────────────
function MacroRing({
  value, goal, color, size = 72, stroke = 6,
}: {
  value: number; goal: number; color: string; size?: number; stroke?: number;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(value / goal, 1);
  const offset = circ * (1 - pct);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="macro-ring">
      <circle cx={size / 2} cy={size / 2} r={r} className="macro-ring-track" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        className="macro-ring-fill"
        strokeWidth={stroke}
        stroke={color}
        strokeDasharray={circ}
        strokeDashoffset={offset}
      />
    </svg>
  );
}

// ── Calorie Big Ring ──────────────────────────────────────────────────────────
function CalorieRing({ value, goal }: { value: number; goal: number }) {
  const size = 140;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(value / goal, 1);
  const offset = circ * (1 - pct);
  const remaining = Math.max(goal - value, 0);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="macro-ring absolute">
        <circle cx={size / 2} cy={size / 2} r={r} className="macro-ring-track" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          className="macro-ring-fill"
          strokeWidth={stroke}
          stroke="#F59E0B"
          strokeDasharray={circ}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="text-center relative z-10">
        <p className="text-2xl font-black text-gray-900 dark:text-white leading-none">{Math.round(remaining)}</p>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">remaining</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{Math.round(value)} / {goal}</p>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function DietPage() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id ?? session?.user?.email ?? "";
  const { toast } = useToast();

  const [date, setDate] = useState(todayString());
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [goals, setGoals] = useState<MacroGoals>(defaultGoals);
  const [loading, setLoading] = useState(false);

  const [showAddMeal, setShowAddMeal] = useState(false);
  const [showGoals, setShowGoals] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    if (!userId) return;
    getMacroGoals(userId).then((g) => { if (g) setGoals(g); });
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    getMeals(userId, date).then(setMeals).finally(() => setLoading(false));
  }, [userId, date]);

  const totals: MealMacros = meals.reduce(
    (acc, m) => ({
      calories: acc.calories + m.macros.calories,
      proteinG: acc.proteinG + m.macros.proteinG,
      carbsG: acc.carbsG + m.macros.carbsG,
      fatG: acc.fatG + m.macros.fatG,
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }
  );

  const handleAddMeal = async (meal: Omit<MealEntry, "id">) => {
    const created = await addMeal(meal);
    setMeals((prev) => [...prev, created]);
    setShowAddMeal(false);
    setShowScanner(false);
    toast("Meal logged! 🍽️", "success");
  };

  const handleDeleteMeal = async (id: string) => {
    await deleteMeal(id);
    setMeals((prev) => prev.filter((m) => m.id !== id));
    toast("Meal removed", "info");
  };

  const handleSaveGoals = async (g: MacroGoals) => {
    await saveMacroGoals(userId, g);
    setGoals(g);
    setShowGoals(false);
    toast("Goals updated!", "success");
  };

  const changeDate = (delta: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    setDate(d.toISOString().split("T")[0]);
  };

  const isToday = date === todayString();

  return (
    <div className="animate-fade-in">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Diet</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5 font-medium">Fuel your performance</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowGoals(true)} className="btn-secondary text-sm flex items-center gap-1.5">
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Goals</span>
          </button>
          <button onClick={() => setShowAddMeal(true)} className="btn-primary text-sm flex items-center gap-1.5">
            <Plus className="w-4 h-4" />
            <span>Log meal</span>
          </button>
        </div>
      </div>

      {/* ── Date navigator ── */}
      <div className="flex items-center justify-between card mb-5">
        <button onClick={() => changeDate(-1)} className="btn-ghost p-2">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="text-center">
          <p className="font-bold text-gray-900 dark:text-white text-sm">{formatDate(date)}</p>
          {isToday && (
            <span className="text-xs font-bold text-emerald-500">Today</span>
          )}
        </div>
        <button onClick={() => changeDate(1)} disabled={isToday} className="btn-ghost p-2 disabled:opacity-30">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* ── Macro Dashboard ── */}
      <div className="card mb-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-gray-900 dark:text-white text-sm">Daily Nutrition</h3>
          <span className="text-xs font-semibold text-gray-400 bg-gray-50 dark:bg-gray-700 px-2.5 py-1 rounded-full">
            {meals.length} meal{meals.length !== 1 ? "s" : ""} logged
          </span>
        </div>

        {/* Calorie ring + macros — stacked on mobile, side-by-side on sm+ */}
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-5">
          <CalorieRing value={totals.calories} goal={goals.calories} />

          <div className="w-full grid grid-cols-3 gap-3 sm:flex-1">
            {/* Protein */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="relative">
                <MacroRing value={totals.proteinG} goal={goals.proteinG} color="#3B82F6" size={68} stroke={6} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] font-black text-blue-500">{Math.round((totals.proteinG / goals.proteinG) * 100)}%</span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-black text-gray-900 dark:text-white">{Math.round(totals.proteinG)}g</p>
                <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400">Protein</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500">/ {goals.proteinG}g</p>
              </div>
            </div>

            {/* Carbs */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="relative">
                <MacroRing value={totals.carbsG} goal={goals.carbsG} color="#10B981" size={68} stroke={6} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] font-black text-emerald-500">{Math.round((totals.carbsG / goals.carbsG) * 100)}%</span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-black text-gray-900 dark:text-white">{Math.round(totals.carbsG)}g</p>
                <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400">Carbs</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500">/ {goals.carbsG}g</p>
              </div>
            </div>

            {/* Fat */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="relative">
                <MacroRing value={totals.fatG} goal={goals.fatG} color="#F43F5E" size={68} stroke={6} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] font-black text-rose-500">{Math.round((totals.fatG / goals.fatG) * 100)}%</span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-black text-gray-900 dark:text-white">{Math.round(totals.fatG)}g</p>
                <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400">Fat</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500">/ {goals.fatG}g</p>
              </div>
            </div>
          </div>
        </div>

        {/* Calorie label row */}
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.min((totals.calories / goals.calories) * 100, 100)}%`, backgroundColor: "#F59E0B" }}
            />
          </div>
          <span className="text-xs font-bold text-amber-500">
            {Math.round(totals.calories)} / {goals.calories} kcal
          </span>
        </div>
      </div>

      {/* ── Scan CTA ── */}
      <button
        onClick={() => setShowScanner(true)}
        className="w-full mb-5 relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 p-px"
      >
        <div className="bg-white dark:bg-gray-800 rounded-[calc(1rem-1px)] px-4 py-3.5 flex items-center justify-center gap-2.5 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30 transition-all">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-gray-900 dark:text-white">Scan meal with AI</p>
            <p className="text-xs text-gray-400">Take a photo — GPT-4o estimates macros</p>
          </div>
          <Camera className="w-4 h-4 text-emerald-500 ml-auto" />
        </div>
      </button>

      {/* ── Meals list ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">
            Meals <span className="text-gray-400 font-semibold">({meals.length})</span>
          </h3>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-20 skeleton" />)}
          </div>
        ) : meals.length === 0 ? (
          <div className="text-center py-12 card border-dashed border-2 border-gray-200">
            <Utensils className="w-10 h-10 text-gray-200 mx-auto mb-2" />
            <p className="text-gray-400 text-sm font-medium">No meals logged yet</p>
            <p className="text-gray-300 text-xs mt-1">Log a meal or scan a photo</p>
            <button onClick={() => setShowAddMeal(true)} className="mt-3 text-sm font-semibold text-emerald-500 hover:text-emerald-700 transition-colors">
              + Add meal
            </button>
          </div>
        ) : (
          <div className="space-y-2 stagger">
            {meals.map((m) => (
              <MealCard key={m.id} meal={m} onDelete={() => handleDeleteMeal(m.id)} />
            ))}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {showAddMeal && (
        <AddMealModal userId={userId} date={date} onSave={handleAddMeal} onClose={() => setShowAddMeal(false)} />
      )}
      {showScanner && (
        <MealScannerModal userId={userId} date={date} onSave={handleAddMeal} onClose={() => setShowScanner(false)} />
      )}
      {showGoals && (
        <GoalsModal goals={goals} onSave={handleSaveGoals} onClose={() => setShowGoals(false)} />
      )}
    </div>
  );
}

// ── MealCard ──────────────────────────────────────────────────────────────────
function MealCard({ meal, onDelete }: { meal: MealEntry; onDelete: () => void }) {
  const macros = [
    { label: "kcal", value: Math.round(meal.macros.calories), bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-400" },
    { label: "P", value: Math.round(meal.macros.proteinG) + "g", bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-400" },
    { label: "C", value: Math.round(meal.macros.carbsG) + "g", bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-400" },
    { label: "F", value: Math.round(meal.macros.fatG) + "g", bg: "bg-rose-100", text: "text-rose-700", dot: "bg-rose-400" },
  ];

  return (
    <div className="card flex items-center gap-3 hover:shadow-md transition-all duration-200 animate-slide-up"
      style={{ borderLeftColor: "#10B981", borderLeftWidth: "3px" }}>
      <div className="w-9 h-9 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
        <Utensils className="w-4 h-4 text-emerald-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{meal.name}</p>
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {macros.map(({ label, value, bg, text, dot }) => (
            <span key={label} className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold", bg, text)}>
              <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", dot)} />
              {value} {label}
            </span>
          ))}
        </div>
      </div>
      <button
        onClick={onDelete}
        className="p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 active:scale-90 transition-all flex-shrink-0"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── Modal wrapper ─────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-5 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── AddMealModal ──────────────────────────────────────────────────────────────
function AddMealModal({ userId, date, onSave, onClose }: {
  userId: string; date: string; onSave: (m: Omit<MealEntry, "id">) => void; onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      userId, date, name: name.trim(),
      macros: {
        calories: Number(calories) || 0,
        proteinG: Number(protein) || 0,
        carbsG: Number(carbs) || 0,
        fatG: Number(fat) || 0,
      },
      createdAt: Date.now(),
    });
  };

  return (
    <Modal title="Log a meal" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="label">Meal name *</label>
          <input autoFocus className="input" placeholder="e.g. Chicken & rice"
            value={name} onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Calories (kcal)</label>
            <input type="number" className="input text-sm" placeholder="0" value={calories} onChange={(e) => setCalories(e.target.value)} />
          </div>
          <div>
            <label className="label">Protein (g)</label>
            <input type="number" className="input text-sm" placeholder="0" value={protein} onChange={(e) => setProtein(e.target.value)} />
          </div>
          <div>
            <label className="label">Carbs (g)</label>
            <input type="number" className="input text-sm" placeholder="0" value={carbs} onChange={(e) => setCarbs(e.target.value)} />
          </div>
          <div>
            <label className="label">Fat (g)</label>
            <input type="number" className="input text-sm" placeholder="0" value={fat} onChange={(e) => setFat(e.target.value)} />
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="btn-secondary flex-1 text-sm">Cancel</button>
          <button onClick={handleSave} disabled={!name.trim()} className="btn-primary flex-1 text-sm">Log meal</button>
        </div>
      </div>
    </Modal>
  );
}

// ── MealScannerModal ──────────────────────────────────────────────────────────
function MealScannerModal({ userId, date, onSave, onClose }: {
  userId: string; date: string; onSave: (m: Omit<MealEntry, "id">) => void; onClose: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string>("");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [editedName, setEditedName] = useState("");
  const [editedMacros, setEditedMacros] = useState({ calories: "", protein: "", carbs: "", fat: "" });
  const [error, setError] = useState("");

  const handleFile = async (file: File) => {
    setError("");
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setPreview(dataUrl);
      setScanning(true);
      try {
        const base64 = dataUrl.split(",")[1];
        const mimeType = file.type;
        const res = await fetch("/api/analyze-meal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64, mimeType }),
        });
        const data = await res.json();
        if (data.error) {
          setError(data.error);
        } else {
          setResult(data);
          setEditedName(data.name || "");
          setEditedMacros({
            calories: String(data.calories || ""),
            protein: String(data.proteinG || ""),
            carbs: String(data.carbsG || ""),
            fat: String(data.fatG || ""),
          });
        }
      } catch {
        setError("Failed to analyze image. Please try again.");
      } finally {
        setScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLog = () => {
    onSave({
      userId, date, name: editedName || "Scanned meal",
      macros: {
        calories: Number(editedMacros.calories) || 0,
        proteinG: Number(editedMacros.protein) || 0,
        carbsG: Number(editedMacros.carbs) || 0,
        fatG: Number(editedMacros.fat) || 0,
      },
      createdAt: Date.now(),
    });
  };

  const confidenceColor = result?.confidence === "high"
    ? "bg-emerald-100 text-emerald-700"
    : result?.confidence === "medium"
    ? "bg-amber-100 text-amber-700"
    : "bg-red-100 text-red-700";

  return (
    <Modal title="Scan meal with AI" onClose={onClose}>
      {!preview ? (
        <div>
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center cursor-pointer hover:border-emerald-300 hover:bg-emerald-50/30 transition-all group"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
              <Camera className="w-7 h-7 text-white" />
            </div>
            <p className="text-sm font-bold text-gray-700">Tap to upload a photo</p>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG, HEIC · GPT-4o will analyze</p>
          </div>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <img src={preview} alt="meal" className="w-full h-44 object-cover rounded-xl" />
            {scanning && (
              <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center gap-2 text-white">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm font-semibold">Analyzing with GPT-4o…</span>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600 font-medium">
              {error}
            </div>
          )}

          {!scanning && result && (
            <div className="space-y-3">
              {result.confidence && (
                <div className="flex items-center gap-2">
                  <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full", confidenceColor)}>
                    {result.confidence} confidence
                  </span>
                  {result.notes && <span className="text-xs text-gray-400 truncate">{result.notes}</span>}
                </div>
              )}
              <div>
                <label className="label">Meal name</label>
                <input className="input text-sm" value={editedName} onChange={(e) => setEditedName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label">Calories (kcal)</label>
                  <input type="number" className="input text-sm" value={editedMacros.calories}
                    onChange={(e) => setEditedMacros(m => ({ ...m, calories: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Protein (g)</label>
                  <input type="number" className="input text-sm" value={editedMacros.protein}
                    onChange={(e) => setEditedMacros(m => ({ ...m, protein: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Carbs (g)</label>
                  <input type="number" className="input text-sm" value={editedMacros.carbs}
                    onChange={(e) => setEditedMacros(m => ({ ...m, carbs: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Fat (g)</label>
                  <input type="number" className="input text-sm" value={editedMacros.fat}
                    onChange={(e) => setEditedMacros(m => ({ ...m, fat: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setPreview(""); setResult(null); setError(""); }} className="btn-secondary flex-1 text-sm">
                  Retake
                </button>
                <button onClick={handleLog} className="btn-primary flex-1 text-sm flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Log meal
                </button>
              </div>
            </div>
          )}

          {!scanning && !result && !error && (
            <button onClick={() => { setPreview(""); }} className="btn-secondary w-full text-sm">Try again</button>
          )}
        </div>
      )}
    </Modal>
  );
}

// ── GoalsModal ────────────────────────────────────────────────────────────────
function GoalsModal({ goals, onSave, onClose }: {
  goals: MacroGoals; onSave: (g: MacroGoals) => void; onClose: () => void;
}) {
  const [form, setForm] = useState({
    calories: String(goals.calories),
    proteinG: String(goals.proteinG),
    carbsG: String(goals.carbsG),
    fatG: String(goals.fatG),
  });

  const handleSave = () => {
    onSave({
      calories: Number(form.calories) || 2000,
      proteinG: Number(form.proteinG) || 150,
      carbsG: Number(form.carbsG) || 200,
      fatG: Number(form.fatG) || 65,
    });
  };

  const fields = [
    { key: "calories" as const, label: "Calories", unit: "kcal", color: "text-amber-500" },
    { key: "proteinG" as const, label: "Protein", unit: "g", color: "text-blue-500" },
    { key: "carbsG" as const, label: "Carbs", unit: "g", color: "text-emerald-500" },
    { key: "fatG" as const, label: "Fat", unit: "g", color: "text-rose-500" },
  ];

  return (
    <Modal title="Daily macro goals" onClose={onClose}>
      <p className="text-xs text-gray-400 -mt-2 mb-4 font-medium">Set your daily nutrition targets</p>
      <div className="space-y-3 mb-4">
        {fields.map(({ key, label, unit, color }) => (
          <div key={key} className="flex items-center gap-3">
            <label className={cn("text-xs font-bold w-16 flex-shrink-0", color)}>{label}</label>
            <input
              type="number"
              className="input text-sm flex-1"
              value={form[key]}
              onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
            />
            <span className="text-xs text-gray-400 w-8">{unit}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={onClose} className="btn-secondary flex-1 text-sm">Cancel</button>
        <button onClick={handleSave} className="btn-primary flex-1 text-sm">Save goals</button>
      </div>
    </Modal>
  );
}
