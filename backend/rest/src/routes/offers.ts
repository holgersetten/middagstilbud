import express, { Request, Response } from 'express';
import offerService from '../../../core/src/services/offerService';
import categoryService from '../../../core/src/services/categoryService';
import categoryConfigService from '../../../core/src/services/categoryConfigService';
import { MainCategory, SubCategory, CATEGORY_HIERARCHY } from '../../../core/src/config/categories';

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
        
        console.log(`📦 Returnerer ${offers.length} tilbud${storeName ? ` fra ${storeName}` : ''}`);
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
        
        console.log(`🔍 Returnerer ${offersNeedingReview.length} tilbud som trenger review`);
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

export default router;
