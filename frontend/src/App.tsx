import { useState, useEffect } from 'react';
import Header from './components/Header';
import OfferList from './components/OfferList';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import { offersApi } from './services/api';
import type { Offer } from './types/offer';
import './App.css';

function App() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={fetchOffers} />;

  return (
    <div className="app">
      <Header />
      <OfferList offers={offers} />
    </div>
  );
}

export default App;
