import { getDb } from './db';

export interface PriceHistoryEntry {
    id?: number;
    productKey: string;
    store: string;
    price: number;
    originalPrice?: number;
    discountPercent?: number;
    validFrom?: string;
    validTo?: string;
    recordedAt?: string;
}

export interface PriceHistoryData {
    productKey: string;
    store: string;
    price: number;
    originalPrice?: number;
    discountPercent?: number;
    validFrom?: string;
    validTo?: string;
}

/**
 * Lagrer en prishistorikk-entry
 * Bruker UNIQUE constraint for å unngå duplikater (samme produkt, butikk, tidspunkt)
 */
export function recordPrice(data: PriceHistoryData): void {
    const db = getDb();
    
    const stmt = db.prepare(`
        INSERT OR IGNORE INTO price_history (
            product_key,
            store,
            price,
            original_price,
            discount_percent,
            valid_from,
            valid_to
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
        data.productKey,
        data.store,
        data.price,
        data.originalPrice || null,
        data.discountPercent || null,
        data.validFrom || null,
        data.validTo || null
    );
}

/**
 * Hent prishistorikk for et spesifikt produkt
 */
export function getPriceHistory(productKey: string, store?: string, limit: number = 30): PriceHistoryEntry[] {
    const db = getDb();
    
    let query = `
        SELECT 
            id,
            product_key as productKey,
            store,
            price,
            original_price as originalPrice,
            discount_percent as discountPercent,
            valid_from as validFrom,
            valid_to as validTo,
            recorded_at as recordedAt
        FROM price_history
        WHERE product_key = ?
    `;
    
    const params: any[] = [productKey];
    
    if (store) {
        query += ' AND store = ?';
        params.push(store);
    }
    
    query += ' ORDER BY recorded_at DESC LIMIT ?';
    params.push(limit);
    
    const stmt = db.prepare(query);
    return stmt.all(...params) as PriceHistoryEntry[];
}

/**
 * Hent laveste pris for et produkt over en tidsperiode
 */
export function getLowestPrice(productKey: string, daysBack: number = 30): { price: number; store: string; recordedAt: string } | null {
    const db = getDb();
    
    const stmt = db.prepare(`
        SELECT price, store, recorded_at as recordedAt
        FROM price_history
        WHERE product_key = ?
        AND recorded_at >= datetime('now', '-' || ? || ' days')
        ORDER BY price ASC
        LIMIT 1
    `);
    
    return stmt.get(productKey, daysBack) as { price: number; store: string; recordedAt: string } | null;
}

/**
 * Hent prisutvikling for et produkt (daglig gjennomsnitt)
 */
export function getPriceTrend(productKey: string, store?: string, daysBack: number = 30): Array<{ date: string; avgPrice: number; minPrice: number; maxPrice: number }> {
    const db = getDb();
    
    let query = `
        SELECT 
            DATE(recorded_at) as date,
            AVG(price) as avgPrice,
            MIN(price) as minPrice,
            MAX(price) as maxPrice
        FROM price_history
        WHERE product_key = ?
        AND recorded_at >= datetime('now', '-' || ? || ' days')
    `;
    
    const params: any[] = [productKey, daysBack];
    
    if (store) {
        query += ' AND store = ?';
        params.push(store);
    }
    
    query += ' GROUP BY DATE(recorded_at) ORDER BY date DESC';
    
    const stmt = db.prepare(query);
    return stmt.all(...params) as Array<{ date: string; avgPrice: number; minPrice: number; maxPrice: number }>;
}

/**
 * Finn produkter som har hatt prisendring nylig
 */
export function getRecentPriceChanges(daysBack: number = 7, limit: number = 50): Array<{
    productKey: string;
    store: string;
    oldPrice: number;
    newPrice: number;
    changePercent: number;
    recordedAt: string;
}> {
    const db = getDb();
    
    const stmt = db.prepare(`
        WITH latest_prices AS (
            SELECT 
                product_key,
                store,
                price,
                recorded_at,
                LAG(price) OVER (PARTITION BY product_key, store ORDER BY recorded_at) as prev_price
            FROM price_history
            WHERE recorded_at >= datetime('now', '-' || ? || ' days')
        )
        SELECT 
            product_key as productKey,
            store,
            prev_price as oldPrice,
            price as newPrice,
            CAST(((price - prev_price) / prev_price * 100) AS INTEGER) as changePercent,
            recorded_at as recordedAt
        FROM latest_prices
        WHERE prev_price IS NOT NULL
        AND prev_price != price
        ORDER BY ABS((price - prev_price) / prev_price) DESC
        LIMIT ?
    `);
    
    return stmt.all(daysBack, limit) as Array<{
        productKey: string;
        store: string;
        oldPrice: number;
        newPrice: number;
        changePercent: number;
        recordedAt: string;
    }>;
}

/**
 * Slett gammel historikk (cleanup)
 */
export function cleanupOldHistory(daysToKeep: number = 90): number {
    const db = getDb();
    
    const stmt = db.prepare(`
        DELETE FROM price_history
        WHERE recorded_at < datetime('now', '-' || ? || ' days')
    `);
    
    const result = stmt.run(daysToKeep);
    return result.changes;
}
