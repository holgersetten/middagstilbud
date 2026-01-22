import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Home, ChevronRight, Calendar, ShoppingCart, Loader2, ChefHat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { offersApi } from '@/services/api';

interface Offer {
  title: string;
  price: number;
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

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Lag ukemeny</h1>
        <p className="text-muted-foreground">Generer ukemeny basert på ukens beste tilbud</p>
      </div>

      {/* Configuration */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Innstillinger</CardTitle>
          <CardDescription>Velg butikker og antall måltider</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Store selection */}
          <div>
            <label className="text-sm font-medium mb-3 block">
              Velg butikker (0-2) {selectedStores.length > 0 && `- ${selectedStores.length} valgt`}
            </label>
            <div className="flex flex-wrap gap-2">
              {STORES.map(store => (
                <Button
                  key={store}
                  variant={selectedStores.includes(store) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStoreToggle(store)}
                  disabled={!selectedStores.includes(store) && selectedStores.length >= 2}
                >
                  {store}
                </Button>
              ))}
            </div>
            {selectedStores.length === 0 && (
              <p className="text-xs text-muted-foreground mt-2">La feltet stå tomt for å bruke alle butikker</p>
            )}
          </div>

          {/* Number of meals */}
          <div>
            <label className="text-sm font-medium mb-3 block">
              Antall måltider: {numMeals}
            </label>
            <input
              type="range"
              min="3"
              max="10"
              value={numMeals}
              onChange={(e) => setNumMeals(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>3 dager</span>
              <span>10 dager</span>
            </div>
          </div>

          {/* Generate button */}
          <Button 
            onClick={handleGenerate} 
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Genererer...
              </>
            ) : (
              <>
                <ChefHat className="mr-2 h-4 w-4" />
                Generer ukemeny
              </>
            )}
          </Button>

          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {weeklyPlan && (
        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Oversikt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Måltider</p>
                  <p className="text-2xl font-bold">{weeklyPlan.meals.length}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Butikker</p>
                  <p className="text-2xl font-bold">{weeklyPlan.storesUsed.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {weeklyPlan.storesUsed.join(', ')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total pris</p>
                  <p className="text-2xl font-bold">
                    {formatPrice(
                      getTotalPrice(weeklyPlan.shoppingList.primary) + 
                      getTotalPrice(weeklyPlan.shoppingList.secondary)
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Meals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChefHat className="h-5 w-5" />
                Ukemeny
              </CardTitle>
              <CardDescription>{weeklyPlan.meals.length} måltider</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {weeklyPlan.meals.map((meal, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{meal.name}</h3>
                        <Badge variant="outline" className="mt-1">Dag {index + 1}</Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      {/* Protein */}
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Protein:</span>
                        <div className="text-right">
                          <p className="font-medium">{meal.protein.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatPrice(meal.protein.price)} @ {meal.protein.store}
                          </p>
                        </div>
                      </div>

                      {/* Carb */}
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Tilbehør:</span>
                        <div className="text-right">
                          {typeof meal.carb === 'string' ? (
                            <>
                              <p className="font-medium capitalize">{meal.carb}</p>
                              <p className="text-xs text-muted-foreground">Fra lager</p>
                            </>
                          ) : (
                            <>
                              <p className="font-medium">{meal.carb.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatPrice(meal.carb.price)} @ {meal.carb.store}
                              </p>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Vegetables */}
                      {meal.vegetables.length > 0 && (
                        <div className="flex justify-between items-start">
                          <span className="text-muted-foreground">Grønnsaker:</span>
                          <div className="text-right space-y-1">
                            {meal.vegetables.map((veg, vIndex) => (
                              <div key={vIndex}>
                                <p className="font-medium">{veg.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatPrice(veg.price)} @ {veg.store}
                                </p>
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Handleliste
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Primary store */}
              {weeklyPlan.shoppingList.primary.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-3 flex items-center justify-between">
                    <span>Hovedbutikk</span>
                    <span className="text-sm font-normal text-muted-foreground">
                      {formatPrice(getTotalPrice(weeklyPlan.shoppingList.primary))}
                    </span>
                  </h3>
                  <div className="space-y-2">
                    {weeklyPlan.shoppingList.primary.map((item, index) => (
                      <div key={index} className="flex justify-between items-center text-sm border-b pb-2">
                        <div>
                          <p className="font-medium">
                            {item.title}
                            {item.usageCount && item.usageCount > 1 && (
                              <span className="ml-2 text-xs text-muted-foreground">
                                (brukes i {item.usageCount} middager)
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">{item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatPrice(item.price)}</p>
                          <p className="text-xs text-muted-foreground">{item.store}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Secondary stores */}
              {weeklyPlan.shoppingList.secondary.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-3 flex items-center justify-between">
                    <span>Andre butikker</span>
                    <span className="text-sm font-normal text-muted-foreground">
                      {formatPrice(getTotalPrice(weeklyPlan.shoppingList.secondary))}
                    </span>
                  </h3>
                  <div className="space-y-2">
                    {weeklyPlan.shoppingList.secondary.map((item, index) => (
                      <div key={index} className="flex justify-between items-center text-sm border-b pb-2">
                        <div>
                          <p className="font-medium">
                            {item.title}
                            {item.usageCount && item.usageCount > 1 && (
                              <span className="ml-2 text-xs text-muted-foreground">
                                (brukes i {item.usageCount} middager)
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">{item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatPrice(item.price)}</p>
                          <p className="text-xs text-muted-foreground">{item.store}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pantry items */}
              {weeklyPlan.shoppingList.pantry.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Fra lager (må ha hjemme)</h3>
                  <div className="flex flex-wrap gap-2">
                    {weeklyPlan.shoppingList.pantry.map((pantryItem, index) => (
                      <Badge key={index} variant="secondary" className="capitalize">
                        {pantryItem.item}
                        {pantryItem.usageCount > 1 && (
                          <span className="ml-1 text-xs">
                            ({pantryItem.usageCount}x)
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
