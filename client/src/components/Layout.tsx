/**
 * Layout Component
 * 
 * Main layout wrapper with header navigation and outlet for child routes
 */

import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Toaster } from '@/components/ui/toaster';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { ROUTES } from '@/lib/routes';
import { useState } from 'react';

export const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`${ROUTES.SEARCH}?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  const isActive = (path: string) => {
    if (path === ROUTES.HOME) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-6">
              <div 
                className="flex items-center space-x-2 cursor-pointer"
                onClick={() => navigate(ROUTES.HOME)}
              >
                <h1 className="text-2xl font-bold text-foreground">
                  🧠 Huzzology
                </h1>
                <Badge variant="secondary" className="text-xs">
                  Beta
                </Badge>
              </div>
              
              {/* Navigation Links */}
              <nav className="hidden md:flex items-center space-x-4">
                <Button
                  variant={isActive(ROUTES.EXPLORE) ? "default" : "ghost"}
                  size="sm"
                  onClick={() => navigate(ROUTES.EXPLORE)}
                >
                  Explore
                </Button>
                <Button
                  variant={isActive(ROUTES.GRAPH) ? "default" : "ghost"}
                  size="sm"
                  onClick={() => navigate(ROUTES.GRAPH)}
                >
                  Graph
                </Button>
                <Button
                  variant={isActive(ROUTES.TRENDING) ? "default" : "ghost"}
                  size="sm"
                  onClick={() => navigate(ROUTES.TRENDING)}
                >
                  Trending
                </Button>
                <Button
                  variant={isActive(ROUTES.LAYOUT) ? "default" : "ghost"}
                  size="sm"
                  onClick={() => navigate(ROUTES.LAYOUT)}
                >
                  Layout
                </Button>
                <Button
                  variant={isActive(ROUTES.API) ? "default" : "ghost"}
                  size="sm"
                  onClick={() => navigate(ROUTES.API)}
                >
                  API Demo
                </Button>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              <Input 
                placeholder="Search archetypes..." 
                className="w-48 md:w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
              />
              <ThemeToggle />
              <Button variant="outline" size="sm">
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>
      
      <footer className="border-t bg-card mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold text-foreground mb-4">Huzzology</h3>
              <p className="text-sm text-muted-foreground">
                Mapping the evolution of women's pop culture archetypes through data visualization.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-3">Explore</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <button 
                    onClick={() => navigate(ROUTES.TRENDING)}
                    className="hover:text-foreground transition-colors"
                  >
                    Trending Archetypes
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate(ROUTES.GRAPH)}
                    className="hover:text-foreground transition-colors"
                  >
                    Network Graph
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-3">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    API
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-3">Connect</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Twitter
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    GitHub
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            © 2024 Huzzology. All rights reserved.
          </div>
        </div>
      </footer>
      
      <Toaster />
    </div>
  );
}; 