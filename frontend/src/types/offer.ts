export interface Offer {
  title: string;
  description?: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  currency: string;
  quantity?: string;
  unit?: string;
  pieces?: number;
  size?: number;
  validFrom?: string;
  validTo?: string;
  imageUrl?: string;
  catalogId?: string;
  hotspotId?: string;
  store: string;
  storeLogo?: string;
}

export interface OffersResponse {
  count: number;
  store: string;
  offers: Offer[];
}
