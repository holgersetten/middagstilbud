const tjekApiService = require('../../../persistence/src/services/tjekApiService');
const fileService = require('../../../persistence/src/services/fileService');
const { getActiveStores, getStoreLogoUrl } = require('../../../rest/src/config/stores');
const config = require('../../../rest/src/config');

class OfferService {
    constructor() {
        this.updateInProgress = false;
        this.setupPeriodicUpdates();
    }

    setupPeriodicUpdates() {
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

    async updateAllStoreOffers() {
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
            console.error('❌ Feil under oppdatering av tilbud:', error.message);
            return false;
        } finally {
            this.updateInProgress = false;
        }
    }

    async updateStoreOffers(store) {
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

            const enrichedOffers = offers.map(offer => ({
                ...offer,
                store: store.name,
                storeLogo: getStoreLogoUrl(store.name)
            }));

            const filename = `${store.name.toLowerCase().replace(/\s+/g, '_')}_offers.json`;
            const filePath = require('path').join(config.offersDir, filename);
            fileService.saveJSON(filePath, enrichedOffers);

            return enrichedOffers;
        } catch (error) {
            const storeName = store?.name || 'ukjent butikk';
            console.error(`❌ Feil ved henting av tilbud fra ${storeName}:`, error.message);
            throw error;
        }
    }

    getAllOffers() {
        const stores = getActiveStores();
        const allOffers = [];

        for (const store of stores) {
            const filename = `${store.name.toLowerCase().replace(/\s+/g, '_')}_offers.json`;
            const filePath = require('path').join(config.offersDir, filename);
            
            try {
                const offers = fileService.loadJSON(filePath);
                if (Array.isArray(offers)) {
                    allOffers.push(...offers);
                }
            } catch (error) {
                console.log(`⚠️ Kunne ikke laste tilbud for ${store.name}`);
            }
        }

        return allOffers;
    }

    getOffersByStore(storeName) {
        const filename = `${storeName.toLowerCase().replace(/\s+/g, '_')}_offers.json`;
        const filePath = require('path').join(config.offersDir, filename);
        
        try {
            return fileService.loadJSON(filePath) || [];
        } catch (error) {
            console.log(`⚠️ Kunne ikke laste tilbud for ${storeName}`);
            return [];
        }
    }
}

module.exports = new OfferService();