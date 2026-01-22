import offerService from './offerService';
import { getIngredientRole, IngredientRole } from '../data/ingredientMeta';

interface Offer {
    title: string;
    price: number | null;
    store?: string;
    ingredientKey?: string;
    mainCategory?: string;
    subCategory?: string;
    cacheStatus?: 'trusted' | 'pending';
    productKey?: string;
    quantity?: string;
    unit?: string;
}

interface Meal {
    name: string;
    protein: Offer;
    carb: Offer | string; // Offer eller pantry fallback (string)
    vegetables: Offer[];
}

interface ShoppingListItem {
    title: string;
    quantity: string;
    store: string;
    price: number;
}

interface WeeklyPlan {
    storesUsed: string[];
    meals: Meal[];
    shoppingList: {
        primary: ShoppingListItem[];
        secondary: ShoppingListItem[];
        pantry: string[]; // Ting du må ha på lager (ris, pasta etc)
    };
}

interface GenerateOptions {
    stores?: string[]; // 0-2 butikker
    meals?: number; // Default 6
}

class WeeklyPlanService {
    /**
     * Genererer ukemeny basert på tilgjengelige tilbud
     */
    async generateWeeklyPlan(options: GenerateOptions = {}): Promise<WeeklyPlan> {
        const { stores = [], meals: numMeals = 6 } = options;

        // 1. Hent alle tilbud
        let allOffers = await offerService.getAllOffers();

        // 2. Filtrér på valgte butikker (hvis spesifisert)
        if (stores.length > 0) {
            allOffers = allOffers.filter(offer => offer.store && stores.includes(offer.store));
        }

        // 3. Filtrer bort pending/ukategoriserte og tilbud uten pris
        const validOffers = allOffers.filter(offer => 
            offer.ingredientKey && 
            offer.ingredientKey !== 'produkt' &&
            offer.cacheStatus === 'trusted' &&
            offer.price !== null &&
            offer.price > 0
        );

        // 4. Bygg index: group by role
        const offersByRole = this.indexOffersByRole(validOffers);

        // 5. Generer meals
        const generatedMeals = this.generateMeals(offersByRole, numMeals);

        // 6. Bygg handleliste
        const shoppingList = this.buildShoppingList(generatedMeals, stores);

        return {
            storesUsed: stores.length > 0 ? stores : this.getUniqueStores(generatedMeals),
            meals: generatedMeals,
            shoppingList
        };
    }

    /**
     * Gruppér offers etter rolle (protein/carb/veg)
     */
    private indexOffersByRole(offers: Offer[]): Record<IngredientRole, Offer[]> {
        const index: Record<IngredientRole, Offer[]> = {
            protein: [],
            carb: [],
            veg: [],
            other: []
        };

        for (const offer of offers) {
            const role = getIngredientRole(offer.ingredientKey);
            index[role].push(offer);
        }

        // Sortér hver gruppe etter pris (billigst først)
        for (const role in index) {
            index[role as IngredientRole].sort((a, b) => (a.price || 0) - (b.price || 0));
        }

        return index;
    }

    /**
     * Generer meals med variasjon
     */
    private generateMeals(offersByRole: Record<IngredientRole, Offer[]>, numMeals: number): Meal[] {
        const meals: Meal[] = [];
        const usedProteinIndices = new Set<number>();
        const usedCarbIndices = new Set<number>();
        const pantryCarbs = ['ris', 'pasta', 'couscous', 'bulgur'];

        for (let i = 0; i < numMeals; i++) {
            // Velg protein (variasjon: ikke samme to ganger på rad)
            const proteinIndex = this.selectNextIndex(
                offersByRole.protein.length, 
                usedProteinIndices,
                meals.length > 0 ? offersByRole.protein.indexOf(meals[meals.length - 1].protein) : -1
            );

            if (proteinIndex === -1 || !offersByRole.protein[proteinIndex]) {
                console.log(`⚠️ Ikke nok proteintilbud for måltid ${i + 1}`);
                break;
            }

            const protein = offersByRole.protein[proteinIndex];
            usedProteinIndices.add(proteinIndex);

            // Velg carb (tilbud først, ellers pantry fallback)
            let carb: Offer | string;
            const carbIndex = this.selectNextIndex(
                offersByRole.carb.length, 
                usedCarbIndices,
                -1
            );

            if (carbIndex !== -1 && offersByRole.carb[carbIndex]) {
                carb = offersByRole.carb[carbIndex];
                usedCarbIndices.add(carbIndex);
            } else {
                // Fallback til pantry
                carb = pantryCarbs[i % pantryCarbs.length];
            }

            // Velg 1-2 grønnsaker (billigst, prøv variere)
            const vegetables: Offer[] = [];
            const vegCount = Math.min(2, offersByRole.veg.length);
            
            for (let v = 0; v < vegCount && v < offersByRole.veg.length; v++) {
                if (offersByRole.veg[v]) {
                    vegetables.push(offersByRole.veg[v]);
                }
            }

            // Generer måltidsnavn
            const proteinName = protein.ingredientKey || protein.title;
            const carbName = typeof carb === 'string' ? carb : (carb.ingredientKey || carb.title);
            const vegNames = vegetables.map(v => v.ingredientKey || v.title).join(' og ');

            meals.push({
                name: `${this.capitalize(proteinName)} med ${carbName}${vegNames ? ' og ' + vegNames : ''}`,
                protein,
                carb,
                vegetables
            });
        }

        return meals;
    }

    /**
     * Velg neste index med variasjon (unngå samme vare to ganger på rad)
     */
    private selectNextIndex(
        maxLength: number, 
        usedIndices: Set<number>, 
        avoidIndex: number
    ): number {
        if (maxLength === 0) return -1;

        // Finn første ubrukt index som ikke er avoidIndex
        for (let i = 0; i < maxLength; i++) {
            if (!usedIndices.has(i) && i !== avoidIndex) {
                return i;
            }
        }

        // Hvis alle er brukt, ta første som ikke er avoidIndex
        for (let i = 0; i < maxLength; i++) {
            if (i !== avoidIndex) {
                return i;
            }
        }

        // Fallback: ta første
        return 0;
    }

    /**
     * Bygg handleliste gruppert etter butikk
     */
    private buildShoppingList(
        meals: Meal[], 
        selectedStores: string[]
    ): { primary: ShoppingListItem[]; secondary: ShoppingListItem[]; pantry: string[] } {
        const itemsMap = new Map<string, ShoppingListItem>();
        const pantryItems = new Set<string>();

        for (const meal of meals) {
            // Protein
            this.addToShoppingList(itemsMap, meal.protein);

            // Carb
            if (typeof meal.carb === 'string') {
                pantryItems.add(meal.carb);
            } else {
                this.addToShoppingList(itemsMap, meal.carb);
            }

            // Vegetables
            for (const veg of meal.vegetables) {
                this.addToShoppingList(itemsMap, veg);
            }
        }

        const allItems = Array.from(itemsMap.values());

        // Hvis user valgte butikker, split primary/secondary
        if (selectedStores.length > 0) {
            const primary = allItems.filter(item => item.store === selectedStores[0]);
            const secondary = allItems.filter(item => item.store !== selectedStores[0]);

            return {
                primary: this.sortByCategory(primary),
                secondary: this.sortByCategory(secondary),
                pantry: Array.from(pantryItems)
            };
        }

        // Ellers: grupper etter mest brukt butikk
        const storeCounts = new Map<string, number>();
        allItems.forEach(item => {
            storeCounts.set(item.store, (storeCounts.get(item.store) || 0) + 1);
        });

        const sortedStores = Array.from(storeCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([store]) => store);

        const primaryStore = sortedStores[0] || '';

        return {
            primary: this.sortByCategory(allItems.filter(item => item.store === primaryStore)),
            secondary: this.sortByCategory(allItems.filter(item => item.store !== primaryStore)),
            pantry: Array.from(pantryItems)
        };
    }

    /**
     * Legg til offer i shopping list (merge duplikater)
     */
    private addToShoppingList(map: Map<string, ShoppingListItem>, offer: Offer): void {
        if (!offer.store) return; // Skip hvis butikk mangler
        
        const key = `${offer.store}|${offer.title}`;
        
        if (!map.has(key)) {
            map.set(key, {
                title: offer.title,
                quantity: offer.quantity || '1 stk',
                store: offer.store,
                price: offer.price || 0
            });
        }
    }

    /**
     * Sortér handleliste etter kategori (protein → veg → carb → other)
     */
    private sortByCategory(items: ShoppingListItem[]): ShoppingListItem[] {
        const order = { protein: 1, veg: 2, carb: 3, other: 4 };
        return items.sort((a, b) => {
            const roleA = getIngredientRole(a.title);
            const roleB = getIngredientRole(b.title);
            return (order[roleA] || 4) - (order[roleB] || 4);
        });
    }

    /**
     * Hent unike butikker fra meals
     */
    private getUniqueStores(meals: Meal[]): string[] {
        const stores = new Set<string>();
        
        for (const meal of meals) {
            if (meal.protein.store) stores.add(meal.protein.store);
            if (typeof meal.carb !== 'string' && meal.carb.store) {
                stores.add(meal.carb.store);
            }
            meal.vegetables.forEach(veg => {
                if (veg.store) stores.add(veg.store);
            });
        }

        return Array.from(stores);
    }

    /**
     * Capitalize første bokstav
     */
    private capitalize(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

export default new WeeklyPlanService();
