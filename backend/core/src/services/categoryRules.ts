// backend/core/src/services/categoryRules.ts
import { Category } from "../config/categories";
import { normalizeTitle } from "../utils/normalizeTitle";

interface CategoryRule {
  category: Category;
  keywords: string[];          // presise ord/fraser (litt lengre = bedre)
  excludeKeywords?: string[];  // ord/fraser som bør stoppe regelen
}

/**
 * HIGH-PRECISION RULES ONLY
 * Kun veldig spesifikke produkter med 100% sikkerhet
 * Brukes som rask pre-filter før AI-kategorisering
 */
const rules: CategoryRule[] = [
  {
    category: "Drikke",
    keywords: ["coca cola", "pepsi max", "fanta orange", "solo original", "sprite"],
  },
  {
    category: "Pålegg",
    keywords: ["makrell i tomat", "kaviar mills", "nugatti", "leverpostei"],
  },
  {
    category: "Meieri og egg",
    keywords: ["tine lettmelk", "tine helmelk", "tine skogsbær", "litago"],
  },
  {
    category: "Snacks og godteri",
    keywords: ["nidar smash", "kvikk lunsj", "freia melkesjokolade"],
  },
];

export const matchCategoryByRules = (title: string): Category | null => {
  const t = normalizeTitle(title);

  for (const rule of rules) {
    // Excludes stopper regelen
    if (rule.excludeKeywords?.some((kw) => t.includes(normalizeTitle(kw)))) {
      continue;
    }

    // Første keyword som matcher avgjør
    if (rule.keywords.some((kw) => t.includes(normalizeTitle(kw)))) {
      return rule.category;
    }
  }

  return null;
};
