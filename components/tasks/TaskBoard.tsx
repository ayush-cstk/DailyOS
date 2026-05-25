"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Plus, FolderOpen, Trash2, CheckCircle2, Circle, Palette, X,
  ChevronLeft, ChevronRight, AlertCircle, CalendarClock, History,
  Edit2, Flag, CalendarCheck,
} from "lucide-react";
import { cn, PROJECT_COLORS, todayString, localDateString } from "@/lib/utils";
import { getTasks, createTask, updateTask, deleteTask, getProjects, createProject } from "@/lib/firestore";
import { useToast } from "@/components/ui/Toast";
import { setTaskContext } from "@/lib/orbitContext";
import type { Task, Project, TaskPriority } from "@/types";

// ── Types ─────────────────────────────────────────────────────────────────────
type ViewMode = "schedule" | "history";

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; textClass: string; bgClass: string }> = {
  high:   { label: "High",   color: "#EF4444", textClass: "text-red-400",    bgClass: "bg-red-500/10"    },
  medium: { label: "Medium", color: "#F59E0B", textClass: "text-amber-400",  bgClass: "bg-amber-500/10"  },
  low:    { label: "Low",    color: "#6366F1", textClass: "text-indigo-400", bgClass: "bg-indigo-500/10" },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getWeekDates(anchor: string): string[] {
  const d = new Date(anchor + "T00:00:00");
  const day = d.getDay(); // 0 = Sun
  const monday = new Date(d);
  monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(monday);
    dd.setDate(monday.getDate() + i);
    return localDateString(dd);
  });
}

function weekLabel(weekDates: string[]): string {
  const first = new Date(weekDates[0] + "T00:00:00");
  const last  = new Date(weekDates[6] + "T00:00:00");
  const fm = first.toLocaleDateString("en-IN", { month: "short" });
  const lm = last.toLocaleDateString("en-IN",  { month: "short" });
  const y  = first.getFullYear();
  return fm === lm ? `${fm} ${y}` : `${fm} – ${lm} ${y}`;
}

function shortDay(dateStr: string): number {
  return parseInt(dateStr.split("-")[2], 10);
}

function formatDateLabel(dateStr: string): string {
  const today = todayString();
  const d = new Date();
  const tomorrow  = new Date(d); tomorrow.setDate(d.getDate() + 1);
  const yesterday = new Date(d); yesterday.setDate(d.getDate() - 1);
  if (dateStr === today)                     return "Today";
  if (dateStr === localDateString(tomorrow))  return "Tomorrow";
  if (dateStr === localDateString(yesterday)) return "Yesterday";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "long", month: "short", day: "numeric",
  });
}

function formatGroupDate(dateStr: string): string {
  const today = todayString();
  const d = new Date();
  const yesterday = new Date(d); yesterday.setDate(d.getDate() - 1);
  if (dateStr === today) return "Today";
  if (dateStr === localDateString(yesterday)) return "Yesterday";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit", hour12: true,
  }).toUpperCase();
}

function formatShortDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
    month: "short", day: "numeric",
  });
}

function groupByCompletionDate(tasks: Task[]): [string, Task[]][] {
  const map: Record<string, Task[]> = {};
  tasks.forEach(t => {
    if (!t.completedAt) return;
    const date = localDateString(new Date(t.completedAt));
    if (!map[date]) map[date] = [];
    map[date].push(t);
  });
  return Object.entries(map)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, list]) => [date, list.sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))]);
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function TaskBoard() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id ?? session?.user?.email ?? "";
  const { toast } = useToast();
  const today = todayString();

  // ── State ──
  const [view, setView]                   = useState<ViewMode>("schedule");
  const [projects, setProjects]           = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [tasks, setTasks]                 = useState<Task[]>([]);
  const [loading, setLoading]             = useState(false);
  const [selectedDate, setSelectedDate]   = useState(today);
  const [weekAnchor, setWeekAnchor]       = useState(today);

  const [showAddTask, setShowAddTask]         = useState(false);
  const [showAddProject, setShowAddProject]   = useState(false);
  const [editingTask, setEditingTask]         = useState<Task | null>(null);

  // ── Data loading ──
  useEffect(() => {
    if (!userId) return;
    getProjects(userId).then(ps => {
      setProjects(ps);
      if (ps.length > 0 && !selectedProject) setSelectedProject(ps[0].id);
    });
  }, [userId]);

  useEffect(() => {
    if (!userId || !selectedProject) return;
    setLoading(true);
    getTasks(userId, selectedProject).then((loaded) => {
      setTasks(loaded);
      // Write to Orbit context so chatbot knows the user's tasks
      const t = todayString();
      const todayStart = new Date(t + "T00:00:00").getTime();
      const activeProject = projects.find(p => p.id === selectedProject);
      setTaskContext({
        todayDate: t,
        pendingToday: loaded.filter(tk =>
          tk.status === "pending" && (tk.dueDate === t || (!tk.dueDate))
        ).map(tk => ({ title: tk.title, priority: tk.priority ?? undefined, projectName: activeProject?.name })),
        completedToday: loaded.filter(tk =>
          tk.status === "completed" && tk.completedAt && tk.completedAt >= todayStart
        ).map(tk => ({ title: tk.title, completedAt: tk.completedAt })),
        overdue: loaded.filter(tk =>
          tk.status === "pending" && tk.dueDate && tk.dueDate < t
        ).map(tk => ({ title: tk.title, dueDate: tk.dueDate!, priority: tk.priority ?? undefined })),
        totalPending: loaded.filter(tk => tk.status === "pending").length,
      });
    }).finally(() => setLoading(false));
  }, [userId, selectedProject, projects]);

  // ── Computed ──
  const weekDates    = getWeekDates(weekAnchor);
  const activeProject = projects.find(p => p.id === selectedProject);

  // Tasks for selected date in Schedule view
  const tasksForDate = tasks.filter(t => {
    if (t.status === "completed") return false;
    if (t.dueDate) return t.dueDate === selectedDate;
    return selectedDate === today; // legacy tasks without dueDate float to today
  });

  // Completed tasks that belong to the selected date
  const completedForDate = tasks.filter(t => {
    if (t.status !== "completed") return false;
    if (t.dueDate) return t.dueDate === selectedDate;
    if (t.completedAt) return localDateString(new Date(t.completedAt)) === selectedDate;
    return false;
  });

  // Overdue: past pending tasks — only shown when viewing today
  const overdueTasks = selectedDate === today
    ? tasks.filter(t => t.dueDate && t.dueDate < today && t.status === "pending")
    : [];

  // Dot counts per day for the week strip (pending tasks per date)
  const pendingByDate: Record<string, number> = {};
  const doneByDate:    Record<string, number> = {};
  weekDates.forEach(d => {
    pendingByDate[d] = tasks.filter(t =>
      t.status === "pending" && (t.dueDate ? t.dueDate === d : d === today)
    ).length;
    doneByDate[d] = tasks.filter(t => {
      if (t.status !== "completed") return false;
      if (t.dueDate) return t.dueDate === d;
      if (t.completedAt) return localDateString(new Date(t.completedAt)) === d;
      return false;
    }).length;
  });

  // History: all completed, grouped by completion date
  const completedAllTime = tasks.filter(t => t.status === "completed" && t.completedAt);
  const historyGroups = groupByCompletionDate(completedAllTime);

  // ── Handlers ──
  const openAddTask = () => setShowAddTask(true);

  const handleAddTask = async (
    title: string, desc: string, dueDate: string, priority: TaskPriority | "none"
  ) => {
    if (!title.trim() || !selectedProject) return;
    const newTask: Omit<Task, "id"> = {
      title: title.trim(),
      frequency: "daily",
      dueDate,
      status: "pending",
      projectId: selectedProject,
      userId,
      createdAt: Date.now(),
    };
    if (desc.trim()) newTask.description = desc.trim();
    if (priority !== "none") newTask.priority = priority;
    const created = await createTask(newTask);
    setTasks(prev => [created, ...prev]);
    setShowAddTask(false);
    toast("Task added!", "success");
  };

  const handleToggleTask = async (task: Task) => {
    const newStatus = task.status === "pending" ? "completed" : "pending";
    const updates: Partial<Task> = { status: newStatus };
    if (newStatus === "completed") updates.completedAt = Date.now();
    await updateTask(task.id, updates);
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, ...updates } : t));
    if (newStatus === "completed") toast("Task completed! 🎉", "success");
  };

  const handleDeleteTask = async (taskId: string) => {
    await deleteTask(taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));
    toast("Task deleted", "info");
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    // Filter undefined values before sending to Firestore
    const clean = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    ) as Partial<Task>;
    await updateTask(taskId, clean);
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...clean } : t));
    setEditingTask(null);
    toast("Task updated", "success");
  };

  const handleAddProject = async (name: string, color: string) => {
    const p = await createProject(userId, name.trim(), color);
    setProjects(prev => [...prev, p]);
    setSelectedProject(p.id);
    toast(`Project "${p.name}" created`, "success");
  };

  const navigateWeek = (dir: -1 | 1) => {
    const anchor = new Date(weekAnchor + "T00:00:00");
    anchor.setDate(anchor.getDate() + dir * 7);
    const newAnchor = localDateString(anchor);
    setWeekAnchor(newAnchor);
    const newWeek = getWeekDates(newAnchor);
    if (!newWeek.includes(selectedDate)) setSelectedDate(newWeek[0]);
  };

  const jumpToToday = () => { setWeekAnchor(today); setSelectedDate(today); };

  // ── Render ──
  return (
    <div className="animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: "var(--text-1)" }}>Tasks</h1>
          <p className="text-sm mt-0.5 font-medium" style={{ color: "var(--text-3)" }}>Stay on top of what matters</p>
        </div>
        <button onClick={openAddTask} className="btn-primary flex items-center gap-1.5 text-sm flex-shrink-0">
          <Plus className="w-4 h-4" /> New task
        </button>
      </div>

      {/* ── Project strip ── */}
      <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1 scrollbar-none">
        {projects.map(p => {
          const active = selectedProject === p.id;
          return (
            <button key={p.id} onClick={() => setSelectedProject(p.id)}
              className={cn("flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-150 border",
                active ? "text-white border-transparent shadow-sm" : "hover:border-white/10")}
              style={active ? { backgroundColor: p.color } : { background: "var(--surface-2)", color: "var(--text-2)", border: "1px solid var(--border)" }}>
              <span className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: active ? "rgba(255,255,255,0.6)" : p.color }} />
              {p.name}
            </button>
          );
        })}
        <button onClick={() => setShowAddProject(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all border border-dashed hover:border-indigo-400/40 hover:text-indigo-400"
          style={{ color: "var(--text-3)", borderColor: "var(--border)", background: "var(--surface-2)" }}>
          <Plus className="w-3.5 h-3.5" /> New project
        </button>
      </div>

      {/* ── No project state ── */}
      {!selectedProject ? (
        <div className="text-center py-16 card">
          <FolderOpen className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-3)" }} />
          <p className="font-bold" style={{ color: "var(--text-2)" }}>No project selected</p>
          <p className="text-sm mt-1" style={{ color: "var(--text-3)" }}>Create a project to start tracking tasks</p>
          <button onClick={() => setShowAddProject(true)} className="btn-primary mt-4 text-sm">Create project</button>
        </div>
      ) : (
        <>
          {/* ── View toggle ── */}
          <div className="flex gap-1 p-1 rounded-xl mb-5 w-fit"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border-subtle)" }}>
            {([
              { id: "schedule" as ViewMode, icon: CalendarClock, label: "Schedule" },
              { id: "history"  as ViewMode, icon: History,       label: "History"  },
            ] as const).map(({ id, icon: Icon, label }) => (
              <button key={id} onClick={() => setView(id)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                style={view === id
                  ? { background: "var(--surface-0)", color: "var(--text-1)", boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }
                  : { color: "var(--text-3)" }}>
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3,4].map(i => <div key={i} className="h-16 skeleton" />)}
            </div>
          ) : view === "schedule" ? (
            <ScheduleView
              weekDates={weekDates}
              weekAnchor={weekAnchor}
              selectedDate={selectedDate}
              today={today}
              pendingByDate={pendingByDate}
              doneByDate={doneByDate}
              tasksForDate={tasksForDate}
              completedForDate={completedForDate}
              overdueTasks={overdueTasks}
              projectColor={activeProject?.color}
              onSelectDate={setSelectedDate}
              onNavigateWeek={navigateWeek}
              onJumpToToday={jumpToToday}
              onToggle={handleToggleTask}
              onDelete={handleDeleteTask}
              onEdit={setEditingTask}
              onAddTask={openAddTask}
            />
          ) : (
            <HistoryView
              groups={historyGroups}
              projectColor={activeProject?.color}
              onToggle={handleToggleTask}
              onDelete={handleDeleteTask}
            />
          )}
        </>
      )}

      {/* ── Modals ── */}
      {showAddTask && (
        <AddTaskModal
          defaultDate={selectedDate}
          onAdd={handleAddTask}
          onClose={() => setShowAddTask(false)}
        />
      )}
      {editingTask && (
        <EditTaskModal
          task={editingTask}
          onSave={handleUpdateTask}
          onClose={() => setEditingTask(null)}
        />
      )}
      {showAddProject && (
        <AddProjectModal
          onAdd={handleAddProject}
          onClose={() => setShowAddProject(false)}
        />
      )}
    </div>
  );
}

// ── Schedule View ─────────────────────────────────────────────────────────────
function ScheduleView({
  weekDates, weekAnchor, selectedDate, today,
  pendingByDate, doneByDate,
  tasksForDate, completedForDate, overdueTasks,
  projectColor,
  onSelectDate, onNavigateWeek, onJumpToToday,
  onToggle, onDelete, onEdit, onAddTask,
}: {
  weekDates: string[]; weekAnchor: string; selectedDate: string; today: string;
  pendingByDate: Record<string, number>; doneByDate: Record<string, number>;
  tasksForDate: Task[]; completedForDate: Task[]; overdueTasks: Task[];
  projectColor?: string;
  onSelectDate: (d: string) => void; onNavigateWeek: (dir: -1 | 1) => void; onJumpToToday: () => void;
  onToggle: (t: Task) => void; onDelete: (id: string) => void; onEdit: (t: Task) => void;
  onAddTask: () => void;
}) {
  const isCurrentWeek = weekDates.includes(today);
  const totalForDate = tasksForDate.length + overdueTasks.length;

  return (
    <>
      {/* ── Week strip ── */}
      <div className="card mb-5 p-3 sm:p-4">
        {/* Week label + nav */}
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => onNavigateWeek(-1)}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-white/5"
            style={{ color: "var(--text-2)" }}>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold" style={{ color: "var(--text-2)" }}>{weekLabel(weekDates)}</span>
            {!isCurrentWeek && (
              <button onClick={onJumpToToday}
                className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-all">
                Today
              </button>
            )}
          </div>
          <button onClick={() => onNavigateWeek(1)}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-white/5"
            style={{ color: "var(--text-2)" }}>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1">
          {weekDates.map((date, i) => {
            const isToday    = date === today;
            const isSelected = date === selectedDate;
            const isPast     = date < today;
            const pending    = pendingByDate[date] ?? 0;
            const done       = doneByDate[date] ?? 0;
            const hasTasks   = pending + done > 0;

            return (
              <button key={date} onClick={() => onSelectDate(date)}
                className={cn(
                  "flex flex-col items-center py-2.5 rounded-xl transition-all duration-150 relative",
                  isSelected ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25" : "hover:bg-white/5"
                )}>
                <span className={cn("text-[10px] font-bold leading-none mb-1.5",
                  isSelected ? "text-indigo-200" : isPast ? "opacity-40" : "")}
                  style={!isSelected ? { color: "var(--text-3)" } : undefined}>
                  {DAY_LABELS[i]}
                </span>
                <span className={cn("text-sm font-black leading-none",
                  isToday && !isSelected ? "text-indigo-400" : isPast && !isSelected ? "opacity-40" : "")}
                  style={!isSelected ? { color: "var(--text-1)" } : undefined}>
                  {shortDay(date)}
                </span>
                {/* Dot indicators */}
                <div className="flex gap-0.5 mt-1.5 h-1.5">
                  {pending > 0 && (
                    <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0",
                      isSelected ? "bg-white/70" : "bg-indigo-400")} />
                  )}
                  {done > 0 && (
                    <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0",
                      isSelected ? "bg-white/30" : "bg-emerald-400")} />
                  )}
                  {!hasTasks && <span className="w-1.5 h-1.5" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Date heading ── */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-black" style={{ color: "var(--text-1)" }}>{formatDateLabel(selectedDate)}</h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
            {totalForDate === 0
              ? "No tasks"
              : `${tasksForDate.length} pending${overdueTasks.length > 0 ? ` · ${overdueTasks.length} overdue` : ""}${completedForDate.length > 0 ? ` · ${completedForDate.length} done` : ""}`}
          </p>
        </div>
        <button onClick={onAddTask}
          className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-all hover:bg-indigo-500/10 hover:text-indigo-400"
          style={{ color: "var(--text-3)", border: "1px solid var(--border)" }}>
          <Plus className="w-3.5 h-3.5" /> Add task
        </button>
      </div>

      {/* ── Overdue section (today only) ── */}
      {overdueTasks.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-2.5 px-1">
            <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
            <span className="text-xs font-black text-red-400 uppercase tracking-wider">
              Overdue · {overdueTasks.length}
            </span>
          </div>
          <div className="space-y-2">
            {overdueTasks.map(t => (
              <TaskCard key={t.id} task={t} isOverdue
                onToggle={onToggle} onDelete={onDelete} onEdit={onEdit}
                color={projectColor} />
            ))}
          </div>
          {/* Divider */}
          <div className="h-px mt-5" style={{ background: "var(--border)" }} />
          <div className="mt-4" />
        </div>
      )}

      {/* ── Pending tasks ── */}
      {tasksForDate.length === 0 && overdueTasks.length === 0 ? (
        <div className="text-center py-14 card border-dashed border-2" style={{ borderColor: "var(--border)" }}>
          <CalendarCheck className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--text-3)" }} />
          <p className="font-bold text-sm" style={{ color: "var(--text-2)" }}>
            {selectedDate < todayString() ? "Nothing was scheduled here" : "Clear schedule"}
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>
            {selectedDate < todayString() ? "Completed tasks are shown below" : "Add a task to get started"}
          </p>
          {selectedDate >= todayString() && (
            <button onClick={onAddTask}
              className="mt-3 text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
              + Add task
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2 stagger">
          {tasksForDate.map(t => (
            <TaskCard key={t.id} task={t}
              onToggle={onToggle} onDelete={onDelete} onEdit={onEdit}
              color={projectColor} />
          ))}
        </div>
      )}

      {/* ── Completed for this date ── */}
      {completedForDate.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px flex-1" style={{ background: "var(--border)" }} />
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
              Completed · {completedForDate.length}
            </p>
            <div className="h-px flex-1" style={{ background: "var(--border)" }} />
          </div>
          <div className="space-y-2">
            {completedForDate.map(t => (
              <TaskCard key={t.id} task={t}
                onToggle={onToggle} onDelete={onDelete} onEdit={onEdit}
                color={projectColor} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// ── History View ──────────────────────────────────────────────────────────────
function HistoryView({
  groups, projectColor, onToggle, onDelete,
}: {
  groups: [string, Task[]][];
  projectColor?: string;
  onToggle: (t: Task) => void;
  onDelete: (id: string) => void;
}) {
  if (groups.length === 0) {
    return (
      <div className="text-center py-16 card border-dashed border-2" style={{ borderColor: "var(--border)" }}>
        <History className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-3)" }} />
        <p className="font-bold text-sm" style={{ color: "var(--text-2)" }}>No history yet</p>
        <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>Complete some tasks to see your history here</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {groups.map(([date, taskList]) => (
        <div key={date}>
          {/* Date group header */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-emerald-500/10">
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black" style={{ color: "var(--text-1)" }}>{formatGroupDate(date)}</p>
              <p className="text-xs" style={{ color: "var(--text-3)" }}>
                {taskList.length} task{taskList.length !== 1 ? "s" : ""} completed
              </p>
            </div>
          </div>

          {/* Timeline line + tasks */}
          <div className="relative ml-4 pl-6 space-y-2"
            style={{ borderLeft: "2px dashed var(--border)" }}>
            {taskList.map(t => (
              <HistoryTaskCard key={t.id} task={t} color={projectColor}
                onToggle={onToggle} onDelete={onDelete} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Task Card ─────────────────────────────────────────────────────────────────
function TaskCard({
  task, onToggle, onDelete, onEdit, color, isOverdue = false,
}: {
  task: Task; onToggle: (t: Task) => void; onDelete: (id: string) => void;
  onEdit: (t: Task) => void; color?: string; isOverdue?: boolean;
}) {
  const done     = task.status === "completed";
  const priority = task.priority;
  const today    = todayString();

  // Border color priority: overdue > task priority > project color
  const borderColor = isOverdue
    ? "#EF4444"
    : priority && PRIORITY_CONFIG[priority]
      ? PRIORITY_CONFIG[priority].color
      : color ?? "#6366F1";

  return (
    <div
      className={cn(
        "card flex items-start gap-3 group transition-all duration-200 animate-slide-up",
        done ? "opacity-50" : isOverdue ? "" : "hover:border-white/10",
        isOverdue && !done ? "bg-red-500/[0.03]" : "",
      )}
      style={{ borderLeftColor: borderColor, borderLeftWidth: "3px" }}>

      {/* Toggle button */}
      <button onClick={() => onToggle(task)}
        className="flex-shrink-0 active:scale-90 transition-transform mt-0.5">
        {done
          ? <CheckCircle2 className="w-5 h-5 animate-checkmark" style={{ color: borderColor }} />
          : isOverdue
            ? <AlertCircle className="w-5 h-5 text-red-400" />
            : <Circle className="w-5 h-5 text-gray-300 dark:text-[#333] hover:text-gray-400 transition-colors" />}
      </button>

      {/* Body — tap to edit on mobile */}
      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => !done && onEdit(task)}>
        <p className={cn("text-sm font-semibold leading-snug", done && "line-through opacity-40")}
          style={{ color: isOverdue && !done ? "#F87171" : "var(--text-1)" }}>
          {task.title}
        </p>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-1.5 mt-1">
          {task.description && (
            <p className="text-xs truncate max-w-[180px] sm:max-w-[260px]" style={{ color: "var(--text-3)" }}>
              {task.description}
            </p>
          )}
          {isOverdue && task.dueDate && !done && (
            <span className="inline-flex items-center text-[10px] font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded-md">
              Due {formatShortDate(task.dueDate)}
            </span>
          )}
          {task.dueDate && !isOverdue && task.dueDate !== today && !done && (
            <span className="inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
              style={{ color: "var(--text-3)", background: "var(--surface-2)" }}>
              {formatShortDate(task.dueDate)}
            </span>
          )}
          {priority && !done && (
            <span className={cn("inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md",
              PRIORITY_CONFIG[priority].textClass, PRIORITY_CONFIG[priority].bgClass)}>
              <Flag className="w-2.5 h-2.5" />
              {PRIORITY_CONFIG[priority].label}
            </span>
          )}
          {done && task.completedAt && (
            <span className="text-[10px]" style={{ color: "var(--text-3)" }}>
              {formatTime(task.completedAt)}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 flex-shrink-0 mt-0.5">
        {!done && (
          <button onClick={() => onEdit(task)}
            className="p-1.5 rounded-lg transition-all md:opacity-0 md:group-hover:opacity-100 hover:bg-white/5"
            style={{ color: "var(--text-3)" }}>
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        )}
        <button onClick={e => { e.stopPropagation(); onDelete(task.id); }}
          className="p-1.5 rounded-lg hover:text-red-400 hover:bg-red-500/10 active:scale-90 transition-all"
          style={{ color: "var(--text-3)" }}>
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── History Task Card ─────────────────────────────────────────────────────────
function HistoryTaskCard({
  task, color, onToggle, onDelete,
}: {
  task: Task; color?: string;
  onToggle: (t: Task) => void; onDelete: (id: string) => void;
}) {
  return (
    <div className="card flex items-start gap-3 group animate-slide-up"
      style={{ borderLeftColor: color ?? "#6366F1", borderLeftWidth: "2px" }}>
      <button onClick={() => onToggle(task)} className="flex-shrink-0 mt-0.5 active:scale-90 transition-transform">
        <CheckCircle2 className="w-4 h-4" style={{ color: color ?? "#6366F1" }} />
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold line-through opacity-40" style={{ color: "var(--text-1)" }}>
          {task.title}
        </p>
        {task.description && (
          <p className="text-xs mt-0.5 opacity-40" style={{ color: "var(--text-2)" }}>{task.description}</p>
        )}
        {task.dueDate && (
          <p className="text-[10px] mt-0.5" style={{ color: "var(--text-3)" }}>
            Scheduled {formatShortDate(task.dueDate)}
          </p>
        )}
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        {task.completedAt && (
          <span className="text-[10px] font-semibold" style={{ color: "var(--text-3)" }}>
            {formatTime(task.completedAt)}
          </span>
        )}
        <button onClick={e => { e.stopPropagation(); onDelete(task.id); }}
          className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-500/10 transition-all"
          style={{ color: "var(--text-3)" }}>
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Priority Selector ─────────────────────────────────────────────────────────
function PrioritySelector({
  value, onChange,
}: {
  value: TaskPriority | "none"; onChange: (v: TaskPriority | "none") => void;
}) {
  const options: { id: TaskPriority | "none"; label: string; textClass: string; bgActive: string }[] = [
    { id: "none",   label: "None",   textClass: "",                          bgActive: "bg-white/10"          },
    { id: "low",    label: "Low",    textClass: "text-indigo-400",           bgActive: "bg-indigo-500/15"     },
    { id: "medium", label: "Medium", textClass: "text-amber-400",            bgActive: "bg-amber-500/15"      },
    { id: "high",   label: "High",   textClass: "text-red-400",              bgActive: "bg-red-500/15"        },
  ];

  return (
    <div>
      <label className="label">Priority</label>
      <div className="flex gap-1.5">
        {options.map(o => (
          <button key={o.id} onClick={() => onChange(o.id)}
            className={cn("flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all border",
              value === o.id ? `${o.textClass} ${o.bgActive}` : "hover:opacity-80")}
            style={value === o.id
              ? { borderColor: "transparent" }
              : { color: "var(--text-3)", border: "1px solid var(--border)" }}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Add Task Modal ────────────────────────────────────────────────────────────
function AddTaskModal({
  defaultDate, onAdd, onClose,
}: {
  defaultDate: string;
  onAdd: (title: string, desc: string, dueDate: string, priority: TaskPriority | "none") => void;
  onClose: () => void;
}) {
  const [title, setTitle]       = useState("");
  const [desc, setDesc]         = useState("");
  const [dueDate, setDueDate]   = useState(defaultDate);
  const [priority, setPriority] = useState<TaskPriority | "none">("none");

  const handleAdd = () => {
    if (!title.trim()) return;
    onAdd(title, desc, dueDate, priority);
  };

  return (
    <Modal title="New task" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="label">Task title *</label>
          <input autoFocus className="input" placeholder="What needs to be done?"
            value={title} onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAdd()} />
        </div>
        <div>
          <label className="label">Notes (optional)</label>
          <textarea className="input resize-none" rows={2} placeholder="Add details..."
            value={desc} onChange={e => setDesc(e.target.value)} />
        </div>
        <div>
          <label className="label">Schedule for</label>
          <input type="date" className="input" value={dueDate}
            onChange={e => setDueDate(e.target.value)} />
        </div>
        <PrioritySelector value={priority} onChange={setPriority} />
        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="btn-secondary flex-1 text-sm">Cancel</button>
          <button onClick={handleAdd} disabled={!title.trim()} className="btn-primary flex-1 text-sm">
            Add task
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Edit Task Modal ───────────────────────────────────────────────────────────
function EditTaskModal({
  task, onSave, onClose,
}: {
  task: Task;
  onSave: (id: string, updates: Partial<Task>) => void;
  onClose: () => void;
}) {
  const [title, setTitle]       = useState(task.title);
  const [desc, setDesc]         = useState(task.description ?? "");
  const [dueDate, setDueDate]   = useState(task.dueDate ?? todayString());
  const [priority, setPriority] = useState<TaskPriority | "none">(task.priority ?? "none");

  const handleSave = () => {
    if (!title.trim()) return;
    const updates: Partial<Task> = {
      title: title.trim(),
      dueDate,
      description: desc.trim() || "",
    };
    if (priority !== "none") {
      updates.priority = priority;
    } else {
      updates.priority = null; // clear it
    }
    onSave(task.id, updates);
  };

  return (
    <Modal title="Edit task" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="label">Task title *</label>
          <input autoFocus className="input" value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSave()} />
        </div>
        <div>
          <label className="label">Notes</label>
          <textarea className="input resize-none" rows={2} value={desc}
            onChange={e => setDesc(e.target.value)} />
        </div>
        <div>
          <label className="label">Scheduled for</label>
          <input type="date" className="input" value={dueDate}
            onChange={e => setDueDate(e.target.value)} />
        </div>
        <PrioritySelector value={priority} onChange={setPriority} />
        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="btn-secondary flex-1 text-sm">Cancel</button>
          <button onClick={handleSave} disabled={!title.trim()} className="btn-primary flex-1 text-sm">
            Save changes
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Add Project Modal ─────────────────────────────────────────────────────────
function AddProjectModal({
  onAdd, onClose,
}: {
  onAdd: (name: string, color: string) => void;
  onClose: () => void;
}) {
  const [name, setName]   = useState("");
  const [color, setColor] = useState(PROJECT_COLORS[0]);

  return (
    <Modal title="New project" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="label">Project name *</label>
          <input autoFocus className="input" placeholder="e.g. Work, Personal, Health"
            value={name} onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && name.trim() && onAdd(name, color)} />
        </div>
        <div>
          <label className="label flex items-center gap-1.5"><Palette className="w-3.5 h-3.5" /> Color</label>
          <div className="flex gap-2 flex-wrap">
            {PROJECT_COLORS.map(c => (
              <button key={c} onClick={() => setColor(c)}
                className={cn("w-9 h-9 rounded-full transition-all duration-150",
                  color === c ? "ring-2 ring-offset-2 ring-indigo-400 ring-offset-transparent scale-110" : "hover:scale-105")}
                style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="btn-secondary flex-1 text-sm">Cancel</button>
          <button onClick={() => name.trim() && onAdd(name, color)}
            disabled={!name.trim()} className="btn-primary flex-1 text-sm">Create</button>
        </div>
      </div>
    </Modal>
  );
}

// ── Modal Wrapper ─────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pt-4 pb-24 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative rounded-2xl shadow-2xl w-full max-w-md p-5 animate-slide-up max-h-[80dvh] overflow-y-auto"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border)", boxShadow: "0 24px 80px rgba(0,0,0,0.4)" }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-black" style={{ color: "var(--text-1)" }}>{title}</h3>
          <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
