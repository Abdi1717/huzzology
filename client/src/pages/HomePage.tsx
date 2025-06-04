/**
 * HomePage Component
 * 
 * Landing page for Huzzology with hero section and feature overview
 */

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/lib/routes';
import { useState } from 'react';

export const HomePage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`${ROUTES.SEARCH}?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-foreground mb-4">
          Map the Evolution of Culture
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
          Discover and explore the evolving landscape of women's pop culture archetypes through interactive data visualization
        </p>
        
        <div className="flex justify-center space-x-4 mb-8">
          <Button 
            size="lg" 
            className="px-8"
            onClick={() => navigate(ROUTES.EXPLORE)}
          >
            Start Exploring
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => navigate(ROUTES.TRENDING)}
          >
            View Trending
          </Button>
        </div>

        <div className="max-w-md mx-auto">
          <Input 
            placeholder="Search archetypes..." 
            className="w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(ROUTES.EXPLORE)}>
          <CardHeader>
            <div className="w-12 h-12 bg-huzzology-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🔍</span>
            </div>
            <CardTitle className="text-xl">Discover</CardTitle>
            <CardDescription>
              Explore trending archetypes and cultural movements as they emerge
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Clean Girl</Badge>
              <Badge variant="outline">Dark Academia</Badge>
              <Badge variant="outline">Cottagecore</Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(ROUTES.GRAPH)}>
          <CardHeader>
            <div className="w-12 h-12 bg-huzzology-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🕸️</span>
            </div>
            <CardTitle className="text-xl">Visualize</CardTitle>
            <CardDescription>
              See how archetypes connect and influence each other in real-time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Relationships</Badge>
              <Badge variant="outline">Evolution</Badge>
              <Badge variant="outline">Networks</Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/analytics')}>
          <CardHeader>
            <div className="w-12 h-12 bg-huzzology-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">📈</span>
            </div>
            <CardTitle className="text-xl">Track</CardTitle>
            <CardDescription>
              Follow the evolution of trends over time with detailed analytics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Timeline</Badge>
              <Badge variant="outline">Metrics</Badge>
              <Badge variant="outline">Insights</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-r from-huzzology-50 to-pink-50 border-huzzology-200">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-huzzology-800">
            Ready to dive into the cultural zeitgeist?
          </CardTitle>
          <CardDescription className="text-huzzology-600">
            Join thousands of users mapping the evolution of pop culture
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button 
            size="lg" 
            className="bg-huzzology-600 hover:bg-huzzology-700"
            onClick={() => navigate(ROUTES.EXPLORE)}
          >
            Get Started Now
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}; 