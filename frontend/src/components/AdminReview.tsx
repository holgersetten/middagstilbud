import { useState, useEffect } from 'react';
import { offersApi } from '../services/api';
import type { Offer, CategoryHierarchy } from '../types/offer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

function AdminReview() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [allOffers, setAllOffers] = useState<Offer[]>([]);
  const [categories, setCategories] = useState<CategoryHierarchy>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [imageCache, setImageCache] = useState<Map<string, string>>(new Map());
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [reviewData, allData, categoriesData] = await Promise.all([
        offersApi.getOffersNeedingReview(),
        offersApi.getAllOffers(),
        offersApi.getCategories()
      ]);
      
      setOffers(reviewData.offers || []);
      setAllOffers(allData.offers || []);
      setCategories(categoriesData.categories);

      // Bildehenting deaktivert - Tjek API krever autentisering
      // De fleste tilbud har ikke tilgjengelige bilder via public API
    } catch (err) {
      setError('Kunne ikke hente data. Er backend-serveren kjørende?');
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMissingImages = async (offersWithoutImages: Offer[]) => {
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

  const handleCategorize = async (
    offer: Offer, 
    mainCategory: string, 
    subCategory: string, 
    ingredientKey: string
  ) => {
    if (!offer.productKey) {
      alert('Produktet mangler productKey');
      return;
    }

    try {
      setSaving(offer.productKey);
      
      await offersApi.categorizeOffer({
        productKey: offer.productKey,
        mainCategory,
        subCategory,
        ingredientKey
      });

      // Fjern fra listen når kategorisert
      setOffers(prev => prev.filter(o => o.productKey !== offer.productKey));
      
    } catch (err) {
      alert('Kunne ikke lagre kategorisering');
      console.error('Error categorizing:', err);
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12 text-lg">Laster produkter som trenger review...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12 text-red-600">{error}</div>
            <div className="text-center">
              <Button onClick={loadData} className="mt-4">
                Prøv igjen
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">📝 Admin Review</h1>
        <p className="text-gray-600">
          {offers.length} produkter trenger kategorisering
        </p>
        
        {/* Søkefelt for å finne feil-kategoriseringer */}
        <div className="mt-4 mb-4">
          <Input
            type="text"
            placeholder="🔍 Søk etter produkt for å rette kategorisering (f.eks. 'vepsebol')..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-base"
          />
        </div>
      </div>

      {searchQuery.length >= 2 && (
        <div className="mb-8 p-4 bg-gray-100 rounded-lg">
          <h3 className="mb-4 text-lg font-semibold">🔍 Søkeresultater ({
            allOffers.filter(o => 
              o.title?.toLowerCase().includes(searchQuery.toLowerCase())
            ).length
          })</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allOffers
              .filter(o => o.title?.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((offer) => (
                <OfferReviewCard
                  key={offer.productKey || offer.title}
                  offer={offer}
                  categories={categories}
                  onCategorize={handleCategorize}
                  saving={saving === offer.productKey}
                  imageCache={imageCache}
                  allowUpdate={true}
                />
              ))}
          </div>
        </div>
      )}

      {offers.length === 0 && searchQuery.length < 2 ? (
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">🎉 Alt er kategorisert!</h2>
          <p className="text-gray-700">Ingen produkter trenger review for øyeblikket.</p>
          <p className="mt-4 text-gray-500">
            💡 Bruk søkefeltet ovenfor for å finne og rette feil-kategoriseringer
          </p>
        </div>
      ) : offers.length > 0 && searchQuery.length < 2 ? (
        <>
          <h3 className="mb-4 text-lg font-semibold">⚠️ Pending kategoriseringer</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {offers.map((offer) => (
              <OfferReviewCard
                key={offer.productKey || offer.title}
                offer={offer}
                categories={categories}
                onCategorize={handleCategorize}
                saving={saving === offer.productKey}
                imageCache={imageCache}
                allowUpdate={false}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

interface OfferReviewCardProps {
  offer: Offer;
  categories: CategoryHierarchy;
  onCategorize: (offer: Offer, main: string, sub: string, key: string) => void;
  saving: boolean;
  imageCache: Map<string, string>;
  allowUpdate: boolean;
}

function OfferReviewCard({ offer, categories, onCategorize, saving, imageCache, allowUpdate }: OfferReviewCardProps) {
  // Pre-fyll med AI-forslag hvis de finnes
  const [mainCategory, setMainCategory] = useState(offer.mainCategory || '');
  const [subCategory, setSubCategory] = useState(offer.subCategory || '');
  const [ingredientKey, setIngredientKey] = useState(offer.ingredientKey || '');

  const subCategories = mainCategory ? categories[mainCategory] || [] : [];
  const [isEditing, setIsEditing] = useState(!allowUpdate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!mainCategory || !subCategory || !ingredientKey.trim()) {
      alert('Vennligst fyll ut alle felt');
      return;
    }

    onCategorize(offer, mainCategory, subCategory, ingredientKey.toLowerCase().trim());
    setIsEditing(false);
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        {offer.imageUrl && (
          <img 
            src={offer.imageUrl} 
            alt={offer.title} 
            className="w-full h-48 object-cover rounded mb-3" 
          />
        )}
        <div className="flex items-center gap-2 mb-2">
          <CardTitle className="text-lg flex-1">{offer.title}</CardTitle>
          {offer.isActive === false && (
            <Badge variant="destructive" className="text-xs">
              Utgått tilbud
            </Badge>
          )}
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-sm text-muted-foreground">{offer.store}</p>
          {offer.price > 0 ? (
            <Badge variant="secondary" className="text-base font-bold">{offer.price} {offer.currency}</Badge>
          ) : (
            <Badge variant="outline" className="text-xs">Pris ikke tilgjengelig</Badge>
          )}
        </div>
        {offer.categoryConfidence !== undefined && (
          <Badge variant="outline" className="mt-2 text-xs">
            AI: {(offer.categoryConfidence * 100).toFixed(0)}%
          </Badge>
        )}
        {allowUpdate && offer.mainCategory && offer.subCategory && (
          <div className="mt-2 space-y-1">
            <Badge variant="default" className="text-xs">
              {offer.mainCategory} → {offer.subCategory}
            </Badge>
            {offer.ingredientKey && (
              <Badge variant="outline" className="text-xs ml-2">
                🔑 {offer.ingredientKey}
              </Badge>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>

      {!isEditing && allowUpdate ? (
        <div className="space-y-2">
          <Button 
            onClick={() => setIsEditing(true)} 
            className="w-full"
            variant="outline"
          >
            ✏️ Endre kategorisering
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`mainCategory-${offer.productKey}`}>Hovedkategori</Label>
            <select 
              id={`mainCategory-${offer.productKey}`}
              value={mainCategory} 
              onChange={(e) => {
                setMainCategory(e.target.value);
                setSubCategory(''); // Reset subCategory når main endres
              }}
              disabled={saving}
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Velg kategori...</option>
              {Object.keys(categories).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`subCategory-${offer.productKey}`}>Underkategori</Label>
            <select 
              id={`subCategory-${offer.productKey}`}
              value={subCategory} 
              onChange={(e) => setSubCategory(e.target.value)}
              disabled={!mainCategory || saving}
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Velg underkategori...</option>
              {subCategories.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`ingredientKey-${offer.productKey}`}>Ingrediens-nøkkel</Label>
            <Input
              id={`ingredientKey-${offer.productKey}`}
              type="text"
              value={ingredientKey}
              onChange={(e) => setIngredientKey(e.target.value)}
              placeholder="f.eks. 'melk', 'agurk', 'pasta'"
              disabled={saving}
              required
            />
            <small className="text-xs text-muted-foreground">Brukes til middagsplanlegging</small>
          </div>

          <div className="flex gap-2">
            <Button 
              type="submit" 
              className="flex-1"
              disabled={saving || !mainCategory || !subCategory || !ingredientKey.trim()}
            >
              {saving ? 'Lagrer...' : '✅ Lagre'}
            </Button>
            {allowUpdate && (
              <Button 
                type="button"
                variant="outline"
                onClick={() => {
                  setMainCategory(offer.mainCategory || '');
                  setSubCategory(offer.subCategory || '');
                  setIngredientKey(offer.ingredientKey || '');
                  setIsEditing(false);
                }}
                disabled={saving}
              >
                Avbryt
              </Button>
            )}
          </div>
        </form>
      )}
      </CardContent>
    </Card>
  );
}

export default AdminReview;
