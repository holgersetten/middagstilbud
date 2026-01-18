import tjekApiService from '../../../persistence/src/services/tjekApiService';
import fileService from '../../../persistence/src/services/fileService';
import { getActiveStores } from '../../../rest/src/config/stores';
import path from 'path';

class CatalogService {
    private lastCheckFile = path.join(__dirname, '../../../persistence/src/resources/last_catalog_check.json');

    /**
     * Sjekker om det finnes nye tilbudsaviser for noen av butikkene
     */
    async hasNewCatalogs(): Promise<boolean> {
        try {
            const stores = getActiveStores();
            const lastCheck = this.loadLastCheck();
            
            console.log('🔍 Sjekker etter nye tilbudsaviser...');
            
            for (const store of stores) {
                try {
                    const catalog = await tjekApiService.getLatestCatalog(store.dealerId);
                    
                    if (!catalog) {
                        console.log(`  ⚠️  ${store.name}: Ingen katalog funnet`);
                        continue;
                    }

                    const catalogId = catalog.id;
                    const lastKnownId = lastCheck[store.dealerId];

                    // Hvis vi ikke har sett denne katalogen før, er det en ny
                    if (!lastKnownId || lastKnownId !== catalogId) {
                        console.log(`  ✨ ${store.name}: Ny katalog funnet (${catalogId})`);
                        return true;
                    } else {
                        console.log(`  ✓ ${store.name}: Katalog uendret (${catalogId})`);
                    }
                } catch (err) {
                    console.error(`  ❌ ${store.name}: Feil ved sjekk -`, (err as Error).message);
                }
            }
            
            console.log('✅ Ingen nye kataloger funnet\n');
            return false;
        } catch (error) {
            console.error('❌ Feil ved sjekk av kataloger:', (error as Error).message);
            return false;
        }
    }

    /**
     * Oppdaterer registeret over siste kjente kataloger
     */
    async updateLastCheck(): Promise<void> {
        try {
            const stores = getActiveStores();
            const lastCheck: Record<string, string> = {};
            
            for (const store of stores) {
                try {
                    const catalog = await tjekApiService.getLatestCatalog(store.dealerId);
                    if (catalog) {
                        lastCheck[store.dealerId] = catalog.id;
                    }
                } catch (err) {
                    console.error(`⚠️ Kunne ikke hente katalog for ${store.name}`);
                }
            }
            
            fileService.saveJSON(this.lastCheckFile, lastCheck);
            console.log('✅ Katalog-register oppdatert');
        } catch (error) {
            console.error('❌ Feil ved oppdatering av katalog-register:', (error as Error).message);
        }
    }

    /**
     * Laster siste kjente kataloger fra fil
     */
    private loadLastCheck(): Record<string, string> {
        try {
            return fileService.loadJSON(this.lastCheckFile);
        } catch {
            // Hvis filen ikke finnes, returner tomt objekt
            return {};
        }
    }
}

export default new CatalogService();
