import express, { Request, Response } from 'express';
import offerService from '../../../core/src/services/offerService';
import categoryService from '../../../core/src/services/categoryService';
import categoryConfigService from '../../../core/src/services/categoryConfigService';
import imageService from '../../../persistence/src/services/imageService';
import { MainCategory, SubCategory, CATEGORY_HIERARCHY } from '../../../core/src/config/categories';
import * as priceHistoryRepo from '../../../core/src/db/priceHistoryRepo';

const router = express.Router();

// GET /api/offers - Hent alle tilbud
router.get('/offers', async (req: Request, res: Response) => {
    try {
        const { store } = req.query;
        const storeName = typeof store === 'string' ? store : undefined;
        
        let offers;
        if (storeName) {
            offers = await offerService.getOffersByStore(storeName);
        } else {
            offers = await offerService.getAllOffers();
        }
        
        res.json({
            count: offers.length,
            store: storeName || 'alle',
            offers: offers
        });
    } catch (error) {
        console.error('❌ Feil ved henting av tilbud:', (error as Error).message);
        res.status(500).json({
            error: 'Kunne ikke hente tilbud',
            message: (error as Error).message
        });
    }
});

// GET /api/offers/review - Hent tilbud som trenger review (lav confidence)
router.get('/offers/review', async (req: Request, res: Response) => {
    try {
        const offersNeedingReview = await offerService.getOffersNeedingReview();
        
        res.json({
            count: offersNeedingReview.length,
            offers: offersNeedingReview
        });
    } catch (error) {
        console.error('❌ Feil ved henting av review-tilbud:', (error as Error).message);
        res.status(500).json({
            error: 'Kunne ikke hente review-tilbud',
            message: (error as Error).message
        });
    }
});

// GET /api/categories - Hent kategoristruktur
router.get('/categories', (req: Request, res: Response) => {
    try {
        res.json({
            categories: CATEGORY_HIERARCHY
        });
    } catch (error) {
        console.error('❌ Feil ved henting av kategorier:', (error as Error).message);
        res.status(500).json({
            error: 'Kunne ikke hente kategorier',
            message: (error as Error).message
        });
    }
});

// POST /api/offers/categorize - Manuell kategorisering av et tilbud
router.post('/offers/categorize', async (req: Request, res: Response) => {
    try {
        const { productKey, mainCategory, subCategory, ingredientKey } = req.body;
        
        if (!productKey || !mainCategory || !subCategory || !ingredientKey) {
            return res.status(400).json({
                error: 'Mangler påkrevde felter',
                required: ['productKey', 'mainCategory', 'subCategory', 'ingredientKey']
            });
        }
        
        const success = categoryService.setManualCategory(
            productKey,
            mainCategory as MainCategory,
            subCategory as SubCategory,
            ingredientKey
        );
        
        if (success) {
            console.log(`✅ Manuell kategorisering: ${productKey} → ${mainCategory} / ${subCategory} / ${ingredientKey}`);
            return res.json({
                success: true,
                message: 'Kategorisering lagret'
            });
        } else {
            return res.status(500).json({
                error: 'Kunne ikke lagre kategorisering'
            });
        }
    } catch (error) {
        console.error('❌ Feil ved manuell kategorisering:', (error as Error).message);
        return res.status(500).json({
            error: 'Kunne ikke kategorisere tilbud',
            message: (error as Error).message
        });
    }
});

// POST /api/offers/update - Manuelt oppdater tilbud
router.post('/offers/update', async (req: Request, res: Response) => {
    try {
        console.log('🔄 Manuell oppdatering av tilbud trigget');
        offerService.updateAllStoreOffers();
        
        res.json({
            message: 'Oppdatering av tilbud startet',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Feil ved oppdatering av tilbud:', (error as Error).message);
        res.status(500).json({
            error: 'Kunne ikke oppdatere tilbud',
            message: (error as Error).message
        });
    }
});

// POST /api/categories/subcategory/add - Legg til ny underkategori
router.post('/categories/subcategory/add', async (req: Request, res: Response) => {
    try {
        const { mainCategory, subCategory } = req.body;
        
        if (!mainCategory || !subCategory) {
            return res.status(400).json({
                error: 'Mangler påkrevde felter',
                required: ['mainCategory', 'subCategory']
            });
        }
        
        const success = categoryConfigService.addSubCategory(mainCategory, subCategory);
        
        if (success) {
            console.log(`✅ Ny underkategori lagt til: ${mainCategory} / ${subCategory}`);
            return res.json({
                success: true,
                message: 'Underkategori lagt til',
                note: 'Server må restartes for at endringer skal tre i kraft'
            });
        } else {
            return res.status(500).json({
                error: 'Kunne ikke legge til underkategori'
            });
        }
    } catch (error) {
        console.error('❌ Feil ved tillegging av underkategori:', (error as Error).message);
        return res.status(500).json({
            error: 'Kunne ikke legge til underkategori',
            message: (error as Error).message
        });
    }
});

// POST /api/categories/subcategory/remove - Fjern underkategori
router.post('/categories/subcategory/remove', async (req: Request, res: Response) => {
    try {
        const { mainCategory, subCategory } = req.body;
        
        if (!mainCategory || !subCategory) {
            return res.status(400).json({
                error: 'Mangler påkrevde felter',
                required: ['mainCategory', 'subCategory']
            });
        }
        
        const success = categoryConfigService.removeSubCategory(mainCategory, subCategory);
        
        if (success) {
            console.log(`✅ Underkategori fjernet: ${mainCategory} / ${subCategory}`);
            return res.json({
                success: true,
                message: 'Underkategori fjernet',
                note: 'Server må restartes for at endringer skal tre i kraft'
            });
        } else {
            return res.status(500).json({
                error: 'Kunne ikke fjerne underkategori'
            });
        }
    } catch (error) {
        console.error('❌ Feil ved fjerning av underkategori:', (error as Error).message);
        return res.status(500).json({
            error: 'Kunne ikke fjerne underkategori',
            message: (error as Error).message
        });
    }
});

// POST /api/categories/subcategory/rename - Omdøp underkategori
router.post('/categories/subcategory/rename', async (req: Request, res: Response) => {
    try {
        const { mainCategory, oldName, newName } = req.body;
        
        if (!mainCategory || !oldName || !newName) {
            return res.status(400).json({
                error: 'Mangler påkrevde felter',
                required: ['mainCategory', 'oldName', 'newName']
            });
        }
        
        const success = categoryConfigService.renameSubCategory(mainCategory, oldName, newName);
        
        if (success) {
            console.log(`✅ Underkategori omdøpt: ${mainCategory} / ${oldName} → ${newName}`);
            return res.json({
                success: true,
                message: 'Underkategori omdøpt',
                note: 'Server må restartes for at endringer skal tre i kraft'
            });
        } else {
            return res.status(500).json({
                error: 'Kunne ikke omdøpe underkategori'
            });
        }
    } catch (error) {
        console.error('❌ Feil ved omdøping av underkategori:', (error as Error).message);
        return res.status(500).json({
            error: 'Kunne ikke omdøpe underkategori',
            message: (error as Error).message
        });
    }
});

// POST /api/categories/main/add - Legg til ny hovedkategori
router.post('/categories/main/add', async (req: Request, res: Response) => {
    try {
        const { mainCategory } = req.body;
        
        if (!mainCategory) {
            return res.status(400).json({
                error: 'Mangler påkrevde felter',
                required: ['mainCategory']
            });
        }
        
        const success = categoryConfigService.addMainCategory(mainCategory);
        
        if (success) {
            console.log(`✅ Ny hovedkategori lagt til: ${mainCategory}`);
            return res.json({
                success: true,
                message: 'Hovedkategori lagt til',
                note: 'Server må restartes for at endringer skal tre i kraft'
            });
        } else {
            return res.status(500).json({
                error: 'Kunne ikke legge til hovedkategori'
            });
        }
    } catch (error) {
        console.error('❌ Feil ved tillegging av hovedkategori:', (error as Error).message);
        return res.status(500).json({
            error: 'Kunne ikke legge til hovedkategori',
            message: (error as Error).message
        });
    }
});

// POST /api/categories/main/remove - Fjern hovedkategori
router.post('/categories/main/remove', async (req: Request, res: Response) => {
    try {
        const { mainCategory } = req.body;
        
        if (!mainCategory) {
            return res.status(400).json({
                error: 'Mangler påkrevde felter',
                required: ['mainCategory']
            });
        }
        
        const success = categoryConfigService.removeMainCategory(mainCategory);
        
        if (success) {
            console.log(`✅ Hovedkategori fjernet: ${mainCategory}`);
            return res.json({
                success: true,
                message: 'Hovedkategori fjernet',
                note: 'Server må restartes for at endringer skal tre i kraft'
            });
        } else {
            return res.status(500).json({
                error: 'Kunne ikke fjerne hovedkategori'
            });
        }
    } catch (error) {
        console.error('❌ Feil ved fjerning av hovedkategori:', (error as Error).message);
        return res.status(500).json({
            error: 'Kunne ikke fjerne hovedkategori',
            message: (error as Error).message
        });
    }
});

// POST /api/categories/main/rename - Omdøp hovedkategori
router.post('/categories/main/rename', async (req: Request, res: Response) => {
    try {
        const { oldName, newName } = req.body;
        
        if (!oldName || !newName) {
            return res.status(400).json({
                error: 'Mangler påkrevde felter',
                required: ['oldName', 'newName']
            });
        }
        
        const success = categoryConfigService.renameMainCategory(oldName, newName);
        
        if (success) {
            console.log(`✅ Hovedkategori omdøpt: ${oldName} → ${newName}`);
            return res.json({
                success: true,
                message: 'Hovedkategori omdøpt',
                note: 'Server må restartes for at endringer skal tre i kraft'
            });
        } else {
            return res.status(500).json({
                error: 'Kunne ikke omdøpe hovedkategori'
            });
        }
    } catch (error) {
        console.error('❌ Feil ved omdøping av hovedkategori:', (error as Error).message);
        return res.status(500).json({
            error: 'Kunne ikke omdøpe hovedkategori',
            message: (error as Error).message
        });
    }
});

// GET /api/offers/:hotspotId/image - Hent bilde for et tilbud
router.get('/offers/:hotspotId/image', async (req: Request, res: Response) => {
    try {
        const hotspotId = req.params.hotspotId;
        
        if (!hotspotId || typeof hotspotId !== 'string') {
            return res.status(400).json({ error: 'hotspotId er påkrevd' });
        }

        const images = await imageService.getOfferImage(hotspotId);
        const bestImage = imageService.getBestImage(images);

        return res.json({
            hotspotId,
            images,
            bestImage
        });
    } catch (error) {
        console.error('❌ Feil ved henting av bilde:', (error as Error).message);
        return res.status(500).json({
            error: 'Kunne ikke hente bilde',
            message: (error as Error).message
        });
    }
});

// POST /api/offers/weekly-update - Komplett ukentlig oppdatering (tilbud + AI kategorisering)
router.post('/offers/weekly-update', async (req: Request, res: Response) => {
    try {
        console.log('🔄 Ukentlig oppdatering startet:', new Date().toISOString());
        
        // STEG 1: Hent nye tilbud
        console.log('📥 Henter nye tilbudsaviser...');
        await offerService.updateAllStoreOffers();
        
        // STEG 2: Hent bilder for tilbudene
        console.log('🖼️  Henter bilder...');
        await offerService.enrichAllOffersWithImages();
        
        // STEG 3: Kjør AI kategorisering (2 iterasjoner for bedre kvalitetskontroll)
        console.log('🤖 AI kategorisering (2 iterasjoner)...');
        
        // Iterasjon 1: Første kategoriseringsforsøk
        console.log('\n🔄 Iterasjon 1/2...');
        let allOffers = await offerService.getAllOffers();
        await categoryService.categorizeOffers(allOffers);
        let pendingCount = categoryService.getPendingCount();
        console.log(`   ➜ Resultat: ${pendingCount} pending produkter`);
        
        if (pendingCount > 0) {
            // Iterasjon 2: Retry pending med fresh context
            console.log('\n🔄 Iterasjon 2/2...');
            categoryService.removePendingFromCache();
            allOffers = await offerService.getAllOffers(); // Fresh load
            await categoryService.categorizeOffers(allOffers);
            pendingCount = categoryService.getPendingCount();
            console.log(`   ➜ Resultat: ${pendingCount} pending produkter`);
        }
        
        // Rapporter resultat
        const result = {
            success: true,
            timestamp: new Date().toISOString(),
            pendingCount,
            message: pendingCount === 0 
                ? 'Alle produkter kategorisert automatisk!' 
                : `${pendingCount} produkter krever manuell review`
        };
        
        res.json(result);
    } catch (error) {
        console.error('❌ Feil ved ukentlig oppdatering:', (error as Error).message);
        res.status(500).json({
            error: 'Ukentlig oppdatering feilet',
            message: (error as Error).message
        });
    }
});

// GET /api/price-history/:productKey - Hent prishistorikk for et produkt
router.get('/price-history/:productKey', (req: Request, res: Response) => {
    try {
        const productKey = typeof req.params.productKey === 'string' ? req.params.productKey : req.params.productKey[0];
        const { store, limit } = req.query;
        
        const history = priceHistoryRepo.getPriceHistory(
            productKey,
            typeof store === 'string' ? store : undefined,
            typeof limit === 'string' ? parseInt(limit) : 30
        );
        
        res.json({
            productKey,
            count: history.length,
            history
        });
    } catch (error) {
        console.error('❌ Feil ved henting av prishistorikk:', (error as Error).message);
        res.status(500).json({
            error: 'Kunne ikke hente prishistorikk',
            message: (error as Error).message
        });
    }
});

// GET /api/price-history/:productKey/lowest - Finn laveste pris
router.get('/price-history/:productKey/lowest', (req: Request, res: Response) => {
    try {
        const productKey = typeof req.params.productKey === 'string' ? req.params.productKey : req.params.productKey[0];
        const { days } = req.query;
        
        const lowest = priceHistoryRepo.getLowestPrice(
            productKey,
            typeof days === 'string' ? parseInt(days) : 30
        );
        
        if (!lowest) {
            return res.status(404).json({ error: 'Ingen prishistorikk funnet' });
        }
        
        return res.json({
            productKey,
            lowestPrice: lowest
        });
    } catch (error) {
        console.error('❌ Feil ved henting av laveste pris:', (error as Error).message);
        return res.status(500).json({
            error: 'Kunne ikke hente laveste pris',
            message: (error as Error).message
        });
    }
});

// GET /api/price-history/:productKey/trend - Hent prisutvikling
router.get('/price-history/:productKey/trend', (req: Request, res: Response) => {
    try {
        const productKey = typeof req.params.productKey === 'string' ? req.params.productKey : req.params.productKey[0];
        const { store, days } = req.query;
        
        const trend = priceHistoryRepo.getPriceTrend(
            productKey,
            typeof store === 'string' ? store : undefined,
            typeof days === 'string' ? parseInt(days) : 30
        );
        
        res.json({
            productKey,
            count: trend.length,
            trend
        });
    } catch (error) {
        console.error('❌ Feil ved henting av prisutvikling:', (error as Error).message);
        res.status(500).json({
            error: 'Kunne ikke hente prisutvikling',
            message: (error as Error).message
        });
    }
});

// GET /api/price-changes - Finn produkter med prisendringer
router.get('/price-changes', (req: Request, res: Response) => {
    try {
        const { days, limit } = req.query;
        
        const changes = priceHistoryRepo.getRecentPriceChanges(
            typeof days === 'string' ? parseInt(days) : 7,
            typeof limit === 'string' ? parseInt(limit) : 50
        );
        
        res.json({
            count: changes.length,
            changes
        });
    } catch (error) {
        console.error('❌ Feil ved henting av prisendringer:', (error as Error).message);
        res.status(500).json({
            error: 'Kunne ikke hente prisendringer',
            message: (error as Error).message
        });
    }
});

// POST /api/offers/test-fetch - Test API-henting for én butikk uten AI/database
router.post('/offers/test-fetch', async (req: Request, res: Response) => {
    try {
        const { dealerId, storeName } = req.body;
        
        if (!dealerId || !storeName) {
            return res.status(400).json({
                error: 'Mangler påkrevde felter',
                required: { dealerId: '80742m', storeName: 'Coop Extra' }
            });
        }

        console.log(`🧪 TEST-MODUS: Henter tilbud for ${storeName} (${dealerId})`);
        console.log('=' .repeat(60));
        
        // Hent tilbud direkte fra API
        const tjekApiService = require('../../../persistence/src/services/tjekApiService').default;
        const offers = await tjekApiService.getStoreOffers(dealerId);
        
        // Lagre til test-fil (ikke overskriv production data)
        const fs = require('fs');
        const path = require('path');
        const testFilePath = path.join(
            __dirname,
            '../../../persistence/src/resources/offers',
            `TEST_${storeName.toLowerCase().replace(/\s+/g, '_')}_offers.json`
        );
        
        fs.writeFileSync(testFilePath, JSON.stringify(offers, null, 2), 'utf-8');
        
        // Generer statistikk
        const stats = {
            storeName,
            dealerId,
            totalOffers: offers.length,
            timestamp: new Date().toISOString(),
            testFile: testFilePath,
            sampleOffers: offers.slice(0, 5).map((o: any) => ({
                title: o.title,
                price: o.price,
                currency: o.currency,
                quantity: o.quantity,
                catalogId: o.catalogId
            })),
            uniqueCatalogs: [...new Set(offers.map((o: any) => o.catalogId))].length,
            priceRange: {
                min: Math.min(...offers.map((o: any) => o.price || Infinity)),
                max: Math.max(...offers.map((o: any) => o.price || 0))
            }
        };
        
        console.log('\n📊 RESULTAT:');
        console.log(`   ✅ ${stats.totalOffers} tilbud hentet`);
        console.log(`   📚 ${stats.uniqueCatalogs} unike kataloger`);
        console.log(`   💰 Pris: ${stats.priceRange.min} - ${stats.priceRange.max} ${offers[0]?.currency || 'NOK'}`);
        console.log(`   📁 Test-fil: ${testFilePath}`);
        console.log('=' .repeat(60));
        
        return res.json({
            success: true,
            message: 'Test fullført - ingen data påvirket',
            stats
        });
        
    } catch (error) {
        console.error('❌ Test feilet:', (error as Error).message);
        return res.status(500).json({
            error: 'Test feilet',
            message: (error as Error).message
        });
    }
});

export default router;
