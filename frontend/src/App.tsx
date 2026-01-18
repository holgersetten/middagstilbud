import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
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
  const [selectedMainCategory, setSelectedMainCategory] = useState<string>('all');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');

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
    if (selectedMainCategory === 'all') {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return offer.title.toLowerCase().includes(query) || 
               offer.description?.toLowerCase().includes(query) ||
               offer.store.toLowerCase().includes(query);
      }
      return true;
    }
    if (offer.mainCategory !== selectedMainCategory) return false;
    if (selectedSubCategory === 'all' || offer.subCategory === selectedSubCategory) {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return offer.title.toLowerCase().includes(query) || 
               offer.description?.toLowerCase().includes(query) ||
               offer.store.toLowerCase().includes(query);
      }
      return true;
    }
    return false;
  });

  const handleMainCategoryChange = (category: string) => {
    setSelectedMainCategory(category);
    setSelectedSubCategory('all');
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

  const subCategories = selectedMainCategory !== 'all' && categories?.[selectedMainCategory] || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Mattilbud</h1>
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
              <CardContent className="p-4 space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Kategorier</h3>
                  <div className="space-y-1">
                    <button
                      onClick={() => handleMainCategoryChange('all')}
                      className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                        selectedMainCategory === 'all'
                          ? 'bg-foreground text-background font-medium'
                          : 'text-foreground hover:bg-muted'
                      }`}
                    >
                      Alle kategorier
                    </button>
                    {categories && Object.keys(categories).sort().map(cat => {
                      const isMainSelected = selectedMainCategory === cat;
                      const subCats = categories[cat] || [];
                      return (
                        <div key={cat}>
                          <button
                            onClick={() => handleMainCategoryChange(cat)}
                            className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                              isMainSelected
                                ? 'bg-foreground text-background font-medium'
                                : 'text-foreground hover:bg-muted'
                            }`}
                          >
                            {cat}
                          </button>
                          {isMainSelected && subCats.length > 0 && (
                            <div className="ml-4 mt-1 space-y-1">
                              {subCats.map(subCat => (
                                <button
                                  key={subCat}
                                  onClick={() => setSelectedSubCategory(subCat)}
                                  className={`w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors ${
                                    selectedSubCategory === subCat
                                      ? 'bg-muted text-foreground font-medium'
                                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
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
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Breadcrumbs */}
            <Breadcrumb className="mb-4">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink onClick={() => handleMainCategoryChange('all')} className="cursor-pointer flex items-center gap-1">
                    <Home className="h-3.5 w-3.5" />
                    Hjem
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {selectedMainCategory !== 'all' && (
                  <>
                    <BreadcrumbSeparator>
                      <ChevronRight className="h-4 w-4" />
                    </BreadcrumbSeparator>
                    <BreadcrumbItem>
                      {selectedSubCategory === 'all' ? (
                        <BreadcrumbPage>{selectedMainCategory}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink onClick={() => setSelectedSubCategory('all')} className="cursor-pointer">
                          {selectedMainCategory}
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </>
                )}
                {selectedSubCategory !== 'all' && (
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

            {/* Search */}
            <div className="relative max-w-xl mb-6">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Søk etter produkter..."
                className="pl-10 h-11"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;
