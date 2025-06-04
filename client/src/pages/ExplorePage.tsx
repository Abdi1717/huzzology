/**
 * ExplorePage Component
 * 
 * Main exploration interface for browsing and searching archetypes
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useArchetypeStore } from '@/stores/archetypeStore';
import { useArchetypeData } from '@/hooks/useArchetypeData';
import { useNavigate, useSearchParams } from 'react-router-dom';

export const ExplorePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  
  const {
    searchFilters,
    setSearchFilters,
    getFilteredArchetypes,
    setSelectedArchetype,
  } = useArchetypeStore();
  
  const {
    isLoading,
    error,
    searchArchetypes,
  } = useArchetypeData();

  const filteredArchetypes = getFilteredArchetypes();

  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      setSearchQuery(query);
      setSearchFilters({ query });
    }
  }, [searchParams, setSearchFilters]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setSearchFilters({ query });
    
    if (query.trim()) {
      await searchArchetypes(query);
    }
  };

  const handleArchetypeClick = (archetypeId: string) => {
    setSelectedArchetype(archetypeId);
    navigate(`/archetype/${archetypeId}`);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription>
              Failed to load archetypes. Please try again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Explore Archetypes
          </h1>
          <p className="text-muted-foreground mb-6">
            Discover and explore the evolving landscape of cultural archetypes
          </p>
          
          {/* Search Bar */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search archetypes, keywords, or descriptions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch(searchQuery);
                  }
                }}
                className="w-full"
              />
            </div>
            <Button onClick={() => handleSearch(searchQuery)}>
              Search
            </Button>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2">
            <Badge 
              variant="outline" 
              className="cursor-pointer hover:bg-accent"
              onClick={() => handleSearch('aesthetic')}
            >
              Aesthetic
            </Badge>
            <Badge 
              variant="outline" 
              className="cursor-pointer hover:bg-accent"
              onClick={() => handleSearch('fashion')}
            >
              Fashion
            </Badge>
            <Badge 
              variant="outline" 
              className="cursor-pointer hover:bg-accent"
              onClick={() => handleSearch('lifestyle')}
            >
              Lifestyle
            </Badge>
            <Badge 
              variant="outline" 
              className="cursor-pointer hover:bg-accent"
              onClick={() => handleSearch('trending')}
            >
              Trending
            </Badge>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading archetypes...</p>
            </div>
          </div>
        )}

        {/* Results */}
        {!isLoading && (
          <>
            <div className="mb-6">
              <p className="text-sm text-muted-foreground">
                {filteredArchetypes.length} archetype{filteredArchetypes.length !== 1 ? 's' : ''} found
                {searchFilters.query && ` for "${searchFilters.query}"`}
              </p>
            </div>

            {filteredArchetypes.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <div className="text-6xl mb-4">🔍</div>
                  <CardTitle className="mb-2">No archetypes found</CardTitle>
                  <CardDescription className="mb-4">
                    Try adjusting your search terms or browse all archetypes
                  </CardDescription>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchQuery('');
                      setSearchFilters({ query: '' });
                    }}
                  >
                    Clear Search
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredArchetypes.map((archetype) => (
                  <Card 
                    key={archetype.id}
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => handleArchetypeClick(archetype.id)}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <CardTitle className="text-lg">{archetype.label}</CardTitle>
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: archetype.color }}
                        />
                      </div>
                      <CardDescription className="line-clamp-2">
                        {archetype.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {archetype.keywords.slice(0, 3).map((keyword) => (
                          <Badge key={keyword} variant="secondary" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                        {archetype.keywords.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{archetype.keywords.length - 3}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>
                          {archetype.metadata.platforms.length} platform{archetype.metadata.platforms.length !== 1 ? 's' : ''}
                        </span>
                        <span>
                          {Math.round(archetype.metadata.influence_score * 100)}% influence
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}; 