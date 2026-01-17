/**
 * Hierarkisk kategoristruktur for middagstilbud
 * Hovedkategorier med underkategorier for bedre filtrering og måltidsplanlegging
 */

export const CATEGORY_HIERARCHY = {
  "Frukt og grønt": [
    "Frukt",
    "Grønnsaker",
    "Salat",
    "Bær",
    "Urter",
    "Poteter",
    "Annet"
  ],
  "Bakeri og bakst": [
    "Brød",
    "Rundstykker",
    "Kaker",
    "Bakervarer",
    "Tortilla og wraps",
    "Annet"
  ],
  "Frokost og korn": [
    "Frokostblanding",
    "Havregryn",
    "Müsli",
    "Grøt",
    "Bars",
    "Annet"
  ],
  "Meieri og egg": [
    "Melk",
    "Yoghurt",
    "Ost",
    "Smør og margarin",
    "Fløte og rømme",
    "Egg",
    "Sjokolademelk",
    "Annet"
  ],
  "Plantebasert": [
    "Kjøtterstatning",
    "Plantedrikk",
    "Vegetarretter",
    "Annet"
  ],
  "Kjøtt": [
    "Storfe",
    "Svin",
    "Kylling og fjærkre",
    "Deig og farse",
    "Påleggskjøtt",
    "Annet"
  ],
  "Fisk og sjømat": [
    "Fisk",
    "Skalldyr",
    "Ferdig fisk",
    "Annet"
  ],
  "Middag og ferdigmat": [
    "Ferdigretter",
    "Pizza",
    "Supper",
    "Sauser og stuinger",
    "Potetmos og tilbehør",
    "Vegetar",
    "Annet"
  ],
  "Pålegg": [
    "Kjøttpålegg",
    "Fiskepålegg",
    "Leverpostei",
    "Ost",
    "Syltetøy",
    "Søtt pålegg",
    "Vegetar",
    "Tubeost",
    "Annet"
  ],
  "Drikke": [
    "Brus",
    "Vann",
    "Juice",
    "Smoothie",
    "Energidrikk",
    "Kaffe",
    "Te",
    "Sjokolademelk",
    "Saft",
    "Annet"
  ],
  "Snacks og godteri": [
    "Sjokolade",
    "Chips",
    "Nøtter",
    "Smågodt",
    "Kjeks",
    "Proteinbarer",
    "Popcorn",
    "Annet"
  ],
  "Is og dessert": [
    "Iskrem",
    "Kaker",
    "Annet"
  ],
  "Baby og barn": [
    "Babymat",
    "Bleier",
    "Barnesnacks",
    "Annet"
  ],
  "Hus og hjem": [
    "Rengjøring",
    "Papirvarer",
    "Kjøkken",
    "Interiør",
    "Annet"
  ],
  "Helse og hygiene": [
    "Personlig hygiene",
    "Apotekvarer",
    "Kosttilskudd",
    "Annet"
  ],
  "Dyr": [
    "Dyremat",
    "Dyreutstyr",
    "Annet"
  ],
  "Pasta og ris": [
    "Spaghetti",
    "Ris",
    "Annet"
  ]
} as const;

export type MainCategory = keyof typeof CATEGORY_HIERARCHY;
export type SubCategory = typeof CATEGORY_HIERARCHY[MainCategory][number];

export const MAIN_CATEGORIES = Object.keys(CATEGORY_HIERARCHY) as MainCategory[];

export const DEFAULT_MAIN_CATEGORY: MainCategory = "Frukt og grønt";
export const DEFAULT_SUB_CATEGORY: SubCategory = "Annet";

export function isValidMainCategory(cat: string): cat is MainCategory {
  return MAIN_CATEGORIES.includes(cat as MainCategory);
}

export function getSubCategories(mainCat: MainCategory): readonly SubCategory[] {
  return CATEGORY_HIERARCHY[mainCat];
}

export function isValidSubCategory(mainCat: MainCategory, subCat: string): boolean {
  return CATEGORY_HIERARCHY[mainCat].includes(subCat as any);
}

// Legacy support - deprecated
export const CATEGORIES = MAIN_CATEGORIES;
export type Category = MainCategory;
export const DEFAULT_CATEGORY = DEFAULT_MAIN_CATEGORY;
