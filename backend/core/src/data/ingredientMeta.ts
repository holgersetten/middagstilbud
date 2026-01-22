/**
 * ingredientMeta.ts
 * 
 * Definerer "rolle" (protein/carb/veg/other) for hver ingredientKey.
 * Brukes av weeklyPlanService til å generere balanserte ukemenyer.
 * 
 * Bootstrap-versjon: Start med ~30 vanlige keys, utvid over tid.
 */

export type IngredientRole = 'protein' | 'carb' | 'veg' | 'other';

export interface IngredientMeta {
    role: IngredientRole;
    pantry?: boolean; // Om dette er vanlig å ha på lager (for carbs som ris/pasta)
    reusable?: boolean; // Kan deles på tvers av flere middager (tomat, løk, paprika)
    maxUsesPerWeek?: number; // Maks ganger denne ingrediensen kan brukes i én uke
}

/**
 * Hardkodet mapping av ingredientKey → meta
 */
export const INGREDIENT_META: Record<string, IngredientMeta> = {
    // ========== PROTEIN ==========
    'kyllingfilet': { role: 'protein' },
    'kyllingbryst': { role: 'protein' },
    'kyllinglår': { role: 'protein' },
    'kylling': { role: 'protein' },
    'kjøttdeig': { role: 'protein' },
    'storfe': { role: 'protein' },
    'indrefilet': { role: 'protein' },
    'biff': { role: 'protein' },
    'entrecôte': { role: 'protein' },
    'laks': { role: 'protein' },
    'laksefilet': { role: 'protein' },
    'torsk': { role: 'protein' },
    'sei': { role: 'protein' },
    'scampi': { role: 'protein' },
    'reker': { role: 'protein' },
    'fiskepinner': { role: 'protein' },
    'fiskekaker': { role: 'protein' },
    'svinekotelett': { role: 'protein' },
    'svinefilet': { role: 'protein' },
    'svinekjøtt': { role: 'protein' },
    'karbonadedeig': { role: 'protein' },
    'bacon': { role: 'protein' },
    'pølser': { role: 'protein' },
    'egg': { role: 'protein' },
    'kalkun': { role: 'protein' },
    'and': { role: 'protein' },
    'lammekjøtt': { role: 'protein' },
    
    // ========== CARBS (med pantry-flag for vanlige lagerartikler) ==========
    'ris': { role: 'carb', pantry: true },
    'pasta': { role: 'carb', pantry: true },
    'makaroni': { role: 'carb', pantry: true },
    'spaghetti': { role: 'carb', pantry: true },
    'penne': { role: 'carb', pantry: true },
    'nudler': { role: 'carb', pantry: true },
    'potet': { role: 'carb' },
    'poteter': { role: 'carb' },
    'søtpotet': { role: 'carb' },
    'couscous': { role: 'carb', pantry: true },
    'quinoa': { role: 'carb', pantry: true },
    'bulgur': { role: 'carb', pantry: true },
    'tortilla': { role: 'carb' },
    'wraps': { role: 'carb' },
    'brød': { role: 'carb' },
    'pitabrød': { role: 'carb' },
    'naan': { role: 'carb' },
    'taco': { role: 'carb' },
    'tacoskjell': { role: 'carb' },
    
    // ========== VEG ==========
    'løk': { role: 'veg', reusable: true, maxUsesPerWeek: 3 },
    'rødløk': { role: 'veg', reusable: true, maxUsesPerWeek: 3 },
    'hvitløk': { role: 'veg', reusable: true, maxUsesPerWeek: 3 },
    'paprika': { role: 'veg', reusable: true, maxUsesPerWeek: 2 },
    'brokkoli': { role: 'veg' },
    'blomkål': { role: 'veg' },
    'salat': { role: 'veg', reusable: true, maxUsesPerWeek: 2 },
    'isbergsalat': { role: 'veg', reusable: true, maxUsesPerWeek: 2 },
    'gulrot': { role: 'veg' },
    'gulrøtter': { role: 'veg' },
    'tomat': { role: 'veg', reusable: true, maxUsesPerWeek: 2 },
    'tomater': { role: 'veg', reusable: true, maxUsesPerWeek: 2 },
    'cherrytomater': { role: 'veg', reusable: true, maxUsesPerWeek: 2 },
    'agurk': { role: 'veg' },
    'squash': { role: 'veg' },
    'aubergine': { role: 'veg' },
    'mais': { role: 'veg' },
    'erter': { role: 'veg' },
    'bønner': { role: 'veg' },
    'grønne bønner': { role: 'veg' },
    'spinat': { role: 'veg' },
    'grønnkål': { role: 'veg' },
    'purre': { role: 'veg' },
    'selleri': { role: 'veg' },
    'champignon': { role: 'veg' },
    'sopp': { role: 'veg' },
    'avokado': { role: 'veg' },
    'chili': { role: 'veg' },
    'jalapeno': { role: 'veg' },
    
    // ========== OTHER (default for alt annet) ==========
    'produkt': { role: 'other' }, // Fallback fra categoryService
};

/**
 * Hent rolle for en ingredientKey (med fallback til 'other')
 */
export function getIngredientRole(ingredientKey: string | undefined): IngredientRole {
    if (!ingredientKey) return 'other';
    const meta = INGREDIENT_META[ingredientKey.toLowerCase()];
    return meta?.role || 'other';
}

/**
 * Sjekk om en ingrediens vanligvis er en pantry-vare
 */
export function isPantryItem(ingredientKey: string | undefined): boolean {
    if (!ingredientKey) return false;
    const meta = INGREDIENT_META[ingredientKey.toLowerCase()];
    return meta?.pantry || false;
}

/**
 * Sjekk om en ingrediens er gjenbrukbar på tvers av flere middager
 */
export function isReusable(ingredientKey: string | undefined): boolean {
    if (!ingredientKey) return false;
    const meta = INGREDIENT_META[ingredientKey.toLowerCase()];
    return meta?.reusable || false;
}

/**
 * Hent maks antall ganger denne ingrediensen kan brukes i én uke
 */
export function getMaxUsesPerWeek(ingredientKey: string | undefined): number | undefined {
    if (!ingredientKey) return undefined;
    const meta = INGREDIENT_META[ingredientKey.toLowerCase()];
    return meta?.maxUsesPerWeek;
}
