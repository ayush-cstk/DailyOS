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

// ── Cardio ─────────────────────────────────────────────────────────────────────
export type CardioActivity =
  | "walking" | "running" | "cycling" | "hiking"
  | "mountain_climbing" | "swimming" | "jump_rope"
  | "elliptical" | "stair_climbing" | "rowing";

export interface CardioLog {
  id: string;
  activity: CardioActivity;
  durationMinutes: number;
  distanceKm?: number;
  caloriesBurned?: number; // MET-based auto-calculation
}

export interface WorkoutSession {
  id: string;
  userId: string;
  date: string; // ISO date string YYYY-MM-DD
  exercises: ExerciseLog[];
  cardioLogs?: CardioLog[];
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
  fiberG?: number;
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

// ── Meal Templates (saved meals) ──────────────────────────────────────────────
export interface MealTemplate {
  id: string;
  userId: string;
  name: string;
  baseQuantity: number;   // the quantity the stored macros correspond to (e.g. 1, or 100)
  unit: string;           // e.g. "serving", "g", "bowl", "piece"
  macros: MealMacros;     // macros for exactly baseQuantity of `unit`
  createdAt: number;
  lastUsedAt?: number;    // for sorting recently-used meals to the top
  useCount?: number;      // how many times it's been logged
}

// ── Workout Templates ──────────────────────────────────────────────────────────
export interface TemplateExercise {
  id: string;
  name: string;
  defaultSets: number;
  defaultReps: number;
  defaultWeight?: number;
  defaultUnit: WeightUnit;
}

export interface WorkoutTemplate {
  id: string;
  userId: string;       // empty string "" for preset templates (client-side only)
  name: string;
  description?: string;
  exercises: TemplateExercise[];
  isPreset?: boolean;   // true for built-in splits
  createdAt: number;
}

// ── Notification Preferences ───────────────────────────────────────────────────
export interface NotificationPrefs {
  mealReminders: boolean;
  breakfastTime: string;    // "HH:MM"
  lunchTime: string;        // "HH:MM"
  dinnerTime: string;       // "HH:MM"
  workoutReminders: boolean;
  workoutTime: string;      // "HH:MM"
  taskReminders: boolean;
  taskReminderTime: string; // "HH:MM"
  timezone?: string;        // IANA tz, e.g. "Asia/Kolkata"
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  mealReminders: true,
  breakfastTime: "08:00",
  lunchTime: "13:00",
  dinnerTime: "19:30",
  workoutReminders: true,
  workoutTime: "07:00",
  taskReminders: true,
  taskReminderTime: "20:00",
};

// ── Auth ───────────────────────────────────────────────────────────────────────
export interface AppUser {
  id: string;
  name: string;
  email: string;
  image?: string;
}
