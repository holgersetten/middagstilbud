import { useState, useEffect } from 'react';
import { offersApi } from '../services/api';
import type { Offer, CategoryHierarchy } from '../types/offer';
import './AdminReview.css';

function AdminReview() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [categories, setCategories] = useState<CategoryHierarchy>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null); // productKey being saved

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [reviewData, categoriesData] = await Promise.all([
        offersApi.getOffersNeedingReview(),
        offersApi.getCategories()
      ]);
      
      setOffers(reviewData.offers || []);
      setCategories(categoriesData.categories);
    } catch (err) {
      setError('Kunne ikke hente data. Er backend-serveren kjørende?');
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
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
      <div className="admin-review">
        <div className="loading">Laster produkter som trenger review...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-review">
        <div className="error">{error}</div>
        <button onClick={loadData}>Prøv igjen</button>
      </div>
    );
  }

  return (
    <div className="admin-review">
      <div className="header">
        <h1>📝 Admin Review</h1>
        <p className="subtitle">
          {offers.length} produkter trenger kategorisering
        </p>
      </div>

      {offers.length === 0 ? (
        <div className="empty-state">
          <h2>🎉 Alt er kategorisert!</h2>
          <p>Ingen produkter trenger review for øyeblikket.</p>
        </div>
      ) : (
        <div className="offers-grid">
          {offers.map((offer) => (
            <OfferReviewCard
              key={offer.productKey || offer.title}
              offer={offer}
              categories={categories}
              onCategorize={handleCategorize}
              saving={saving === offer.productKey}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface OfferReviewCardProps {
  offer: Offer;
  categories: CategoryHierarchy;
  onCategorize: (offer: Offer, main: string, sub: string, key: string) => void;
  saving: boolean;
}

function OfferReviewCard({ offer, categories, onCategorize, saving }: OfferReviewCardProps) {
  const [mainCategory, setMainCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [ingredientKey, setIngredientKey] = useState('');

  const subCategories = mainCategory ? categories[mainCategory] || [] : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!mainCategory || !subCategory || !ingredientKey.trim()) {
      alert('Vennligst fyll ut alle felt');
      return;
    }

    onCategorize(offer, mainCategory, subCategory, ingredientKey.toLowerCase().trim());
  };

  return (
    <div className="offer-review-card">
      <div className="offer-info">
        {offer.imageUrl && (
          <img src={offer.imageUrl} alt={offer.title} className="offer-image" />
        )}
        <div className="offer-details">
          <h3>{offer.title}</h3>
          <p className="store">{offer.store}</p>
          <p className="price">{offer.price} {offer.currency}</p>
          {offer.categoryConfidence !== undefined && (
            <p className="confidence">
              AI Confidence: {(offer.categoryConfidence * 100).toFixed(0)}%
            </p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="categorize-form">
        <div className="form-group">
          <label>Hovedkategori</label>
          <select 
            value={mainCategory} 
            onChange={(e) => {
              setMainCategory(e.target.value);
              setSubCategory(''); // Reset subCategory når main endres
            }}
            disabled={saving}
            required
          >
            <option value="">Velg kategori...</option>
            {Object.keys(categories).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Underkategori</label>
          <select 
            value={subCategory} 
            onChange={(e) => setSubCategory(e.target.value)}
            disabled={!mainCategory || saving}
            required
          >
            <option value="">Velg underkategori...</option>
            {subCategories.map(sub => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Ingrediens-nøkkel</label>
          <input
            type="text"
            value={ingredientKey}
            onChange={(e) => setIngredientKey(e.target.value)}
            placeholder="f.eks. 'melk', 'agurk', 'pasta'"
            disabled={saving}
            required
          />
          <small>Brukes til middagsplanlegging</small>
        </div>

        <button 
          type="submit" 
          className="save-button"
          disabled={saving || !mainCategory || !subCategory || !ingredientKey.trim()}
        >
          {saving ? 'Lagrer...' : '✅ Lagre kategorisering'}
        </button>
      </form>
    </div>
  );
}

export default AdminReview;
