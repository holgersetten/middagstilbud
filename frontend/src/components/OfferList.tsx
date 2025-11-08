import type { Offer } from '../types/offer';
import OfferCard from './OfferCard';
import './OfferList.css';

interface OfferListProps {
  offers: Offer[];
}

function OfferList({ offers }: OfferListProps) {
  if (offers.length === 0) {
    return (
      <div className="no-offers">
        <p>Ingen tilbud funnet 😢</p>
      </div>
    );
  }

  return (
    <div className="offer-list">
      {offers.map((offer, index) => (
        <OfferCard key={`${offer.store}-${offer.hotspotId || index}`} offer={offer} />
      ))}
    </div>
  );
}

export default OfferList;
