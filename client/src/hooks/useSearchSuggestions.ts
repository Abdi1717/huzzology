import { useState, useEffect, useMemo } from 'react';
import { ArchetypeNode } from '@/types/archetype';
import { SearchSuggestion } from '@/components/graph/GraphSearch';

interface UseSearchSuggestionsOptions {
  archetypes: ArchetypeNode[];
  recentSearches?: string[];
  maxSuggestions?: number;
}

interface SearchSuggestionsState {
  suggestions: SearchSuggestion[];
  trendingSuggestions: SearchSuggestion[];
  loading: boolean;
  error: Error | null;
}

export const useSearchSuggestions = ({
  archetypes,
  recentSearches = [],
  maxSuggestions = 10
}: UseSearchSuggestionsOptions): SearchSuggestionsState => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Generate trending suggestions based on archetype popularity
  const trendingSuggestions = useMemo(() => {
    return archetypes
      .filter(archetype => archetype.metadata?.influence_score > 0.7)
      .sort((a, b) => (b.metadata?.influence_score || 0) - (a.metadata?.influence_score || 0))
      .slice(0, 5)
      .map(archetype => ({
        id: archetype.id,
        label: archetype.label,
        type: 'trending' as const,
        score: archetype.metadata?.influence_score
      }));
  }, [archetypes]);

  // Generate keyword suggestions from archetype keywords
  const keywordSuggestions = useMemo(() => {
    const allKeywords = archetypes.flatMap(archetype => archetype.keywords || []);
    const keywordCounts = allKeywords.reduce((acc, keyword) => {
      acc[keyword] = (acc[keyword] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(keywordCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, maxSuggestions)
      .map(([keyword, count]) => ({
        id: keyword,
        label: keyword,
        type: 'keyword' as const,
        score: count / archetypes.length
      }));
  }, [archetypes, maxSuggestions]);

  // Generate archetype suggestions
  const archetypeSuggestions = useMemo(() => {
    return archetypes
      .slice(0, maxSuggestions)
      .map(archetype => ({
        id: archetype.id,
        label: archetype.label,
        type: 'archetype' as const,
        score: archetype.metadata?.influence_score
      }));
  }, [archetypes, maxSuggestions]);

  // Combine all suggestions
  const allSuggestions = useMemo(() => {
    return [
      ...trendingSuggestions,
      ...keywordSuggestions,
      ...archetypeSuggestions
    ];
  }, [trendingSuggestions, keywordSuggestions, archetypeSuggestions]);

  // Simulate async loading for more complex suggestion generation
  useEffect(() => {
    if (archetypes.length === 0) return;

    setLoading(true);
    setError(null);

    // Simulate processing time for trend analysis
    const timer = setTimeout(() => {
      try {
        // Here you could add more complex suggestion logic
        // like analyzing search patterns, popularity trends, etc.
        setLoading(false);
      } catch (err) {
        setError(err as Error);
        setLoading(false);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [archetypes]);

  return {
    suggestions: allSuggestions,
    trendingSuggestions,
    loading,
    error
  };
};

export default useSearchSuggestions;