import express, { Request, Response } from 'express';
import offerService from '../../../core/src/services/offerService';

const router = express.Router();

// GET /api/offers - Hent alle tilbud
router.get('/offers', async (req: Request, res: Response) => {
    try {
        const { store } = req.query;
        const storeName = typeof store === 'string' ? store : undefined;
        
        let offers;
        if (storeName) {
            offers = offerService.getOffersByStore(storeName);
        } else {
            offers = offerService.getAllOffers();
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

export default router;
