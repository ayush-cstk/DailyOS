"use client";
import { useState, useEffect } from "react";
import { CheckSquare, Dumbbell, Utensils, Sparkles, ArrowRight, X, Brain, Camera, Zap, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const TOUR_KEY = "dailyos_tour_v1";

export default function ProductTour() {
  const [visible, setVisible]   = useState(false);
  const [step, setStep]         = useState(0);
  const [dir, setDir]           = useState<1 | -1>(1); // animation direction
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(TOUR_KEY)) {
      const t = setTimeout(() => setVisible(true), 700);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = () => { localStorage.setItem(TOUR_KEY, "1"); setVisible(false); };

  const goTo = (next: number, direction: 1 | -1 = 1) => {
    if (animating) return;
    setDir(direction);
    setAnimating(true);
    setTimeout(() => { setStep(next); setAnimating(false); }, 220);
  };

  const next = () => step < 4 ? goTo(step + 1, 1) : dismiss();
  const back = () => step > 0 && goTo(step - 1, -1);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={dismiss} />

      <div
        className="relative w-full shadow-2xl overflow-hidden"
        style={{
          maxWidth: step === 0 ? 400 : step === 4 ? 460 : 420,
          borderRadius: 28,
          transition: "max-width 0.3s cubic-bezier(0.34,1.4,0.64,1)",
        }}
      >
        {/* ── Step content ── */}
        <div
          style={{
            transition: animating
              ? "opacity 0.18s ease, transform 0.18s ease"
              : "opacity 0.22s ease, transform 0.22s cubic-bezier(0.34,1.2,0.64,1)",
            opacity: animating ? 0 : 1,
            transform: animating
              ? `translateX(${dir * 40}px) scale(0.97)`
              : "translateX(0) scale(1)",
          }}
        >
          {step === 0 && <Step0 onNext={next} onDismiss={dismiss} />}
          {step === 1 && <Step1 onNext={next} onBack={back} onDismiss={dismiss} />}
          {step === 2 && <Step2 onNext={next} onBack={back} onDismiss={dismiss} />}
          {step === 3 && <Step3 onNext={next} onBack={back} onDismiss={dismiss} />}
          {step === 4 && <Step4 onNext={next} onBack={back} onDismiss={dismiss} />}
        </div>

        {/* Progress dots — always visible */}
        <div
          className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-6 py-4"
          style={{ pointerEvents: "none" }}
        >
          <div className="flex gap-1.5" style={{ pointerEvents: "auto" }}>
            {[0,1,2,3,4].map(i => (
              <div key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === step ? 20 : 6,
                  height: 6,
                  backgroundColor: i === step ? "white" : "rgba(255,255,255,0.3)",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Shared footer nav ─────────────────────────────────────────────── */
function Nav({ onBack, onNext, isLast, light }: { onBack?: () => void; onNext: () => void; isLast?: boolean; light?: boolean }) {
  return (
    <div className={cn("flex items-center justify-between px-6 pb-6 pt-2")}>
      <div className="w-24" /> {/* spacer for dots */}
      <div className="flex items-center gap-2 ml-auto">
        {onBack && (
          <button onClick={onBack}
            className={cn("px-3 py-2 rounded-xl text-xs font-bold transition-all",
              light ? "text-white/60 hover:text-white hover:bg-white/10" : "text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            )}>Back</button>
        )}
        <button onClick={onNext}
          className={cn(
            "flex items-center gap-1.5 px-5 py-2.5 rounded-2xl text-sm font-black text-white transition-all active:scale-95 shadow-lg",
            light ? "bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/20" : "bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600"
          )}>
          {isLast ? "Let's go 🚀" : "Next"}
          {!isLast && <ArrowRight className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}

/* ── STEP 0: Welcome — full gradient hero ──────────────────────────── */
function Step0({ onNext, onDismiss }: { onNext: () => void; onDismiss: () => void }) {
  return (
    <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 rounded-[28px] overflow-hidden">
      <button onClick={onDismiss} className="absolute top-4 right-4 p-1.5 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-all z-10">
        <X className="w-4 h-4" />
      </button>

      {/* Hero area */}
      <div className="pt-14 pb-8 px-8 text-center relative overflow-hidden">
        {/* Floating blobs */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-400/20 rounded-full blur-2xl" />

        {/* Icon with ring */}
        <div className="relative inline-flex mb-6">
          <div className="w-20 h-20 rounded-3xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-2xl">
            <Sparkles className="w-9 h-9 text-white" />
          </div>
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full border-2 border-white flex items-center justify-center">
            <Zap className="w-2.5 h-2.5 text-white" />
          </div>
        </div>

        <h1 className="text-2xl font-black text-white mb-3 leading-tight">
          Welcome to<br />DailyOS 👋
        </h1>
        <p className="text-sm text-white/70 leading-relaxed max-w-[260px] mx-auto">
          Tasks · Workouts · Nutrition — all in one place, with AI coaching built right in.
        </p>
      </div>

      {/* Three pill features */}
      <div className="flex gap-2 px-8 pb-8 justify-center flex-wrap">
        {[
          { icon: CheckSquare, label: "Tasks" },
          { icon: Dumbbell, label: "Workout" },
          { icon: Utensils, label: "Diet" },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-1.5 bg-white/10 border border-white/15 rounded-full px-3.5 py-1.5">
            <Icon className="w-3 h-3 text-white/80" />
            <span className="text-xs font-bold text-white/80">{label}</span>
          </div>
        ))}
      </div>

      <Nav onNext={onNext} light />
    </div>
  );
}

/* ── STEP 1: Tasks — visual LEFT, text RIGHT ───────────────────────── */
function Step1({ onNext, onBack, onDismiss }: { onNext: () => void; onBack: () => void; onDismiss: () => void }) {
  const tasks = [
    { text: "Review PRD document", done: true },
    { text: "Team standup call", done: true },
    { text: "Ship v2 feature", done: false },
    { text: "Update docs", done: false },
  ];
  return (
    <div className="bg-white dark:bg-gray-900 rounded-[28px] overflow-hidden">
      <button onClick={onDismiss} className="absolute top-4 right-4 p-1.5 rounded-xl text-gray-300 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all z-10">
        <X className="w-4 h-4" />
      </button>

      {/* Top violet strip */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 pt-6 pb-5">
        <span className="text-[10px] font-black uppercase tracking-widest text-violet-200 bg-white/15 px-3 py-1 rounded-full">Tasks</span>
        <h2 className="text-xl font-black text-white mt-3 leading-tight">Manage your day<br />like a pro ✅</h2>
      </div>

      {/* Side-by-side layout */}
      <div className="flex gap-0">
        {/* Task list — takes most of the width */}
        <div className="flex-1 p-5 space-y-2">
          {tasks.map((t, i) => (
            <div key={i}
              className="flex items-center gap-2.5 p-2.5 rounded-xl border transition-all"
              style={{
                borderColor: t.done ? "#EDE9FE" : "#F3F4F6",
                background: t.done ? "#F5F3FF" : "white",
              }}
              // Note: ProductTour uses inline styles for its demo cards (intentionally not dark-mode themed as they are mock UI)
              >
              <div className="w-4 h-4 rounded-full flex-shrink-0 border-2 flex items-center justify-center"
                style={t.done ? { background: "#7C3AED", borderColor: "#7C3AED" } : { borderColor: "#D1D5DB" }}>
                {t.done && <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5 3.5-4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>}
              </div>
              <span className={cn("text-xs font-semibold", t.done ? "line-through text-gray-300" : "text-gray-800")}>{t.text}</span>
            </div>
          ))}
          {/* Progress bar */}
          <div className="mt-3 pt-2 border-t border-gray-100">
            <div className="flex justify-between text-[10px] font-bold text-gray-400 mb-1.5">
              <span>Progress</span><span className="text-violet-600">2/4 done</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500" style={{ width: "50%" }} />
            </div>
          </div>
        </div>

        {/* Right: short description */}
        <div className="w-[130px] flex-shrink-0 bg-violet-50 p-4 flex flex-col justify-center gap-3">
          <div className="text-xs text-violet-800 leading-relaxed font-medium">
            <p className="font-black text-violet-900 mb-1">Projects</p>
            Group tasks by Work, Personal, or Health.
          </div>
          <div className="text-xs text-violet-800 leading-relaxed font-medium">
            <p className="font-black text-violet-900 mb-1">Daily / Weekly</p>
            Switch between day and week views.
          </div>
        </div>
      </div>

      <Nav onBack={onBack} onNext={onNext} />
    </div>
  );
}

/* ── STEP 2: Workout — dark card, exercises at top ─────────────────── */
function Step2({ onNext, onBack, onDismiss }: { onNext: () => void; onBack: () => void; onDismiss: () => void }) {
  const exs = [
    { name: "Bench Press", sets: "4×8", weight: "80kg", pct: 80 },
    { name: "Pull-ups",    sets: "3×10", weight: "BW",   pct: 65 },
    { name: "Squat",       sets: "4×6", weight: "100kg", pct: 90 },
  ];
  return (
    <div className="bg-gray-950 rounded-[28px] overflow-hidden">
      <button onClick={onDismiss} className="absolute top-4 right-4 p-1.5 rounded-xl text-white/30 hover:text-white hover:bg-white/10 transition-all z-10">
        <X className="w-4 h-4" />
      </button>

      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-blue-500 flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Workout</span>
            <h2 className="text-lg font-black text-white leading-tight">Every rep. Logged.</h2>
          </div>
        </div>

        {/* Exercise cards — stacked with depth effect */}
        <div className="space-y-2">
          {exs.map((ex, i) => (
            <div key={i} className="bg-gray-900 rounded-2xl p-3.5 border border-gray-800 flex items-center gap-3"
              style={{ transform: `translateX(${i * 4}px)`, opacity: 1 - i * 0.08 }}>
              <div className="flex-1">
                <p className="text-sm font-bold text-white">{ex.name}</p>
                <div className="mt-1.5 h-1 bg-gray-800 rounded-full overflow-hidden w-full">
                  <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" style={{ width: `${ex.pct}%` }} />
                </div>
              </div>
              <span className="text-xs bg-blue-500/20 text-blue-400 font-black px-2.5 py-1 rounded-xl border border-blue-500/20">{ex.sets}</span>
              <span className="text-xs bg-gray-800 text-gray-400 font-bold px-2.5 py-1 rounded-xl">{ex.weight}</span>
            </div>
          ))}
        </div>
      </div>

      {/* AI summary teaser */}
      <div className="mx-6 mb-5 bg-gradient-to-r from-indigo-900/60 to-purple-900/60 border border-indigo-700/40 rounded-2xl p-3 flex items-center gap-2.5">
        <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0" />
        <p className="text-xs text-indigo-300 font-semibold">Hit <span className="font-black text-white">AI Summary</span> after your session for calories burned + coach feedback.</p>
      </div>

      <Nav onBack={onBack} onNext={onNext} light />
    </div>
  );
}

/* ── STEP 3: Diet — rings front & center ──────────────────────────── */
function Step3({ onNext, onBack, onDismiss }: { onNext: () => void; onBack: () => void; onDismiss: () => void }) {
  const macros = [
    { label: "Calories", value: 1640, goal: 2000, color: "#F59E0B", pct: 82 },
    { label: "Protein",  value: 118,  goal: 150,  color: "#3B82F6", pct: 79 },
    { label: "Carbs",    value: 165,  goal: 200,  color: "#10B981", pct: 55 },
    { label: "Fat",      value: 52,   goal: 65,   color: "#F43F5E", pct: 80 },
  ];

  function Ring({ color, pct, size = 64, stroke = 7 }: { color: string; pct: number; size?: number; stroke?: number }) {
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#F1F5F9" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)} />
      </svg>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-[28px] overflow-hidden">
      <button onClick={onDismiss} className="absolute top-4 right-4 p-1.5 rounded-xl text-gray-300 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all z-10">
        <X className="w-4 h-4" />
      </button>

      {/* Emerald top + big calorie ring */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 pt-6 pb-8 px-6 text-center relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-100/80 bg-white/15 px-3 py-1 rounded-full inline-block mb-4">Diet</span>

        {/* Big center ring */}
        <div className="relative inline-flex items-center justify-center mb-2">
          <Ring color="white" pct={82} size={110} stroke={9} />
          <div className="absolute text-center">
            <p className="text-2xl font-black text-white leading-none">360</p>
            <p className="text-[9px] text-white/60 font-bold uppercase tracking-wide">kcal left</p>
          </div>
        </div>
        <p className="text-xs text-white/70 font-semibold">1,640 of 2,000 kcal consumed</p>
      </div>

      {/* Macro mini rings row */}
      <div className="flex justify-around px-5 py-5 border-b border-gray-100 dark:border-gray-700">
        {macros.slice(1).map((m) => (
          <div key={m.label} className="flex flex-col items-center gap-1">
            <div className="relative">
              <Ring color={m.color} pct={m.pct} size={52} stroke={5} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[9px] font-black" style={{ color: m.color }}>{m.pct}%</span>
              </div>
            </div>
            <p className="text-[10px] font-bold text-gray-700 dark:text-gray-300">{m.value}g</p>
            <p className="text-[9px] text-gray-400">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="px-6 py-4">
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          Log meals manually or <span className="font-black text-emerald-600">snap a photo</span> — GPT-4o estimates every macro instantly.
        </p>
      </div>

      <Nav onBack={onBack} onNext={onNext} />
    </div>
  );
}

/* ── STEP 4: AI / Aria — dramatic dark, fanned cards ──────────────── */
function Step4({ onNext, onBack, onDismiss }: { onNext: () => void; onBack: () => void; onDismiss: () => void }) {
  const cards = [
    { icon: Dumbbell, title: "Workout Coach", desc: "Personalized report after every gym session — intensity, wins, calories burned.", color: "#3B82F6", rotate: -4 },
    { icon: Camera,   title: "Meal Scanner",  desc: "Photograph your food. AI estimates calories, protein, carbs & fat in seconds.", color: "#10B981", rotate: 0 },
    { icon: Brain,    title: "Orbit — Your AI Coach",  desc: "Chat anytime. Ask about workouts, nutrition, productivity — using /commands.", color: "#A78BFA", rotate: 4 },
  ];

  return (
    <div className="bg-gray-950 rounded-[28px] overflow-hidden">
      <button onClick={onDismiss} className="absolute top-4 right-4 p-1.5 rounded-xl text-white/30 hover:text-white hover:bg-white/10 transition-all z-10">
        <X className="w-4 h-4" />
      </button>

      <div className="px-6 pt-7 pb-2">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">AI Features</span>
        </div>
        <h2 className="text-2xl font-black text-white leading-tight mb-1">AI that actually<br />coaches you.</h2>
        <p className="text-xs text-gray-500 mb-5">Built into every section. No extra steps.</p>

        {/* Fanned cards */}
        <div className="relative h-[175px]">
          {cards.map((c, i) => {
            const Icon = c.icon;
            return (
              <div key={i}
                className="absolute inset-x-0 rounded-2xl border p-4 flex items-start gap-3"
                style={{
                  top: i * 14,
                  background: "rgba(255,255,255,0.04)",
                  borderColor: "rgba(255,255,255,0.08)",
                  transform: `rotate(${c.rotate}deg)`,
                  zIndex: i + 1,
                  backdropFilter: "blur(8px)",
                }}
              >
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: c.color + "25", border: `1px solid ${c.color}40` }}>
                  <Icon className="w-4 h-4" style={{ color: c.color }} />
                </div>
                <div>
                  <p className="text-xs font-black text-white">{c.title}</p>
                  <p className="text-[10px] text-gray-500 leading-relaxed mt-0.5">{c.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Nav onBack={onBack} onNext={onNext} isLast light />
    </div>
  );
}
