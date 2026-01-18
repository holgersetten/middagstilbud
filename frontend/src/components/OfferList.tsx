import type { Offer } from "../types/offer";
import OfferCard from "./OfferCard";
import { useState } from "react";

interface OfferListProps {
  offers: Offer[];
}

function OfferList({ offers }: OfferListProps) {
  const [imageCache] = useState<Map<string, string>>(new Map());

  if (offers.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h2 className="text-xl font-semibold text-foreground">Ingen tilbud funnet</h2>
        <p className="mt-2 text-sm text-muted-foreground">Prøv å endre filter eller søk.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">
          Tilbud <span className="text-muted-foreground">({offers.length})</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
