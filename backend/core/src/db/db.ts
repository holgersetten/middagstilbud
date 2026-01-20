import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Singleton connection
let db: Database.Database | null = null;

/**
 * Henter eller oppretter singleton DB-connection
 */
export function getDb(): Database.Database {
    if (!db) {
        const dbPath = path.join(__dirname, '../../../../persistence/data/mattilbud.db');
        const dbDir = path.dirname(dbPath);
        
        // Opprett mappe hvis den ikke eksisterer
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
            console.log(`📁 Created database directory: ${dbDir}`);
        }
        
        db = new Database(dbPath);
        
        // Sett pragmas for performance og data integrity
        db.pragma('journal_mode = WAL'); // Write-Ahead Logging
        db.pragma('foreign_keys = ON');  // Håndhev foreign keys
        
        console.log(`✅ SQLite database opened`);
    }
    return db;
}

/**
 * Lukker DB-connection (vanligvis ikke nødvendig i dev, men nyttig ved testing/shutdown)
 */
export function closeDb(): void {
    if (db) {
        db.close();
        db = null;
        console.log('🔒 SQLite database closed');
    }
}

/**
 * Initialiserer database: lager tabeller og triggers hvis de ikke finnes
 */
export function initDb(): void {
    const database = getDb();
    
    // Lag category_cache tabell
    database.exec(`
        CREATE TABLE IF NOT EXISTS category_cache (
            product_key TEXT PRIMARY KEY,
            main_category TEXT NOT NULL,
            sub_category TEXT NOT NULL,
            ingredient_key TEXT NOT NULL,
            source TEXT NOT NULL,
            confidence_main REAL,
            confidence_sub REAL,
            confidence_ingredient REAL,
            cache_status TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // Lag trigger for å oppdatere updated_at automatisk
    database.exec(`
        CREATE TRIGGER IF NOT EXISTS trg_category_cache_updated
        AFTER UPDATE ON category_cache
        FOR EACH ROW
        BEGIN
            UPDATE category_cache 
            SET updated_at = CURRENT_TIMESTAMP 
            WHERE product_key = NEW.product_key;
        END;
    `);

    // Lag price_history tabell for å tracke prisendringer
    database.exec(`
        CREATE TABLE IF NOT EXISTS price_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_key TEXT NOT NULL,
            store TEXT NOT NULL,
            price REAL NOT NULL,
            original_price REAL,
            discount_percent INTEGER,
            valid_from TEXT,
            valid_to TEXT,
            recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(product_key, store, recorded_at)
        );
    `);

    // Indeks for rask oppslag på product_key og store
    database.exec(`
        CREATE INDEX IF NOT EXISTS idx_price_history_product 
        ON price_history(product_key);
        
        CREATE INDEX IF NOT EXISTS idx_price_history_store 
        ON price_history(store);
        
        CREATE INDEX IF NOT EXISTS idx_price_history_recorded_at 
        ON price_history(recorded_at DESC);
    `);

    console.log('✅ Database tables and triggers initialized');
}
