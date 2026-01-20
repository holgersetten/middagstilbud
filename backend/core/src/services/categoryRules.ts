// backend/core/src/services/categoryRules.ts
import { Category } from "../config/categories";

/**
 * HIGH-PRECISION RULES ONLY
 * Kun veldig spesifikke produkter med 100% sikkerhet
 * Brukes som rask pre-filter før AI-kategorisering
 * 
 * DEPRECATED: Med ny kategoristruktur håndteres alt av AI
 */

export const matchCategoryByRules = (title: string): Category | null => {
  // Legacy support - returnerer alltid null
  // AI med den nye detaljerte kategoristrukturen er mer nøyaktig
  return null;
};
