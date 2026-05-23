"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Dumbbell, Utensils, CheckSquare, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { MarkdownText } from "@/components/ui/MarkdownText";

type Mode = "workout" | "diet" | "tasks" | null;
type Message = { role: "user" | "assistant"; content: string };

const MODE_CONFIG = {
  workout: { label: "Workout", icon: Dumbbell,    color: "bg-blue-100 text-blue-700 border-blue-200",      dot: "bg-blue-500",    gradient: "from-blue-500 to-indigo-600" },
  diet:    { label: "Diet",    icon: Utensils,     color: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", gradient: "from-emerald-500 to-teal-600" },
  tasks:   { label: "Tasks",   icon: CheckSquare,  color: "bg-violet-100 text-violet-700 border-violet-200",  dot: "bg-violet-500",  gradient: "from-violet-500 to-purple-600" },
};

const SUGGESTIONS = [
  { mode: "workout" as Mode, slash: "/workout", text: "How should I structure my push day?" },
  { mode: "diet"    as Mode, slash: "/diet",    text: "High protein Indian meal ideas?" },
  { mode: "tasks"   as Mode, slash: "/tasks",   text: "How do I stop procrastinating?" },
];

/* ── Orbit icon: chat bubble + pulse/heartbeat line ────────────────── */
function OrbitIcon({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Chat bubble */}
      <path
        d="M20 3H4C2.9 3 2 3.9 2 5V15C2 16.1 2.9 17 4 17H8.5L12 21L15.5 17H20C21.1 17 22 16.1 22 15V5C22 3.9 21.1 3 20 3Z"
        fill="rgba(255,255,255,0.2)"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Heartbeat / pulse line */}
      <polyline
        points="4.5,10 7,10 9,7 11,13 13,8.5 15,10 19.5,10"
        fill="none"
        stroke="white"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function AriaChatbot() {
  const [open, setOpen]           = useState(false);
  const [input, setInput]         = useState("");
  const [mode, setMode]           = useState<Mode>(null);
  const [messages, setMessages]   = useState<Message[]>([]);
  const [loading, setLoading]     = useState(false);
  const [showSlash, setShowSlash] = useState(false);
  const [mounted, setMounted]     = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef    = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLTextAreaElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 280);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const t = setTimeout(() => document.addEventListener("mousedown", handler), 100);
    return () => { clearTimeout(t); document.removeEventListener("mousedown", handler); };
  }, [open]);

  useEffect(() => {
    setShowSlash(input === "/");
    if (input.startsWith("/workout"))    setMode("workout");
    else if (input.startsWith("/diet"))  setMode("diet");
    else if (input.startsWith("/tasks")) setMode("tasks");
  }, [input]);

  const activeMode = mode ? MODE_CONFIG[mode] : null;

  const send = useCallback(async (text?: string) => {
    const content = (text ?? input).replace(/^\/(workout|diet|tasks)\s*/, "").trim();
    if (!content || loading) return;

    const userMsg: Message = { role: "user", content };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/aria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, mode }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.reply ?? "Sorry, something went wrong.",
      }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, something went wrong." }]);
    } finally {
      setLoading(false);
    }
  }, [input, messages, mode, loading]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const handleSlashSuggestion = (s: typeof SUGGESTIONS[0]) => {
    setMode(s.mode); setInput(""); setShowSlash(false); send(s.text);
  };

  const reset = () => { setMessages([]); setMode(null); setInput(""); };

  if (!mounted) return null;

  return (
    <div ref={containerRef} className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-[150] flex flex-col items-end gap-3 pointer-events-none">

      {/* ── Chat panel ── */}
      <div
        style={{
          transition: open
            ? "opacity 0.28s ease, transform 0.32s cubic-bezier(0.34,1.4,0.64,1)"
            : "opacity 0.18s ease, transform 0.18s cubic-bezier(0.4,0,1,1)",
          opacity: open ? 1 : 0,
          transform: open ? "scale(1) translateY(0)" : "scale(0.88) translateY(12px)",
          pointerEvents: open ? "auto" : "none",
          transformOrigin: "bottom right",
          maxHeight: "min(72vh, calc(100dvh - 200px))",
        }}
        className="w-[360px] max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
            <OrbitIcon size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-gray-900 dark:text-white text-sm leading-none">Orbit</p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold mt-0.5">Your AI life coach</p>
          </div>
          {activeMode && (
            <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5 flex-shrink-0", activeMode.color)}>
              <span className={cn("w-1.5 h-1.5 rounded-full", activeMode.dot)} />
              {activeMode.label}
            </span>
          )}
          <div className="flex items-center gap-0.5">
            <button onClick={reset} title="Clear" className="p-1.5 rounded-lg text-gray-300 hover:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg text-gray-300 hover:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="overflow-y-auto px-4 py-3 space-y-3 scrollbar-none flex-1">
          {messages.length === 0 && (
            <div className="flex flex-col items-center text-center py-3">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-indigo-200/40">
                <OrbitIcon size={22} />
              </div>
              <p className="font-black text-gray-900 dark:text-white text-sm">Ask me anything</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 leading-relaxed max-w-[200px]">
                Workout, nutrition, or productivity — I&apos;ve got you.
              </p>
              <div className="mt-4 w-full space-y-1.5">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Quick start</p>
                {SUGGESTIONS.map((s) => {
                  const Cfg = MODE_CONFIG[s.mode!];
                  const Icon = Cfg.icon;
                  return (
                    <button key={s.slash} onClick={() => handleSlashSuggestion(s)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-700 hover:border-gray-200 transition-all text-left">
                      <div className={cn("w-6 h-6 rounded-lg bg-gradient-to-br flex items-center justify-center flex-shrink-0", Cfg.gradient)}>
                        <Icon className="w-3 h-3 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={cn("text-[10px] font-black uppercase tracking-wide mr-1.5", Cfg.color.split(" ")[1])}>{s.slash}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{s.text}</span>
                      </div>
                    </button>
                  );
                })}
                <p className="text-[10px] text-gray-400 text-center pt-1 font-medium">
                  Type <span className="font-black text-gray-500">/</span> to switch modes
                </p>
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={cn("flex gap-2", m.role === "user" ? "justify-end" : "justify-start")}>
              {m.role === "assistant" && (
                <div className="w-5 h-5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-md flex items-center justify-center flex-shrink-0 mt-1">
                  <OrbitIcon size={10} />
                </div>
              )}
              <div className={cn(
                "max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed",
                m.role === "user"
                  ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-br-sm"
                  : "bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-bl-sm"
              )}>
                {m.role === "assistant" ? <MarkdownText text={m.content} /> : m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-2">
              <div className="w-5 h-5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-md flex items-center justify-center flex-shrink-0 mt-1">
                <OrbitIcon size={10} />
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5 items-center">
                {[0,1,2].map(i => (
                  <span key={i} className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 140}ms` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Slash dropdown */}
        {showSlash && (
          <div className="px-3 pb-1">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg overflow-hidden">
              {(["workout", "diet", "tasks"] as const).map((m) => {
                const Cfg = MODE_CONFIG[m];
                const Icon = Cfg.icon;
                return (
                  <button key={m}
                    onClick={() => { setMode(m); setInput(`/${m} `); inputRef.current?.focus(); setShowSlash(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left border-b border-gray-50 dark:border-gray-700 last:border-0">
                    <div className={cn("w-6 h-6 rounded-lg bg-gradient-to-br flex items-center justify-center", Cfg.gradient)}>
                      <Icon className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-xs font-black text-gray-900 dark:text-white">/{m}</span>
                    <span className="text-xs text-gray-400">{Cfg.label} mode</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="px-3 py-3 flex-shrink-0">
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 px-3.5 py-2.5 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-900/40 transition-all">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask me anything… or type /"
              className="flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 resize-none outline-none leading-snug scrollbar-none"
              style={{ fieldSizing: "content", maxHeight: "80px" } as any}
            />
            <button onClick={() => send()} disabled={!input.trim() || loading}
              className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 disabled:opacity-30 active:scale-90 transition-all">
              <Send className="w-3 h-3 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Floating trigger button ── */}
      <button
        onClick={() => setOpen(o => !o)}
        title="Ask Orbit"
        style={{
          transition: "transform 0.2s cubic-bezier(0.34,1.4,0.64,1), box-shadow 0.2s ease",
        }}
        className={cn(
          "w-12 h-12 md:w-[52px] md:h-[52px] rounded-2xl flex items-center justify-center pointer-events-auto",
          "bg-gradient-to-br from-indigo-500 to-purple-600",
          "shadow-lg shadow-indigo-400/30",
          "hover:shadow-xl hover:shadow-indigo-400/40 hover:scale-105 active:scale-95"
        )}
      >
        <div style={{
          transition: "transform 0.25s cubic-bezier(0.34,1.4,0.64,1), opacity 0.15s ease",
          transform: open ? "rotate(45deg) scale(0.85)" : "rotate(0deg) scale(1)",
        }}>
          {open
            ? <X className="w-5 h-5 text-white" />
            : <OrbitIcon size={22} />}
        </div>
      </button>
    </div>
  );
}
