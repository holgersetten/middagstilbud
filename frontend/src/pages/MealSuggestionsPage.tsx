import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Home, ChevronRight, Calendar, ShoppingCart, Loader2, ChefHat, Utensils, Store, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { offersApi } from '@/services/api';

interface Offer {
  title: string;
  price: number;
  originalPrice?: number;
  imageUrl?: string;
  store: string;
  quantity?: string;
}

interface Meal {
  name: string;
  protein: Offer;
  carb: Offer | string;
  vegetables: Offer[];
}

interface ShoppingListItem {
  title: string;
  quantity: string;
  store: string;
  price: number;
  usageCount?: number; // Hvor mange middager denne brukes i
}

interface PantryItem {
  item: string;
  usageCount: number;
}

interface WeeklyPlanResponse {
  success: boolean;
  storesUsed: string[];
  meals: Meal[];
  shoppingList: {
    primary: ShoppingListItem[];
    secondary: ShoppingListItem[];
    pantry: PantryItem[];
  };
}

const STORES = [
  "Bunnpris", "Rema 1000", "Meny", "Spar", "Kiwi", "Obs",
  "Coop Extra", "Coop Mega", "Coop Prix", "Coop Marked", "Joker", "Matkroken"
];

export default function MealSuggestionsPage() {
  const navigate = useNavigate();
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [numMeals, setNumMeals] = useState(6);
  const [loading, setLoading] = useState(false);
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleStoreToggle = (store: string) => {
    if (selectedStores.includes(store)) {
      setSelectedStores(selectedStores.filter(s => s !== store));
    } else {
      if (selectedStores.length < 2) {
        setSelectedStores([...selectedStores, store]);
      }
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await offersApi.generateWeeklyPlan(
        selectedStores.length > 0 ? selectedStores : undefined,
        numMeals
      );
      setWeeklyPlan(response);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Kunne ikke generere ukemeny');
      console.error('Feil ved generering av ukemeny:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return `${price.toFixed(2)} kr`;
  };

  const getTotalPrice = (items: ShoppingListItem[]) => {
    return items.reduce((sum, item) => sum + item.price, 0);
  };

  const getMealPrice = (meal: Meal) => {
    let total = meal.protein.price;
    if (typeof meal.carb !== 'string') {
      total += meal.carb.price;
    }
    total += meal.vegetables.reduce((sum, veg) => sum + veg.price, 0);
    return total;
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => navigate('/')} className="flex items-center gap-1 cursor-pointer hover:underline">
              <Home className="h-3.5 w-3.5" />
              Hjem
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronRight className="h-4 w-4" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage>Middagsforslag</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Hero Section */}
      <div className="mb-8 text-center">
        <div className="inline-block p-3 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-full mb-4">
          <ChefHat className="h-10 w-10 text-orange-600" />
        </div>
        <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent">
          Lag ukemeny
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Spar tid og penger! Generer en komplett ukemeny basert på ukens beste tilbud
        </p>
      </div>

      {/* Configuration */}
      <Card className="mb-6 border-orange-200 bg-gradient-to-br from-white to-orange-50/30">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Utensils className="h-5 w-5 text-orange-600" />
            <CardTitle>Innstillinger</CardTitle>
          </div>
          <CardDescription>Tilpass menyen etter dine preferanser</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Store selection */}
          <div>
            <label className="text-sm font-medium mb-3 flex items-center gap-2">
              <Store className="h-4 w-4 text-orange-600" />
              <span>Velg butikker (valgfritt)</span>
              {selectedStores.length > 0 && (
                <Badge variant="secondary" className="ml-2 bg-orange-100 text-orange-700">
                  {selectedStores.length} valgt
                </Badge>
              )}
            </label>
            <div className="flex flex-wrap gap-2">
              {STORES.map(store => (
                <Button
                  key={store}
                  variant={selectedStores.includes(store) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStoreToggle(store)}
                  disabled={!selectedStores.includes(store) && selectedStores.length >= 2}
                  className={selectedStores.includes(store) ? 'bg-orange-600 hover:bg-orange-700' : ''}
                >
                  {store}
                </Button>
              ))}
            </div>
            {selectedStores.length === 0 && (
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <span className="inline-block w-1 h-1 rounded-full bg-orange-400"></span>
                La feltet stå tomt for å bruke alle butikker
              </p>
            )}
          </div>

          {/* Number of meals */}
          <div>
            <label className="text-sm font-medium mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-orange-600" />
              <span>Antall måltider: <span className="text-orange-600 font-bold">{numMeals}</span></span>
            </label>
            <input
              type="range"
              min="3"
              max="10"
              value={numMeals}
              onChange={(e) => setNumMeals(parseInt(e.target.value))}
              className="w-full h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>3 dager</span>
              <span>10 dager</span>
            </div>
          </div>

          {/* Generate button */}
          <Button 
            onClick={handleGenerate} 
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700 text-white"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Genererer ukemeny...
              </>
            ) : (
              <>
                <ChefHat className="mr-2 h-5 w-5" />
                Generer ukemeny
              </>
            )}
          </Button>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-lg flex items-start gap-2">
              <span className="text-red-500 font-bold">⚠</span>
              <span>{error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {weeklyPlan && (
        <div className="space-y-6">
          {/* Summary */}
          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-green-700" />
                </div>
                <CardTitle className="text-green-900">Din ukemeny er klar! 🎉</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Utensils className="h-4 w-4 text-green-600" />
                    <p className="text-sm font-medium text-muted-foreground">Måltider</p>
                  </div>
                  <p className="text-3xl font-bold text-green-700">{weeklyPlan.meals.length}</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Store className="h-4 w-4 text-blue-600" />
                    <p className="text-sm font-medium text-muted-foreground">Butikker</p>
                  </div>
                  <p className="text-3xl font-bold text-blue-700 mb-1">{weeklyPlan.storesUsed.length}</p>
                  <div className="flex flex-wrap gap-1">
                    {weeklyPlan.storesUsed.map((store, i) => (
                      <Badge key={i} variant="secondary" className="text-xs bg-blue-50 text-blue-700">
                        {store}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <ShoppingCart className="h-4 w-4 text-orange-600" />
                    <p className="text-sm font-medium text-muted-foreground">Total pris</p>
                  </div>
                  <p className="text-3xl font-bold text-orange-700">
                    {formatPrice(
                      getTotalPrice(weeklyPlan.shoppingList.primary) + 
                      getTotalPrice(weeklyPlan.shoppingList.secondary)
                    )}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <ChefHat className="h-4 w-4 text-purple-600" />
                    <p className="text-sm font-medium text-muted-foreground">Snittpris</p>
                  </div>
                  <p className="text-3xl font-bold text-purple-700">
                    {formatPrice(
                      (getTotalPrice(weeklyPlan.shoppingList.primary) + 
                      getTotalPrice(weeklyPlan.shoppingList.secondary)) / weeklyPlan.meals.length
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">per middag</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Meals */}
          <Card className="border-purple-200 bg-gradient-to-br from-purple-50/50 to-pink-50/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <ChefHat className="h-5 w-5 text-purple-700" />
                </div>
                <div>
                  <CardTitle className="text-purple-900">Ukemeny</CardTitle>
                  <CardDescription>{weeklyPlan.meals.length} deilige måltider</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {weeklyPlan.meals.map((meal, index) => (
                  <div key={index} className="bg-white border border-purple-100 rounded-lg p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-purple-600 hover:bg-purple-700">
                            Dag {index + 1}
                          </Badge>
                        </div>
                        <h3 className="font-bold text-lg text-purple-900">{meal.name}</h3>
                      </div>
                    </div>
                    
                    <div className="space-y-3 text-sm">
                      {/* Protein */}
                      <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                        {meal.protein.imageUrl ? (
                          <img 
                            src={meal.protein.imageUrl} 
                            alt={meal.protein.title}
                            className="w-16 h-16 object-cover rounded border border-red-200"
                          />
                        ) : (
                          <div className="p-1.5 bg-red-100 rounded w-16 h-16 flex items-center justify-center">
                            <Utensils className="h-6 w-6 text-red-600" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-red-700 font-medium mb-1">Protein</p>
                          <p className="font-semibold text-red-900 truncate">{meal.protein.title}</p>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-xs text-red-600">{meal.protein.store}</p>
                            <div className="text-right">
                              {meal.protein.originalPrice && meal.protein.originalPrice > meal.protein.price && (
                                <p className="text-xs text-red-400 line-through">{formatPrice(meal.protein.originalPrice)}</p>
                              )}
                              <p className="text-sm font-bold text-red-700">{formatPrice(meal.protein.price)}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Carb */}
                      <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                        {typeof meal.carb === 'string' ? (
                          <div className="p-1.5 bg-amber-100 rounded w-16 h-16 flex items-center justify-center">
                            <Package className="h-6 w-6 text-amber-600" />
                          </div>
                        ) : meal.carb.imageUrl ? (
                          <img 
                            src={meal.carb.imageUrl} 
                            alt={meal.carb.title}
                            className="w-16 h-16 object-cover rounded border border-amber-200"
                          />
                        ) : (
                          <div className="p-1.5 bg-amber-100 rounded w-16 h-16 flex items-center justify-center">
                            <Package className="h-6 w-6 text-amber-600" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-amber-700 font-medium mb-1">Tilbehør</p>
                          {typeof meal.carb === 'string' ? (
                            <>
                              <p className="font-semibold text-amber-900 capitalize truncate">{meal.carb}</p>
                              <p className="text-xs text-amber-600 mt-1">Fra lager</p>
                            </>
                          ) : (
                            <>
                              <p className="font-semibold text-amber-900 truncate">{meal.carb.title}</p>
                              <div className="flex items-center justify-between mt-1">
                                <p className="text-xs text-amber-600">{meal.carb.store}</p>
                                <div className="text-right">
                                  {meal.carb.originalPrice && meal.carb.originalPrice > meal.carb.price && (
                                    <p className="text-xs text-amber-400 line-through">{formatPrice(meal.carb.originalPrice)}</p>
                                  )}
                                  <p className="text-sm font-bold text-amber-700">{formatPrice(meal.carb.price)}</p>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Vegetables */}
                      {meal.vegetables.length > 0 && (
                        <div className="bg-green-50 rounded-lg border border-green-100 p-3">
                          <p className="text-xs text-green-700 font-medium mb-2 flex items-center gap-1">
                            <span className="text-green-600">🥬</span>
                            Grønnsaker
                          </p>
                          <div className="space-y-2">
                            {meal.vegetables.map((veg, vIndex) => (
                              <div key={vIndex} className="flex items-center gap-2">
                                {veg.imageUrl ? (
                                  <img 
                                    src={veg.imageUrl} 
                                    alt={veg.title}
                                    className="w-12 h-12 object-cover rounded border border-green-200"
                                  />
                                ) : (
                                  <div className="w-12 h-12 bg-green-100 rounded flex items-center justify-center">
                                    <span className="text-green-600 text-lg">🥬</span>
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-green-900 text-xs truncate">{veg.title}</p>
                                  <p className="text-xs text-green-600">{veg.store}</p>
                                </div>
                                <div className="text-right">
                                  {veg.originalPrice && veg.originalPrice > veg.price && (
                                    <p className="text-xs text-green-400 line-through">{formatPrice(veg.originalPrice)}</p>
                                  )}
                                  <p className="text-sm font-bold text-green-700">{formatPrice(veg.price)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Shopping List */}
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50/50 to-cyan-50/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ShoppingCart className="h-5 w-5 text-blue-700" />
                </div>
                <div>
                  <CardTitle className="text-blue-900">Handleliste</CardTitle>
                  <CardDescription>Alt du trenger å kjøpe</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Primary store */}
              {weeklyPlan.shoppingList.primary.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-blue-200">
                    <h3 className="font-bold text-lg text-blue-900 flex items-center gap-2">
                      <Store className="h-5 w-5" />
                      Hovedbutikk
                    </h3>
                    <span className="text-lg font-bold text-blue-700">
                      {formatPrice(getTotalPrice(weeklyPlan.shoppingList.primary))}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {weeklyPlan.shoppingList.primary.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-white rounded-lg border border-blue-100 hover:border-blue-200 transition-colors">
                        <div className="flex-1">
                          <p className="font-semibold text-blue-900">
                            {item.title}
                            {item.usageCount && item.usageCount > 1 && (
                              <Badge variant="secondary" className="ml-2 text-xs bg-blue-100 text-blue-700">
                                {item.usageCount} middager
                              </Badge>
                            )}
                          </p>
                          <p className="text-xs text-blue-600 mt-1">{item.quantity}</p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-bold text-blue-700">{formatPrice(item.price)}</p>
                          <p className="text-xs text-blue-600">{item.store}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Secondary stores */}
              {weeklyPlan.shoppingList.secondary.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-cyan-200">
                    <h3 className="font-bold text-lg text-cyan-900 flex items-center gap-2">
                      <Store className="h-5 w-5" />
                      Andre butikker
                    </h3>
                    <span className="text-lg font-bold text-cyan-700">
                      {formatPrice(getTotalPrice(weeklyPlan.shoppingList.secondary))}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {weeklyPlan.shoppingList.secondary.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-white rounded-lg border border-cyan-100 hover:border-cyan-200 transition-colors">
                        <div className="flex-1">
                          <p className="font-semibold text-cyan-900">
                            {item.title}
                            {item.usageCount && item.usageCount > 1 && (
                              <Badge variant="secondary" className="ml-2 text-xs bg-cyan-100 text-cyan-700">
                                {item.usageCount} middager
                              </Badge>
                            )}
                          </p>
                          <p className="text-xs text-cyan-600 mt-1">{item.quantity}</p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-bold text-cyan-700">{formatPrice(item.price)}</p>
                          <p className="text-xs text-cyan-600">{item.store}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pantry items */}
              {weeklyPlan.shoppingList.pantry.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h3 className="font-bold text-amber-900 mb-3 flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Fra lager (må ha hjemme)
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {weeklyPlan.shoppingList.pantry.map((pantryItem, index) => (
                      <Badge key={index} className="capitalize bg-amber-100 text-amber-900 hover:bg-amber-200 border-amber-300">
                        {pantryItem.item}
                        {pantryItem.usageCount > 1 && (
                          <span className="ml-1 font-bold">
                            ×{pantryItem.usageCount}
                          </span>
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
