import { useState, useEffect } from 'react';
import Header from './components/Header';
import OfferList from './components/OfferList';
import AdminReview from './components/AdminReview';
import CategoryManager from './components/CategoryManager';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import { offersApi } from './services/api';
import type { Offer } from './types/offer';

type ViewMode = 'offers' | 'admin' | 'categories';

function App() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('offers');

  useEffect(() => {
    fetchOffers();
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
        <OfferList offers={offers} />
      </div>
    </div>
  );
}

export default App;
