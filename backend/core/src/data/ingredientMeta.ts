export type IngredientRole = 'protein' | 'carb' | 'veg' | 'other';

export interface IngredientMeta {
  role: IngredientRole;
  pantry?: boolean;
  reusable?: boolean;
  maxUsesPerWeek?: number;
}

export const INGREDIENT_META: Record<string, IngredientMeta> = {
  // ===== PROTEIN (råvarer, ikke ferdigretter) =====
  'kylling': { role: 'protein' },
  'kyllingfilet': { role: 'protein' },
  'kyllingbryst': { role: 'protein' },
  'kyllinglår': { role: 'protein' },

  'storfe': { role: 'protein' },
  'kjøttdeig': { role: 'protein' },
  'karbonadedeig': { role: 'protein' },
  'biff': { role: 'protein' },
  'entrecote': { role: 'protein' },

  'svin': { role: 'protein' },
  'svinekotelett': { role: 'protein' },
  'svinefilet': { role: 'protein' },
  'pølser': { role: 'protein' },
  'bacon': { role: 'protein' },

  'laks': { role: 'protein' },
  'laksefilet': { role: 'protein' },
  'torsk': { role: 'protein' },
  'sei': { role: 'protein' },
  'fiskekaker': { role: 'protein' },
  'fiskepinner': { role: 'protein' },
  'reker': { role: 'protein' },
  'scampi': { role: 'protein' },

  'egg': { role: 'protein' },

  // ===== CARBS =====
  'ris': { role: 'carb', pantry: true },
  'pasta': { role: 'carb', pantry: true },
  'makaroni': { role: 'carb', pantry: true },
  'spaghetti': { role: 'carb', pantry: true },
  'nudler': { role: 'carb', pantry: true },

  'potet': { role: 'carb' },
  'poteter': { role: 'carb' },
  'søtpotet': { role: 'carb' },

  'brød': { role: 'carb' },
  'pitabrød': { role: 'carb' },
  'tortilla': { role: 'carb' },

  // ===== GRØNNSAKER =====
  'løk': { role: 'veg', reusable: true, maxUsesPerWeek: 3 },
  'rødløk': { role: 'veg', reusable: true, maxUsesPerWeek: 3 },
  'hvitløk': { role: 'veg', reusable: true, maxUsesPerWeek: 3 },

  'paprika': { role: 'veg', reusable: true, maxUsesPerWeek: 2 },
  'tomat': { role: 'veg', reusable: true, maxUsesPerWeek: 2 },
  'tomater': { role: 'veg', reusable: true, maxUsesPerWeek: 2 },

  'salat': { role: 'veg', reusable: true, maxUsesPerWeek: 2 },
  'isbergsalat': { role: 'veg', reusable: true, maxUsesPerWeek: 2 },

  'brokkoli': { role: 'veg' },
  'gulrot': { role: 'veg' },
  'agurk': { role: 'veg' },
  'mais': { role: 'veg' },
  'erter': { role: 'veg' },
  'sopp': { role: 'veg' },

  // ===== FALLBACK =====
  'ukjent': { role: 'other' }
};

export function normalizeKey(key?: string): string {
  return key?.toLowerCase().trim() ?? 'ukjent';
}

export function getIngredientMeta(key?: string): IngredientMeta {
  return INGREDIENT_META[normalizeKey(key)] ?? { role: 'other' };
}

export function getIngredientRole(key?: string): IngredientRole {
  return getIngredientMeta(key).role;
}

export function isReusable(key?: string): boolean {
  return getIngredientMeta(key).reusable ?? false;
}

export function getMaxUsesPerWeek(key?: string): number | undefined {
  return getIngredientMeta(key).maxUsesPerWeek;
}
