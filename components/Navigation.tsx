"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import Image from "next/image";
import { CheckSquare, Dumbbell, Utensils, LogOut, User, Sun, Moon, ChevronDown, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import NotificationBell from "@/components/ui/NotificationBell";

const navItems = [
  {
    href: "/dashboard",         icon: LayoutDashboard, label: "Home", exact: true,
    activeBg: "bg-orange-50 dark:bg-transparent",
    activeText: "text-orange-700 dark:text-white",
    activeBorder: "dark:border-l-orange-500",
    activeGlow: "dark:shadow-[0_0_12px_rgba(249,115,22,0.2)]",
    iconActive: "text-orange-600 dark:text-orange-400",
    dot: "bg-orange-500",
    mobileActiveBg: "bg-orange-50 dark:bg-orange-500/10",
    mobileActiveText: "text-orange-700 dark:text-orange-300",
  },
  {
    href: "/dashboard/tasks",   icon: CheckSquare, label: "Tasks",
    activeBg: "bg-violet-50 dark:bg-transparent",
    activeText: "text-violet-700 dark:text-white",
    activeBorder: "dark:border-l-violet-500",
    activeGlow: "dark:shadow-[0_0_12px_rgba(139,92,246,0.2)]",
    iconActive: "text-violet-600 dark:text-violet-400",
    dot: "bg-violet-500",
    mobileActiveBg: "bg-violet-50 dark:bg-violet-500/10",
    mobileActiveText: "text-violet-700 dark:text-violet-300",
  },
  {
    href: "/dashboard/workout", icon: Dumbbell,    label: "Workout",
    activeBg: "bg-blue-50 dark:bg-transparent",
    activeText: "text-blue-700 dark:text-white",
    activeBorder: "dark:border-l-blue-500",
    activeGlow: "dark:shadow-[0_0_12px_rgba(59,130,246,0.2)]",
    iconActive: "text-blue-600 dark:text-blue-400",
    dot: "bg-blue-500",
    mobileActiveBg: "bg-blue-50 dark:bg-blue-500/10",
    mobileActiveText: "text-blue-700 dark:text-blue-300",
  },
  {
    href: "/dashboard/diet",    icon: Utensils,    label: "Diet",
    activeBg: "bg-emerald-50 dark:bg-transparent",
    activeText: "text-emerald-700 dark:text-white",
    activeBorder: "dark:border-l-emerald-500",
    activeGlow: "dark:shadow-[0_0_12px_rgba(16,185,129,0.2)]",
    iconActive: "text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
    mobileActiveBg: "bg-emerald-50 dark:bg-emerald-500/10",
    mobileActiveText: "text-emerald-700 dark:text-emerald-300",
  },
];

function ThemeToggle({ iconSize = "w-4 h-4" }: { iconSize?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-8 h-8" />;

  const isDark = theme === "dark";
  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="p-1.5 rounded-lg transition-all"
      style={{ color: "var(--text-3)" }}
      onMouseEnter={e => (e.currentTarget.style.color = "var(--text-1)")}
      onMouseLeave={e => (e.currentTarget.style.color = "var(--text-3)")}
    >
      {isDark
        ? <Sun className={iconSize} />
        : <Moon className={iconSize} />}
    </button>
  );
}

export default function Navigation() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  const logoSrc = mounted && resolvedTheme === "dark"
    ? "/BrandLogo_Header_DarkMode.png"
    : "/BrandLogo_Header.png";

  // Close profile menu on outside click
  useEffect(() => {
    if (!showProfileMenu) return;
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    const t = setTimeout(() => document.addEventListener("mousedown", handler), 50);
    return () => { clearTimeout(t); document.removeEventListener("mousedown", handler); };
  }, [showProfileMenu]);

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex flex-col w-60 min-h-screen sticky top-0 shrink-0"
        style={{ background: "var(--surface-0)", borderRight: "1px solid var(--border)" }}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <Image src={logoSrc} alt="DailyOS" width={32} height={32} className="rounded-xl" />
          <span className="font-black text-lg tracking-tight" style={{ color: "var(--text-1)" }}>DailyOS</span>
          <div className="ml-auto flex items-center gap-1">
            <NotificationBell />
            <ThemeToggle />
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 p-3 space-y-0.5">
          <p className="text-[10px] font-bold uppercase tracking-widest px-2 mb-3 mt-1" style={{ color: "var(--text-3)" }}>Menu</p>
          {navItems.map(({ href, icon: Icon, label, activeBg, activeText, activeBorder, activeGlow, iconActive, dot, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link key={href} href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 group relative border-l-2",
                  active
                    ? `${activeBg} ${activeText} ${activeBorder} ${activeGlow} border-l-2`
                    : "border-l-transparent hover:bg-gray-50 dark:hover:bg-white/[0.04] hover:text-gray-800 dark:hover:text-white"
                )}
                style={active ? undefined : { color: "var(--text-2)" }}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                  active ? "bg-white/80 dark:bg-white/[0.06] shadow-sm" : "bg-transparent group-hover:bg-gray-100 dark:group-hover:bg-white/[0.04]"
                )}>
                  <Icon className={cn("w-4 h-4 transition-all", active ? iconActive : "text-gray-400 dark:text-[#555] group-hover:text-gray-600 dark:group-hover:text-gray-300")} />
                </div>
                {label}
                {active && <div className={cn("ml-auto w-1.5 h-1.5 rounded-full", dot)} />}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        {session?.user && (
          <div className="p-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl" style={{ background: "var(--surface-2)", border: "1px solid var(--border-subtle)" }}>
              {session.user.image ? (
                <Image src={session.user.image} alt="avatar" width={32} height={32} className="rounded-full ring-2 ring-white/10" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-indigo-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate" style={{ color: "var(--text-1)" }}>{session.user.name?.split(" ")[0]}</p>
                <p className="text-[10px] truncate" style={{ color: "var(--text-3)" }}>{session.user.email}</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                title="Sign out"
                className="p-1.5 rounded-lg transition-all hover:bg-red-500/10 hover:text-red-400"
                style={{ color: "var(--text-3)" }}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* ── Mobile top header ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 flex items-center px-4 safe-top bg-white/90 dark:bg-black/80 backdrop-blur-xl border-b border-gray-100 dark:border-white/[0.06]">
        {/* empty: using Tailwind dark: classes now */}
        <div className="flex items-center gap-2">
          <Image src={logoSrc} alt="DailyOS" width={28} height={28} className="rounded-lg" />
          <span className="font-black" style={{ color: "var(--text-1)" }}>DailyOS</span>
        </div>
        {/* Active section label */}
        <div className="ml-3">
          {navItems.map(({ href, label, mobileActiveBg, mobileActiveText, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            if (!active) return null;
            return <span key={href} className={cn("text-xs font-bold px-2 py-1 rounded-lg", mobileActiveBg, mobileActiveText)}>{label}</span>;
          })}
        </div>
        <div className="ml-auto flex items-center gap-1">
          <NotificationBell />
          <ThemeToggle iconSize="w-3.5 h-3.5" />
          {session?.user && (
            <div ref={profileRef} className="relative">
              <button
                onClick={() => setShowProfileMenu(v => !v)}
                className="flex items-center gap-1.5 p-1 rounded-xl active:scale-95 transition-all"
                style={{ background: "transparent" }}
              >
                {session.user.image ? (
                  <Image src={session.user.image} alt="avatar" width={28} height={28} className="rounded-full ring-2 ring-white/10" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-indigo-500/10 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                )}
                <ChevronDown className={cn("w-3 h-3 transition-transform duration-200", showProfileMenu && "rotate-180")} style={{ color: "var(--text-3)" }} />
              </button>

              {/* Profile dropdown */}
              {showProfileMenu && (
                <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl overflow-hidden z-50 animate-scale-in"
                  style={{
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.04)",
                  }}>
                  {/* User info */}
                  <div className="px-4 py-3.5" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <p className="text-sm font-bold truncate" style={{ color: "var(--text-1)" }}>{session.user.name}</p>
                    <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-3)" }}>{session.user.email}</p>
                  </div>
                  {/* Sign out */}
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-semibold text-red-400 hover:bg-red-500/10 active:scale-[0.98] transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile bottom nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 safe-bottom bg-white/95 dark:bg-black/90 backdrop-blur-2xl border-t border-gray-100 dark:border-white/[0.06]">
        <div className="flex items-stretch h-16">
          {navItems.map(({ href, icon: Icon, label, mobileActiveBg, mobileActiveText, dot, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link key={href} href={href}
                className={cn("flex-1 flex flex-col items-center justify-center gap-1 transition-all duration-150 relative active:scale-95")}>
                <div className={cn("w-11 h-8 rounded-xl flex items-center justify-center transition-all duration-150", active ? mobileActiveBg : "")}>
                  <Icon className={cn("w-[22px] h-[22px] transition-all", active ? mobileActiveText : "text-gray-400 dark:text-[#444]")} />
                </div>
                <span className={cn("text-[10px] font-bold leading-none", active ? mobileActiveText : "text-gray-400 dark:text-[#444]")}>{label}</span>
                {active && <div className={cn("absolute top-1.5 w-5 h-1 rounded-full", dot)} />}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile top-bar spacer — pushes content below the fixed header */}
      <div className="md:hidden h-14 flex-shrink-0" />
    </>
  );
}
