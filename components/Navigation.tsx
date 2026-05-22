"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { CheckSquare, Dumbbell, Utensils, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard/tasks", icon: CheckSquare, label: "Tasks", color: "text-violet-600", activeBg: "bg-violet-50", activeText: "text-violet-700", dot: "bg-violet-500" },
  { href: "/dashboard/workout", icon: Dumbbell, label: "Workout", color: "text-blue-600", activeBg: "bg-blue-50", activeText: "text-blue-700", dot: "bg-blue-500" },
  { href: "/dashboard/diet", icon: Utensils, label: "Diet", color: "text-emerald-600", activeBg: "bg-emerald-50", activeText: "text-emerald-700", dot: "bg-emerald-500" },
];

export default function Navigation() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex flex-col w-60 bg-white border-r border-gray-100 min-h-screen sticky top-0 shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-gray-50">
          <Image src="/BrandLogo_Header.png" alt="DailyOS" width={32} height={32} className="rounded-xl" />
          <span className="font-black text-gray-900 text-lg tracking-tight">DailyOS</span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 p-3 space-y-1">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-3 mt-1">Menu</p>
          {navItems.map(({ href, icon: Icon, label, activeBg, activeText, dot }) => {
            const active = pathname.startsWith(href);
            return (
              <Link key={href} href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 group",
                  active ? `${activeBg} ${activeText}` : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                )}>
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-all", active ? "bg-white shadow-sm" : "bg-transparent group-hover:bg-gray-100")}>
                  <Icon className={cn("w-4 h-4", active ? activeText : "text-gray-400 group-hover:text-gray-600")} />
                </div>
                {label}
                {active && <div className={cn("ml-auto w-1.5 h-1.5 rounded-full", dot)} />}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        {session?.user && (
          <div className="p-3 border-t border-gray-100">
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-gray-50">
              {session.user.image ? (
                <Image src={session.user.image} alt="avatar" width={32} height={32} className="rounded-full ring-2 ring-white" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                  <User className="w-4 h-4 text-indigo-600" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-900 truncate">{session.user.name?.split(" ")[0]}</p>
                <p className="text-[10px] text-gray-400 truncate">{session.user.email}</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                title="Sign out"
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* ── Mobile top header ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 h-14 flex items-center px-4 safe-top">
        <div className="flex items-center gap-2">
          <Image src="/BrandLogo_Header.png" alt="DailyOS" width={28} height={28} className="rounded-lg" />
          <span className="font-black text-gray-900">DailyOS</span>
        </div>
        {/* Active section label */}
        <div className="ml-3">
          {navItems.map(({ href, label, activeText, activeBg }) => {
            if (!pathname.startsWith(href)) return null;
            return <span key={href} className={cn("text-xs font-bold px-2 py-1 rounded-lg", activeBg, activeText)}>{label}</span>;
          })}
        </div>
        {session?.user && (
          <div className="ml-auto">
            {session.user.image ? (
              <Image src={session.user.image} alt="avatar" width={28} height={28} className="rounded-full" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-indigo-600" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Mobile bottom nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-100 safe-bottom">
        <div className="flex items-stretch h-16">
          {navItems.map(({ href, icon: Icon, label, activeBg, activeText, dot }) => {
            const active = pathname.startsWith(href);
            return (
              <Link key={href} href={href}
                className={cn("flex-1 flex flex-col items-center justify-center gap-1 transition-all duration-150 relative")}>
                <div className={cn("w-10 h-8 rounded-xl flex items-center justify-center transition-all", active ? activeBg : "")}>
                  <Icon className={cn("w-5 h-5 transition-all", active ? activeText : "text-gray-400")} />
                </div>
                <span className={cn("text-[10px] font-bold", active ? activeText : "text-gray-400")}>{label}</span>
                {active && <div className={cn("absolute top-1 w-4 h-1 rounded-full", dot)} />}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile top-bar spacer */}
      <div className="md:hidden h-14 flex-shrink-0" />
    </>
  );
}
