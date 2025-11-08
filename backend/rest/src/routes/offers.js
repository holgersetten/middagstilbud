const express = require('express');
const offerService = require('../../../core/src/services/offerService');

const router = express.Router();

// GET /api/offers - Hent alle tilbud
router.get('/offers', async (req, res) => {
    try {
        const { store } = req.query;
        
        let offers;
        if (store) {
            offers = offerService.getOffersByStore(store);
        } else {
            offers = offerService.getAllOffers();
        }
        
        console.log(`📦 Returnerer ${offers.length} tilbud${store ? ` fra ${store}` : ''}`);
        res.json({
            count: offers.length,
            store: store || 'alle',
            offers: offers
        });
    } catch (error) {
        console.error('❌ Feil ved henting av tilbud:', error.message);
        res.status(500).json({
            error: 'Kunne ikke hente tilbud',
            message: error.message
        });
    }
});

// POST /api/offers/update - Manuelt oppdater tilbud
router.post('/offers/update', async (req, res) => {
    try {
        console.log('🔄 Manuell oppdatering av tilbud trigget');
        offerService.updateAllStoreOffers();
        
        res.json({
            message: 'Oppdatering av tilbud startet',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Feil ved oppdatering av tilbud:', error.message);
        res.status(500).json({
            error: 'Kunne ikke oppdatere tilbud',
            message: error.message
        });
    }
});

module.exports = router;