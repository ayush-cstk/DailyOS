"use client";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CheckSquare, Dumbbell, Utensils, Settings } from "lucide-react";

// Per-page identity: a soft color wash + a giant faint icon watermark.
// Tints match the module colors used across the app.
const CONFIG = {
  home:     { glow: "#FF5E4D", glow2: "#FF9D42", Icon: LayoutDashboard },
  tasks:    { glow: "#8B5CF6", glow2: "#7C3AED", Icon: CheckSquare },
  workout:  { glow: "#3B82F6", glow2: "#2563EB", Icon: Dumbbell },
  diet:     { glow: "#10B981", glow2: "#0D9488", Icon: Utensils },
  settings: { glow: "#8A8580", glow2: "#57534E", Icon: Settings },
} as const;

function keyForPath(p: string): keyof typeof CONFIG {
  if (p.startsWith("/dashboard/tasks")) return "tasks";
  if (p.startsWith("/dashboard/workout")) return "workout";
  if (p.startsWith("/dashboard/diet")) return "diet";
  if (p.startsWith("/dashboard/settings")) return "settings";
  return "home";
}

export default function PageBackground() {
  const pathname = usePathname() || "/dashboard";
  const { glow, glow2, Icon } = CONFIG[keyForPath(pathname)];

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Soft ambient glows in the page's module color */}
      <div
        key={`a-${glow}`}
        className="absolute -top-40 -right-28 w-[560px] h-[560px] rounded-full blur-[100px] animate-fade-in"
        style={{ background: `radial-gradient(circle, ${glow}26, transparent 70%)` }}
      />
      <div
        key={`b-${glow2}`}
        className="absolute top-1/3 -left-40 w-[480px] h-[480px] rounded-full blur-[110px] animate-fade-in"
        style={{ background: `radial-gradient(circle, ${glow2}1c, transparent 70%)` }}
      />

      {/* Giant faint icon watermark — "demonstrates the page" without hitting the eyes */}
      <Icon
        key={`i-${glow}`}
        className="absolute animate-fade-in"
        style={{
          color: glow,
          opacity: 0.035,
          strokeWidth: 1,
          width: "min(70vw, 460px)",
          height: "min(70vw, 460px)",
          right: "-3rem",
          bottom: "-4rem",
          transform: "rotate(-8deg)",
        }}
      />
    </div>
  );
}
