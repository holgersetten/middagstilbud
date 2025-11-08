import type { Offer } from '../types/offer';
import OfferCard from './OfferCard';

interface OfferListProps {
  offers: Offer[];
}

function OfferList({ offers }: OfferListProps) {
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
          <OfferCard key={`${offer.store}-${offer.hotspotId || index}`} offer={offer} />
        ))}
      </div>
    </div>
  );
}

export default OfferList;
