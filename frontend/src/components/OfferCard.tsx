import type { Offer } from '../types/offer';

interface OfferCardProps {
  offer: Offer;
}

function OfferCard({ offer }: OfferCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 h-full flex flex-col">
      {offer.imageUrl && (
        <div className="h-48 bg-gray-100 overflow-hidden">
          <img 
            src={offer.imageUrl} 
            alt={offer.title} 
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
          {offer.title}
        </h3>
        {offer.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {offer.description}
          </p>
        )}
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-2xl font-bold text-purple-600">
            {offer.price} {offer.currency}
          </span>
          {offer.quantity && (
            <span className="text-sm text-gray-500">
              {offer.quantity}
            </span>
          )}
        </div>
        <div className="mt-auto pt-3 border-t border-gray-100 flex items-center gap-2">
          {offer.storeLogo && (
            <img 
              src={offer.storeLogo} 
              alt={offer.store} 
              className="h-6 w-6 object-contain"
            />
          )}
          <span className="text-sm font-medium text-gray-700">{offer.store}</span>
        </div>
      </div>
    </div>
  );
}

export default OfferCard;
