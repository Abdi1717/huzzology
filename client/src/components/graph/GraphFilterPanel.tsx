import React, { useState, useCallback } from 'react';
import { GraphDataOptions } from '@/hooks/useGraphData';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Search, Filter, X, Calendar as CalendarIcon, Hash, Tag } from 'lucide-react';
import { format } from 'date-fns';

export interface FilterConfig {
  platforms: string[];
  categories: string[];
  tags: string[];
  influenceRange: [number, number];
  dateRange: [Date | undefined, Date | undefined];
}

export interface GraphFilterPanelProps {
  onFilterChange: (options: GraphDataOptions) => void;
  onPathFind?: (sourceId: string, targetId: string) => void;
  platforms?: string[];
  categories?: string[];
  availableTags?: string[];
  className?: string;
}

const DEFAULT_PLATFORMS = [
  'tiktok', 'instagram', 'pinterest', 'twitter', 'youtube', 'facebook', 'snapchat', 'reddit'
];

const DEFAULT_CATEGORIES = [
  'Beauty', 'Lifestyle', 'Fashion', 'Aesthetic', 'Technology', 'Gaming', 'Fitness', 'Food'
];

const DEFAULT_TAGS = [
  'trending', 'viral', 'aesthetic', 'minimalist', 'maximalist', 'retro', 'futuristic', 
  'sustainable', 'luxury', 'budget-friendly', 'diy', 'professional', 'casual', 'formal'
];

const GraphFilterPanel: React.FC<GraphFilterPanelProps> = ({
  onFilterChange,
  onPathFind,
  platforms = DEFAULT_PLATFORMS,
  categories = DEFAULT_CATEGORIES,
  availableTags = DEFAULT_TAGS,
  className,
}) => {
  // State for selected filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [influenceRange, setInfluenceRange] = useState<[number, number]>([0, 100]);
  const [dateRange, setDateRange] = useState<[Date | undefined, Date | undefined]>([undefined, undefined]);
  const [sortBy, setSortBy] = useState<string>('popularity');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showTrendingOnly, setShowTrendingOnly] = useState(false);
  
  // Path finding state
  const [sourceNode, setSourceNode] = useState('');
  const [targetNode, setTargetNode] = useState('');
  
  // Handle tag selection
  const handleTagToggle = useCallback((tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  }, []);
  
  // Remove a selected tag
  const removeTag = useCallback((tag: string) => {
    setSelectedTags(prev => prev.filter(t => t !== tag));
  }, []);
  
  // Apply filters
  const applyFilters = useCallback(() => {
    onFilterChange({
      search: searchQuery || undefined,
      platform: selectedPlatform === 'all' ? undefined : selectedPlatform,
      category: selectedCategory === 'all' ? undefined : selectedCategory,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      sortBy: sortBy as any,
      sortOrder,
      startDate: dateRange[0] ? format(dateRange[0], 'yyyy-MM-dd') : undefined,
      endDate: dateRange[1] ? format(dateRange[1], 'yyyy-MM-dd') : undefined,
      trending: showTrendingOnly || undefined,
      influenceMin: influenceRange[0] > 0 ? influenceRange[0] / 100 : undefined,
      influenceMax: influenceRange[1] < 100 ? influenceRange[1] / 100 : undefined,
    });
  }, [
    onFilterChange, 
    searchQuery, 
    selectedPlatform, 
    selectedCategory, 
    selectedTags,
    sortBy, 
    sortOrder, 
    dateRange, 
    showTrendingOnly, 
    influenceRange
  ]);
  
  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedPlatform('all');
    setSelectedCategory('all');
    setSelectedTags([]);
    setInfluenceRange([0, 100]);
    setDateRange([undefined, undefined]);
    setSortBy('popularity');
    setSortOrder('desc');
    setShowTrendingOnly(false);
    
    // Apply cleared filters
    onFilterChange({
      page: 1,
      limit: 10,
      sortBy: 'popularity',
      sortOrder: 'desc',
    });
  }, [onFilterChange]);
  
  // Find path between nodes
  const findPath = useCallback(() => {
    if (onPathFind && sourceNode && targetNode) {
      onPathFind(sourceNode, targetNode);
    }
  }, [onPathFind, sourceNode, targetNode]);
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Graph Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="basic">
          <TabsList className="w-full">
            <TabsTrigger value="basic">Basic Filters</TabsTrigger>
            <TabsTrigger value="advanced">Advanced Filters</TabsTrigger>
            {onPathFind && <TabsTrigger value="pathfinding">Path Finding</TabsTrigger>}
          </TabsList>
          
          <TabsContent value="basic" className="space-y-4 pt-4">
            {/* Search Input */}
            <div className="space-y-2">
              <Label htmlFor="search">Search Archetypes</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name, keyword..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            {/* Platform Filter */}
            <div className="space-y-2">
              <Label htmlFor="platform">Platform</Label>
              <Select 
                value={selectedPlatform}
                onValueChange={setSelectedPlatform}
              >
                <SelectTrigger id="platform">
                  <SelectValue placeholder="All Platforms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  {platforms.map(platform => (
                    <SelectItem key={platform} value={platform}>
                      {platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Category Filter */}
            <div className="space-y-2">
              <Label>Category</Label>
              <div className="flex flex-wrap gap-1.5">
                <Badge 
                  variant={selectedCategory === 'all' ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setSelectedCategory('all')}
                >
                  All
                </Badge>
                {categories.map(category => (
                  <Badge 
                    key={category}
                    variant={selectedCategory === category ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            </div>
            
            {/* Tag-based Filter */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                <Label>Tags</Label>
                <Badge variant="secondary" className="text-xs">
                  {selectedTags.length}
                </Badge>
              </div>
              
              {/* Selected tags display */}
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedTags.map(tag => (
                    <Badge 
                      key={tag}
                      variant="default"
                      className="cursor-pointer text-xs"
                      onClick={() => removeTag(tag)}
                    >
                      {tag}
                      <X className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              )}
              
              {/* Available tags */}
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {availableTags
                  .filter(tag => !selectedTags.includes(tag))
                  .map(tag => (
                    <Badge 
                      key={tag}
                      variant="outline"
                      className="cursor-pointer text-xs hover:bg-accent"
                      onClick={() => handleTagToggle(tag)}
                    >
                      <Hash className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
              </div>
            </div>
            
            {/* Trending Filter */}
            <div className="flex items-center space-x-2">
              <Switch
                id="trending"
                checked={showTrendingOnly}
                onCheckedChange={setShowTrendingOnly}
              />
              <Label htmlFor="trending">Show trending archetypes only</Label>
            </div>
            
            {/* Sort Controls */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sortBy">Sort By</Label>
                <Select 
                  value={sortBy}
                  onValueChange={setSortBy}
                >
                  <SelectTrigger id="sortBy">
                    <SelectValue placeholder="Sort by..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popularity">Popularity</SelectItem>
                    <SelectItem value="recent">Recent</SelectItem>
                    <SelectItem value="alphabetical">Alphabetical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Select 
                  value={sortOrder}
                  onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}
                >
                  <SelectTrigger id="sortOrder">
                    <SelectValue placeholder="Sort order..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Descending</SelectItem>
                    <SelectItem value="asc">Ascending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="advanced" className="space-y-4 pt-4">
            {/* Influence Range */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Influence Score</Label>
                <span className="text-sm">
                  {influenceRange[0]}% - {influenceRange[1]}%
                </span>
              </div>
              <Slider
                min={0}
                max={100}
                step={5}
                value={influenceRange}
                onValueChange={(value: [number, number]) => setInfluenceRange(value)}
                className="py-1"
              />
            </div>
            
            {/* Date Range */}
            <div className="space-y-2">
              <Label>Origin Date Range</Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="w-full sm:w-1/2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange[0] ? format(dateRange[0], 'PPP') : "Start date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dateRange[0]}
                        onSelect={(date) => setDateRange([date, dateRange[1]])}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="w-full sm:w-1/2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange[1] ? format(dateRange[1], 'PPP') : "End date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dateRange[1]}
                        onSelect={(date) => setDateRange([dateRange[0], date])}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {onPathFind && (
            <TabsContent value="pathfinding" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="sourceNode">Source Node ID</Label>
                <Input
                  id="sourceNode"
                  placeholder="Enter source node ID"
                  value={sourceNode}
                  onChange={(e) => setSourceNode(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="targetNode">Target Node ID</Label>
                <Input
                  id="targetNode"
                  placeholder="Enter target node ID"
                  value={targetNode}
                  onChange={(e) => setTargetNode(e.target.value)}
                />
              </div>
              
              <Button
                onClick={findPath}
                disabled={!sourceNode || !targetNode}
                className="w-full"
              >
                Find Path
              </Button>
              
              <p className="text-xs text-muted-foreground">
                This will find and highlight the shortest path between two archetypes
                in the graph, showing their relationships.
              </p>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={clearAllFilters}>
          <X className="mr-2 h-4 w-4" />
          Clear All
        </Button>
        
        <Button onClick={applyFilters}>
          <Filter className="mr-2 h-4 w-4" />
          Apply Filters
        </Button>
      </CardFooter>
    </Card>
  );
};

export default GraphFilterPanel; 