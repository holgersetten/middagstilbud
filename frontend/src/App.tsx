import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbSeparator, BreadcrumbPage, BreadcrumbLink } from '@/components/ui/breadcrumb';
import { OfferGrid } from '@/components/grocery/offer-grid';
import { Search, Settings, Tags, ArrowLeft, Loader2, AlertCircle, ChevronRight, Home, Lock, ArrowDownUp, Store as StoreIcon } from 'lucide-react';
import { offersApi } from './services/api';
import type { Offer, CategoryHierarchy } from './types/offer';
import AdminReview from './components/AdminReview';
import CategoryManager from './components/CategoryManager';

const STORE_LOGOS: Record<string, string> = {
  'Bunnpris': 'http://localhost:5000/store_logos/bunnpris_logo.png',
  'Rema 1000': 'http://localhost:5000/store_logos/rema_kompakt_logo.svg',
  'Meny': 'http://localhost:5000/store_logos/meny_kompakt_logo.png',
  'Spar': 'http://localhost:5000/store_logos/spar_kompakt_logo.png',
  'Kiwi': 'http://localhost:5000/store_logos/kiwi_kompakt_logo.png',
  'Obs': 'http://localhost:5000/store_logos/circular/coop_obs_circular_logo.png',
  'Coop Extra': 'http://localhost:5000/store_logos/circular/coop_extra_circular_logo.png',
  'Coop Mega': 'http://localhost:5000/store_logos/circular/coop_mega_circular_logo.png',
  'Coop Prix': 'http://localhost:5000/store_logos/circular/coop_prix_circular_logo.png',
  'Coop Marked': 'http://localhost:5000/store_logos/circular/coop_marked_circular_logo.png',
};

type ViewMode = 'offers' | 'admin' | 'categories';

function App() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('offers');
  const [categories, setCategories] = useState<CategoryHierarchy | null>(null);
  const [selectedMainCategory, setSelectedMainCategory] = useState<string>('');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(true);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [placeholderText, setPlaceholderText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [sortByPrice, setSortByPrice] = useState(false);
  const [filterStore, setFilterStore] = useState<string[]>([]);
  const [showAllOffers, setShowAllOffers] = useState(false);
  const [showStoreFilter, setShowStoreFilter] = useState(false);
  const [showMealSuggestions, setShowMealSuggestions] = useState(false);

  const stores = Array.from(new Set(offers.map(o => o.store))).sort();

  const placeholders = [
    'laksefilet',
    'kyllingkjøttdeig',
    'melk',
    'brød',
    'ost',
    'yoghurt',
    'epler',
    'banan',
    'ketchup',
    'pasta'
  ];

  useEffect(() => {
    console.log('App mounted, fetching data...');
    fetchOffers();
    fetchCategories();
  }, []);

  // Typing animation for placeholder
  useEffect(() => {
    const currentWord = placeholders[placeholderIndex];
    let currentCharIndex = 0;
    
    if (isTyping) {
      // Type forward
      const typeInterval = setInterval(() => {
        if (currentCharIndex <= currentWord.length) {
          setPlaceholderText(currentWord.slice(0, currentCharIndex));
          currentCharIndex++;
        } else {
          clearInterval(typeInterval);
          // Pause at full word
          setTimeout(() => setIsTyping(false), 2000);
        }
      }, 150);
      return () => clearInterval(typeInterval);
    } else {
      // Delete backwards
      currentCharIndex = currentWord.length;
      const deleteInterval = setInterval(() => {
        if (currentCharIndex >= 0) {
          setPlaceholderText(currentWord.slice(0, currentCharIndex));
          currentCharIndex--;
        } else {
          clearInterval(deleteInterval);
          // Move to next word
          setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
          setIsTyping(true);
        }
      }, 75);
      return () => clearInterval(deleteInterval);
    }
  }, [placeholderIndex, isTyping]);

  // Finn de beste tilbudene basert på rabatt-prosent
  const getTopOffers = () => {
    let topOffers = offers
      .filter(offer => offer.originalPrice && offer.price)
      .map(offer => ({
        ...offer,
        discountPercent: Math.round(((offer.originalPrice! - offer.price) / offer.originalPrice!) * 100)
      }));

    // Filtrer etter butikk hvis valgt
    if (filterStore.length > 0) {
      topOffers = topOffers.filter(offer => filterStore.includes(offer.store));
    }

    // Sorter etter rabatt-prosent (standard)
    topOffers = topOffers.sort((a, b) => b.discountPercent - a.discountPercent);

    // Hvis pris-sortering er aktivert, sorter etter pris i stedet
    if (sortByPrice) {
      topOffers = topOffers.sort((a, b) => a.price - b.price);
    }

    return topOffers.slice(0, 10);
  };

  const fetchOffers = async () => {
    try {
      console.log('Fetching offers from API...');
      setLoading(true);
      setError(null);
      const data = await offersApi.getAllOffers();
      console.log('Offers received:', data);
      setOffers(data.offers || []);
    } catch (err) {
      console.error('Error fetching offers:', err);
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

  const filteredOffers = offers
    .filter(offer => {
      // Filtrer etter butikk først
      if (filterStore.length > 0 && !filterStore.includes(offer.store)) return false;

      // Hvis søk er aktivt, søk på alle offers
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return offer.title.toLowerCase().includes(query) || 
               offer.ingredientKey?.toLowerCase().includes(query) ||
               offer.subCategory?.toLowerCase().includes(query) ||
               offer.description?.toLowerCase().includes(query) ||
               offer.store.toLowerCase().includes(query);
      }
      
      // Hvis ingen søk, filtrer basert på kategori
      if (!selectedMainCategory) return false;
      if (offer.mainCategory !== selectedMainCategory) return false;
      if (selectedSubCategory === 'all' || offer.subCategory === selectedSubCategory) {
        return true;
      }
      return false;
    })
    .sort((a, b) => {
      // Søkesortering: navn → ingredientKey → subCategory
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const aTitle = a.title.toLowerCase();
        const bTitle = b.title.toLowerCase();
        const aIngredientKey = a.ingredientKey?.toLowerCase() || '';
        const bIngredientKey = b.ingredientKey?.toLowerCase() || '';
        const aSubCategory = a.subCategory?.toLowerCase() || '';
        const bSubCategory = b.subCategory?.toLowerCase() || '';
        
        const aTitleMatch = aTitle.includes(query);
        const bTitleMatch = bTitle.includes(query);
        const aIngredientMatch = aIngredientKey.includes(query);
        const bIngredientMatch = bIngredientKey.includes(query);
        const aSubMatch = aSubCategory.includes(query);
        const bSubMatch = bSubCategory.includes(query);
        
        // Prioritet 1: Tittel match
        if (aTitleMatch && !bTitleMatch) return -1;
        if (!aTitleMatch && bTitleMatch) return 1;
        
        // Prioritet 2: IngredientKey match
        if (aIngredientMatch && !bIngredientMatch) return -1;
        if (!aIngredientMatch && bIngredientMatch) return 1;
        
        // Prioritet 3: SubCategory match
        if (aSubMatch && !bSubMatch) return -1;
        if (!aSubMatch && bSubMatch) return 1;
      }

      // Deretter sorter etter pris hvis aktivert
      if (sortByPrice) {
        return a.price - b.price;
      }
      
      return 0;
    });

  const handleMainCategoryChange = (category: string) => {
    setShowRecommendations(false);
    setShowAllOffers(false);
    setShowMealSuggestions(false);
    setSearchQuery('');
    if (selectedMainCategory === category) {
      // Toggle off hvis samme kategori klikkes
      setSelectedMainCategory('');
      setSelectedSubCategory('all');
    } else {
      setSelectedMainCategory(category);
      setSelectedSubCategory('all');
    }
  };

  // Sorter kategorier etter relevans
  const getCategoriesSorted = () => {
    if (!categories) return [];
    
    const categoryPriority = [
      'Middag',
      'Frukt & grønt',
      'Kjøtt',
      'Kylling og fjærkre',
      'Fisk & skalldyr',
      'Meieri & egg',
      'Brød',
      'Pålegg & frokost',
      'Tilbehør',
      'Drikke',
      'Snacks, godteri & sjokolade',
      'Ost',
      'Dessert og iskrem',
      'Baking',
      'Barneprodukter',
      'Dyr',
      'Personlige artikler',
      'Hus & hjem',
      'Blomster og planter',
      'Ukategorisert'
    ];

    const allCategories = Object.keys(categories);
    
    return allCategories.sort((a, b) => {
      const indexA = categoryPriority.indexOf(a);
      const indexB = categoryPriority.indexOf(b);
      
      // Hvis begge er i prioritetslisten, sorter etter prioritet
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      
      // Hvis bare A er i listen, plasser A først
      if (indexA !== -1) return -1;
      
      // Hvis bare B er i listen, plasser B først
      if (indexB !== -1) return 1;
      
      // Hvis ingen er i listen, sorter alfabetisk
      return a.localeCompare(b, 'nb-NO');
    });
  };

  if (viewMode === 'admin') {
    if (!isAdminAuthenticated) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <Lock className="h-5 w-5 text-foreground" />
                <h2 className="text-xl font-semibold text-foreground">Admin Tilgang</h2>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Passord</label>
                <Input
                  type="password"
                  placeholder="Skriv inn passord..."
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && adminPassword === 'a') {
                      setIsAdminAuthenticated(true);
                    }
                  }}
                  className="h-11"
                />
              </div>
              <Button
                onClick={() => {
                  if (adminPassword === 'a') {
                    setIsAdminAuthenticated(true);
                  } else {
                    alert('Feil passord!');
                  }
                }}
                className="w-full"
              >
                Logg inn
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setViewMode('offers');
                  setAdminPassword('');
                }}
                className="w-full"
              >
                Avbryt
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => {
                setViewMode('offers');
                setIsAdminAuthenticated(false);
                setAdminPassword('');
              }}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Tilbake
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div>
                <h1 className="text-xl font-semibold text-foreground">Admin Review</h1>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setViewMode('categories')}>
                  <Tags className="h-4 w-4 mr-2" />
                  Kategorier
                </Button>
              </div>
            </div>
          </div>
        </header>
        <div className="container mx-auto px-4 py-8">
          <AdminReview />
        </div>
      </div>
    );
  }

  if (viewMode === 'categories') {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => setViewMode('offers')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Tilbake
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div>
                <h1 className="text-xl font-semibold text-foreground">Kategorimanager</h1>
              </div>
            </div>
          </div>
        </header>
        <div className="container mx-auto px-4 py-8">
          <CategoryManager />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-sm font-medium">Laster tilbud...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="space-y-3 flex-1">
                <p className="text-sm text-foreground">{error}</p>
                <Button onClick={fetchOffers} size="sm" className="w-full">
                  Prøv igjen
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Ukeshandling.no</h1>
              <p className="text-sm text-muted-foreground mt-1">Finn de beste tilbudene</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setViewMode('admin')}>
                <Settings className="h-4 w-4 mr-2" />
                Admin
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="w-64 flex-shrink-0">
            <Card>
              <CardContent className="p-4">
                {/* Anbefalinger */}
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Anbefalinger</h3>
                  <button
                    onClick={() => {
                      setShowRecommendations(true);
                      setSelectedMainCategory('');
                      setSelectedSubCategory('all');
                      setSearchQuery('');
                    }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-md transition-all duration-200 cursor-pointer ${
                      showRecommendations
                        ? 'bg-foreground text-background font-medium shadow-sm'
                        : 'text-foreground hover:bg-muted hover:translate-x-0.5'
                    }`}
                  >
                    Beste tilbud
                  </button>
                  <button
                    onClick={() => {
                      setShowMealSuggestions(true);
                      setSelectedMainCategory('');
                      setSelectedSubCategory('all');
                      setSearchQuery('');
                      setShowRecommendations(false);
                      setShowAllOffers(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-md transition-all duration-200 cursor-pointer mt-1 ${
                      showMealSuggestions
                        ? 'bg-foreground text-background font-medium shadow-sm'
                        : 'text-foreground hover:bg-muted hover:translate-x-0.5'
                    }`}
                  >
                    Middagsforslag
                  </button>
                  <button
                    onClick={() => {
                      setShowAllOffers(true);
                      setShowRecommendations(false);
                      setSelectedMainCategory('');
                      setSelectedSubCategory('all');
                      setSearchQuery('');
                    }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-md transition-all duration-200 cursor-pointer mt-1 ${
                      showAllOffers
                        ? 'bg-foreground text-background font-medium shadow-sm'
                        : 'text-foreground hover:bg-muted hover:translate-x-0.5'
                    }`}
                  >
                    Alle tilbud
                  </button>
                </div>

                <Separator className="my-4" />

                {/* Kategorier */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Kategorier</h3>
                  <div className="space-y-1">
                    {getCategoriesSorted().slice(0, showAllCategories ? undefined : 7).map(cat => {
                      const isMainSelected = selectedMainCategory === cat;
                      const subCats = categories?.[cat] || [];
                      return (
                        <div key={cat}>
                          <button
                            onClick={() => handleMainCategoryChange(cat)}
                            className={`w-full text-left px-3 py-2 text-sm rounded-md transition-all duration-200 cursor-pointer ${
                              isMainSelected
                                ? 'bg-foreground text-background font-medium shadow-sm'
                                : 'text-foreground hover:bg-muted hover:translate-x-0.5'
                            }`}
                          >
                            {cat}
                          </button>
                          {subCats.length > 0 && (
                            <div className={`ml-4 mt-1 space-y-1 subcategory-container ${
                              isMainSelected ? 'subcategory-expanded' : 'subcategory-collapsed'
                            }`}>
                              {subCats.map(subCat => (
                                <button
                                  key={subCat}
                                  onClick={() => setSelectedSubCategory(subCat)}
                                  className={`w-full text-left px-3 py-1.5 text-sm rounded-md transition-all duration-200 cursor-pointer ${
                                    selectedSubCategory === subCat
                                      ? 'bg-muted text-foreground font-medium'
                                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:translate-x-0.5'
                                  }`}
                                >
                                  {subCat}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    
                    {getCategoriesSorted().length > 7 && (
                      <button
                        onClick={() => setShowAllCategories(!showAllCategories)}
                        className="w-full text-left px-3 py-2 text-sm rounded-md transition-all duration-200 cursor-pointer mt-2 text-foreground hover:bg-muted hover:translate-x-0.5"
                      >
                        {showAllCategories ? '↑ Vis færre' : '↓ Vis flere...'}
                      </button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Breadcrumbs */}
            {(selectedMainCategory || showRecommendations || showAllOffers || showMealSuggestions) && (
              <Breadcrumb className="mb-4">
                <BreadcrumbList>
                  <BreadcrumbItem>
                    {selectedMainCategory ? (
                      <BreadcrumbLink 
                        className="flex items-center gap-1 cursor-pointer hover:underline"
                        onClick={() => {
                          setSelectedMainCategory('');
                          setSelectedSubCategory('all');
                          setShowRecommendations(false);
                          setShowAllOffers(false);
                          setShowMealSuggestions(false);
                        }}
                      >
                        <Home className="h-3.5 w-3.5" />
                        Kategorier
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage className="flex items-center gap-1">
                        <Home className="h-3.5 w-3.5" />
                        {showRecommendations ? 'Anbefalinger' : showAllOffers ? 'Alle tilbud' : showMealSuggestions ? 'Middagsforslag' : 'Kategorier'}
                      </BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                  {selectedMainCategory && (
                    <>
                      <BreadcrumbSeparator>
                        <ChevronRight className="h-4 w-4" />
                      </BreadcrumbSeparator>
                      <BreadcrumbItem>
                        {selectedSubCategory !== 'all' ? (
                          <BreadcrumbLink 
                            className="cursor-pointer hover:underline"
                            onClick={() => setSelectedSubCategory('all')}
                          >
                            {selectedMainCategory}
                          </BreadcrumbLink>
                        ) : (
                          <BreadcrumbPage>{selectedMainCategory}</BreadcrumbPage>
                        )}
                      </BreadcrumbItem>
                    </>
                  )}
                  {selectedSubCategory !== 'all' && selectedMainCategory && (
                    <>
                      <BreadcrumbSeparator>
                        <ChevronRight className="h-4 w-4" />
                      </BreadcrumbSeparator>
                      <BreadcrumbItem>
                        <BreadcrumbPage>{selectedSubCategory}</BreadcrumbPage>
                      </BreadcrumbItem>
                    </>
                  )}
                </BreadcrumbList>
              </Breadcrumb>
            )}

            {/* Search and Filters */}
            <div className="flex items-center justify-between gap-3 mb-2">
              {/* Search */}
              <div className="relative flex-1 max-w-xl">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={placeholderText ? `Søk etter ${placeholderText}` : 'Søk etter'}
                  className="pl-10 h-11 placeholder:text-muted-foreground/50"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (e.target.value) {
                      setSelectedMainCategory('');
                      setSelectedSubCategory('all');
                      setShowRecommendations(false);
                      setShowAllOffers(false);
                      setShowMealSuggestions(false);
                    }
                  }}
                />
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortByPrice(!sortByPrice)}
                  className={`h-8 text-xs gap-1.5 cursor-pointer ${
                    sortByPrice 
                      ? 'bg-zinc-200 hover:bg-zinc-200' 
                      : ''
                  }`}
                >
                  <ArrowDownUp className="h-3.5 w-3.5" />
                  Pris
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowStoreFilter(!showStoreFilter)}
                  className={`h-8 text-xs gap-1.5 cursor-pointer ${
                    filterStore.length > 0 
                      ? 'bg-zinc-200 hover:bg-zinc-200' 
                      : ''
                  }`}
                >
                  <StoreIcon className="h-3.5 w-3.5" />
                  Butikker
                </Button>
              </div>
            </div>

            {/* Butikk-filter som ikoner med smooth transition */}
            <div 
              className={`transition-all duration-300 ease-in-out overflow-visible ${
                showStoreFilter ? 'max-h-20 opacity-100 mb-3' : 'max-h-0 opacity-0 mb-0 pointer-events-none'
              }`}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setFilterStore([])}  
                  className={`flex items-center justify-center h-12 w-12 rounded-lg border transition-all hover:shadow-md hover:scale-105 cursor-pointer ${
                    filterStore.length === 0
                      ? 'border-primary bg-primary/10 shadow-sm opacity-100'
                      : filterStore.length > 0
                      ? 'border-border bg-background hover:border-primary/50 opacity-40 hover:opacity-70'
                      : 'border-border bg-background hover:border-primary/50 opacity-100'
                  }`}
                  title="Alle butikker"
                >
                  <StoreIcon className="h-6 w-6 text-foreground" />
                </button>
                {stores.map(store => {
                  const isSelected = filterStore.includes(store);
                  const hasSelection = filterStore.length > 0;
                  return (
                    <button
                      key={store}
                      onClick={() => {
                        if (isSelected) {
                          setFilterStore(filterStore.filter(s => s !== store));
                        } else {
                          setFilterStore([...filterStore, store]);
                        }
                      }}
                      className={`flex items-center justify-center h-12 w-12 rounded-lg border transition-all hover:shadow-md hover:scale-105 p-1.5 cursor-pointer ${
                        isSelected
                          ? 'border-primary bg-primary/10 shadow-sm opacity-100'
                          : hasSelection
                          ? 'border-border bg-background hover:border-primary/50 opacity-40 hover:opacity-70'
                          : 'border-border bg-background hover:border-primary/50 opacity-100'
                      }`}
                      title={store}
                    >
                      <img 
                        src={STORE_LOGOS[store]} 
                        alt={store}
                        className="h-full w-full object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            <Separator className="my-3" />

            {/* Stats */}
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="secondary" className="text-xs font-medium px-3 py-1.5">
                {showAllOffers ? offers.filter(o => filterStore.length === 0 || filterStore.includes(o.store)).length : filteredOffers.length} tilbud
              </Badge>
            </div>

            {/* Tilbudsgrid */}
            {showRecommendations ? (
              <OfferGrid 
                offers={getTopOffers().map(offer => ({
                  id: offer.offerId || offer.productKey || '',
                  title: offer.title,
                  price: offer.price,
                  originalPrice: offer.originalPrice,
                  currency: offer.currency || 'kr',
                  imageUrl: offer.imageUrl || '/placeholder.svg',
                  store: offer.store,
                  storeLogo: STORE_LOGOS[offer.store],
                  validUntil: offer.validTo,
                  description: offer.description,
                  quantity: offer.quantity
                }))} 
              />
            ) : showMealSuggestions ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-muted">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Middagsforslag kommer snart</h3>
                <p className="text-sm text-muted-foreground mt-1">Denne funksjonen er under utvikling</p>
              </div>
            ) : showAllOffers ? (
              <OfferGrid 
                offers={offers
                  .filter(offer => filterStore.length === 0 || filterStore.includes(offer.store))
                  .sort((a, b) => sortByPrice ? a.price - b.price : 0)
                  .map(offer => ({
                    id: offer.offerId || offer.productKey || '',
                    title: offer.title,
                    price: offer.price,
                    originalPrice: offer.originalPrice,
                    currency: offer.currency || 'kr',
                    imageUrl: offer.imageUrl || '/placeholder.svg',
                    store: offer.store,
                    storeLogo: STORE_LOGOS[offer.store],
                    validUntil: offer.validTo,
                    description: offer.description,
                    quantity: offer.quantity
                  }))} 
              />
            ) : searchQuery || selectedMainCategory ? (
              <OfferGrid 
                offers={filteredOffers.map(offer => ({
                  id: offer.offerId || offer.productKey || '',
                  title: offer.title,
                  price: offer.price,
                  originalPrice: offer.originalPrice,
                  currency: offer.currency || 'kr',
                  imageUrl: offer.imageUrl || '/placeholder.svg',
                  store: offer.store,
                  storeLogo: STORE_LOGOS[offer.store],
                  validUntil: offer.validTo,
                  description: offer.description,
                  quantity: offer.quantity
                }))} 
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-muted">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Velg en kategori</h3>
                <p className="text-sm text-muted-foreground mt-1">Velg en kategori fra menyen til venstre for å se tilbud</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;
