/**
 * Produktkategorier for tilbud
 * 
 * Lett å endre og utvide:
 * - Endre navn: Oppdater strengen i CATEGORIES array
 * - Legge til ny: Push til CATEGORIES array
 * - Fjerne: Fjern fra array (husk å migrere eksisterende data)
 */

export const CATEGORIES = [
    "Frukt",
    "Grønnsaker",
    "Meieri og egg",
    "Pålegg",
    "Kjøtt",
    "Fisk og sjømat",
    "Brød og bakst",
    "Tørrvarer",
    "Snacks og godteri",
    "Drikke",
    "Ukjent"
] as const;

export type Category = typeof CATEGORIES[number];

// Standard fallback-kategori
export const DEFAULT_CATEGORY: Category = "Ukjent";

/**
 * Valider at en kategori er gyldig
 */
export const isValidCategory = (category: string): category is Category => {
    return CATEGORIES.includes(category as Category);
};

/**
 * Hent alle kategorier unntatt "Ukjent"
 */
export const getSelectableCategories = (): readonly Category[] => {
    return CATEGORIES.filter(cat => cat !== DEFAULT_CATEGORY);
};
