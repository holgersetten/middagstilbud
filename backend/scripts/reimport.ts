/**
 * Reimporter category_cache.json til SQLite
 */

import * as fs from 'fs';
import * as path from 'path';
import { initDb } from '../core/src/db/db';
import * as categoryCacheRepo from '../core/src/db/categoryCacheRepo';

const jsonPath = path.join(__dirname, '../persistence/src/resources/category_cache.json');

console.log('📦 Reimporterer category_cache.json til SQLite...\n');

// Les JSON
const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
const entries = Object.entries(jsonData);

console.log(`📊 Fant ${entries.length} entries i JSON\n`);

// Init database
initDb();

// Clear existing data
categoryCacheRepo.clear();
console.log('🗑️  Tømte database\n');

// Migrer hver entry
let imported = 0;
let errors = 0;

for (const [productKey, data] of entries) {
    try {
        const typedData = data as any;
        categoryCacheRepo.upsert(productKey, {
            mainCategory: typedData.mainCategory,
            subCategory: typedData.subCategory,
            ingredientKey: typedData.ingredientKey,
            source: typedData.source,
            confidence: typedData.confidence,
            timestamp: typedData.timestamp || new Date().toISOString()
        });
        imported++;
        
        if (imported % 100 === 0) {
            process.stdout.write(`\r  Importert: ${imported}/${entries.length}`);
        }
    } catch (err) {
        errors++;
    }
}

console.log(`\n\n✅ Ferdig!`);
console.log(`   Importert: ${imported}`);
console.log(`   Feil: ${errors}`);
console.log(`   Total i DB: ${categoryCacheRepo.count()}\n`);
