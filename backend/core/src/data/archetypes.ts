/**
 * archetypes.ts
 *
 * Archetypes = TYPE RETT (kulturell kategori)
 * Templates = KONKRET RETT innen én archetype
 *
 * Regler her er harde default-regler.
 * Templates kan kun overstyre i unntak.
 */

export type ArchetypeId =
  | 'pasta'
  | 'wok'
  | 'husmann'
  | 'oven'
  | 'form'
  | 'enkel';

export interface Archetype {
  id: ArchetypeId;
  name: string;

  /** Tillatte carbs for denne rettypen */
  allowedCarbs: string[];

  /** Ingredienser som ALDRI gir mening her */
  forbiddenIngredients: string[];

  /** Pantry fallback hvis ingen tilbud finnes */
  carbFallback?: string[];

  /** Metadata (kun informativt) */
  difficulty: 'easy' | 'medium';
  cookingMethod: 'pan' | 'wok' | 'oven' | 'mixed';
}

export const ARCHETYPES: Record<ArchetypeId, Archetype> = {
  /**
   * PASTA
   * Vestlig/italiensk pastamat
   * Alltid pasta – aldri potet eller ris
   */
  pasta: {
    id: 'pasta',
    name: 'Pastaretter',
    allowedCarbs: [
      'pasta',
      'spaghetti',
      'makaroni',
      'penne',
      'tagliatelle',
      'fusilli'
    ],
    forbiddenIngredients: [
      'potet',
      'poteter',
      'ris',
      'nudler',
      'fiskekaker'
    ],
    carbFallback: ['pasta'],
    difficulty: 'easy',
    cookingMethod: 'pan'
  },

  /**
   * WOK
   * Asiatisk / stir-fry / bowl
   * Ris eller nudler – aldri pasta eller potet
   */
  wok: {
    id: 'wok',
    name: 'Wok-retter',
    allowedCarbs: [
      'ris',
      'nudler',
      'risnudler',
      'eggnudler'
    ],
    forbiddenIngredients: [
      'pasta',
      'makaroni',
      'potet',
      'poteter',
      'fiskekaker',
      'pølser'
    ],
    carbFallback: ['ris'],
    difficulty: 'medium',
    cookingMethod: 'wok'
  },

  /**
   * HUSMANN
   * Klassisk norsk middag
   * ALLTID potet
   */
  husmann: {
    id: 'husmann',
    name: 'Husmannskost',
    allowedCarbs: [
      'potet',
      'poteter'
    ],
    forbiddenIngredients: [
      'pasta',
      'makaroni',
      'ris',
      'nudler',
      'tortilla',
      'brød'
    ],
    carbFallback: ['potet'],
    difficulty: 'easy',
    cookingMethod: 'pan'
  },

  /**
   * OVEN
   * Moderne ovnsretter (ikke husmann)
   * Potet eller ris – aldri pasta
   */
  oven: {
    id: 'oven',
    name: 'Ovnsretter',
    allowedCarbs: [
      'potet',
      'poteter',
      'ris',
      'søtpotet'
    ],
    forbiddenIngredients: [
      'pasta',
      'makaroni',
      'nudler',
      'fiskekaker',
      'pølser'
    ],
    carbFallback: ['potet', 'ris'],
    difficulty: 'easy',
    cookingMethod: 'oven'
  },

  /**
   * FORM
   * Gryter / former / alt-i-ett
   * Mest fleksibel archetype
   */
  form: {
    id: 'form',
    name: 'Gryter og former',
    allowedCarbs: [
      'potet',
      'poteter',
      'ris',
      'pasta'
    ],
    forbiddenIngredients: [],
    difficulty: 'medium',
    cookingMethod: 'mixed'
  },

  /**
   * ENKEL
   * Rask hverdagsmat
   * Brød, wraps, tortilla – aldri pasta/ris
   */
  enkel: {
    id: 'enkel',
    name: 'Enkle retter',
    allowedCarbs: [
      'brød',
      'pitabrød',
      'tortilla',
      'potet',
      'poteter'
    ],
    forbiddenIngredients: [
      'pasta',
      'makaroni',
      'ris',
      'nudler'
    ],
    difficulty: 'easy',
    cookingMethod: 'pan'
  }
};

/**
 * Hent archetype (enkelt og eksplisitt)
 */
export function getArchetype(id: ArchetypeId): Archetype {
  return ARCHETYPES[id];
}
