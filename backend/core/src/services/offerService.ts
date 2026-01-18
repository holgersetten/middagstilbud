import path from 'path';
import tjekApiService from '../../../persistence/src/services/tjekApiService';
import fileService from '../../../persistence/src/services/fileService';
import { getActiveStores, getStoreLogoUrl, Store } from '../../../rest/src/config/stores';
import config from '../../../rest/src/config/index';
import categoryService from './categoryService';
import { MainCategory, SubCategory } from '../config/categories';

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
        setInterval(() => {
            const now = new Date();
            const isWeekday = now.getDay() >= 1 && now.getDay() <= 5;
            const isBusinessHours = now.getHours() >= 8 && now.getHours() <= 20;
            
            if (isWeekday && isBusinessHours && !this.updateInProgress) {
                console.log('⏰ Automatisk oppdatering av tilbud...');
                this.updateAllStoreOffers();
            }
        }, 60 * 60 * 1000);
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
                storeLogo: getStoreLogoUrl(store.name)
            }));

            const filename = `${store.name.toLowerCase().replace(/\s+/g, '_')}_offers.json`;
            const filePath = path.join(config.offersDir, filename);
            fileService.saveJSON(filePath, enrichedOffers);

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

        return await categoryService.categorizeOffers(allOffers);
    }

    async getOffersByStore(storeName: string) {
        const filename = `${storeName.toLowerCase().replace(/\s+/g, '_')}_offers.json`;
        const filePath = path.join(config.offersDir, filename);
        
        try {
            const offers = fileService.loadJSON<Offer[]>(filePath);
            return Array.isArray(offers) ? await categoryService.categorizeOffers(offers) : [];
        } catch (error) {
            console.log(`⚠️ Kunne ikke laste tilbud for ${storeName}`);
            return [];
        }
    }

    async getOffersNeedingReview() {
        const allOffers = await this.getAllOffers();
        
        // Filtrer KUN produkter med cacheStatus: 'pending'
        // Dette er produkter som HAR vært gjennom AI men fikk lav confidence eller subCategory='Annet'
        // Vi ignorerer 'unknown' produkter (de som aldri har vært kategorisert)
        return allOffers.filter((offer: Offer) => {
            return offer.cacheStatus === 'pending';
        });
    }
}

export default new OfferService();
