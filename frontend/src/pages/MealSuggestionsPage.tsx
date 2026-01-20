import { useNavigate } from 'react-router-dom';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Home, ChevronRight, Search } from 'lucide-react';

export default function MealSuggestionsPage() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-6">
      <Breadcrumb className="mb-4">
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
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-muted">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Middagsforslag kommer snart</h3>
        <p className="text-sm text-muted-foreground mt-1">Denne funksjonen er under utvikling</p>
      </div>
    </div>
  );
}
