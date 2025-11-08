import type { Offer } from '../types/offer';
import './OfferCard.css';

interface OfferCardProps {
  offer: Offer;
}

function OfferCard({ offer }: OfferCardProps) {
  return (
    <div className="offer-card">
      {offer.imageUrl && (
        <img src={offer.imageUrl} alt={offer.title} className="offer-image" />
      )}
      <div className="offer-content">
        <h3 className="offer-title">{offer.title}</h3>
        {offer.description && (
          <p className="offer-description">{offer.description}</p>
        )}
        <div className="offer-details">
          <span className="offer-price">{offer.price} {offer.currency}</span>
          {offer.quantity && (
            <span className="offer-quantity">{offer.quantity}</span>
          )}
        </div>
        <div className="offer-store">
          {offer.storeLogo && (
            <img src={offer.storeLogo} alt={offer.store} className="store-logo" />
          )}
          <span>{offer.store}</span>
        </div>
      </div>
    </div>
  );
}

export default OfferCard;
