"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Plus, FolderOpen, Trash2, CheckCircle2, Circle, Calendar, CalendarDays, Palette, X, TrendingUp } from "lucide-react";
import { cn, generateId, PROJECT_COLORS, todayString } from "@/lib/utils";
import { getTasks, createTask, updateTask, deleteTask, getProjects, createProject } from "@/lib/firestore";
import { useToast } from "@/components/ui/Toast";
import type { Task, Project, TaskFrequency } from "@/types";

type Tab = "daily" | "weekly";

export default function TaskBoard() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id ?? session?.user?.email ?? "";
  const { toast } = useToast();

  const [tab, setTab] = useState<Tab>("daily");
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddProject, setShowAddProject] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectColor, setNewProjectColor] = useState(PROJECT_COLORS[0]);

  useEffect(() => {
    if (!userId) return;
    getProjects(userId).then((ps) => {
      setProjects(ps);
      if (ps.length > 0 && !selectedProject) setSelectedProject(ps[0].id);
    });
  }, [userId]);

  useEffect(() => {
    if (!userId || !selectedProject) return;
    setLoading(true);
    getTasks(userId, selectedProject).then(setTasks).finally(() => setLoading(false));
  }, [userId, selectedProject]);

  const filteredTasks = tasks.filter((t) => t.frequency === tab);
  const pendingTasks = filteredTasks.filter((t) => t.status === "pending");
  const completedTasks = filteredTasks.filter((t) => t.status === "completed");
  const activeProject = projects.find((p) => p.id === selectedProject);
  const completionPct = filteredTasks.length > 0 ? Math.round((completedTasks.length / filteredTasks.length) * 100) : 0;

  const handleAddTask = async () => {
    if (!newTaskTitle.trim() || !selectedProject) return;
    const task: Omit<Task, "id"> = {
      title: newTaskTitle.trim(),
      frequency: tab,
      status: "pending",
      projectId: selectedProject,
      userId,
      createdAt: Date.now(),
    };
    if (newTaskDesc.trim()) (task as any).description = newTaskDesc.trim();
    const created = await createTask(task);
    setTasks((prev) => [created, ...prev]);
    setNewTaskTitle(""); setNewTaskDesc(""); setShowAddTask(false);
    toast("Task added!", "success");
  };

  const handleToggleTask = async (task: Task) => {
    const newStatus = task.status === "pending" ? "completed" : "pending";
    const updates: Partial<Task> = { status: newStatus };
    if (newStatus === "completed") updates.completedAt = Date.now();
    await updateTask(task.id, updates);
    setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: newStatus } : t));
    if (newStatus === "completed") toast("Task completed! 🎉", "success");
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      toast("Task deleted", "info");
    } catch (err) {
      console.error("Delete failed:", err);
      toast("Failed to delete task", "error");
    }
  };

  const handleAddProject = async () => {
    if (!newProjectName.trim()) return;
    const p = await createProject(userId, newProjectName.trim(), newProjectColor);
    setProjects((prev) => [...prev, p]);
    setSelectedProject(p.id);
    setNewProjectName(""); setShowAddProject(false);
    toast(`Project "${p.name}" created`, "success");
  };

  return (
    <div className="animate-fade-in">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Tasks</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5 font-medium">Stay on top of what matters</p>
        </div>
        <button onClick={() => setShowAddTask(true)} className="btn-primary flex items-center gap-1.5 text-sm flex-shrink-0">
          <Plus className="w-4 h-4" />
          <span>New task</span>
        </button>
      </div>

      {/* ── Projects ── */}
      <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1 scrollbar-none">
        {projects.map((p) => {
          const active = selectedProject === p.id;
          return (
            <button key={p.id} onClick={() => setSelectedProject(p.id)}
              className={cn("flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-150 border",
                active ? "text-white border-transparent shadow-sm" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300")}
              style={active ? { backgroundColor: p.color } : {}}>
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: active ? "rgba(255,255,255,0.6)" : p.color }} />
              {p.name}
            </button>
          );
        })}
        <button onClick={() => setShowAddProject(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-gray-400 bg-white dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-600 hover:border-gray-400 hover:text-gray-600 whitespace-nowrap transition-all">
          <Plus className="w-3.5 h-3.5" /> New project
        </button>
      </div>

      {/* ── Tab + Progress ── */}
      {selectedProject && filteredTasks.length > 0 && (
        <div className="card mb-5 flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
              <span className="text-gray-500">{tab === "daily" ? "Today" : "This week"}</span>
              <span style={{ color: activeProject?.color }}>{completedTasks.length}/{filteredTasks.length} done</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${completionPct}%`, backgroundColor: activeProject?.color }} />
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black" style={{ color: activeProject?.color }}>{completionPct}%</span>
          </div>
        </div>
      )}

      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mb-6 w-fit">
        {(["daily", "weekly"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all duration-150",
              tab === t ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300")}>
            {t === "daily" ? <Calendar className="w-3.5 h-3.5" /> : <CalendarDays className="w-3.5 h-3.5" />}
            {t}
          </button>
        ))}
      </div>

      {/* ── Task list ── */}
      {!selectedProject ? (
        <div className="text-center py-16 card">
          <FolderOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="font-bold text-gray-500">No project selected</p>
          <p className="text-gray-400 text-sm mt-1">Create a project to start tracking tasks</p>
          <button onClick={() => setShowAddProject(true)} className="btn-primary mt-4 text-sm">Create project</button>
        </div>
      ) : loading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-16 skeleton" />)}
        </div>
      ) : (
        <>
          <div className="space-y-2 stagger">
            {pendingTasks.length === 0 ? (
              <div className="text-center py-12 card border-dashed border-2 border-gray-200">
                <CheckCircle2 className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-gray-400 dark:text-gray-500 text-sm font-medium">No {tab} tasks yet</p>
                <button onClick={() => setShowAddTask(true)} className="mt-2 text-sm font-semibold text-indigo-500 hover:text-indigo-700 transition-colors">+ Add one</button>
              </div>
            ) : pendingTasks.map((task) => (
              <TaskCard key={task.id} task={task} onToggle={handleToggleTask} onDelete={handleDeleteTask} color={activeProject?.color} />
            ))}
          </div>

          {completedTasks.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px flex-1 bg-gray-100" />
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Completed ({completedTasks.length})</p>
                <div className="h-px flex-1 bg-gray-100" />
              </div>
              <div className="space-y-2 stagger">
                {completedTasks.map((task) => (
                  <TaskCard key={task.id} task={task} onToggle={handleToggleTask} onDelete={handleDeleteTask} color={activeProject?.color} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Add Task Modal ── */}
      {showAddTask && (
        <Modal title="New task" onClose={() => setShowAddTask(false)}>
          <div className="space-y-4">
            <div>
              <label className="label">Task title *</label>
              <input autoFocus className="input" placeholder="What needs to be done?" value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddTask()} />
            </div>
            <div>
              <label className="label">Notes (optional)</label>
              <textarea className="input resize-none" rows={2} placeholder="Add details..."
                value={newTaskDesc} onChange={(e) => setNewTaskDesc(e.target.value)} />
            </div>
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
              {(["daily", "weekly"] as Tab[]).map((t) => (
                <button key={t} onClick={() => setTab(t)}
                  className={cn("flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-all", tab === t ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-500")}>
                  {t}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowAddTask(false)} className="btn-secondary flex-1 text-sm">Cancel</button>
              <button onClick={handleAddTask} disabled={!newTaskTitle.trim()} className="btn-primary flex-1 text-sm">Add task</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Add Project Modal ── */}
      {showAddProject && (
        <Modal title="New project" onClose={() => setShowAddProject(false)}>
          <div className="space-y-4">
            <div>
              <label className="label">Project name *</label>
              <input autoFocus className="input" placeholder="e.g. Work, Personal, Health"
                value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddProject()} />
            </div>
            <div>
              <label className="label flex items-center gap-1.5"><Palette className="w-3.5 h-3.5" /> Color</label>
              <div className="flex gap-2 flex-wrap">
                {PROJECT_COLORS.map((c) => (
                  <button key={c} onClick={() => setNewProjectColor(c)}
                    className={cn("w-9 h-9 rounded-full transition-all duration-150", newProjectColor === c ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : "hover:scale-105")}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowAddProject(false)} className="btn-secondary flex-1 text-sm">Cancel</button>
              <button onClick={handleAddProject} disabled={!newProjectName.trim()} className="btn-primary flex-1 text-sm">Create</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function TaskCard({ task, onToggle, onDelete, color }: {
  task: Task; onToggle: (t: Task) => void; onDelete: (id: string) => void; color?: string;
}) {
  const done = task.status === "completed";
  return (
    <div className={cn("card flex items-center gap-3 transition-all duration-200 animate-slide-up",
      done ? "opacity-50" : "hover:shadow-md")}
      style={!done ? { borderLeftColor: color, borderLeftWidth: "3px" } : {}}>
      <button onClick={() => onToggle(task)} className="flex-shrink-0 active:scale-90 transition-transform">
        {done
          ? <CheckCircle2 className="w-5 h-5 animate-checkmark" style={{ color: color ?? "#6366f1" }} />
          : <Circle className="w-5 h-5 text-gray-300 hover:text-gray-400 transition-colors" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-semibold text-gray-900 dark:text-gray-100 leading-snug", done && "line-through text-gray-400 dark:text-gray-600")}>
          {task.title}
        </p>
        {(task as any).description && (
          <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{(task as any).description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
        className="p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 active:scale-90 transition-all flex-shrink-0"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pt-4 pb-24 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-5 animate-slide-up max-h-[80dvh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
