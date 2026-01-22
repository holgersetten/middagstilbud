import offerService from './offerService';
import { getIngredientRole, isReusable, getMaxUsesPerWeek } from '../data/ingredientMeta';
import { MEAL_TEMPLATES, MealTemplate } from '../data/mealTemplates';

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
    usageCount?: number; // Hvor mange middager denne brukes i
}

interface WeeklyPlan {
    storesUsed: string[];
    meals: Meal[];
    shoppingList: {
        primary: ShoppingListItem[];
        secondary: ShoppingListItem[];
        pantry: Array<{ item: string; usageCount: number }>; // Pantry med bruksteller
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

        // 4. Bygg index: group by ingredientKey (ikke role)
        const offersByIngredient = this.indexOffersByIngredient(validOffers);

        // 5. NYTT: Score templates basert på tilgjengelige tilbud
        const scoredTemplates = this.scoreTemplates(MEAL_TEMPLATES, offersByIngredient);

        // 6. NYTT: Velg beste templates med variasjon
        const selectedTemplates = this.selectTemplates(scoredTemplates, numMeals);

        // 7. NYTT: Fyll templates med konkrete offers
        const generatedMeals = this.fillTemplates(selectedTemplates, offersByIngredient);

        // 8. Bygg handleliste
        const shoppingList = this.buildShoppingList(generatedMeals, stores);

        return {
            storesUsed: stores.length > 0 ? stores : this.getUniqueStores(generatedMeals),
            meals: generatedMeals,
            shoppingList
        };
    }

    /**
     * Gruppér offers etter ingredientKey (ikke rolle)
     */
    private indexOffersByIngredient(offers: Offer[]): Map<string, Offer[]> {
        const index = new Map<string, Offer[]>();

        for (const offer of offers) {
            const key = (offer.ingredientKey || '').toLowerCase();
            if (!key) continue;
            
            if (!index.has(key)) {
                index.set(key, []);
            }
            index.get(key)!.push(offer);
        }

        // Sortér hver gruppe etter pris (billigst først)
        for (const offerList of index.values()) {
            offerList.sort((a, b) => (a.price || 0) - (b.price || 0));
        }

        return index;
    }

    /**
     * Score alle templates basert på tilgjengelige tilbud
     */
    private scoreTemplates(
        templates: MealTemplate[], 
        offersByIngredient: Map<string, Offer[]>
    ): Array<{ template: MealTemplate; score: number }> {
        return templates.map(template => {
            let score = 0;

            // +10 hvis protein finnes på tilbud
            const hasProtein = template.protein.some(p => offersByIngredient.has(p.toLowerCase()));
            if (hasProtein) score += 10;

            // +5 hvis carb finnes på tilbud (ellers kan vi bruke pantry)
            const hasCarb = template.carbs.some(c => offersByIngredient.has(c.toLowerCase()));
            if (hasCarb) score += 5;

            // +3 hvis minst 1 veg finnes
            const vegCount = template.vegetables.filter(v => 
                offersByIngredient.has(v.toLowerCase())
            ).length;
            score += Math.min(vegCount, 2) * 3; // Max 6 poeng for veg

            return { template, score };
        });
    }

    /**
     * Velg beste templates med variasjon i protein
     */
    private selectTemplates(
        scoredTemplates: Array<{ template: MealTemplate; score: number }>,
        numMeals: number
    ): MealTemplate[] {
        // Sortér etter score (høyest først)
        const sorted = [...scoredTemplates].sort((a, b) => b.score - a.score);

        const selected: MealTemplate[] = [];
        const usedProteinTypes = new Set<string>();

        // Velg templates med variasjon (ikke samme protein-type to ganger på rad)
        for (const { template, score } of sorted) {
            if (selected.length >= numMeals) break;
            if (score <= 0) continue; // Skip templates uten tilbud

            // Enkel variasjon: ikke samme protein-type direkte etter hverandre
            const proteinType = template.protein[0]; // Bruk første protein som "type"
            const lastProteinType = selected.length > 0 
                ? selected[selected.length - 1].protein[0] 
                : null;

            if (lastProteinType === proteinType) {
                // Skip hvis samme type, men la den være tilgjengelig senere
                continue;
            }

            selected.push(template);
            usedProteinTypes.add(proteinType);
        }

        // Hvis vi ikke fikk nok, fyll opp med beste (tillat gjenbruk)
        if (selected.length < numMeals) {
            for (const { template, score } of sorted) {
                if (selected.length >= numMeals) break;
                if (score <= 0) continue;
                if (!selected.includes(template)) {
                    selected.push(template);
                }
            }
        }

        return selected;
    }

    /**
     * Fyll templates med konkrete offers
     */
    private fillTemplates(
        templates: MealTemplate[],
        offersByIngredient: Map<string, Offer[]>
    ): Meal[] {
        const meals: Meal[] = [];
        const defaultPantryCarbs = ['ris', 'pasta', 'couscous', 'bulgur'];
        
        // Track reusable ingredient usage
        const reusableUsage = new Map<string, number>();

        for (const template of templates) {
            // 1. PROTEIN: Finn billigste lovlige protein
            let protein: Offer | null = null;
            for (const proteinKey of template.protein) {
                const offers = offersByIngredient.get(proteinKey.toLowerCase());
                if (offers && offers.length > 0) {
                    protein = offers[0]; // Billigste (allerede sortert)
                    break;
                }
            }

            if (!protein) {
                console.log(`⚠️ Ingen protein funnet for template ${template.id}`);
                continue;
            }

            // 2. CARB: Finn billigste lovlige carb (eller bruk template-spesifikk fallback)
            let carb: Offer | string = defaultPantryCarbs[0]; // Default
            let carbFound = false;
            
            for (const carbKey of template.carbs) {
                const offers = offersByIngredient.get(carbKey.toLowerCase());
                if (offers && offers.length > 0) {
                    carb = offers[0];
                    carbFound = true;
                    break;
                }
            }

            // If no offer found, use template-specific carbFallback (NOT generic pantry)
            if (!carbFound) {
                if (template.carbFallback && template.carbFallback.length > 0) {
                    // Use carbFallback, but respect forbids
                    const allowedFallback = template.carbFallback.find(fb => {
                        const fbLower = fb.toLowerCase();
                        return !template.forbids?.some(f => f.toLowerCase() === fbLower);
                    });
                    carb = allowedFallback || template.carbFallback[0]; // Fallback to first if all forbidden (shouldn't happen)
                } else {
                    // Generic pantry fallback (only if template has no specific preference)
                    const pantryMatch = template.carbs.find(c => {
                        const cLower = c.toLowerCase();
                        return defaultPantryCarbs.includes(cLower) && 
                               !template.forbids?.some(f => f.toLowerCase() === cLower);
                    });
                    carb = pantryMatch || defaultPantryCarbs[0];
                }
            }

            // 3. VEG: Finn 1-2 lovlige grønnsaker (unique + respect reusable limits)
            const vegetables: Offer[] = [];
            const usedVegKeys = new Set<string>();

            for (const vegKey of template.vegetables) {
                if (vegetables.length >= 2) break;
                if (usedVegKeys.has(vegKey.toLowerCase())) continue;

                // Check reusable limit
                const vegKeyLower = vegKey.toLowerCase();
                if (isReusable(vegKeyLower)) {
                    const maxUses = getMaxUsesPerWeek(vegKeyLower) || 2;
                    const currentUses = reusableUsage.get(vegKeyLower) || 0;
                    if (currentUses >= maxUses) {
                        continue; // Skip - already used too much
                    }
                }

                const offers = offersByIngredient.get(vegKeyLower);
                if (offers && offers.length > 0) {
                    vegetables.push(offers[0]);
                    usedVegKeys.add(vegKeyLower);
                    
                    // Track reusable usage
                    if (isReusable(vegKeyLower)) {
                        reusableUsage.set(vegKeyLower, (reusableUsage.get(vegKeyLower) || 0) + 1);
                    }
                }
            }

            // 4. CREATE MEAL
            const proteinName = protein.ingredientKey || protein.title;
            const carbName = typeof carb === 'string' ? carb : (carb.ingredientKey || carb.title || 'ukjent');
            const vegNames = vegetables.map(v => v.ingredientKey || v.title).join(' og ');

            meals.push({
                name: template.name || `${this.capitalize(proteinName)} med ${carbName}${vegNames ? ' og ' + vegNames : ''}`,
                protein,
                carb,
                vegetables
            });
        }

        return meals;
    }



    /**
     * Bygg handleliste gruppert etter butikk
     */
    private buildShoppingList(
        meals: Meal[], 
        selectedStores: string[]
    ): { primary: ShoppingListItem[]; secondary: ShoppingListItem[]; pantry: Array<{ item: string; usageCount: number }> } {
        const itemsMap = new Map<string, ShoppingListItem>();
        const pantryUsage = new Map<string, number>(); // Track pantry usage

        for (const meal of meals) {
            // Protein
            this.addToShoppingList(itemsMap, meal.protein, selectedStores);

            // Carb
            if (typeof meal.carb === 'string') {
                pantryUsage.set(meal.carb, (pantryUsage.get(meal.carb) || 0) + 1);
            } else {
                this.addToShoppingList(itemsMap, meal.carb, selectedStores);
            }

            // Vegetables
            for (const veg of meal.vegetables) {
                this.addToShoppingList(itemsMap, veg, selectedStores);
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
                pantry: Array.from(pantryUsage.entries()).map(([item, usageCount]) => ({ item, usageCount }))
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
            pantry: Array.from(pantryUsage.entries()).map(([item, usageCount]) => ({ item, usageCount }))
        };
    }

    /**
     * Legg til offer i shopping list (merge duplikater, respekt reusable)
     */
    private addToShoppingList(
        map: Map<string, ShoppingListItem>, 
        offer: Offer, 
        selectedStores: string[]
    ): void {
        if (!offer.store) return; // Skip hvis butikk mangler
        
        const ingredientKey = (offer.ingredientKey || '').toLowerCase();
        
        // CRITICAL: For reusable ingredients, use ingredientKey as key (not store+title)
        // This deduplicates across stores (tomater brukes kun 1x selv om 3 middager)
        const key = isReusable(ingredientKey) 
            ? `reusable|${ingredientKey}`
            : `${offer.store}|${offer.title}`;
        
        const existing = map.get(key);
        
        if (!existing) {
            map.set(key, {
                title: offer.title,
                quantity: offer.quantity || '1 stk',
                store: offer.store,
                price: offer.price || 0,
                usageCount: 1
            });
        } else {
            // Already exists - increment usage count
            existing.usageCount = (existing.usageCount || 1) + 1;
            
            // For reusable: choose best store (primary preference if price is close)
            if (isReusable(ingredientKey) && selectedStores.length > 0) {
                const primaryStore = selectedStores[0];
                const isPrimaryStore = offer.store === primaryStore;
                const isExistingPrimary = existing.store === primaryStore;
                
                // Switch to primary if price is "close enough" (≤ 5kr more expensive)
                if (isPrimaryStore && !isExistingPrimary) {
                    const priceDiff = (offer.price || 0) - (existing.price || 0);
                    if (priceDiff <= 5) {
                        existing.store = offer.store;
                        existing.price = offer.price || 0;
                        existing.title = offer.title;
                        existing.quantity = offer.quantity || '1 stk';
                    }
                } else if (!isPrimaryStore && !isExistingPrimary) {
                    // Both are secondary - choose cheapest
                    if ((offer.price || 0) < (existing.price || 0)) {
                        existing.store = offer.store;
                        existing.price = offer.price || 0;
                        existing.title = offer.title;
                        existing.quantity = offer.quantity || '1 stk';
                    }
                }
            }
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
