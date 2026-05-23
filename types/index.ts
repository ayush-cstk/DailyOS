// ── Task Management ────────────────────────────────────────────────────────────
export type TaskFrequency = "daily" | "weekly";
export type TaskStatus = "pending" | "completed";
export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  description?: string;
  frequency: TaskFrequency;   // kept for backward compat
  dueDate?: string;           // ISO date string YYYY-MM-DD (scheduled date)
  priority?: TaskPriority | null;
  status: TaskStatus;
  projectId: string;
  userId: string;
  createdAt: number;
  completedAt?: number;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  userId: string;
  createdAt: number;
}

// ── Workout ────────────────────────────────────────────────────────────────────
export type WeightUnit = "kg" | "lbs" | "bodyweight";

export interface SetLog {
  id: string;
  reps: number;
  weight?: number;
  unit: WeightUnit;
  completed: boolean;
}

export interface ExerciseLog {
  id: string;
  name: string;
  sets: SetLog[];
  notes?: string;
}

export interface WorkoutSession {
  id: string;
  userId: string;
  date: string; // ISO date string YYYY-MM-DD
  exercises: ExerciseLog[];
  durationMinutes: number;
  bodyWeightKg?: number;
  notes?: string;
  summary?: string; // AI generated
  createdAt: number;
}

export interface BodyWeightEntry {
  id: string;
  userId: string;
  date: string;
  weightKg: number;
  createdAt: number;
}

// ── Diet / Meal ────────────────────────────────────────────────────────────────
export interface MacroGoals {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface MealMacros {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface MealEntry {
  id: string;
  userId: string;
  date: string;
  name: string;
  macros: MealMacros;
  imageUrl?: string;
  createdAt: number;
}

export interface DietDay {
  id: string;
  userId: string;
  date: string;
  goals: MacroGoals;
  meals: MealEntry[];
  createdAt: number;
}

// ── Auth ───────────────────────────────────────────────────────────────────────
export interface AppUser {
  id: string;
  name: string;
  email: string;
  image?: string;
}
