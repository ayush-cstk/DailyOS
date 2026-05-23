"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import Image from "next/image";
import { CheckSquare, Dumbbell, Utensils, LogOut, User, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/dashboard/tasks",   icon: CheckSquare, label: "Tasks",   color: "text-violet-600", activeBg: "bg-violet-50 dark:bg-violet-950/50", activeText: "text-violet-700 dark:text-violet-300", dot: "bg-violet-500" },
  { href: "/dashboard/workout", icon: Dumbbell,    label: "Workout", color: "text-blue-600",   activeBg: "bg-blue-50 dark:bg-blue-950/50",     activeText: "text-blue-700 dark:text-blue-300",   dot: "bg-blue-500"   },
  { href: "/dashboard/diet",    icon: Utensils,    label: "Diet",    color: "text-emerald-600", activeBg: "bg-emerald-50 dark:bg-emerald-950/50", activeText: "text-emerald-700 dark:text-emerald-300", dot: "bg-emerald-500" },
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
      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
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

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex flex-col w-60 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 min-h-screen sticky top-0 shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-gray-50 dark:border-gray-800">
          <Image src="/BrandLogo_Header.png" alt="DailyOS" width={32} height={32} className="rounded-xl" />
          <span className="font-black text-gray-900 dark:text-white text-lg tracking-tight">DailyOS</span>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 p-3 space-y-1">
          <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest px-2 mb-3 mt-1">Menu</p>
          {navItems.map(({ href, icon: Icon, label, activeBg, activeText, dot }) => {
            const active = pathname.startsWith(href);
            return (
              <Link key={href} href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 group",
                  active ? `${activeBg} ${activeText}` : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-100"
                )}>
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-all", active ? "bg-white dark:bg-gray-800 shadow-sm" : "bg-transparent group-hover:bg-gray-100 dark:group-hover:bg-gray-700")}>
                  <Icon className={cn("w-4 h-4", active ? activeText : "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300")} />
                </div>
                {label}
                {active && <div className={cn("ml-auto w-1.5 h-1.5 rounded-full", dot)} />}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        {session?.user && (
          <div className="p-3 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800">
              {session.user.image ? (
                <Image src={session.user.image} alt="avatar" width={32} height={32} className="rounded-full ring-2 ring-white dark:ring-gray-700" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                  <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{session.user.name?.split(" ")[0]}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{session.user.email}</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                title="Sign out"
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* ── Mobile top header ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 h-14 flex items-center px-4 safe-top">
        <div className="flex items-center gap-2">
          <Image src="/BrandLogo_Header.png" alt="DailyOS" width={28} height={28} className="rounded-lg" />
          <span className="font-black text-gray-900 dark:text-white">DailyOS</span>
        </div>
        {/* Active section label */}
        <div className="ml-3">
          {navItems.map(({ href, label, activeText, activeBg }) => {
            if (!pathname.startsWith(href)) return null;
            return <span key={href} className={cn("text-xs font-bold px-2 py-1 rounded-lg", activeBg, activeText)}>{label}</span>;
          })}
        </div>
        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle iconSize="w-3.5 h-3.5" />
          {session?.user && (
            <>
              {session.user.image ? (
                <Image src={session.user.image} alt="avatar" width={28} height={28} className="rounded-full" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Mobile bottom nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/98 dark:bg-gray-900/98 backdrop-blur-lg border-t border-gray-100 dark:border-gray-800 safe-bottom">
        <div className="flex items-stretch h-16">
          {navItems.map(({ href, icon: Icon, label, activeBg, activeText, dot }) => {
            const active = pathname.startsWith(href);
            return (
              <Link key={href} href={href}
                className={cn("flex-1 flex flex-col items-center justify-center gap-1 transition-all duration-150 relative active:scale-95")}>
                <div className={cn("w-11 h-8 rounded-xl flex items-center justify-center transition-all duration-150", active ? activeBg : "")}>
                  <Icon className={cn("w-[22px] h-[22px] transition-all", active ? activeText : "text-gray-400 dark:text-gray-500")} />
                </div>
                <span className={cn("text-[10px] font-bold leading-none", active ? activeText : "text-gray-400 dark:text-gray-500")}>{label}</span>
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
