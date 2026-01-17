import path from 'path';
import fileService from '../../../persistence/src/services/fileService';
import config from '../../../rest/src/config';
import { MainCategory, SubCategory, DEFAULT_MAIN_CATEGORY, DEFAULT_SUB_CATEGORY } from '../config/categories';
import { buildProductKey, buildCategoryKey } from '../utils/productKey';
import { matchCategoryByRules } from './categoryRules';
import { batchCategorizeWithAI } from './aiCategorization';
import { batchCategorizeWithAIMock } from './aiCategorizationMock';

// Toggle mellom mock og real AI
const USE_MOCK_AI = process.env.USE_MOCK_AI === 'true';
const aiCategorize = USE_MOCK_AI ? batchCategorizeWithAIMock : batchCategorizeWithAI;

type CategorySource = 'manual' | 'rule' | 'ai' | 'unknown';

interface CategoryCacheEntry {
    mainCategory: MainCategory;
    subCategory: SubCategory;
    ingredientKey: string;
    source: CategorySource;
    confidence: {
        main: number;
        sub: number;
        ingredientKey: number;
    };
    timestamp?: string;
}

type CategoryCache = Record<string, CategoryCacheEntry>;

interface OfferLike {
    title: string;
    store?: string | null;
    size?: number | null;
    unit?: string | null;
    pieces?: number | null;
    quantity?: string | null;
}

class CategoryService {
    private cache: CategoryCache = {}
    private cacheFilePath: string;
    private manualOverrides: Record<string, {
        mainCategory: MainCategory;
        subCategory: SubCategory;
        ingredientKey: string;
        reason?: string;
    }> = {};
    private manualOverridesPath: string;

    constructor() {
        this.cacheFilePath = path.join(config.offersDir, '../category_cache.json');
        this.manualOverridesPath = path.join(config.offersDir, '../manual_overrides.json');
        this.loadCache();
        this.loadManualOverrides();
    }

    private loadCache(): void {
        try {
            this.cache = fileService.loadJSON<CategoryCache>(this.cacheFilePath);
        }
        catch {
            console.log("!!! Ingen category cache funnet, starter med tom cache");
            this.cache = {};
        }
    }

    private loadManualOverrides(): void {
        try {
            const data = fileService.loadJSON<any>(this.manualOverridesPath);
            // Filter ut _info og _example
            this.manualOverrides = Object.keys(data)
                .filter(key => !key.startsWith('_'))
                .reduce((acc, key) => {
                    acc[key] = data[key];
                    return acc;
                }, {} as typeof this.manualOverrides);
            
            if (Object.keys(this.manualOverrides).length > 0) {
                console.log(`📝 Lastet ${Object.keys(this.manualOverrides).length} manuelle overrides`);
            }
        }
        catch {
            console.log("📝 Ingen manual_overrides.json funnet");
            this.manualOverrides = {};
        }
    }

    private saveCache(): boolean {
        return fileService.saveJSON(this.cacheFilePath, this.cache);
    }

    getCategoryForProduct(productKey: string): CategoryCacheEntry | null {
        return this.cache[productKey] || null;
    }

    setCategoryForProduct(
        productKey: string,
        mainCategory: MainCategory,
        subCategory: SubCategory,
        ingredientKey: string,
        source: CategorySource,
        confidence: { main: number; sub: number; ingredientKey: number }
    ): void {
        this.cache[productKey] = {
            mainCategory,
            subCategory,
            ingredientKey,
            source,
            confidence,
            timestamp: new Date().toISOString()
        };
        this.saveCache();
    }
    
    categorizeOffer(offer: OfferLike): { mainCategory: MainCategory; subCategory: SubCategory; ingredientKey: string } {
        // 0. Sjekk manuelle overrides først (høyeste prioritet)
        const categoryKey = buildCategoryKey(offer);
        const manualOverride = this.manualOverrides[categoryKey];
        if (manualOverride) {
            // Lagre i cache med source: manual
            this.setCategoryForProduct(
                categoryKey,
                manualOverride.mainCategory,
                manualOverride.subCategory,
                manualOverride.ingredientKey,
                'manual',
                { main: 1.0, sub: 1.0, ingredientKey: 1.0 }
            );
            return {
                mainCategory: manualOverride.mainCategory,
                subCategory: manualOverride.subCategory,
                ingredientKey: manualOverride.ingredientKey
            };
        }

        // 1. Prøv produktnøkkel (eksakt match)
        const productKey = buildProductKey(offer);
        const productEntry = this.getCategoryForProduct(productKey);
        if (productEntry) {
            return {
                mainCategory: productEntry.mainCategory,
                subCategory: productEntry.subCategory,
                ingredientKey: productEntry.ingredientKey
            };
        }

        // 2. Prøv kategorinøkkel (uten størrelse)
        const categoryEntry = this.getCategoryForProduct(categoryKey);
        if (categoryEntry) {
            return {
                mainCategory: categoryEntry.mainCategory,
                subCategory: categoryEntry.subCategory,
                ingredientKey: categoryEntry.ingredientKey
            };
        }

        // 3. Prøv high-precision rules (deprecated, kan fjernes)
        const ruleMatch = matchCategoryByRules(offer.title);
        if (ruleMatch) {
            // Legacy support - map old category to new structure
            return {
                mainCategory: ruleMatch as MainCategory,
                subCategory: DEFAULT_SUB_CATEGORY,
                ingredientKey: 'produkt'
            };
        }

        // 4. AI-kategorisering håndteres i batch av categorizeOffers()
        // For enkeltoppslag returnerer vi defaults
        return {
            mainCategory: DEFAULT_MAIN_CATEGORY,
            subCategory: DEFAULT_SUB_CATEGORY,
            ingredientKey: 'produkt'
        };
    }

    async categorizeOffers<T extends OfferLike>(offers: T[]): Promise<(T & { 
        productKey: string; 
        mainCategory: MainCategory; 
        subCategory: SubCategory; 
        ingredientKey: string;
        categorySource: CategorySource;
        categoryConfidence: number;
    })[]> {
        // Steg 1: Kategoriser synkront (cache + rules)
        const results = offers.map(offer => {
            const productKey = buildProductKey(offer);
            const categorization = this.categorizeOffer(offer);
            const cacheEntry = this.getCategoryForProduct(productKey) || 
                              this.getCategoryForProduct(buildCategoryKey(offer));
            
            // Beregn gjennomsnittlig confidence (0 hvis ikke cached)
            const avgConfidence = cacheEntry 
                ? (cacheEntry.confidence.main + cacheEntry.confidence.sub + cacheEntry.confidence.ingredientKey) / 3
                : 0;
            
            return {
                ...offer,
                productKey,
                ...categorization,
                categorySource: cacheEntry?.source || 'unknown' as CategorySource,
                categoryConfidence: avgConfidence
            };
        });

        // Steg 2: Samle alle "Ukjent" produkter for AI batch
        const uncategorized = results
            .filter(r => r.mainCategory === DEFAULT_MAIN_CATEGORY && r.ingredientKey === 'produkt')
            .map(r => ({
                productKey: r.productKey,
                title: r.title,
                store: r.store || undefined
            }));

        if (uncategorized.length > 0) {
            console.log(`🤖 Sender ${uncategorized.length} produkter til AI${USE_MOCK_AI ? ' (MOCK MODE)' : ''}...`);
            
            // Batch AI-kategorisering
            const aiResults = await aiCategorize(uncategorized);
            
            // Oppdater resultater og cache
            let cached = 0;
            for (const result of results) {
                if (result.mainCategory === DEFAULT_MAIN_CATEGORY && result.ingredientKey === 'produkt') {
                    const aiResult = aiResults.get(result.productKey);
                    if (aiResult) {
                        // Sjekk om alle confidence-verdier er høye nok
                        const minConfidence = 0.9;
                        const shouldCache = aiResult.confidence.main >= minConfidence &&
                                          aiResult.confidence.sub >= minConfidence &&
                                          aiResult.confidence.ingredientKey >= minConfidence;
                        
                        // Beregn gjennomsnittlig confidence
                        const avgConfidence = (aiResult.confidence.main + aiResult.confidence.sub + aiResult.confidence.ingredientKey) / 3;
                        
                        // Oppdater uansett (vises til bruker)
                        result.mainCategory = aiResult.mainCategory;
                        result.subCategory = aiResult.subCategory;
                        result.ingredientKey = aiResult.ingredientKey;
                        result.categorySource = 'ai';
                        result.categoryConfidence = avgConfidence;
                        
                        // Cache kun hvis høy nok confidence
                        if (shouldCache) {
                            const categoryKey = buildCategoryKey(result);
                            this.setCategoryForProduct(
                                categoryKey,
                                aiResult.mainCategory,
                                aiResult.subCategory,
                                aiResult.ingredientKey,
                                'ai',
                                aiResult.confidence
                            );
                            cached++;
                        }
                    }
                }
            }
            
            console.log(`✅ AI-kategorisering: ${aiResults.size} resultater, ${cached} cached (confidence ≥ 0.9)`);
        }

        return results;
    }

    setManualCategory(
        productKey: string,
        mainCategory: MainCategory,
        subCategory: SubCategory,
        ingredientKey: string
    ): boolean {
        this.setCategoryForProduct(
            productKey,
            mainCategory,
            subCategory,
            ingredientKey,
            'manual',
            { main: 1.0, sub: 1.0, ingredientKey: 1.0 }
        );
        return true;
    }
}

export default new CategoryService();