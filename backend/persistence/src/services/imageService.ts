import axios from 'axios';

interface OfferImages {
    view: string | null;
    zoom: string | null;
    thumb: string | null;
    error?: string;
}

interface CacheEntry {
    data: OfferImages;
    timestamp: number;
}

class ImageService {
    private baseUrl: string;
    private cache: Map<string, CacheEntry>;
    private cacheTimeout: number;

    constructor() {
        this.baseUrl = 'https://api.etilbudsavis.dk/v2';
        this.cache = new Map();
        this.cacheTimeout = 60 * 60 * 1000; // 1 hour
    }

    async getOfferImage(offerId: string): Promise<OfferImages> {
        try {
            // Check cache first
            const cacheKey = `offer_${offerId}`;
            const cached = this.cache.get(cacheKey);
            if (cached && (Date.now() - cached.timestamp < this.cacheTimeout)) {
                return cached.data;
            }

            const response = await axios.get(`${this.baseUrl}/offers/${offerId}`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/json'
                },
                timeout: 5000
            });

            const offerData = response.data;
            
            // Extract image URLs
            const images: OfferImages = {
                view: offerData?.images?.view || null,
                zoom: offerData?.images?.zoom || null,
                thumb: offerData?.images?.thumb || null
            };

            // Cache the result
            this.cache.set(cacheKey, {
                data: images,
                timestamp: Date.now()
            });

            return images;

        } catch (error) {
            // Ikke log 404 - mange tilbud har ikke tilgjengelige bilder
            const axiosError = error as any;
            if (axiosError.response?.status !== 404) {
                console.error(`❌ Error fetching image for offer ${offerId}:`, (error as Error).message);
            }
            
            return {
                view: null,
                zoom: null,
                thumb: null,
                error: (error as Error).message
            };
        }
    }

    // Get best available image (prefer view -> zoom -> thumb for better quality)
    getBestImage(images: OfferImages): string | null {
        return images.view || images.zoom || images.thumb || null;
    }

    // Clear cache (useful for testing or memory management)
    clearCache(): void {
        this.cache.clear();
        console.log('🗑️ Image cache cleared');
    }

    // Get cache stats
    getCacheStats(): { total: number; valid: number; expired: number } {
        const now = Date.now();
        const entries = Array.from(this.cache.entries());
        const validEntries = entries.filter(([, value]) => 
            (now - value.timestamp) < this.cacheTimeout
        );
        
        return {
            total: entries.length,
            valid: validEntries.length,
            expired: entries.length - validEntries.length
        };
    }

    // Batch fetch images for multiple offers (for weekly-update pipeline)
    async fetchImagesForOffers<T extends { offerId?: string | null; imageUrl?: string | null }>(offers: T[]): Promise<T[]> {
        console.log(`🖼️  Henter bilder for ${offers.length} tilbud...`);
        
        const offersNeedingImages = offers.filter(o => !o.imageUrl && o.offerId);
        
        if (offersNeedingImages.length === 0) {
            console.log('✅ Alle tilbud har allerede bilder');
            return offers;
        }

        console.log(`📸 ${offersNeedingImages.length} tilbud mangler bilder`);
        
        // Batch processing (20 parallelle kall av gangen)
        const batchSize = 20;
        const batches: T[][] = [];
        for (let i = 0; i < offersNeedingImages.length; i += batchSize) {
            batches.push(offersNeedingImages.slice(i, i + batchSize));
        }

        let fetchedCount = 0;
        let successCount = 0;

        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            const results = await Promise.allSettled(
                batch.map(offer => this.getOfferImage(offer.offerId!))
            );

            results.forEach((result, idx) => {
                fetchedCount++;
                if (result.status === 'fulfilled') {
                    const imageUrl = this.getBestImage(result.value);
                    if (imageUrl) {
                        batch[idx].imageUrl = imageUrl;
                        successCount++;
                    }
                }
            });

            // Progress update hver 5. batch
            if ((i + 1) % 5 === 0 || i === batches.length - 1) {
                console.log(`   📊 Progress: ${fetchedCount}/${offersNeedingImages.length} (${successCount} bilder funnet)`);
            }
        }

        console.log(`✅ Bildhenting fullført: ${successCount}/${offersNeedingImages.length} bilder hentet\n`);
        return offers;
    }
}

export default new ImageService();
