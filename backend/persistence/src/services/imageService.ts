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
            console.error(`❌ Error fetching image for offer ${offerId}:`, (error as Error).message);
            
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
}

export default new ImageService();
