import type { Offer } from "../types/offer";

interface OfferCardProps {
  offer: Offer;
  imageCache: Map<string, string>;
}

function OfferCard({ offer, imageCache }: OfferCardProps) {
  const imageUrl =
    offer.imageUrl || (offer.hotspotId ? imageCache.get(offer.hotspotId) : null);

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      {/* Media */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={offer.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <div className="text-sm text-muted-foreground">Ingen bilde</div>
          </div>
        )}

        {/* Store pill */}
        <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-background/90 px-3 py-1 text-xs shadow-sm ring-1 ring-border backdrop-blur">
          {offer.storeLogo ? (
            <img
              src={offer.storeLogo}
              alt={offer.store}
              className="h-4 w-4 object-contain"
              loading="lazy"
            />
          ) : null}
          <span className="font-medium text-foreground">{offer.store}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="mb-1 line-clamp-2 text-base font-semibold leading-snug text-foreground">
          {offer.title}
        </h3>

        {offer.description ? (
          <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
            {offer.description}
          </p>
        ) : (
          <div className="mb-3" />
        )}

        {/* Price row */}
        <div className="mt-auto flex items-end justify-between gap-3">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-foreground">
                {offer.price} {offer.currency}
              </span>
              {offer.quantity ? (
                <span className="text-xs text-muted-foreground">
                  {offer.quantity}
                </span>
              ) : null}
            </div>
            {/* Optional: add more meta later (period, category, etc.) */}
          </div>

          <button
            type="button"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90 active:opacity-80"
            aria-label={`Se tilbud: ${offer.title}`}
          >
            Se tilbud
          </button>
        </div>
      </div>
    </article>
  );
}

export default OfferCard;
