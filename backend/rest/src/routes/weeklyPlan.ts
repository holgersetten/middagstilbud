import express, { Request, Response } from 'express';
import weeklyPlanService from '../../../core/src/services/weeklyPlanService';

const router = express.Router();

/**
 * POST /api/weekly-plan/generate
 * 
 * Genererer ukemeny basert på tilgjengelige tilbud
 * 
 * Body:
 *   - stores?: string[] (0-2 butikker, default = alle)
 *   - meals?: number (default = 6)
 * 
 * Response:
 *   - storesUsed: string[]
 *   - meals: Meal[]
 *   - shoppingList: { primary, secondary, pantry }
 */
router.post('/generate', async (req: Request, res: Response) => {
    try {
        const { stores, meals } = req.body;

        // Valider input
        if (stores && !Array.isArray(stores)) {
            return res.status(400).json({
                error: 'Ugyldig format',
                message: '"stores" må være en array av butikknavn'
            });
        }

        if (meals && (typeof meals !== 'number' || meals < 1 || meals > 14)) {
            return res.status(400).json({
                error: 'Ugyldig format',
                message: '"meals" må være et tall mellom 1 og 14'
            });
        }

        if (stores && stores.length > 2) {
            return res.status(400).json({
                error: 'For mange butikker',
                message: 'Maks 2 butikker kan velges'
            });
        }

        // Generer ukemeny
        const weeklyPlan = await weeklyPlanService.generateWeeklyPlan({
            stores,
            meals
        });

        console.log(`✅ Ukemeny generert: ${weeklyPlan.meals.length} måltider, ${weeklyPlan.storesUsed.length} butikker`);

        return res.json({
            success: true,
            storesUsed: weeklyPlan.storesUsed,
            meals: weeklyPlan.meals,
            shoppingList: weeklyPlan.shoppingList
        });
    } catch (error) {
        console.error('❌ Feil ved generering av ukemeny:', (error as Error).message);
        return res.status(500).json({
            error: 'Kunne ikke generere ukemeny',
            message: (error as Error).message
        });
    }
});

export default router;
