import path from 'path';
import fileService from '../../../persistence/src/services/fileService';
import config from '../../../rest/src/config';
import { MainCategory, SubCategory, DEFAULT_MAIN_CATEGORY, DEFAULT_SUB_CATEGORY, CATEGORY_HIERARCHY } from '../config/categories';
import { buildProductKey, buildCategoryKey } from '../utils/productKey';
import { matchCategoryByRules } from './categoryRules';
import { batchCategorizeWithAI } from './aiCategorization';

type CategorySource = 'manual' | 'rule' | 'ai' | 'unknown';
type CacheStatus = 'trusted' | 'pending';

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
    cacheStatus?: CacheStatus; // Optional - beregnes dynamisk, lagres ikke
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
    private ongoingCategorization: Promise<any> | null = null;

    constructor() {
        this.cacheFilePath = path.join(config.offersDir, '../category_cache.json');
        this.manualOverridesPath = path.join(config.offersDir, '../manual_overrides.json');
        this.loadCache();
        this.loadManualOverrides();
        this.cleanupObsoletePendingEntries();
    }
    
    // Rydder opp i gamle pending categoryKey entries når det finnes nyere trusted productKey entries
    private cleanupObsoletePendingEntries(): void {
        let cleanedCount = 0;
        const keysToDelete: string[] = [];
        
        for (const key in this.cache) {
            const entry = this.cache[key];
            
            // Hopp over hvis ikke pending
            if (entry.cacheStatus !== 'pending') continue;
            
            // Sjekk om dette er en categoryKey (format: title|store)
            const parts = key.split('|');
            if (parts.length !== 2) continue;
            
            // Sjekk om det finnes noen trusted productKey entries som matcher denne categoryKey
            // productKey format: title|size|pieces|store
            const matchingTrustedKeys = Object.keys(this.cache).filter(k => {
                const kParts = k.split('|');
                if (kParts.length !== 4) return false;
                
                const titleMatches = kParts[0] === parts[0];
                const storeMatches = kParts[3] === parts[1];
                const isTrusted = this.cache[k].cacheStatus === 'trusted';
                
                return titleMatches && storeMatches && isTrusted;
            });
            
            if (matchingTrustedKeys.length > 0) {
                console.log(`🧹 Sletter obsolete pending entry "${key}" (finnes trusted version: ${matchingTrustedKeys[0]})`);
                keysToDelete.push(key);
                cleanedCount++;
            }
        }
        
        // Slett alle identifiserte keys
        keysToDelete.forEach(key => delete this.cache[key]);
        
        if (cleanedCount > 0) {
            this.saveCache();
            console.log(`✅ Cleaned up ${cleanedCount} obsolete pending entries`);
        }
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
        const entry = this.cache[productKey];
        if (!entry) return null;
        
        // Rekalkluler cacheStatus basert på gjeldende regler
        // Dette sikrer at nye regler påvirker eksisterende cache-entries
        const recalculatedStatus: CacheStatus = 
            (entry.subCategory === 'Annet')
                ? 'pending'
                : (entry.confidence.main >= 0.90 && entry.confidence.sub >= 0.88 && entry.confidence.ingredientKey >= 0.90)
                    ? 'trusted'
                    : 'pending';
        
        // cacheStatus beregnes alltid dynamisk basert på gjeldende regler
        
        return {
            ...entry,
            cacheStatus: recalculatedStatus
        };
    }

    setCategoryForProduct(
        productKey: string,
        mainCategory: MainCategory,
        subCategory: SubCategory,
        ingredientKey: string,
        source: CategorySource,
        confidence: { main: number; sub: number; ingredientKey: number }
    ): void {
        // Valider at subCategory tilhører mainCategory
        const validSubs = CATEGORY_HIERARCHY[mainCategory];
        if (!validSubs.includes(subCategory as any)) {
            console.warn(`⚠️ Ugyldig subCategory "${subCategory}" for "${mainCategory}", setter til "Annet"`);
            subCategory = 'Annet' as SubCategory;
            confidence.sub = 0.5; // Redusert confidence for reparert kategori
        }

        // cacheStatus beregnes dynamisk i getCategoryForProduct()
        // og lagres IKKE i filen for å unngå inkonsistens ved threshold-endringer
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

        // 1. Prøv produktnøkkel (eksakt match) - bruk ALLE cache entries
        const productKey = buildProductKey(offer);
        const productEntry = this.getCategoryForProduct(productKey);
        if (productEntry) {
            return {
                mainCategory: productEntry.mainCategory,
                subCategory: productEntry.subCategory,
                ingredientKey: productEntry.ingredientKey
            };
        }

        // 2. Prøv kategorinøkkel (uten størrelse) - bruk ALLE cache entries
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
        cacheStatus?: CacheStatus;
    })[]> {
        console.log(`📋 Kategoriserer ${offers.length} tilbud...`);
        
        // Hvis kategorisering pågår, vent og returner synkron kategorisering
        if (this.ongoingCategorization) {
            console.log(`⏸️ Venter på pågående AI-kategorisering...`);
            await this.ongoingCategorization;
            console.log(`✅ Bruker cached resultater`);
            
            // Returner synkron kategorisering (bruker cache fra den pågående kategoriseringen)
            return offers.map(offer => {
                const productKey = buildProductKey(offer);
                const categorization = this.categorizeOffer(offer);
                const cacheEntry = this.getCategoryForProduct(productKey) || 
                                  this.getCategoryForProduct(buildCategoryKey(offer));
                
                const avgConfidence = cacheEntry 
                    ? (cacheEntry.confidence.main + cacheEntry.confidence.sub + cacheEntry.confidence.ingredientKey) / 3
                    : 0;
                
                return {
                    ...offer,
                    productKey,
                    ...categorization,
                    categorySource: cacheEntry?.source || 'unknown' as CategorySource,
                    categoryConfidence: avgConfidence,
                    cacheStatus: cacheEntry?.cacheStatus
                };
            });
        }

        // Start ny kategorisering
        this.ongoingCategorization = this.doCategorization(offers);
        
        try {
            const result = await this.ongoingCategorization;
            return result;
        } finally {
            this.ongoingCategorization = null;
        }
    }

    private async doCategorization<T extends OfferLike>(offers: T[]): Promise<(T & { 
        productKey: string; 
        mainCategory: MainCategory; 
        subCategory: SubCategory; 
        ingredientKey: string;
        categorySource: CategorySource;
        categoryConfidence: number;
        cacheStatus?: CacheStatus;
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
                categoryConfidence: avgConfidence,
                cacheStatus: cacheEntry?.cacheStatus
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

        const cachedCount = results.length - uncategorized.length;
        console.log(`✅ ${cachedCount} produkter fra cache, ${uncategorized.length} trenger kategorisering`);

        // Kategoriser ALLE ukategoriserte produkter (ingen limit)
        const uncategorizedToProcess = uncategorized;
        
        if (uncategorizedToProcess.length > 0) {
            console.log(`🚀 Kategoriserer ${uncategorizedToProcess.length} produkter med AI...`);
        }

        // Sjekk om AI er tilgjengelig (dynamisk ved runtime)
        // Trim SKIP_AI verdien for å håndtere mellomrom fra batch-filer
        const skipAI = (process.env.SKIP_AI || '').trim().toLowerCase() === 'true';
        const aiEnabled = !skipAI && !!process.env.OPENAI_API_KEY;

        if (uncategorizedToProcess.length > 0 && !aiEnabled) {
            console.log(`⚠️ ${uncategorizedToProcess.length} produkter mangler kategorisering (AI deaktivert)`);
            return results;
        }

        if (uncategorizedToProcess.length > 0 && aiEnabled) {
            console.log(`🤖 Sender ${uncategorizedToProcess.length} produkter til AI...`);
            
            // Batch AI-kategorisering
            const aiResults = await batchCategorizeWithAI(uncategorizedToProcess);
            
            // Oppdater resultater og cache
            let trusted = 0, pending = 0;
            const cachedKeys = new Set<string>(); // Spor unike categoryKeys
            
            for (const result of results) {
                if (result.mainCategory === DEFAULT_MAIN_CATEGORY && result.ingredientKey === 'produkt') {
                    const aiResult = aiResults.get(result.productKey);
                    if (aiResult) {
                        // Beregn gjennomsnittlig confidence
                        const avgConfidence = (aiResult.confidence.main + aiResult.confidence.sub + aiResult.confidence.ingredientKey) / 3;
                        
                        // Oppdater offer med AI-resultat
                        result.mainCategory = aiResult.mainCategory;
                        result.subCategory = aiResult.subCategory;
                        result.ingredientKey = aiResult.ingredientKey;
                        result.categorySource = 'ai';
                        result.categoryConfidence = avgConfidence;
                        
                        // Cache med validering og cacheStatus
                        const categoryKey = buildCategoryKey(result);
                        
                        // Kun cache hvis vi ikke allerede har cached denne categoryKey i denne runden
                        if (!cachedKeys.has(categoryKey)) {
                            this.setCategoryForProduct(
                                categoryKey,
                                aiResult.mainCategory,
                                aiResult.subCategory,
                                aiResult.ingredientKey,
                                'ai',
                                aiResult.confidence
                            );
                            cachedKeys.add(categoryKey);
                        }
                        
                        // Tell trusted vs pending
                        const cacheEntry = this.getCategoryForProduct(categoryKey);
                        if (cacheEntry?.cacheStatus === 'trusted') {
                            trusted++;
                        } else {
                            pending++;
                        }
                    }
                }
            }
            
            console.log(`✅ AI-kategorisering: ${trusted} trusted, ${pending} pending (${cachedKeys.size} unike oppføringer lagret i cache)`);
        }

        return results;
    }

    setManualCategory(
        productKey: string,
        mainCategory: MainCategory,
        subCategory: SubCategory,
        ingredientKey: string
    ): boolean {
        // Konverter productKey til categoryKey for konsistent lagring
        // productKey: "title|size|pieces|store" → categoryKey: "title|store"
        const categoryKey = this.extractCategoryKey(productKey);
        
        console.log(`📝 Manuell kategorisering: ${productKey} → ${categoryKey}`);
        
        // Manuell kategorisering får alltid max confidence og trusted status
        this.setCategoryForProduct(
            categoryKey,
            mainCategory,
            subCategory,
            ingredientKey,
            'manual',
            { main: 1.0, sub: 1.0, ingredientKey: 1.0 }
        );
        
        return true;
    }
    
    // Hjelper-metode for å ekstrahere categoryKey fra productKey
    // productKey format: "title|size|pieces|store"
    // categoryKey format: "title|store"
    private extractCategoryKey(productKey: string): string {
        const parts = productKey.split('|');
        if (parts.length === 4) {
            // Format: title|size|pieces|store → title|store
            return `${parts[0]}|${parts[3]}`;
        }
        // Allerede i categoryKey format eller ukjent format
        return productKey;
    }
}

export default new CategoryService();