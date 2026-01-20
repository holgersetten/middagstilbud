import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, ChefHat } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold tracking-tight text-foreground mb-4">
            Lei av å tenke på middag?
          </h1>
          <p className="text-xl text-muted-foreground">
            Sjekk ukens billigste meny
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Link to="/tilbud" className="cursor-pointer">
            <Card className="h-full hover:shadow-lg transition-shadow group">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                    <ShoppingCart className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">Tilbud</CardTitle>
                </div>
                <CardDescription className="text-base">
                  Bla gjennom alle tilbud fra Kiwi, Meny, Rema 1000, Spar, Bunnpris, og alle Coop-butikkene
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors cursor-pointer">
                  Se tilbud
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link to="/middagsforslag" className="cursor-pointer">
            <Card className="h-full hover:shadow-lg transition-all group bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                    <ChefHat className="h-6 w-6 text-orange-600" />
                  </div>
                  <CardTitle className="text-2xl text-orange-900">Middagsforslag</CardTitle>
                </div>
                <CardDescription className="text-base text-orange-800">
                  Få inspirasjon til middagsplanlegging basert på tilbudene
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full bg-orange-600 text-white hover:bg-orange-500 border-orange-600 transition-colors cursor-pointer">
                  Utforsk oppskrifter
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Stats Section */}
        <div className="bg-muted rounded-lg p-8 text-center">
          <h2 className="text-2xl font-semibold mb-4">Hvorfor Ukeshandel.no?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-3xl font-bold text-primary mb-2">8+</div>
              <div className="text-sm text-muted-foreground">Butikkjeder</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">1000+</div>
              <div className="text-sm text-muted-foreground">Tilbud hver uke</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">24/7</div>
              <div className="text-sm text-muted-foreground">Alltid oppdatert</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
