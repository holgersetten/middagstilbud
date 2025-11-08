const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const config = require('./config');
const offerService = require('../../core/src/offerService');
const offersRouter = require('./routes/offers');

const app = express();

// Middleware
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve butikklogoer
app.use('/images', express.static(path.join(__dirname, 'img')));

// Logging
app.use((req, res, next) => {
    if (!req.path.startsWith('/images') && !req.path.startsWith('/favicon')) {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    }
    next();
});

// Root endpoint
app.get('/', (req, res) => {
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
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: config.nodeEnv
    });
});

// API Routes
app.use('/api', offersRouter);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint ikke funnet' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('❌ Server error:', err);
    res.status(500).json({
        error: 'Intern serverfeil',
        message: config.nodeEnv === 'development' ? err.message : undefined
    });
});

// Start server
const PORT = config.port || 5000;
const server = app.listen(PORT, () => {
    console.log('🚀 =================================');
    console.log('🚀 Middagstilbud API Server startet');
    console.log('🚀 =================================');
    console.log(`🚀 Port: ${PORT}`);
    console.log(`🚀 Environment: ${config.nodeEnv}`);
    console.log('🚀 =================================');

    offerService.updateAllStoreOffers();
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

module.exports = app;