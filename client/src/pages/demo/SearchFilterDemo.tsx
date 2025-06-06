/**
 * SearchFilterDemo - Comprehensive demo for the search and filter system
 * Showcases fuzzy search, tag filtering, trending recommendations, and autocomplete
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GraphSearch, { SearchSuggestion } from '@/components/graph/GraphSearch';
import GraphFilterPanel from '@/components/graph/GraphFilterPanel';
import useSearchSuggestions from '@/hooks/useSearchSuggestions';
import { FilteredGraphVisualization } from '@/components/graph/FilteredGraphVisualization';
import { generateMockArchetypes } from '@/utils/sample-data';
import { ArchetypeNode } from '@/types/archetype';
import { 
  Search, 
  Filter, 
  TrendingUp, 
  Zap, 
  Target,
  Clock,
  Hash,
  Users,
  BarChart3
} from 'lucide-react';

const SearchFilterDemo: React.FC = () => {
  // Generate mock data for demonstration
  const mockArchetypes: ArchetypeNode[] = useMemo(() => generateMockArchetypes(50), []);
  
  // State for demo controls
  const [selectedDemo, setSelectedDemo] = useState<'search' | 'filter' | 'combined'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ArchetypeNode[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<SearchSuggestion | null>(null);
  
  // Use search suggestions hook
  const { suggestions, trendingSuggestions, loading: suggestionsLoading } = useSearchSuggestions({
    archetypes: mockArchetypes,
    recentSearches: ['clean girl', 'dark academia', 'cottagecore'],
    maxSuggestions: 20
  });

  // Handle search functionality
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    // Simple fuzzy search simulation
    const results = mockArchetypes.filter(archetype => 
      archetype.label.toLowerCase().includes(query.toLowerCase()) ||
      archetype.description.toLowerCase().includes(query.toLowerCase()) ||
      archetype.keywords.some(keyword => keyword.toLowerCase().includes(query.toLowerCase()))
    );
    
    setSearchResults(results);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    setSelectedSuggestion(suggestion);
    
    // Find archetype if it's an archetype suggestion
    if (suggestion.type === 'archetype') {
      const archetype = mockArchetypes.find(a => a.id === suggestion.id);
      if (archetype) {
        setSearchResults([archetype]);
      }
    }
  };

  // Handle filter changes
  const handleFilterChange = (options: any) => {
    console.log('Filter options changed:', options);
    // In a real app, this would trigger a new API call
  };

  // Demo statistics
  const demoStats = {
    totalArchetypes: mockArchetypes.length,
    trendingCount: trendingSuggestions.length,
    keywordSuggestions: suggestions.filter(s => s.type === 'keyword').length,
    archetypeSuggestions: suggestions.filter(s => s.type === 'archetype').length,
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Search & Filter System Demo</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Experience comprehensive search functionality with fuzzy matching, 
          tag-based filtering, trending recommendations, and intelligent autocomplete.
        </p>
      </div>

      {/* Demo Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Demo Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{demoStats.totalArchetypes}</div>
              <div className="text-sm text-muted-foreground">Total Archetypes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{demoStats.trendingCount}</div>
              <div className="text-sm text-muted-foreground">Trending Items</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{demoStats.keywordSuggestions}</div>
              <div className="text-sm text-muted-foreground">Keyword Suggestions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{demoStats.archetypeSuggestions}</div>
              <div className="text-sm text-muted-foreground">Archetype Suggestions</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Demo Tabs */}
      <Tabs value={selectedDemo} onValueChange={(value: any) => setSelectedDemo(value)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Search Demo
          </TabsTrigger>
          <TabsTrigger value="filter" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filter Demo
          </TabsTrigger>
          <TabsTrigger value="combined" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Combined Demo
          </TabsTrigger>
        </TabsList>

        {/* Search Demo */}
        <TabsContent value="search" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Fuzzy Search with Autocomplete
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Search Input</h3>
                  <GraphSearch
                    onSearch={handleSearch}
                    onSuggestionSelect={handleSuggestionSelect}
                    archetypes={mockArchetypes}
                    suggestions={suggestions}
                    showSuggestions={true}
                    enableFuzzySearch={true}
                    placeholder="Try 'clean', 'dark', or 'cottage'..."
                  />
                  
                  {selectedSuggestion && (
                    <Alert>
                      <Zap className="h-4 w-4" />
                      <AlertDescription>
                        Selected suggestion: <strong>{selectedSuggestion.label}</strong> 
                        ({selectedSuggestion.type})
                        {selectedSuggestion.score && (
                          <span className="ml-2">
                            Match: {Math.round((1 - selectedSuggestion.score) * 100)}%
                          </span>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Trending Suggestions
                  </h3>
                  <div className="space-y-2">
                    {trendingSuggestions.slice(0, 5).map(suggestion => (
                      <div 
                        key={suggestion.id}
                        className="flex items-center justify-between p-2 border rounded-md hover:bg-accent cursor-pointer"
                        onClick={() => handleSuggestionSelect(suggestion)}
                      >
                        <span className="font-medium">{suggestion.label}</span>
                        <Badge variant="secondary">
                          {Math.round((suggestion.score || 0) * 100)}% influence
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Search Results ({searchResults.length})</h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {searchResults.slice(0, 6).map(archetype => (
                      <Card key={archetype.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div 
                              className="w-4 h-4 rounded-full" 
                              style={{ backgroundColor: archetype.color }}
                            />
                            <h4 className="font-medium">{archetype.label}</h4>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {archetype.description}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {archetype.keywords.slice(0, 3).map(keyword => (
                              <Badge key={keyword} variant="outline" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Filter Demo */}
        <TabsContent value="filter" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Advanced Filtering System
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                  <GraphFilterPanel
                    onFilterChange={handleFilterChange}
                    platforms={['tiktok', 'instagram', 'pinterest', 'twitter']}
                    categories={['Beauty', 'Fashion', 'Lifestyle', 'Aesthetic']}
                    availableTags={[
                      'trending', 'viral', 'aesthetic', 'minimalist', 'maximalist',
                      'retro', 'sustainable', 'luxury', 'diy', 'professional'
                    ]}
                  />
                </div>
                
                <div className="lg:col-span-2">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Filter Features</h3>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Hash className="h-4 w-4 text-blue-500" />
                            <h4 className="font-medium">Tag-based Filtering</h4>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Multi-select tags with visual feedback and easy removal
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="h-4 w-4 text-green-500" />
                            <h4 className="font-medium">Platform Filtering</h4>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Filter by social media platform origin
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <BarChart3 className="h-4 w-4 text-purple-500" />
                            <h4 className="font-medium">Influence Range</h4>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Filter by archetype influence score
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="h-4 w-4 text-orange-500" />
                            <h4 className="font-medium">Date Range</h4>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Filter by archetype origin date
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Combined Demo */}
        <TabsContent value="combined" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Complete Search & Filter Experience
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                This demonstrates the full integration of search and filtering capabilities 
                in the graph visualization component.
              </p>
              
              <div className="h-[600px] border rounded-lg">
                <FilteredGraphVisualization
                  layout="dagre"
                  enablePathfinding={true}
                  enableRealTimeUpdates={false}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Feature Highlights */}
      <Card>
        <CardHeader>
          <CardTitle>Key Features Implemented</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Search className="h-4 w-4 text-blue-500" />
                Fuzzy Search
              </div>
              <p className="text-xs text-muted-foreground">
                Advanced text matching using Fuse.js with configurable thresholds
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Hash className="h-4 w-4 text-green-500" />
                Tag Filtering
              </div>
              <p className="text-xs text-muted-foreground">
                Multi-select tag-based filtering with visual tag management
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <TrendingUp className="h-4 w-4 text-orange-500" />
                Trending Recommendations
              </div>
              <p className="text-xs text-muted-foreground">
                Dynamic suggestions based on popularity and influence scores
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Zap className="h-4 w-4 text-purple-500" />
                Smart Autocomplete
              </div>
              <p className="text-xs text-muted-foreground">
                Context-aware suggestions with keyboard navigation support
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Filter className="h-4 w-4 text-red-500" />
                Advanced Filters
              </div>
              <p className="text-xs text-muted-foreground">
                Platform, category, influence range, and date filtering
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Target className="h-4 w-4 text-indigo-500" />
                Integrated Experience
              </div>
              <p className="text-xs text-muted-foreground">
                Seamless integration with graph visualization and pathfinding
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SearchFilterDemo;