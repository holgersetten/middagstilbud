import { useState, useEffect } from 'react';
import type { Offer } from '../types/offer';
import OfferCard from './OfferCard';
import { offersApi } from '../services/api';

interface OfferListProps {
  offers: Offer[];
}

function OfferList({ offers }: OfferListProps) {
  const [imageCache, setImageCache] = useState<Map<string, string>>(new Map());

  // Bildefetching deaktivert for alle offers - kun i AdminReview
  /*
  useEffect(() => {
    const fetchMissingImages = async () => {
      const offersWithoutImages = offers.filter(o => !o.imageUrl && o.hotspotId);
      if (offersWithoutImages.length === 0) return;

      const newCache = new Map(imageCache);
      
      for (const offer of offersWithoutImages) {
        if (!offer.hotspotId) continue;
        
        try {
          const imageData = await offersApi.getOfferImage(offer.hotspotId);
          if (imageData.bestImage) {
            newCache.set(offer.hotspotId, imageData.bestImage);
          }
        } catch (err) {
          console.error(`Failed to fetch image for ${offer.hotspotId}:`, err);
        }
      }
      
      setImageCache(newCache);
    };

    fetchMissingImages();
  }, [offers]);
  */

  if (offers.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-xl text-gray-600">Ingen tilbud funnet 😢</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {offers.map((offer, index) => (
          <OfferCard 
            key={`${offer.store}-${offer.hotspotId || index}`} 
            offer={offer} 
            imageCache={imageCache}
          />
        ))}
      </div>
    </div>
  );
}

export default OfferList;
