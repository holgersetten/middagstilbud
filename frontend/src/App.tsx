import { useState, useEffect } from 'react';
import Header from './components/Header';
import OfferList from './components/OfferList';
import AdminReview from './components/AdminReview';
import CategoryManager from './components/CategoryManager';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import { offersApi } from './services/api';
import type { Offer, CategoryHierarchy } from './types/offer';

type ViewMode = 'offers' | 'admin' | 'categories';

function App() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('offers');
  const [categories, setCategories] = useState<CategoryHierarchy | null>(null);
  const [selectedMainCategory, setSelectedMainCategory] = useState<string>('all');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('all');

  useEffect(() => {
    fetchOffers();
    fetchCategories();
  }, []);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await offersApi.getAllOffers();
      setOffers(data.offers || []);
    } catch (err) {
      setError('Kunne ikke hente tilbud. Er backend-serveren kjørende på port 5000?');
      console.error('Error fetching offers:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await offersApi.getCategories();
      setCategories(data.categories);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const filteredOffers = offers.filter(offer => {
    if (selectedMainCategory === 'all') return false; // IKKE vis alt som default
    if (offer.mainCategory !== selectedMainCategory) return false;
    if (selectedSubCategory === 'all') return true;
    return offer.subCategory === selectedSubCategory;
  });

  const handleMainCategoryChange = (category: string) => {
    setSelectedMainCategory(category);
    setSelectedSubCategory('all');
  };

  if (viewMode === 'admin') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-4">
          <button
            onClick={() => setViewMode('offers')}
            className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            ← Tilbake til tilbud
          </button>
          <AdminReview />
        </div>
      </div>
    );
  }

  if (viewMode === 'categories') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-4">
          <button
            onClick={() => setViewMode('offers')}
            className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            ← Tilbake til tilbud
          </button>
          <CategoryManager />
        </div>
      </div>
    );
  }

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={fetchOffers} />;

  const subCategories = selectedMainCategory !== 'all' && categories?.[selectedMainCategory] || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-4">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setViewMode('admin')}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            📝 Admin Review
          </button>
          <button
            onClick={() => setViewMode('categories')}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            🏷️ Kategorier
          </button>
        </div>

        {/* Kategorifilter */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Hovedkategori */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hovedkategori
              </label>
              <select
                value={selectedMainCategory}
                onChange={(e) => handleMainCategoryChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Alle kategorier ({offers.length})</option>
                {categories && Object.keys(categories).sort().map(cat => {
                  const count = offers.filter(o => o.mainCategory === cat).length;
                  return (
                    <option key={cat} value={cat}>
                      {cat} ({count})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Subkategori */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subkategori
              </label>
              <select
                value={selectedSubCategory}
                onChange={(e) => setSelectedSubCategory(e.target.value)}
                disabled={selectedMainCategory === 'all'}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="all">
                  {selectedMainCategory === 'all' 
                    ? 'Velg hovedkategori først' 
                    : `Alle subkategorier (${offers.filter(o => o.mainCategory === selectedMainCategory).length})`
                  }
                </option>
                {subCategories.map(subCat => {
                  const count = offers.filter(o => 
                    o.mainCategory === selectedMainCategory && o.subCategory === subCat
                  ).length;
                  return (
                    <option key={subCat} value={subCat}>
                      {subCat} ({count})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Filter info */}
          <div className="mt-3 text-sm text-gray-600">
            {selectedMainCategory === 'all' ? (
              <div className="text-center py-4 text-gray-500 italic">
                👆 Velg en kategori ovenfor for å se tilbud
              </div>
            ) : (
              <>
                Viser {filteredOffers.length} av {offers.length} tilbud
                <button
                  onClick={() => {
                    setSelectedMainCategory('all');
                    setSelectedSubCategory('all');
                  }}
                  className="ml-4 text-blue-600 hover:text-blue-800 underline"
                >
                  Nullstill filter
                </button>
              </>
            )}
          </div>
        </div>

        {selectedMainCategory !== 'all' && <OfferList offers={filteredOffers} />}
      </div>
    </div>
  );
}

export default App;
