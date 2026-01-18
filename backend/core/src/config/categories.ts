/**
 * Hierarkisk kategoristruktur for middagstilbud
 * Hovedkategorier med underkategorier for bedre filtrering og måltidsplanlegging
 */

export const CATEGORY_HIERARCHY = {
  "Frukt & grønt": [
    "Bær",
    "Frosne bær og grønnsaker",
    "Frukt",
    "Fruktkurv",
    "Grønnsaker",
    "Krydderurter",
    "Poteter",
    "Sopp",
    "Annet",
  ],

  "Fisk & skalldyr": [
    "Fisk",
    "Hvalkjøtt",
    "Skalldyr",
    "Skjell",
    "Sushi",
    "Tørket fisk",
    "Annet",
  ],

  "Brød": [
    "Boller og småkaker",
    "Brød",
    "Hamburgerbrød",
    "Knekkebrød",
    "Lefser",
    "Loff",
    "Lomper",
    "Maiskaker",
    "Pita og nan",
    "Pølsebrød",
    "Baguetter",
    "Lefser",
    "Riskaker",
    "Rundstykker",
    "Annet",
  ],

  "Middag": [
    "Ferdigretter",
    "Fiskeretter",
    "Grøt",
    "Middagshermetikk",
    "Nudler",
    "Pasta",
    "Pizza",
    "Supper",
    "Taco",
    "Vegetarretter",
    "Andre middagsretter",
    "Annet",
  ],

  "Kylling og fjærkre": [
    "And",
    "Kalkun",
    "Kylling",
    "Rype",
    "Annet",
  ],

  "Meieri & egg": [
    "Cottage cheese",
    "Creme fraiche",
    "Egg",
    "Fløte",
    "Kesam",
    "Melk",
    "Proteinpudding",
    "Rømme",
    "Yoghurt",
    "Drikkeyoghurt",
    "Annet",
  ],

  "Pålegg & frokost": [
    "Bacon",
    "Fiskepålegg",
    "Frokostblandinger og müsli",
    "Kjøttpålegg",
    "Leverpostei",
    "Påleggsalat",
    "Smør, margarin og matfett",
    "Syltetøy",
    "Vegansk pålegg",
    "Tubeost",
    "Annet",
  ],

  "Kjøtt": [
    "Hamburger",
    "Kjøttdeig og farse",
    "Andre kjøttretter",
    "Lammekjøtt",
    "Pølser",
    "Storfekjøtt",
    "Svinekjøtt",
    "Viltkjøtt",
    "Annet",
  ],

  "Tilbehør": [
    "Eddik",
    "Hermetisk grønt",
    "Tomatsaus",
    "Ketchup og sennep",
    "Kokosmelk",
    "Kraft og buljong",
    "Krydder",
    "Linser og frø",
    "Marinader og BBQ-saus",
    "Matoljer",
    "Middagssalat",
    "Pizzatopping",
    "Potetsalat",
    "Sauser og dressing",
    "Stuinger",
    "Sushitilbehør",
    "Annet",
  ],

  "Drikke": [
    "Brus",
    "Drinkmikser",
    "Energidrikk",
    "Ferdigdrinker",
    "Iskaffe",
    "Iste",
    "Juice",
    "Kaffe",
    "Leskedrikk",
    "Saft",
    "Sjokoladedrikk",
    "Smoothie",
    "Te",
    "Toddy",
    "Vann",
    "Øl og cider",
    "Annet",
  ],

  "Ost": [
    "Blåmuggost",
    "Brunost",
    "Cheddar",
    "Fetaost",
    "Gulost",
    "Halloumi",
    "Mozzarella",
    "Parmesan",
    "Plantebasert ost",
    "Revet ost",
    "Smøreoster",
    "Øvrig ost",
    "Annet",
  ],

  "Dessert og iskrem": [
    "Dessertpuddinger",
    "Dessertsaucer",
    "Dessertsuppe",
    "Gele",
    "Hermetisk frukt og bær",
    "Is",
    "Mousse",
    "Riskrem",
    "Tiramisu",
    "Annet",
  ],

  "Baking": [
    "Bakemixer",
    "Melis",
    "Bakepulver",
    "Gjær",
    "Mel",
    "Havregryn",
    "Sukker",
    "Sukkerbiter",
    "Tørket frukt og nøtter",
    "Annet",
  ],

  "Snacks, godteri & sjokolade": [
    "Dip",
    "Godteri",
    "Nøtter",
    "Pastiller",
    "Popcorn",
    "Sjokolade",
    "Tyggegummi",
    "Mellommåltid",
    "Kjeks",
    "Potetgull",
    "Annet",
  ],

  "Barneprodukter": [
    "Babyartikler",
    "Barnemat",
    "Annet",
  ],

  "Personlige artikler": [
    "Barbering",
    "Bind og tamponger",
    "Briller",
    "Helsekost",
    "Hår og hud",
    "Klær",
    "Personlig hygiene",
    "Sminke",
    "Tannpleie",
    "Annet",
  ],

  "Hus & hjem": [
    "Belysning",
    "Bilpleie",
    "Borddekning og servietter",
    "Byggevarer",
    "Grill",
    "Kjøkken",
    "Klesvask",
    "Klær og sko",
    "Kontorrekvisita",
    "Oppvarming",
    "Poser, papir og folie",
    "Renhold",
    "Sikkerhet",
    "Fest",
    "Sport",
    "Verktøy",
    "Annet",
  ],

  "Dyr": [
    "Dyreartikler",
    "Fuglemat",
    "Hundemat",
    "Kattemat",
    "Annet",
  ],

  "Blomster og planter": [
    "Blomster",
    "Plantejord",
    "Plantenæring",
    "Potteplanter",
    "Annet",
  ],
} as const;

export type MainCategory = keyof typeof CATEGORY_HIERARCHY;
export type SubCategory = typeof CATEGORY_HIERARCHY[MainCategory][number];

export const MAIN_CATEGORIES = Object.keys(CATEGORY_HIERARCHY) as MainCategory[];

export const DEFAULT_MAIN_CATEGORY: MainCategory = "Frukt & grønt";
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
