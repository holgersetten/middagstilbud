import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { OfferGrid } from '@/components/grocery/offer-grid';
import { Search, Settings, Tags, ArrowLeft, Loader2, AlertCircle, ChevronRight, Home, Lock } from 'lucide-react';
import { offersApi } from './services/api';
import type { Offer, CategoryHierarchy } from './types/offer';
import AdminReview from './components/AdminReview';
import CategoryManager from './components/CategoryManager';

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
    return offers
      .filter(offer => offer.originalPrice && offer.price)
      .map(offer => ({
        ...offer,
        discountPercent: Math.round(((offer.originalPrice! - offer.price) / offer.originalPrice!) * 100)
      }))
      .sort((a, b) => b.discountPercent - a.discountPercent)
      .slice(0, 10);
  };

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

  const filteredOffers = offers
    .filter(offer => {
      // Hvis søk er aktivt, søk på alle offers
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return offer.title.toLowerCase().includes(query) || 
               offer.ingredientKey?.toLowerCase().includes(query) ||
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
      if (!searchQuery) return 0;
      
      const query = searchQuery.toLowerCase();
      const aTitle = a.title.toLowerCase();
      const bTitle = b.title.toLowerCase();
      const aIngredientKey = a.ingredientKey?.toLowerCase() || '';
      const bIngredientKey = b.ingredientKey?.toLowerCase() || '';
      
      const aTitleMatch = aTitle.includes(query);
      const bTitleMatch = bTitle.includes(query);
      const aIngredientMatch = aIngredientKey.includes(query);
      const bIngredientMatch = bIngredientKey.includes(query);
      
      // Prioritet 1: Tittel match
      if (aTitleMatch && !bTitleMatch) return -1;
      if (!aTitleMatch && bTitleMatch) return 1;
      
      // Prioritet 2: IngredientKey match
      if (aIngredientMatch && !bIngredientMatch) return -1;
      if (!aIngredientMatch && bIngredientMatch) return 1;
      
      return 0;
    });

  const handleMainCategoryChange = (category: string) => {
    setShowRecommendations(false);
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
      'Fisk & skaldyr',
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
      'Blomster og planter'
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
            <Card className="sticky top-24">
              <CardContent className="p-4 max-h-[calc(100vh-7rem)] overflow-y-auto scrollbar-hide">
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
                    De beste tilbudene
                  </button>
                </div>

                <Separator className="my-4" />

                {/* Kategorier */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Kategorier</h3>
                  <div className="space-y-1">
                    {getCategoriesSorted().slice(0, showAllCategories ? undefined : 6).map(cat => {
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
                    
                    {getCategoriesSorted().length > 6 && (
                      <button
                        onClick={() => setShowAllCategories(!showAllCategories)}
                        className="w-full text-left px-3 py-2 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 cursor-pointer mt-2 border-t border-border pt-3"
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
            {(selectedMainCategory || showRecommendations) && (
              <Breadcrumb className="mb-4">
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbPage className="flex items-center gap-1">
                      <Home className="h-3.5 w-3.5" />
                      {showRecommendations ? 'Anbefalinger' : selectedMainCategory}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                  {selectedSubCategory !== 'all' && !showRecommendations && (
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

            {/* Search */}
            <div className="relative max-w-xl mb-6">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder={placeholderText ? `Søk etter ${placeholderText}` : 'Søk etter'}
                className="pl-10 h-11"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value) {
                    setSelectedMainCategory('');
                    setSelectedSubCategory('all');
                    setShowRecommendations(false);
                  }
                }}
              />
            </div>

            {/* Stats */}
            <div className="flex items-center gap-3 mb-6">
              <Badge variant="secondary" className="text-xs font-medium px-3 py-1.5">
                {filteredOffers.length} tilbud
              </Badge>
              {searchQuery && (
                <>
                  <span className="text-muted-foreground text-sm">•</span>
                  <span className="text-sm text-muted-foreground">
                    Søker etter: "{searchQuery}"
                  </span>
                </>
              )}
            </div>

            <Separator className="my-6" />

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
                  storeLogo: offer.storeLogo,
                  validUntil: offer.validTo,
                  description: offer.description
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
                  storeLogo: offer.storeLogo,
                  validUntil: offer.validTo,
                  description: offer.description
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
