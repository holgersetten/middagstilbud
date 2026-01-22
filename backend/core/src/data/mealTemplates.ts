/**
 * mealTemplates.ts
 * 
 * Definerer plausible middagsretter som templates.
 * Et template er IKKE "velg hva som helst" - det er begrensninger.
 * 
 * Formål: Forhindre rare kombinasjoner (fiskekaker + pasta, laks + makaroni)
 */

export type Archetype = 'pasta' | 'wok' | 'oven' | 'husmann' | 'enkel' | 'form';

export interface MealTemplate {
    id: string;
    name: string;
    archetype: Archetype;
    
    // Hva som er LOV
    protein: string[];        // ingredientKeys som er lovlige (kan være flere varianter)
    carbs: string[];          // lovlige carbs
    vegetables: string[];     // lovlige grønnsaker
    
    // Hva som er FORBUDT (kritisk for plausibilitet)
    forbids?: string[];       // ingredientKeys som ALDRI skal brukes
    
    // Carb fallback (spesifikk for template, ikke generisk pantry)
    carbFallback?: string[];  // Spesifikke pantry-carbs for dette måltidet (hvis carbs[] ikke finnes)
    
    // Metadata
    difficulty?: 'easy' | 'medium' | 'hard';
    cookingMethod?: string;
}

/**
 * PROOF OF CONCEPT: 5 templates som dekker 5 archetypes
 * 
 * Disse avslører raskt om:
 * - ingredientMeta er bra nok
 * - butikkutvalg fungerer
 * - pantry-fallback fungerer
 * - "forbids" faktisk hindrer tull
 */
export const MEAL_TEMPLATES: MealTemplate[] = [
    // ========== 1. PASTARETT ==========
    {
        id: 'kjottdeig_pasta',
        name: 'Kjøttdeig med pasta',
        archetype: 'pasta',
        protein: ['kjøttdeig', 'karbonadedeig', 'storfe'],
        carbs: ['pasta', 'spaghetti', 'makaroni', 'penne'],
        vegetables: ['tomat', 'tomater', 'løk', 'rødløk', 'paprika', 'hvitløk'],
        forbids: ['potet', 'poteter', 'ris', 'fiskekaker', 'laks', 'torsk'],
        difficulty: 'easy',
        cookingMethod: 'pan'
    },

    // ========== 2. WOK ==========
    {
        id: 'kylling_wok',
        name: 'Kylling i wok',
        archetype: 'wok',
        protein: ['kyllingfilet', 'kyllingbryst', 'kylling', 'scampi', 'reker'],
        carbs: ['ris', 'nudler'],
        vegetables: ['paprika', 'løk', 'rødløk', 'brokkoli', 'gulrot', 'gulrøtter', 'mais', 'erter'],
        forbids: ['pasta', 'potet', 'poteter', 'fiskekaker', 'pølser'],
        difficulty: 'medium',
        cookingMethod: 'wok'
    },

    // ========== 3. OVNSRETT ==========
    {
        id: 'laks_ovn',
        name: 'Ovnsbakt laks',
        archetype: 'oven',
        protein: ['laks', 'laksefilet'],
        carbs: ['potet', 'poteter', 'ris'],
        vegetables: ['gulrot', 'gulrøtter', 'brokkoli', 'asparges', 'salat', 'isbergsalat'],
        forbids: ['pasta', 'makaroni', 'nudler', 'fiskekaker', 'pølser'],
        difficulty: 'easy',
        cookingMethod: 'oven'
    },

    // ========== 4. HUSMANN (klassisk) ==========
    {
        id: 'fiskekaker_husmann',
        name: 'Fiskekaker med potet',
        archetype: 'husmann',
        protein: ['fiskekaker', 'fiskepinner'],
        carbs: ['potet', 'poteter'],
        vegetables: ['gulrot', 'gulrøtter', 'agurk', 'tomat', 'tomater', 'salat', 'mais', 'erter'],
        forbids: ['pasta', 'makaroni', 'ris', 'nudler', 'laks', 'torsk'],
        carbFallback: ['potet'], // IKKE generisk pantry - kun potet passer
        difficulty: 'easy',
        cookingMethod: 'pan'
    },

    // ========== 5. ENKEL (familie) ==========
    {
        id: 'omelett_enkel',
        name: 'Omelett',
        archetype: 'enkel',
        protein: ['egg'],
        carbs: ['brød', 'pitabrød'], // Kan også være ingen (omelett standalone)
        vegetables: ['tomat', 'tomater', 'paprika', 'løk', 'rødløk', 'champignon', 'sopp', 'salat'],
        forbids: ['pasta', 'ris', 'potet', 'fiskekaker', 'laks', 'pølser'],
        difficulty: 'easy',
        cookingMethod: 'pan'
    }
];

/**
 * Sjekk om en ingredientKey er forbudt i et template
 */
export function isForbidden(template: MealTemplate, ingredientKey: string): boolean {
    if (!template.forbids) return false;
    return template.forbids.includes(ingredientKey.toLowerCase());
}

/**
 * Sjekk om en ingredientKey er lovlig som protein i template
 */
export function isValidProtein(template: MealTemplate, ingredientKey: string): boolean {
    return template.protein.includes(ingredientKey.toLowerCase());
}

/**
 * Sjekk om en ingredientKey er lovlig som carb i template
 */
export function isValidCarb(template: MealTemplate, ingredientKey: string): boolean {
    return template.carbs.includes(ingredientKey.toLowerCase());
}

/**
 * Sjekk om en ingredientKey er lovlig som veg i template
 */
export function isValidVegetable(template: MealTemplate, ingredientKey: string): boolean {
    return template.vegetables.includes(ingredientKey.toLowerCase());
}
