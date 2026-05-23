/**
 * Lightweight module-level store so DietPage can share today's meal
 * data with Orbit without a global state library.
 *
 * DietPage writes via setDietContext() whenever meals/goals change.
 * AriaChatbot reads via getDietContext() and forwards to /api/aria.
 */

export interface DietContextData {
  date: string;
  meals: Array<{
    name: string;
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  }>;
  totals: { calories: number; proteinG: number; carbsG: number; fatG: number };
  goals: { calories: number; proteinG: number; carbsG: number; fatG: number };
}

let _dietContext: DietContextData | null = null;

export function setDietContext(data: DietContextData) {
  _dietContext = data;
}

export function getDietContext(): DietContextData | null {
  return _dietContext;
}
