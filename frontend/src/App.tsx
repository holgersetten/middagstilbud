import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import OffersPage from './pages/OffersPage';
import AdminPage from './pages/AdminPage';
import CategoriesPage from './pages/CategoriesPage';
import MealSuggestionsPage from './pages/MealSuggestionsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="tilbud" element={<OffersPage />} />
          <Route path="admin" element={<AdminPage />} />
          <Route path="kategorier" element={<CategoriesPage />} />
          <Route path="middagsforslag" element={<MealSuggestionsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
