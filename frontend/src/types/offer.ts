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
  offerId?: string;
  catalogId?: string;
  hotspotId?: string;
  store: string;
  storeLogo?: string;
  mainCategory?: string;
  subCategory?: string;
  ingredientKey?: string;
  categorySource?: 'manual' | 'rule' | 'ai' | 'unknown';
  categoryConfidence?: number;
  productKey?: string;
}

export interface CategoryHierarchy {
  [mainCategory: string]: string[];
}

export interface CategorizeRequest {
  productKey: string;
  mainCategory: string;
  subCategory: string;
  ingredientKey: string;
}

export interface OffersResponse {
  count: number;
  store: string;
  offers: Offer[];
}
