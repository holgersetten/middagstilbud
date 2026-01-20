import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

import config from './config';
import offersRouter from './routes/offers';
import { initDb } from '../../core/src/db/db';

// Initialiser database ved oppstart
initDb();

const app = express();

// Middleware
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve butikklogoer
app.use('/store_logos', express.static(path.join(__dirname, '../../persistence/src/resources/img/store_logos')));

// Logging (disabled for cleaner output)
// app.use((req: Request, _res: Response, next: NextFunction) => {
//     if (!req.path.startsWith('/images') && !req.path.startsWith('/favicon')) {
//         console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
//     }
//     next();
// });

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
    res.json({
        name: 'Middagstilbud API',
        version: '1.0.0',
        status: 'running',
        endpoints: {
            health: '/health',
            offers: '/api/offers',
            storeOffers: '/api/offers/:store'
        }
    });
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: config.nodeEnv
    });
});

// API Routes
app.use('/api', offersRouter);

// 404 handler
app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Endpoint ikke funnet' });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('❌ Server error:', err);
    res.status(500).json({
        error: 'Intern serverfeil',
        message: config.nodeEnv === 'development' ? err.message : undefined
    });
});

// Start server
const PORT = config.port || 5000;
const server = app.listen(PORT, async () => {
    console.log('🚀 =================================');
    console.log('🚀 Middagstilbud API Server startet');
    console.log('🚀 =================================');
    console.log(`🚀 Port: ${PORT}`);
    console.log(`🚀 Environment: ${config.nodeEnv}`);
    console.log('🚀 =================================\n');
    
    // Automatisk catalog-sjekk deaktivert (kjør manuelt: POST /api/offers/weekly-update)
    // Kan aktiveres igjen når last_catalog_check.json fungerer korrekt
    /*
    // Sjekk om det er nye tilbudsaviser ved oppstart
    try {
        const hasNewCatalogs = await catalogService.hasNewCatalogs();
        
        if (hasNewCatalogs) {
            console.log('✨ Nye tilbudsaviser - starter oppdatering...\n');
            
            // Trigger weekly-update endpoint
            try {
                const response = await axios.post(`http://localhost:${PORT}/api/offers/weekly-update`);
                const { pendingCount } = response.data;
                console.log(`✅ Oppdatering fullført - ${pendingCount} produkter krever review\n`);
                
                // Oppdater katalog-register
                await catalogService.updateLastCheck();
            } catch (error) {
                console.error('❌ Feil ved automatisk oppdatering:', (error as Error).message);
            }
        } else {
            console.log('📋 Ingen nye tilbudsaviser\n');
        }
    } catch (error) {
        console.error('❌ Feil ved sjekk av kataloger:', (error as Error).message);
        console.log('📋 Fortsetter med eksisterende data.\n');
    }
    */
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n📱 SIGINT mottatt, stenger server...');
    server.close(() => {
        console.log('✅ Server stengt gracefully');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n📱 SIGTERM mottatt, stenger server...');
    server.close(() => {
        console.log('✅ Server stengt gracefully');
        process.exit(0);
    });
});

export default app;
