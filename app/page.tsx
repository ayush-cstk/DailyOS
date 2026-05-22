"use client";
import Link from "next/link";
import { useSession, signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import {
  CheckCircle2, Dumbbell, Utensils, ArrowRight, Zap, BarChart3,
  Brain, Target, Star, ChevronRight, Sparkles, Camera, TrendingUp,
  Activity, Shield, Clock, Users
} from "lucide-react";

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
  { icon: Camera, gradient: "from-pink-500 to-rose-600", title: "AI Meal Scanner", desc: "Snap a photo of your food. GPT-4o estimates all macros instantly." },
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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">

      {/* ── Nav ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/90 backdrop-blur-lg shadow-sm border-b border-gray-100" : "bg-transparent"}`}>
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-200">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-gray-900 text-lg tracking-tight">DailyOS</span>
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
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-indigo-100 via-purple-50 to-transparent opacity-70 blur-3xl" />
          <div className="absolute top-60 -left-40 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-blue-100 to-transparent opacity-50 blur-3xl" />
          <div className="absolute bottom-0 right-1/3 w-[300px] h-[300px] rounded-full bg-gradient-to-br from-emerald-50 to-transparent opacity-60 blur-3xl" />
        </div>

        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold px-4 py-2 rounded-full mb-8 animate-slide-down uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5" /> Your personal daily operating system
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-gray-900 leading-[1.06] tracking-tight mb-6 animate-slide-up">
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
            <a href="#features" className="inline-flex items-center justify-center gap-2 text-gray-600 font-semibold px-8 py-4 rounded-2xl text-base border border-gray-200 hover:border-gray-300 hover:bg-gray-50 active:scale-[0.97] transition-all">
              See how it works <ChevronRight className="w-4 h-4" />
            </a>
          </div>
          <p className="mt-4 text-sm text-gray-400 animate-slide-up" style={{animationDelay:"160ms"}}>Free forever · No credit card · Works on iPhone</p>
        </div>

        {/* ── App Preview ── */}
        <div className="max-w-5xl mx-auto mt-20 animate-slide-up" style={{animationDelay:"200ms"}}>
          <div className="relative rounded-3xl overflow-hidden border border-gray-200 shadow-2xl shadow-gray-900/10 bg-[#F7F8FC] p-5">
            {/* Fake browser bar */}
            <div className="flex items-center gap-2 mb-5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
              <div className="flex-1 mx-4 bg-white rounded-lg h-7 flex items-center px-3">
                <span className="text-xs text-gray-400">dailyos.app/dashboard</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Tasks preview */}
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 bg-violet-100 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5 text-violet-600" />
                  </div>
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Today</span>
                  <span className="ml-auto text-xs bg-violet-100 text-violet-600 font-bold px-2 py-0.5 rounded-full">2/4</span>
                </div>
                {[
                  { t: "Review PRD document", done: true },
                  { t: "Team standup call", done: true },
                  { t: "Ship v2 feature", done: false },
                  { t: "Update documentation", done: false },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5 py-1.5 border-b border-gray-50 last:border-0">
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${item.done ? "bg-violet-500 border-violet-500" : "border-gray-300"}`}>
                      {item.done && <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5 3.5-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                    </div>
                    <span className={`text-xs ${item.done ? "line-through text-gray-300" : "text-gray-700"}`}>{item.t}</span>
                  </div>
                ))}
              </div>

              {/* Workout preview */}
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Dumbbell className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Workout</span>
                  <span className="ml-auto text-xs text-gray-400">58 min</span>
                </div>
                {[
                  { name: "Bench Press", sets: "4×8", weight: "80kg" },
                  { name: "Pull-ups", sets: "3×10", weight: "BW" },
                  { name: "Squat", sets: "4×6", weight: "100kg" },
                ].map((ex, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <span className="text-xs font-semibold text-gray-700">{ex.name}</span>
                    <div className="flex gap-1">
                      <span className="text-xs bg-blue-50 text-blue-600 font-bold px-1.5 py-0.5 rounded-md">{ex.sets}</span>
                      <span className="text-xs bg-gray-100 text-gray-500 font-medium px-1.5 py-0.5 rounded-md">{ex.weight}</span>
                    </div>
                  </div>
                ))}
                <div className="mt-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-2 text-center border border-indigo-100">
                  <span className="text-xs font-bold text-indigo-600 flex items-center justify-center gap-1">
                    <Sparkles className="w-3 h-3" /> AI Summary Ready
                  </span>
                </div>
              </div>

              {/* Diet preview */}
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Utensils className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Nutrition</span>
                  <span className="ml-auto text-xs font-bold text-emerald-600">1,840 kcal</span>
                </div>
                {[
                  { label: "Protein", val: 142, goal: 180, color: "bg-blue-400", pct: 79 },
                  { label: "Carbs", val: 210, goal: 250, color: "bg-amber-400", pct: 84 },
                  { label: "Fat", val: 58, goal: 65, color: "bg-rose-400", pct: 89 },
                ].map((m) => (
                  <div key={m.label} className="mb-2.5">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500 font-medium">{m.label}</span>
                      <span className="font-bold text-gray-700">{m.val}g <span className="text-gray-300 font-normal">/ {m.goal}g</span></span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${m.color} rounded-full transition-all`} style={{width:`${m.pct}%`}} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
      <section id="features" className="py-24 px-5 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4 tracking-tight">
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
                <h3 className="font-bold text-gray-900 mb-2 text-base">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-24 px-5 bg-[#F7F8FC]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3">Workflow</p>
            <h2 className="text-4xl font-black text-gray-900 tracking-tight">One app. Three modules. Your whole day.</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { step: "01", icon: CheckCircle2, color: "text-violet-600 bg-violet-100", title: "Plan your day", desc: "Add tasks under projects. Switch between daily and weekly views. Tap to complete." },
              { step: "02", icon: Dumbbell, color: "text-blue-600 bg-blue-100", title: "Log your workout", desc: "Add exercises, sets, reps, weights. Save it. Hit AI Summary for a coach report." },
              { step: "03", icon: Utensils, color: "text-emerald-600 bg-emerald-100", title: "Track your nutrition", desc: "Snap a meal photo or log manually. Watch your macros fill up throughout the day." },
            ].map((step) => (
              <div key={step.step} className="card text-center">
                <div className={`w-12 h-12 rounded-2xl ${step.color} flex items-center justify-center mx-auto mb-4`}>
                  <step.icon className="w-5.5 h-5.5" />
                </div>
                <span className="text-xs font-black text-gray-300 tracking-widest">{step.step}</span>
                <h3 className="font-bold text-gray-900 mt-1 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-24 px-5 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="flex items-center justify-center gap-1 mb-4">
              {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />)}
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">People who actually use it</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {testimonials.map((t) => (
              <div key={t.name} className="card-hover">
                <p className="text-sm text-gray-600 leading-relaxed mb-5">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center text-white font-bold text-sm`}>{t.avatar}</div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{t.name}</p>
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
      <footer className="bg-gray-950 text-gray-500 py-8 px-5 text-center text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-white" />
          </div>
          <span className="text-white font-bold">DailyOS</span>
        </div>
        <p>© {new Date().getFullYear()} DailyOS · Built for people who do the work.</p>
      </footer>
    </div>
  );
}
