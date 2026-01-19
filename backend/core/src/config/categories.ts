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
    "Salat"
  ],
  "Fisk & skalldyr": [
    "Fisk",
    "Fiskeburger",
    "Hvalkjøtt",
    "Skalldyr",
    "Skjell",
    "Sushi",
    "Tørket fisk"
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
    "Riskaker",
    "Rundstykker"
  ],
  "Middag": [
    "Ferdigretter",
    "Fiskeretter",
    "Grøt",
    "Middagshermetikk",
    "Nudler",
    "Pasta",
    "Ris",
    "Wok",
    "Pizza",
    "Supper",
    "Taco",
    "Vegetarretter"
  ],
  "Kylling og fjærkre": [
    "And",
    "Kalkun",
    "Kylling",
    "Rype"
  ],
  "Meieri & egg": [
    "Cottage cheese",
    "Creme fraiche",
    "Egg",
    "Fløte",
    "Kesam",
    "Melk",
    "Smør og margarin",
    "Proteinpudding",
    "Rømme",
    "Yoghurt",
    "Drikkeyoghurt"
  ],
  "Pålegg & frokost": [
    "Bacon",
    "Fiskepålegg",
    "Frokostblandinger og müsli",
    "Kjøttpålegg",
    "Leverpostei",
    "Påleggsalat",
    "Syltetøy og honning",
    "Vegansk pålegg",
    "Tubeost"
  ],
  "Kjøtt": [
    "Hamburger",
    "Kjøttdeig og farse",
    "Lammekjøtt",
    "Pølser",
    "Storfekjøtt",
    "Svinekjøtt",
    "Viltkjøtt",
    "Kjøttkaker og kjøttboller"
  ],
  "Tilbehør": [
    "Eddik",
    "Dip",
    "Hermetisk grønt",
    "Ketchup og sennep",
    "Kokosmelk",
    "Kraft og buljong",
    "Krydder",
    "Linser og bønner",
    "Marinader og BBQ-saus",
    "Matoljer",
    "Middagssalat",
    "Oliven",
    "Pizzatopping",
    "Potetsalat",
    "Sauser og dressing",
    "Stuinger",
    "Sushitilbehør",
    "Fries"
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
    "Øl og cider"
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
    "Øvrig ost"
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
    "Tiramisu"
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
    "Tørket frukt og nøtter"
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
    "Muffins",
    "Kjeks",
    "Potetgull"
  ],
  "Barneprodukter": [
    "Babyartikler",
    "Barnemat"
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
    "Tannpleie"
  ],
  "Hus & hjem": [
    "Belysning",
    "Bilpleie",
    "Borddekning og servietter",
    "Byggevarer",
    "Dopapir og tørkerull",
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
    "Leker"
  ],
  "Dyr": [
    "Dyreartikler",
    "Fuglemat",
    "Hundemat",
    "Kattemat"
  ],
  "Blomster og planter": [
    "Blomster",
    "Plantejord",
    "Plantenæring",
    "Potteplanter"
  ],
  "Ukategorisert": [
    "Ukategorisert"
  ]
} as const;

export type MainCategory = keyof typeof CATEGORY_HIERARCHY;
export type SubCategory = typeof CATEGORY_HIERARCHY[MainCategory][number];

export const MAIN_CATEGORIES = Object.keys(CATEGORY_HIERARCHY) as MainCategory[];

export const DEFAULT_MAIN_CATEGORY: MainCategory = "Ukategorisert";
export const DEFAULT_SUB_CATEGORY: SubCategory = "Ukategorisert";

export function isValidMainCategory(cat: string): cat is MainCategory {
  return MAIN_CATEGORIES.includes(cat as MainCategory);
}

export function getSubCategories(mainCat: MainCategory): readonly SubCategory[] {
  return CATEGORY_HIERARCHY[mainCat] as readonly SubCategory[];
}

export function isValidSubCategory(mainCat: MainCategory, subCat: string): boolean {
  const subCategories = CATEGORY_HIERARCHY[mainCat] as readonly SubCategory[];
  return subCategories.includes(subCat as SubCategory);
}

// Legacy support - deprecated
export const CATEGORIES = MAIN_CATEGORIES;
export type Category = MainCategory;
export const DEFAULT_CATEGORY = DEFAULT_MAIN_CATEGORY;
