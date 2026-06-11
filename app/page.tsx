"use client";
import Link from "next/link";
import Image from "next/image";
import { useSession, signIn } from "next-auth/react";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import {
  CheckCircle2, Dumbbell, Utensils, ArrowRight, Zap, BarChart3,
  Brain, Target, Star, ChevronRight, Sparkles, Camera, TrendingUp,
  Activity, Shield, Clock, Users
} from "lucide-react";

// ── Dark app preview (hero mockup) ───────────────────────────────────────────
function DarkCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: "#141414", border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: "14px", padding: "14px", minWidth: 0, overflow: "hidden", ...style,
    }}>
      {children}
    </div>
  );
}

function DarkAppPreview() {
  // Calorie ring
  const consumed = 1840, calorieGoal = 2200;
  const R = 30, CIRC = 2 * Math.PI * R;
  const ringPct = consumed / calorieGoal;

  // Weight sparkline (fake descending data)
  const wts     = [80.2, 79.8, 79.9, 79.5, 79.3, 78.8, 78.5];
  const wLo     = Math.min(...wts) - 0.3;
  const wHi     = Math.max(...wts) + 0.3;
  const SW = 150, SH = 30;
  const sparkPts = wts.map((w, i) => {
    const x = (i / (wts.length - 1)) * SW;
    const y = SH - ((w - wLo) / (wHi - wLo)) * (SH - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const sparkArea = `0,${SH} ${sparkPts} ${SW},${SH}`;

  // Workout frequency (5/7 days trained, height = duration ratio)
  const wkDays  = [60, 0, 75, 45, 90, 0, 55];
  const wkLabels = ["S","M","T","W","T","F","S"];
  const wkMax   = 90;

  const cardHeader = (bg: string, label: string, link: string, linkColor: string, extra?: React.ReactNode) => (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"10px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:"7px" }}>
        <div style={{ width:"24px", height:"24px", background: bg, borderRadius:"7px" }} />
        <span style={{ fontWeight:700, color:"#e8e8e8", fontSize:"11px" }}>{label}</span>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
        {extra}
        <span style={{ fontSize:"9px", fontWeight:700, color: linkColor }}>{link} ↗</span>
      </div>
    </div>
  );

  return (
    <div style={{ background:"#0a0a0a", borderRadius:"20px", padding:"16px",
      fontFamily:"system-ui,-apple-system,sans-serif", fontSize:"12px" }}>

      {/* Browser chrome */}
      <div style={{ display:"flex", alignItems:"center", gap:"5px", marginBottom:"14px" }}>
        {["#ff5f57","#febc2e","#28c840"].map(c => (
          <div key={c} style={{ width:"9px", height:"9px", borderRadius:"50%", background:c }} />
        ))}
        <div style={{ flex:1, marginLeft:"6px", background:"#1a1a1a", borderRadius:"5px",
          height:"20px", display:"flex", alignItems:"center", paddingLeft:"10px",
          border:"1px solid rgba(255,255,255,0.05)" }}>
          <span style={{ color:"#444", fontSize:"10px" }}>dailyos.app/dashboard</span>
        </div>
      </div>

      {/* Greeting + streak chips */}
      <div style={{ marginBottom:"14px" }}>
        <div style={{ fontSize:"17px", fontWeight:900, color:"#fff", letterSpacing:"-0.4px" }}>
          Good morning, Ayush
        </div>
        <div style={{ fontSize:"10px", color:"#555", marginTop:"2px" }}>Monday, 26 May 2026</div>
        <div style={{ display:"flex", gap:"6px", marginTop:"8px", flexWrap:"wrap" }}>
          {[
            { label:"7-day workout streak", bg:"rgba(59,130,246,0.12)", color:"#60a5fa", border:"rgba(59,130,246,0.2)" },
            { label:"5-day task streak",    bg:"rgba(139,92,246,0.12)", color:"#a78bfa", border:"rgba(139,92,246,0.2)" },
          ].map(chip => (
            <span key={chip.label} style={{ fontSize:"10px", fontWeight:700, padding:"3px 9px",
              borderRadius:"20px", background:chip.bg, color:chip.color,
              border:`1px solid ${chip.border}` }}>
              {chip.label}
            </span>
          ))}
        </div>
      </div>

      {/* Row 1: Nutrition (2/3) + Weight (1/3) */}
      <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:"10px", marginBottom:"10px", minWidth:0 }}>

        {/* Nutrition card */}
        <DarkCard>
          {cardHeader("rgba(16,185,129,0.15)", "Today's Nutrition", "Open", "#10b981")}
          <div style={{ display:"flex", alignItems:"center", gap:"14px" }}>
            {/* Ring */}
            <div style={{ position:"relative", flexShrink:0, width:"72px", height:"72px" }}>
              <svg viewBox="0 0 72 72" style={{ width:"72px", height:"72px", transform:"rotate(-90deg)" }}>
                <circle cx="36" cy="36" r={R} fill="none" strokeWidth="5.5" stroke="#2a2a2a" />
                <circle cx="36" cy="36" r={R} fill="none" strokeWidth="5.5" stroke="#10b981"
                  strokeLinecap="round"
                  strokeDasharray={`${ringPct * CIRC} ${CIRC}`} />
              </svg>
              <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column",
                alignItems:"center", justifyContent:"center", lineHeight:1 }}>
                <span style={{ fontSize:"13px", fontWeight:900, color:"#fff" }}>{consumed}</span>
                <span style={{ fontSize:"8px", color:"#555", marginTop:"2px" }}>/ {calorieGoal}</span>
              </div>
            </div>
            {/* Macro bars */}
            <div style={{ flex:1 }}>
              <div style={{ fontSize:"9px", fontWeight:700, color:"#10b981",
                background:"rgba(16,185,129,0.1)", padding:"3px 7px", borderRadius:"20px",
                display:"inline-block", marginBottom:"7px" }}>
                360 kcal remaining
              </div>
              {[
                { label:"Protein", val:142, goal:180, pct:79,  color:"#6366f1" },
                { label:"Carbs",   val:210, goal:250, pct:84,  color:"#f59e0b" },
                { label:"Fat",     val:58,  goal:65,  pct:89,  color:"#ec4899" },
              ].map(m => (
                <div key={m.label} style={{ marginBottom:"5px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"2px" }}>
                    <span style={{ fontSize:"9px", fontWeight:600, color:"#888" }}>{m.label}</span>
                    <span style={{ fontSize:"9px", color:"#555" }}>{m.val}/{m.goal}g</span>
                  </div>
                  <div style={{ height:"4px", background:"#2a2a2a", borderRadius:"4px" }}>
                    <div style={{ height:"100%", width:`${m.pct}%`, background:m.color, borderRadius:"4px" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DarkCard>

        {/* Weight card */}
        <DarkCard>
          {cardHeader("rgba(99,102,241,0.15)", "Body Weight", "Log", "#818cf8")}
          <div style={{ fontSize:"28px", fontWeight:900, color:"#fff", letterSpacing:"-1px", lineHeight:1 }}>
            78.5<span style={{ fontSize:"12px", color:"#555", fontWeight:600 }}> kg</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:"5px", marginTop:"4px" }}>
            <span style={{ fontSize:"10px", fontWeight:700, color:"#10b981" }}>↓ −0.3 kg</span>
            <span style={{ fontSize:"10px", color:"#555" }}>Yesterday</span>
          </div>
          <svg viewBox={`0 0 ${SW} ${SH}`} style={{ width:"100%", height:`${SH}px`, marginTop:"8px" }}>
            <defs>
              <linearGradient id="previewSparkGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#818cf8" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#818cf8" stopOpacity="0"    />
              </linearGradient>
            </defs>
            <polygon points={sparkArea} fill="url(#previewSparkGrad)" />
            <polyline points={sparkPts} fill="none" stroke="#818cf8"
              strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
          </svg>
        </DarkCard>
      </div>

      {/* Row 2: Tasks + Workout */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", minWidth:0 }}>

        {/* Tasks card */}
        <DarkCard>
          {cardHeader("rgba(139,92,246,0.15)", "Today's Tasks", "Open", "#a78bfa")}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:"5px" }}>
            <div>
              <span style={{ fontSize:"22px", fontWeight:900, color:"#fff" }}>3</span>
              <span style={{ fontSize:"10px", color:"#555", marginLeft:"4px" }}>/ 6 done</span>
            </div>
            <span style={{ fontSize:"10px", fontWeight:700, color:"#8b5cf6" }}>50%</span>
          </div>
          <div style={{ height:"4px", background:"#2a2a2a", borderRadius:"4px", marginBottom:"8px" }}>
            <div style={{ height:"100%", width:"50%", background:"#8b5cf6", borderRadius:"4px" }} />
          </div>
          {[
            { title:"Review PRD document", p:"high",   pc:"#ef4444", pb:"rgba(239,68,68,0.1)"   },
            { title:"Ship v2 feature",     p:"high",   pc:"#ef4444", pb:"rgba(239,68,68,0.1)"   },
            { title:"Update docs",         p:"medium", pc:"#f59e0b", pb:"rgba(245,158,11,0.1)"  },
          ].map((task, i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:"7px",
              padding:"4px 7px", background:"#1e1e1e", borderRadius:"7px", marginBottom:"3px" }}>
              <div style={{ width:"9px", height:"9px", borderRadius:"50%",
                border:"1.5px solid #444", flexShrink:0 }} />
              <span style={{ flex:1, fontSize:"9px", color:"#999",
                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {task.title}
              </span>
              <span style={{ fontSize:"8px", fontWeight:700, padding:"1px 5px",
                borderRadius:"4px", background:task.pb, color:task.pc,
                textTransform:"uppercase", flexShrink:0 }}>{task.p}</span>
            </div>
          ))}
        </DarkCard>

        {/* Workout card */}
        <DarkCard>
          {cardHeader("rgba(59,130,246,0.15)", "Workout", "View", "#60a5fa",
            <span style={{ fontSize:"9px", fontWeight:700, padding:"2px 6px",
              borderRadius:"20px", background:"rgba(59,130,246,0.1)", color:"#60a5fa" }}>
              7d
            </span>
          )}
          <div style={{ display:"flex", alignItems:"center", gap:"6px", marginBottom:"7px" }}>
            <span style={{ fontSize:"9px", fontWeight:700, padding:"2px 7px",
              borderRadius:"20px", background:"rgba(59,130,246,0.1)", color:"#60a5fa" }}>
              Trained today
            </span>
            <span style={{ fontSize:"9px", color:"#555" }}>55 min</span>
          </div>
          {["Bench Press · 4 sets","Pull-ups · 3 sets","Squat · 4 sets"].map((ex, i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:"7px",
              padding:"4px 7px", background:"#1e1e1e", borderRadius:"7px", marginBottom:"3px" }}>
              <div style={{ width:"5px", height:"5px", borderRadius:"50%",
                background:"#3b82f6", flexShrink:0 }} />
              <span style={{ fontSize:"9px", color:"#999" }}>{ex}</span>
            </div>
          ))}
          {/* Frequency bars */}
          <div style={{ marginTop:"8px", paddingTop:"8px",
            borderTop:"1px solid rgba(255,255,255,0.05)" }}>
            <span style={{ fontSize:"8px", fontWeight:600, color:"#444",
              textTransform:"uppercase", letterSpacing:"0.05em" }}>Last 7 days</span>
            <svg viewBox="0 0 119 38" style={{ width:"100%", height:"38px", marginTop:"3px" }}>
              {wkDays.map((dur, i) => {
                const bH = dur > 0 ? Math.max(6, (dur / wkMax) * 24) : 3;
                const x  = i * 17;
                return (
                  <g key={i}>
                    <rect x={x} y={24-bH} width={12} height={bH} rx="2.5"
                      fill={dur > 0 ? "#3b82f6" : "#232323"} />
                    <text x={x+6} y={36} textAnchor="middle"
                      style={{ fontSize:"7px", fill:"#444" }}>{wkLabels[i]}</text>
                  </g>
                );
              })}
            </svg>
          </div>
        </DarkCard>
      </div>
    </div>
  );
}

// ── Animated counter ─────────────────────────────────────────────────────────
function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(to / 40);
    const t = setInterval(() => {
      start += step;
      if (start >= to) { setVal(to); clearInterval(t); }
      else setVal(start);
    }, 30);
    return () => clearInterval(t);
  }, [to]);
  return <span>{val.toLocaleString()}{suffix}</span>;
}

const features = [
  { icon: CheckCircle2, gradient: "from-violet-500 to-purple-600", title: "Smart Task Management", desc: "Daily & weekly to-dos organized by project. One tap to complete. Zero friction." },
  { icon: Dumbbell, gradient: "from-blue-500 to-indigo-600", title: "Workout Logger", desc: "Log every set, rep, and weight. kg, lbs, or bodyweight. Built for real athletes." },
  { icon: Camera, gradient: "from-pink-500 to-rose-600", title: "AI Meal Scanner", desc: "Snap a photo of your food. Our best AI model estimates all macros instantly." },
  { icon: Brain, gradient: "from-amber-500 to-orange-600", title: "AI Workout Analysis", desc: "Get a personalized coach report after every session — intensity, wins, improvements." },
  { icon: BarChart3, gradient: "from-emerald-500 to-teal-600", title: "Nutrition Tracking", desc: "Set macro goals. Log meals. Watch your daily calories, protein, carbs and fat." },
  { icon: TrendingUp, gradient: "from-cyan-500 to-blue-600", title: "Progress Over Time", desc: "Body weight trends, workout history, and nutrition patterns all in one place." },
];

const stats = [
  { value: 100, suffix: "%", label: "Free forever" },
  { value: 3, suffix: " apps", label: "Replaced by one" },
  { value: 0, suffix: " ads", label: "Ever, period" },
];

const testimonials = [
  { name: "Priya M.", role: "Product Manager", avatar: "P", color: "bg-violet-500", text: "DailyOS replaced my task app, gym tracker, and MyFitnessPal. It's the only app I open every morning." },
  { name: "Rahul K.", role: "Software Engineer", avatar: "R", color: "bg-blue-500", text: "The AI workout summary actually coaches me. It told me my pull-day volume was low before I even noticed." },
  { name: "Ananya S.", role: "Fitness Coach", avatar: "A", color: "bg-emerald-500", text: "I snap a photo of my meal and get macros in 3 seconds. My clients are obsessed with this feature." },
];

export default function LandingPage() {
  const { data: session } = useSession();
  const { resolvedTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const logoSrc = mounted && resolvedTheme === "dark"
    ? "/BrandLogo_Header_DarkMode.png"
    : "/BrandLogo_Header.png";

  return (
    <div className="min-h-screen bg-white dark:bg-black overflow-x-hidden">

      {/* ── Nav ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/90 dark:bg-black/80 backdrop-blur-xl shadow-sm border-b border-gray-100 dark:border-white/[0.06]" : "bg-transparent"}`}>
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image src={logoSrc} alt="DailyOS" width={32} height={32} className="rounded-xl" />
            <span className="font-black text-gray-900 dark:text-white text-lg tracking-tight">DailyOS</span>
          </div>
          <div className="flex items-center gap-3">
            {session ? (
              <Link href="/dashboard" className="btn-primary text-sm flex items-center gap-1.5">
                Dashboard <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <button onClick={() => signIn("google", { callbackUrl: "/dashboard" })} className="text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors hidden sm:block">
                  Sign in
                </button>
                <button onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                  className="bg-gray-900 text-white font-semibold px-4 py-2 rounded-xl text-sm hover:bg-gray-800 active:scale-95 transition-all">
                  Get started free
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-20 px-5 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-indigo-100 via-purple-50 to-transparent opacity-70 dark:opacity-[0.07] dark:from-indigo-500 dark:via-purple-500 blur-3xl" />
          <div className="absolute top-60 -left-40 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-blue-100 to-transparent opacity-50 dark:opacity-[0.06] dark:from-blue-500 blur-3xl" />
          <div className="absolute bottom-0 right-1/3 w-[300px] h-[300px] rounded-full bg-gradient-to-br from-emerald-50 to-transparent opacity-60 dark:opacity-[0.05] dark:from-emerald-500 blur-3xl" />
        </div>

        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold px-4 py-2 rounded-full mb-8 animate-slide-down uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5" /> Your personal daily operating system
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-gray-900 dark:text-white leading-[1.06] tracking-tight mb-6 animate-slide-up">
            Tasks. Gym. Diet.
            <br />
            <span className="gradient-text">All in one place.</span>
          </h1>

          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up" style={{animationDelay:"60ms"}}>
            DailyOS brings your to-dos, workout tracking, and nutrition logging into one
            beautifully simple app — with AI that actually helps you improve.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center animate-slide-up" style={{animationDelay:"120ms"}}>
            <button
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              className="group inline-flex items-center justify-center gap-3 bg-gray-900 text-white font-bold px-8 py-4 rounded-2xl text-base hover:bg-gray-800 active:scale-[0.97] transition-all duration-200 shadow-xl shadow-gray-900/20"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <a href="#features" className="inline-flex items-center justify-center gap-2 text-gray-600 dark:text-gray-300 font-semibold px-8 py-4 rounded-2xl text-base border border-gray-200 dark:border-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-[0.97] transition-all">
              See how it works <ChevronRight className="w-4 h-4" />
            </a>
          </div>
          <p className="mt-4 text-sm text-gray-400 animate-slide-up" style={{animationDelay:"160ms"}}>Free forever · No credit card · Works on iPhone</p>
        </div>

        {/* ── App Preview ── */}
        <div className="max-w-4xl mx-auto mt-20 animate-slide-up" style={{animationDelay:"200ms"}}>
          <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-black/60"
            style={{ border:"1px solid rgba(255,255,255,0.07)" }}>
            <DarkAppPreview />
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-16 px-5 bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-3 gap-6 text-center">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="text-4xl sm:text-5xl font-black text-white mb-1">
                  <Counter to={s.value} suffix={s.suffix} />
                </p>
                <p className="text-sm text-gray-400 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-5 bg-white dark:bg-black">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
              Built for how you actually live
            </h2>
            <p className="text-lg text-gray-400 max-w-xl mx-auto">
              No bloat. No upsells. Just the tools you need to show up every day.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger">
            {features.map((f, i) => (
              <div key={f.title} className="card-hover animate-slide-up group" style={{animationDelay:`${i*60}ms`}}>
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                  <f.icon className="w-5.5 h-5.5 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-base">{f.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-24 px-5 bg-[#F7F8FC] dark:bg-[#0a0a0a]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3">Workflow</p>
            <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">One app. Three modules. Your whole day.</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { step: "01", icon: CheckCircle2, color: "text-violet-600 bg-violet-100 dark:bg-violet-900/40", title: "Plan your day", desc: "Add tasks under projects. Switch between daily and weekly views. Tap to complete." },
              { step: "02", icon: Dumbbell, color: "text-blue-600 bg-blue-100 dark:bg-blue-900/40", title: "Log your workout", desc: "Add exercises, sets, reps, weights. Save it. Hit AI Summary for a coach report." },
              { step: "03", icon: Utensils, color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40", title: "Track your nutrition", desc: "Snap a meal photo or log manually. Watch your macros fill up throughout the day." },
            ].map((step) => (
              <div key={step.step} className="card text-center">
                <div className={`w-12 h-12 rounded-2xl ${step.color} flex items-center justify-center mx-auto mb-4`}>
                  <step.icon className="w-5.5 h-5.5" />
                </div>
                <span className="text-xs font-black text-gray-300 tracking-widest">{step.step}</span>
                <h3 className="font-bold text-gray-900 dark:text-white mt-1 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-24 px-5 bg-white dark:bg-black">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="flex items-center justify-center gap-1 mb-4">
              {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />)}
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight">People who actually use it</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {testimonials.map((t) => (
              <div key={t.name} className="card-hover">
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-5">&quot;{t.text}&quot;</p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center text-white font-bold text-sm`}>{t.avatar}</div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-5 bg-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-900/40 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-900/40 rounded-full blur-3xl" />
        </div>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-5 tracking-tight">
            Start your daily OS
          </h2>
          <p className="text-lg text-gray-400 mb-10 leading-relaxed">
            Join people who use DailyOS to stay organized, get stronger, and eat smarter — every single day.
          </p>
          <button
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="group inline-flex items-center gap-3 bg-white text-gray-900 font-bold px-10 py-4 rounded-2xl text-base hover:shadow-2xl hover:shadow-white/10 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Get started — it's free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
          <p className="mt-4 text-sm text-gray-500">Add to iPhone home screen · Works offline</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-black text-[#555] py-8 px-5 text-center text-sm" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <Image src={logoSrc} alt="DailyOS" width={24} height={24} className="rounded-md" />
          <span className="text-white font-bold">DailyOS</span>
        </div>
        <p>© {new Date().getFullYear()} DailyOS · Built for people who do the work.</p>
      </footer>
    </div>
  );
}
