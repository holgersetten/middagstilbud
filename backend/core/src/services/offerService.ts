import path from 'path';
import tjekApiService from '../../../persistence/src/services/tjekApiService';
import fileService from '../../../persistence/src/services/fileService';
import imageService from '../../../persistence/src/services/imageService';
import { getActiveStores, getStoreLogoUrl, Store } from '../../../rest/src/config/stores';
import config from '../../../rest/src/config/index';
import categoryService from './categoryService';
import { MainCategory, SubCategory } from '../config/categories';
import * as priceHistoryRepo from '../db/priceHistoryRepo';

interface Offer {
    title: string;
    description?: string;
    price: number | null;
    originalPrice?: number | null;
    discount?: number | null;
    currency: string;
    quantity?: string;
    unit?: string;
    pieces?: number;
    size?: number | null;
    validFrom?: string | null;
    validTo?: string | null;
    imageUrl?: string | null;
    offerId?: string | null;
    catalogId?: string;
    hotspotId?: string;
    store?: string;
    storeLogo?: string | null;
    mainCategory?: MainCategory;
    subCategory?: SubCategory;
    ingredientKey?: string;
    categorySource?: 'manual' | 'rule' | 'ai' | 'unknown';
    categoryConfidence?: number;
    cacheStatus?: 'trusted' | 'pending';
    productKey?: string;
}

class OfferService {
    private updateInProgress: boolean;

    constructor() {
        this.updateInProgress = false;
        this.setupPeriodicUpdates();
    }

    setupPeriodicUpdates(): void {
        // Ukentlig automatisk oppdatering: Hver søndag kl 22:00
        setInterval(() => {
            const now = new Date();
            const isSunday = now.getDay() === 0;
            const isUpdateTime = now.getHours() === 22 && now.getMinutes() < 60;
            
            if (isSunday && isUpdateTime && !this.updateInProgress) {
                console.log('⏰ Automatisk ukentlig oppdatering startet...');
                this.runWeeklyUpdate();
            }
        }, 60 * 60 * 1000); // Sjekk hver time
    }

    async runWeeklyUpdate(): Promise<void> {
        console.log('🔄 Ukentlig oppdatering: Henter nye tilbud og kjører AI kategorisering');
        
        try {
            // Hent nye tilbud
            await this.updateAllStoreOffers();
            
            // Trigger AI kategorisering via REST endpoint
            // (dette gjøres via endpoint for å følge samme flow som manuell oppdatering)
            console.log('✅ Tilbud oppdatert. AI kategorisering vil starte automatisk ved neste server-restart med SKIP_AI=false');
        } catch (error) {
            console.error('❌ Feil under ukentlig oppdatering:', (error as Error).message);
        }
    }

    async updateAllStoreOffers(): Promise<boolean> {
        if (this.updateInProgress) {
            console.log('🔄 Oppdatering pågår allerede...');
            return false;
        }

        this.updateInProgress = true;

        try {
            const stores = getActiveStores();
            const updatePromises = stores.map(store => this.updateStoreOffers(store));
            await Promise.allSettled(updatePromises);
            
            console.log('✅ Oppdatering av alle butikker fullført');
            return true;
        } catch (error) {
            console.error('❌ Feil under oppdatering av tilbud:', (error as Error).message);
            return false;
        } finally {
            this.updateInProgress = false;
        }
    }

    async enrichAllOffersWithImages(): Promise<void> {
        const stores = getActiveStores();
        
        for (const store of stores) {
            const filename = `${store.name.toLowerCase().replace(/\s+/g, '_')}_offers.json`;
            const filePath = path.join(config.offersDir, filename);
            
            try {
                let offers = fileService.loadJSON<Offer[]>(filePath);
                if (!Array.isArray(offers)) continue;

                // Hent bilder
                offers = await imageService.fetchImagesForOffers(offers);
                
                // Lagre tilbake
                fileService.saveJSON(filePath, offers);
            } catch (error) {
                console.error(`❌ Feil ved bildhenting for ${store.name}:`, (error as Error).message);
            }
        }
    }

    async updateStoreOffers(store: Store): Promise<Offer[] | undefined> {
        try {
            if (!store || !store.name) {
                console.error(`❌ Ugyldig butikk-objekt:`, store);
                return;
            }
            
            const offers = await tjekApiService.getStoreOffers(store.dealerId);
            
            if (!offers || offers.length === 0) {
                console.log(`⚠️ Ingen tilbud funnet for ${store.name}`);
                return;
            }

            const enrichedOffers = offers.map((offer: Offer) => ({
                ...offer,
                store: store.name,
                storeLogo: getStoreLogoUrl(store.name),
                productKey: `${offer.title}|${offer.size || 0}|${offer.pieces || 1}|${store.name}`
            }));

            const filename = `${store.name.toLowerCase().replace(/\/s+/g, '_')}_offers.json`;
            const filePath = path.join(config.offersDir, filename);
            fileService.saveJSON(filePath, enrichedOffers);

            // Lagre prishistorikk kun når tilbud oppdateres
            this.recordPriceHistory(enrichedOffers);

            return enrichedOffers;
        } catch (error) {
            const storeName = store?.name || 'ukjent butikk';
            console.error(`❌ Feil ved henting av tilbud fra ${storeName}:`, (error as Error).message);
            throw error;
        }
    }

    async getAllOffers() {
        const stores = getActiveStores();
        const allOffers: Offer[] = [];

        for (const store of stores) {
            const filename = `${store.name.toLowerCase().replace(/\s+/g, '_')}_offers.json`;
            const filePath = path.join(config.offersDir, filename);
            
            try {
                const offers = fileService.loadJSON<Offer[]>(filePath);
                if (Array.isArray(offers)) {
                    allOffers.push(...offers);
                }
            } catch (error) {
                console.log(`⚠️ Kunne ikke laste tilbud for ${store.name}`);
            }
        }

        // Bruk kun synkron kategorisering fra cache - kjør IKKE AI her
        // Legg også til productKey for admin review
        const enrichedOffers = allOffers.map(offer => ({
            ...offer,
            ...categoryService.categorizeOffer(offer),
            productKey: `${offer.title}|${offer.size || 0}|${offer.pieces || 1}|${offer.store || 'unknown'}`
        }));

        return enrichedOffers;
    }

    async getOffersByStore(storeName: string) {
        const filename = `${storeName.toLowerCase().replace(/\s+/g, '_')}_offers.json`;
        const filePath = path.join(config.offersDir, filename);
        
        try {
            const offers = fileService.loadJSON<Offer[]>(filePath);
            // Bruk kun synkron kategorisering fra cache - kjør IKKE AI her
            return Array.isArray(offers) ? offers.map(offer => ({
                ...offer,
                ...categoryService.categorizeOffer(offer)
            })) : [];
        } catch (error) {
            console.log(`⚠️ Kunne ikke laste tilbud for ${storeName}`);
            return [];
        }
    }

    async getOffersNeedingReview() {
        const allOffers = await this.getAllOffers();
        
        // Legg til productKey på alle aktive tilbud
        const withProductKeys = allOffers.map(offer => ({
            ...offer,
            productKey: `${offer.title}|${offer.size || 0}|${offer.pieces || 1}|${offer.store || 'unknown'}`,
            isActive: true
        }));
        
        // Filtrer aktive tilbud som trenger review
        const activeNeedingReview = withProductKeys.filter((offer: any) => {
            return offer.cacheStatus === 'pending' || offer.mainCategory === 'Ukategorisert';
        });
        
        // Hent ALLE ukategoriserte fra cache (inkluderer også gamle/utgåtte tilbud)
        const uncategorizedFromCache = categoryService.getAllUncategorizedFromCache();
        
        // Konverter cache entries til offer-format og merk som inactive
        const inactiveUncategorized = uncategorizedFromCache
            .filter(({ productKey }) => {
                // Ikke inkluder hvis allerede i aktive tilbud
                return !withProductKeys.some(o => o.productKey === productKey);
            })
            .map(({ productKey, entry }) => {
                // Parse productKey: title|store ELLER title|size|pieces|store
                const parts = productKey.split('|');
                const isOldFormat = parts.length === 2;
                
                return {
                    title: parts[0] || 'Ukjent',
                    size: isOldFormat ? 0 : (parseInt(parts[1]) || 0),
                    pieces: isOldFormat ? 1 : (parseInt(parts[2]) || 1),
                    store: isOldFormat ? parts[1] : (parts[3] || 'Ukjent'),
                    price: 0,
                    currency: 'kr',
                    quantity: '',
                    mainCategory: entry.mainCategory,
                    subCategory: entry.subCategory,
                    ingredientKey: entry.ingredientKey,
                    cacheStatus: entry.cacheStatus,
                    productKey,
                    isActive: false // Markerer som inaktivt/gammelt tilbud
                };
            });
        
        const combined = [...activeNeedingReview, ...inactiveUncategorized];
        console.log(`📊 Review: ${activeNeedingReview.length} aktive, ${inactiveUncategorized.length} inaktive (utløpte), totalt ${combined.length}`);
        
        return combined;
    }

    /**
     * Lagrer prishistorikk for alle tilbud
     */
    private recordPriceHistory(offers: Offer[]): void {
        let recorded = 0;
        for (const offer of offers) {
            if (!offer.productKey || !offer.price || !offer.store) continue;
            
            try {
                priceHistoryRepo.recordPrice({
                    productKey: offer.productKey,
                    store: offer.store,
                    price: offer.price,
                    originalPrice: offer.originalPrice ?? undefined,
                    discountPercent: offer.originalPrice 
                        ? Math.round(((offer.originalPrice - offer.price) / offer.originalPrice) * 100)
                        : undefined,
                    validFrom: offer.validFrom ?? undefined,
                    validTo: offer.validTo ?? undefined
                });
                recorded++;
            } catch (err) {
                // Ignorer duplikater (UNIQUE constraint)
            }
        }
        if (recorded > 0) {
            console.log(`💰 Lagret prishistorikk for ${recorded} tilbud`);
        }
    }
}

export default new OfferService();
