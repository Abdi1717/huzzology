import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, X, TrendingUp } from 'lucide-react';
import Fuse from 'fuse.js';
import { ArchetypeNode } from '@/types/archetype';

export interface SearchSuggestion {
  id: string;
  label: string;
  type: 'archetype' | 'keyword' | 'trending';
  score?: number;
}

export interface GraphSearchProps {
  onSearch: (query: string) => void;
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
  placeholder?: string;
  initialValue?: string;
  debounceTime?: number;
  className?: string;
  archetypes?: ArchetypeNode[];
  suggestions?: SearchSuggestion[];
  showSuggestions?: boolean;
  enableFuzzySearch?: boolean;
}

const GraphSearch: React.FC<GraphSearchProps> = ({
  onSearch,
  onSuggestionSelect,
  placeholder = 'Search archetypes...',
  initialValue = '',
  debounceTime = 300,
  className,
  archetypes = [],
  suggestions = [],
  showSuggestions = true,
  enableFuzzySearch = true,
}) => {
  const [searchValue, setSearchValue] = useState(initialValue);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fuzzy search setup
  const fuseOptions = {
    keys: [
      { name: 'label', weight: 0.7 },
      { name: 'description', weight: 0.3 },
      { name: 'keywords', weight: 0.5 }
    ],
    threshold: 0.4,
    includeScore: true,
    minMatchCharLength: 2,
  };

  const fuse = useMemo(() => {
    return new Fuse(archetypes, fuseOptions);
  }, [archetypes]);

  // Generate search suggestions
  const searchSuggestions = useMemo(() => {
    if (!searchValue.trim() || searchValue.length < 2) {
      // Show trending suggestions when no search
      return suggestions.filter(s => s.type === 'trending').slice(0, 5);
    }

    if (enableFuzzySearch && archetypes.length > 0) {
      // Use fuzzy search for archetype suggestions
      const fuzzyResults = fuse.search(searchValue).slice(0, 3);
      const archetypeSuggestions: SearchSuggestion[] = fuzzyResults.map(result => ({
        id: result.item.id,
        label: result.item.label,
        type: 'archetype' as const,
        score: result.score
      }));

      // Add keyword suggestions
      const keywordSuggestions: SearchSuggestion[] = suggestions
        .filter(s => s.type === 'keyword' && s.label.toLowerCase().includes(searchValue.toLowerCase()))
        .slice(0, 2);

      return [...archetypeSuggestions, ...keywordSuggestions];
    }

    // Fallback to simple matching
    return suggestions
      .filter(s => s.label.toLowerCase().includes(searchValue.toLowerCase()))
      .slice(0, 5);
  }, [searchValue, archetypes, suggestions, fuse, enableFuzzySearch]);

  // Custom debounce implementation
  const debounceRef = useRef<NodeJS.Timeout>();
  const debouncedSearch = useCallback((query: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      onSearch(query);
    }, debounceTime);
  }, [onSearch, debounceTime]);

  // Handle input change
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchValue(value);
      setShowDropdown(true);
      setSelectedSuggestionIndex(-1);
      debouncedSearch(value);
    },
    [debouncedSearch]
  );

  // Handle input focus
  const handleFocus = useCallback(() => {
    if (showSuggestions) {
      setShowDropdown(true);
    }
  }, [showSuggestions]);

  // Handle input blur
  const handleBlur = useCallback((e: React.FocusEvent) => {
    // Delay hiding dropdown to allow clicks on suggestions
    setTimeout(() => {
      if (!dropdownRef.current?.contains(e.relatedTarget as Node)) {
        setShowDropdown(false);
      }
    }, 150);
  }, []);

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback((suggestion: SearchSuggestion) => {
    setSearchValue(suggestion.label);
    setShowDropdown(false);
    onSearch(suggestion.label);
    onSuggestionSelect?.(suggestion);
  }, [onSearch, onSuggestionSelect]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showDropdown || searchSuggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < searchSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          handleSuggestionSelect(searchSuggestions[selectedSuggestionIndex]);
        } else {
          setShowDropdown(false);
          onSearch(searchValue);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setSelectedSuggestionIndex(-1);
        inputRef.current?.blur();
        break;
    }
  }, [showDropdown, searchSuggestions, selectedSuggestionIndex, handleSuggestionSelect, onSearch, searchValue]);

  // Clear the search
  const handleClear = useCallback(() => {
    setSearchValue('');
    setShowDropdown(false);
    setSelectedSuggestionIndex(-1);
    onSearch('');
    inputRef.current?.focus();
  }, [onSearch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get suggestion icon
  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'trending':
        return <TrendingUp className="h-3 w-3 text-orange-500" />;
      case 'archetype':
        return <div className="h-3 w-3 rounded-full bg-blue-500" />;
      case 'keyword':
        return <Search className="h-3 w-3 text-gray-500" />;
      default:
        return <Search className="h-3 w-3 text-gray-500" />;
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="pl-8 pr-8"
          aria-label="Search"
          aria-expanded={showDropdown}
          aria-haspopup="listbox"
          role="combobox"
        />
        {searchValue && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full p-0 px-2"
            onClick={handleClear}
            aria-label="Clear search"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </Button>
        )}
      </div>

      {/* Search Suggestions Dropdown */}
      {showDropdown && showSuggestions && searchSuggestions.length > 0 && (
        <div 
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 z-50 mt-1"
        >
          <Card className="shadow-lg border">
            <CardContent className="p-2">
              {!searchValue.trim() && (
                <div className="px-2 py-1 text-xs text-muted-foreground border-b mb-1">
                  Trending searches
                </div>
              )}
              <div className="space-y-1" role="listbox">
                {searchSuggestions.map((suggestion, index) => (
                  <div
                    key={`${suggestion.type}-${suggestion.id}`}
                    role="option"
                    aria-selected={index === selectedSuggestionIndex}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-sm cursor-pointer transition-colors ${
                      index === selectedSuggestionIndex 
                        ? 'bg-accent text-accent-foreground' 
                        : 'hover:bg-accent/50'
                    }`}
                    onClick={() => handleSuggestionSelect(suggestion)}
                  >
                    {getSuggestionIcon(suggestion.type)}
                    <span className="flex-1 text-sm">{suggestion.label}</span>
                    <Badge 
                      variant="secondary" 
                      className="text-xs px-1.5 py-0.5"
                    >
                      {suggestion.type}
                    </Badge>
                    {suggestion.score && (
                      <span className="text-xs text-muted-foreground">
                        {Math.round((1 - suggestion.score) * 100)}%
                      </span>
                    )}
                  </div>
                ))}
              </div>
              {enableFuzzySearch && searchValue.trim() && (
                <div className="px-2 py-1 text-xs text-muted-foreground border-t mt-1">
                  Powered by fuzzy search
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default GraphSearch; 