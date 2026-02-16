// weeklyPlanConfig.ts
// Én plass for "menneskereglene" (lett å tweake, ikke hardcode spredt)

import type { ArchetypeId } from '../data/archetypes';

export type WeeklyPlanConfig = {
  mealsDefault: number;

  // Hvor mange ganger en archetype kan forekomme i en uke
  maxArchetypePerWeek: Partial<Record<ArchetypeId, number>>;

  // Carb caps (for å unngå makaroni 4 dager)
  maxCarbPerWeek: Record<string, number>;

  // Protein-type caps (for å unngå laks 4 dager)
  maxProteinTypePerWeek: Record<string, number>;

  // Maks antall ganger samme offer (productKey) kan brukes
  maxSameOfferUsesDefault: number;

  // Hvis prisforskjell er liten, foretrekk primary store for reusable
  reusablePrimaryPreferThresholdNok: number;
};

export const WEEKLY_PLAN_CONFIG: WeeklyPlanConfig = {
  mealsDefault: 6,

  maxArchetypePerWeek: {
    pasta: 2,
    wok: 1,
    oven: 2,
    husmann: 2,
    enkel: 1,
    form: 1,
    readyMeal: 1 // Ferdigretter kun som fallback
  },

  // keys må matche ingredientKey (lowercase)
  maxCarbPerWeek: {
    makaroni: 1,
    spaghetti: 2,
    pasta: 2,
    ris: 2,
    nudler: 2,
    potet: 3,
    poteter: 3,
    brød: 2,
    tortilla: 2,
    pitabrød: 2
  },

  // keys må matche ingredientKey (lowercase)
  maxProteinTypePerWeek: {
    laks: 2,
    laksefilet: 2,
    kylling: 3,
    kyllingfilet: 3,
    kyllingbryst: 3,
    kjøttdeig: 2,
    egg: 2
  },

  maxSameOfferUsesDefault: 2,

  reusablePrimaryPreferThresholdNok: 5
};

// Små helpers (valgfritt å bruke)
export function getMaxArchetypePerWeek(id: ArchetypeId): number {
  return WEEKLY_PLAN_CONFIG.maxArchetypePerWeek[id] ?? 99;
}

export function getMaxCarbPerWeek(carbKey: string): number {
  return WEEKLY_PLAN_CONFIG.maxCarbPerWeek[carbKey.toLowerCase()] ?? 99;
}

export function getMaxProteinTypePerWeek(proteinKey: string): number {
  return WEEKLY_PLAN_CONFIG.maxProteinTypePerWeek[proteinKey.toLowerCase()] ?? 99;
}
