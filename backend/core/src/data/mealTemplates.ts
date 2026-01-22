import { type ArchetypeId, getArchetype } from './archetypes';

export interface MealTemplate {
  id: string;
  name: string;
  archetype: ArchetypeId;

  protein: string[];

  carbs?: string[];
  vegetables?: string[];
  forbids?: string[];
  carbFallback?: string[];

  difficulty?: 'easy' | 'medium' | 'hard';
  cookingMethod?: string;
}

export interface ResolvedMealTemplate {
  id: string;
  name: string;
  archetype: ArchetypeId;

  protein: string[];
  carbs: string[];
  vegetables: string[];
  forbids: Set<string>;
  carbFallback: string[];

  difficulty: 'easy' | 'medium' | 'hard';
  cookingMethod: string;
}

export const MEAL_TEMPLATES: MealTemplate[] = [
  // ===== PASTA (6) =====
  {
    id: 'kjottdeig_pasta',
    name: 'Pasta med kjøttdeig',
    archetype: 'pasta',
    protein: ['kjøttdeig', 'karbonadedeig'],
    vegetables: ['tomat', 'løk', 'paprika', 'hvitløk']
  },
  {
    id: 'kylling_pasta',
    name: 'Kyllingpasta',
    archetype: 'pasta',
    protein: ['kylling'],
    vegetables: ['paprika', 'løk', 'brokkoli']
  },
  {
    id: 'laks_pasta',
    name: 'Laksepasta',
    archetype: 'pasta',
    protein: ['laks'],
    vegetables: ['spinat', 'brokkoli']
  },
  {
    id: 'pasta_bacon',
    name: 'Pasta med bacon',
    archetype: 'pasta',
    protein: ['bacon'],
    vegetables: ['løk', 'sopp']
  },
  {
    id: 'pasta_sopp',
    name: 'Pasta med sopp',
    archetype: 'pasta',
    protein: ['egg'],
    vegetables: ['sopp', 'løk']
  },
  {
    id: 'pasta_pesto',
    name: 'Pasta pesto',
    archetype: 'pasta',
    protein: ['kylling', 'laks'],
    vegetables: ['tomat']
  },

  // ===== WOK (6) =====
  {
    id: 'kylling_wok',
    name: 'Kylling i wok',
    archetype: 'wok',
    protein: ['kylling'],
    vegetables: ['paprika', 'brokkoli', 'gulrot', 'løk']
  },
  {
    id: 'scampi_wok',
    name: 'Scampi i wok',
    archetype: 'wok',
    protein: ['scampi', 'reker'],
    vegetables: ['paprika', 'brokkoli']
  },
  {
    id: 'svin_wok',
    name: 'Svinewok',
    archetype: 'wok',
    protein: ['svinefilet'],
    vegetables: ['paprika', 'løk', 'gulrot']
  },
  {
    id: 'egg_wok',
    name: 'Egg i wok',
    archetype: 'wok',
    protein: ['egg'],
    vegetables: ['brokkoli', 'gulrot']
  },
  {
    id: 'laks_wok',
    name: 'Laks i wok',
    archetype: 'wok',
    protein: ['laks'],
    vegetables: ['brokkoli', 'paprika']
  },
  {
    id: 'kylling_risbowl',
    name: 'Kylling risbolle',
    archetype: 'wok',
    protein: ['kylling'],
    vegetables: ['agurk', 'gulrot', 'mais']
  },

  // ===== HUSMANN (6) =====
  {
    id: 'fiskekaker_husmann',
    name: 'Fiskekaker med potet',
    archetype: 'husmann',
    protein: ['fiskekaker'],
    vegetables: ['gulrot', 'agurk', 'salat']
  },
  {
    id: 'fiskepinner',
    name: 'Fiskepinner med potet',
    archetype: 'husmann',
    protein: ['fiskepinner'],
    vegetables: ['gulrot', 'erter']
  },
  {
    id: 'koteletter',
    name: 'Svinekoteletter med potet',
    archetype: 'husmann',
    protein: ['svinekotelett'],
    vegetables: ['kål', 'gulrot']
  },
  {
    id: 'laks_husmann',
    name: 'Laks med potet',
    archetype: 'husmann',
    protein: ['laks'],
    vegetables: ['gulrot', 'brokkoli']
  },
  {
    id: 'kjottkaker',
    name: 'Kjøttkaker med potet',
    archetype: 'husmann',
    protein: ['storfe'],
    vegetables: ['kål', 'gulrot']
  },
  {
    id: 'pølser_potet',
    name: 'Pølser med potet',
    archetype: 'husmann',
    protein: ['pølser'],
    vegetables: ['løk', 'erter']
  },

  // ===== OVEN (6) =====
  {
    id: 'laks_ovn',
    name: 'Ovnsbakt laks',
    archetype: 'oven',
    protein: ['laks'],
    vegetables: ['gulrot', 'brokkoli']
  },
  {
    id: 'kylling_ovn',
    name: 'Kylling i ovn',
    archetype: 'oven',
    protein: ['kylling'],
    vegetables: ['gulrot', 'potet']
  },
  {
    id: 'torsk_ovn',
    name: 'Ovnsbakt torsk',
    archetype: 'oven',
    protein: ['torsk'],
    vegetables: ['gulrot', 'løk']
  },
  {
    id: 'svin_ovn',
    name: 'Svin i ovn',
    archetype: 'oven',
    protein: ['svinefilet'],
    vegetables: ['paprika', 'løk']
  },
  {
    id: 'kylling_form',
    name: 'Kyllingform',
    archetype: 'oven',
    protein: ['kylling'],
    vegetables: ['brokkoli', 'gulrot']
  },
  {
    id: 'laks_grateng',
    name: 'Laksegrateng',
    archetype: 'oven',
    protein: ['laks'],
    vegetables: ['gulrot']
  },

  // ===== ENKEL (6) =====
  {
    id: 'omelett',
    name: 'Omelett',
    archetype: 'enkel',
    protein: ['egg'],
    vegetables: ['paprika', 'løk', 'sopp']
  },
  {
    id: 'pølser_brod',
    name: 'Pølser og brød',
    archetype: 'enkel',
    protein: ['pølser'],
    carbs: ['brød'],
    vegetables: ['løk']
  },
  {
    id: 'wrap_kylling',
    name: 'Kyllingwrap',
    archetype: 'enkel',
    protein: ['kylling'],
    carbs: ['tortilla'],
    vegetables: ['salat', 'tomat']
  },
  {
    id: 'egg_brod',
    name: 'Egg og brød',
    archetype: 'enkel',
    protein: ['egg'],
    carbs: ['brød'],
    vegetables: ['tomat']
  },
  {
    id: 'reker_brod',
    name: 'Reker og brød',
    archetype: 'enkel',
    protein: ['reker'],
    carbs: ['brød'],
    vegetables: ['salat']
  },
  {
    id: 'pannekaker',
    name: 'Pannekaker',
    archetype: 'enkel',
    protein: ['egg'],
    carbs: ['brød']
  }
];
 

export function resolveMealTemplate(t: MealTemplate): ResolvedMealTemplate {
  const a = getArchetype(t.archetype);

  return {
    id: t.id,
    name: t.name,
    archetype: t.archetype,

    protein: t.protein.map(p => p.toLowerCase()),
    carbs: (t.carbs ?? a.allowedCarbs).map(c => c.toLowerCase()),
    vegetables: (t.vegetables ?? []).map(v => v.toLowerCase()),

    forbids: new Set([
      ...a.forbiddenIngredients,
      ...(t.forbids ?? [])
    ].map(f => f.toLowerCase())),

    carbFallback: (t.carbFallback ?? a.carbFallback ?? []).map(c => c.toLowerCase()),

    difficulty: t.difficulty ?? a.difficulty,
    cookingMethod: t.cookingMethod ?? a.cookingMethod
  };
}

export function resolveAllTemplates(): ResolvedMealTemplate[] {
  return MEAL_TEMPLATES.map(resolveMealTemplate);
}
