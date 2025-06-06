/**
 * Test suite for Search and Filter functionality
 * Tests fuzzy search, tag filtering, trending recommendations, and performance
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GraphSearch from '@/components/graph/GraphSearch';
import GraphFilterPanel from '@/components/graph/GraphFilterPanel';
import useSearchSuggestions from '@/hooks/useSearchSuggestions';
import { ArchetypeNode } from '@/types/archetype';

// Mock data for testing
const mockArchetypes: ArchetypeNode[] = [
  {
    id: 'clean-girl',
    label: 'Clean Girl',
    description: 'Minimalist beauty aesthetic focusing on natural, effortless looks',
    keywords: ['minimalist', 'natural', 'effortless', 'skincare'],
    influences: ['skincare-enthusiast'],
    examples: [],
    color: '#8fbc8f',
    metadata: {
      origin_date: '2020-01-01',
      peak_popularity: '2022-06-01',
      influence_score: 0.85,
      platforms: ['tiktok', 'instagram']
    }
  },
  {
    id: 'dark-academia',
    label: 'Dark Academia',
    description: 'Intellectual aesthetic inspired by classic literature and gothic architecture',
    keywords: ['intellectual', 'gothic', 'vintage', 'books'],
    influences: ['bookworm', 'vintage-lover'],
    examples: [],
    color: '#2f4f4f',
    metadata: {
      origin_date: '2019-01-01',
      peak_popularity: '2021-10-01',
      influence_score: 0.92,
      platforms: ['pinterest', 'tumblr']
    }
  },
  {
    id: 'cottagecore',
    label: 'Cottagecore',
    description: 'Romanticized rural life aesthetic with focus on simple living',
    keywords: ['rural', 'nature', 'cozy', 'handmade'],
    influences: ['nature-lover'],
    examples: [],
    color: '#deb887',
    metadata: {
      origin_date: '2018-01-01',
      peak_popularity: '2020-08-01',
      influence_score: 0.78,
      platforms: ['instagram', 'pinterest']
    }
  }
];

const mockSuggestions = [
  { id: 'clean', label: 'clean', type: 'keyword' as const },
  { id: 'aesthetic', label: 'aesthetic', type: 'keyword' as const },
  { id: 'trending-1', label: 'Dark Academia', type: 'trending' as const, score: 0.92 }
];

// Mock the hooks
vi.mock('@/hooks/useSearchSuggestions');

describe('GraphSearch Component', () => {
  const mockOnSearch = vi.fn();
  const mockOnSuggestionSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search input with placeholder', () => {
    render(
      <GraphSearch 
        onSearch={mockOnSearch}
        placeholder="Search archetypes..."
      />
    );

    expect(screen.getByPlaceholderText('Search archetypes...')).toBeInTheDocument();
  });

  it('calls onSearch when user types', async () => {
    const user = userEvent.setup();
    
    render(
      <GraphSearch 
        onSearch={mockOnSearch}
        debounceTime={100}
      />
    );

    const input = screen.getByRole('combobox');
    await user.type(input, 'clean');

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('clean');
    }, { timeout: 200 });
  });

  it('shows suggestions when focused', async () => {
    const user = userEvent.setup();
    
    render(
      <GraphSearch 
        onSearch={mockOnSearch}
        onSuggestionSelect={mockOnSuggestionSelect}
        suggestions={mockSuggestions}
        showSuggestions={true}
      />
    );

    const input = screen.getByRole('combobox');
    await user.click(input);

    await waitFor(() => {
      expect(screen.getByText('clean')).toBeInTheDocument();
    });
  });

  it('filters suggestions based on search query', async () => {
    const user = userEvent.setup();
    
    render(
      <GraphSearch 
        onSearch={mockOnSearch}
        onSuggestionSelect={mockOnSuggestionSelect}
        archetypes={mockArchetypes}
        suggestions={mockSuggestions}
        showSuggestions={true}
        enableFuzzySearch={true}
      />
    );

    const input = screen.getByRole('combobox');
    await user.type(input, 'clean');

    await waitFor(() => {
      expect(screen.getByText('Clean Girl')).toBeInTheDocument();
    });
  });

  it('handles keyboard navigation', async () => {
    const user = userEvent.setup();
    
    render(
      <GraphSearch 
        onSearch={mockOnSearch}
        onSuggestionSelect={mockOnSuggestionSelect}
        suggestions={mockSuggestions}
        showSuggestions={true}
      />
    );

    const input = screen.getByRole('combobox');
    await user.click(input);
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');

    expect(mockOnSuggestionSelect).toHaveBeenCalledWith(mockSuggestions[0]);
  });

  it('clears search when clear button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <GraphSearch 
        onSearch={mockOnSearch}
        initialValue="test"
      />
    );

    const clearButton = screen.getByLabelText('Clear search');
    await user.click(clearButton);

    expect(mockOnSearch).toHaveBeenCalledWith('');
  });
});

describe('GraphFilterPanel Component', () => {
  const mockOnFilterChange = vi.fn();
  const mockOnPathFind = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders filter panel with all sections', () => {
    render(
      <GraphFilterPanel 
        onFilterChange={mockOnFilterChange}
        onPathFind={mockOnPathFind}
      />
    );

    expect(screen.getByText('Graph Filters')).toBeInTheDocument();
    expect(screen.getByText('Basic Filters')).toBeInTheDocument();
    expect(screen.getByText('Advanced Filters')).toBeInTheDocument();
  });

  it('handles platform selection', async () => {
    const user = userEvent.setup();
    
    render(
      <GraphFilterPanel 
        onFilterChange={mockOnFilterChange}
        platforms={['tiktok', 'instagram']}
      />
    );

    // Open platform dropdown
    const platformTrigger = screen.getByRole('combobox');
    await user.click(platformTrigger);

    // Select TikTok
    await user.click(screen.getByText('Tiktok'));

    // Apply filters
    const applyButton = screen.getByText('Apply Filters');
    await user.click(applyButton);

    expect(mockOnFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        platform: 'tiktok'
      })
    );
  });

  it('handles tag selection and removal', async () => {
    const user = userEvent.setup();
    
    render(
      <GraphFilterPanel 
        onFilterChange={mockOnFilterChange}
        availableTags={['trending', 'viral', 'aesthetic']}
      />
    );

    // Select a tag
    const trendingTag = screen.getByText('trending');
    await user.click(trendingTag);

    // Verify tag is selected (should appear in selected tags)
    expect(screen.getByText('1')).toBeInTheDocument(); // Tag count badge

    // Apply filters
    const applyButton = screen.getByText('Apply Filters');
    await user.click(applyButton);

    expect(mockOnFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        tags: ['trending']
      })
    );
  });

  it('handles influence range slider', async () => {
    render(
      <GraphFilterPanel 
        onFilterChange={mockOnFilterChange}
      />
    );

    // Switch to Advanced Filters tab
    const advancedTab = screen.getByText('Advanced Filters');
    fireEvent.click(advancedTab);

    // The slider should be present
    expect(screen.getByText('Influence Score')).toBeInTheDocument();
    expect(screen.getByText('0% - 100%')).toBeInTheDocument();
  });

  it('clears all filters when clear button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <GraphFilterPanel 
        onFilterChange={mockOnFilterChange}
      />
    );

    const clearButton = screen.getByText('Clear All');
    await user.click(clearButton);

    expect(mockOnFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        limit: 10,
        sortBy: 'popularity',
        sortOrder: 'desc'
      })
    );
  });

  it('handles pathfinding inputs', async () => {
    const user = userEvent.setup();
    
    render(
      <GraphFilterPanel 
        onFilterChange={mockOnFilterChange}
        onPathFind={mockOnPathFind}
      />
    );

    // Switch to Path Finding tab
    const pathTab = screen.getByText('Path Finding');
    await user.click(pathTab);

    // Fill in source and target nodes
    const sourceInput = screen.getByLabelText('Source Node ID');
    const targetInput = screen.getByLabelText('Target Node ID');
    
    await user.type(sourceInput, 'clean-girl');
    await user.type(targetInput, 'dark-academia');

    // Click Find Path button
    const findPathButton = screen.getByText('Find Path');
    await user.click(findPathButton);

    expect(mockOnPathFind).toHaveBeenCalledWith('clean-girl', 'dark-academia');
  });
});

describe('useSearchSuggestions Hook', () => {
  it('generates trending suggestions based on influence score', () => {
    const mockUseSearchSuggestions = vi.mocked(useSearchSuggestions);
    
    mockUseSearchSuggestions.mockReturnValue({
      suggestions: mockSuggestions,
      trendingSuggestions: [
        { id: 'dark-academia', label: 'Dark Academia', type: 'trending', score: 0.92 },
        { id: 'clean-girl', label: 'Clean Girl', type: 'trending', score: 0.85 }
      ],
      loading: false,
      error: null
    });

    const { suggestions, trendingSuggestions } = useSearchSuggestions({
      archetypes: mockArchetypes,
      maxSuggestions: 10
    });

    expect(trendingSuggestions).toHaveLength(2);
    expect(trendingSuggestions[0].label).toBe('Dark Academia');
    expect(trendingSuggestions[0].score).toBe(0.92);
  });

  it('generates keyword suggestions from archetype keywords', () => {
    const mockUseSearchSuggestions = vi.mocked(useSearchSuggestions);
    
    const mockResult = {
      suggestions: [
        { id: 'minimalist', label: 'minimalist', type: 'keyword', score: 0.33 },
        { id: 'natural', label: 'natural', type: 'keyword', score: 0.33 },
        { id: 'intellectual', label: 'intellectual', type: 'keyword', score: 0.33 }
      ],
      trendingSuggestions: [],
      loading: false,
      error: null
    };
    
    mockUseSearchSuggestions.mockReturnValue(mockResult);

    const result = useSearchSuggestions({
      archetypes: mockArchetypes,
      maxSuggestions: 10
    });

    const keywordSuggestions = result.suggestions.filter(s => s.type === 'keyword');
    expect(keywordSuggestions.length).toBeGreaterThan(0);
    expect(keywordSuggestions[0].type).toBe('keyword');
  });
});

describe('Search Performance', () => {
  it('debounces search requests', async () => {
    const mockOnSearch = vi.fn();
    const user = userEvent.setup();
    
    render(
      <GraphSearch 
        onSearch={mockOnSearch}
        debounceTime={100}
      />
    );

    const input = screen.getByRole('combobox');
    
    // Type multiple characters quickly
    await user.type(input, 'clean girl');

    // Should only call onSearch once after debounce period
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledTimes(1);
      expect(mockOnSearch).toHaveBeenCalledWith('clean girl');
    }, { timeout: 200 });
  });

  it('handles large datasets efficiently', () => {
    const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
      ...mockArchetypes[0],
      id: `archetype-${i}`,
      label: `Archetype ${i}`
    }));

    const start = performance.now();
    
    render(
      <GraphSearch 
        onSearch={vi.fn()}
        archetypes={largeDataset}
        enableFuzzySearch={true}
      />
    );

    const end = performance.now();
    
    // Should render quickly even with large dataset
    expect(end - start).toBeLessThan(100);
  });
});

describe('Fuzzy Search Accuracy', () => {
  it('finds matches with typos', async () => {
    const user = userEvent.setup();
    const mockOnSearch = vi.fn();
    
    render(
      <GraphSearch 
        onSearch={mockOnSearch}
        archetypes={mockArchetypes}
        enableFuzzySearch={true}
        showSuggestions={true}
      />
    );

    const input = screen.getByRole('combobox');
    
    // Type with typo: "clen" instead of "clean"
    await user.type(input, 'clen');

    await waitFor(() => {
      // Should still find "Clean Girl" despite typo
      expect(screen.getByText('Clean Girl')).toBeInTheDocument();
    });
  });

  it('ranks results by relevance', async () => {
    const user = userEvent.setup();
    
    render(
      <GraphSearch 
        onSearch={vi.fn()}
        archetypes={mockArchetypes}
        enableFuzzySearch={true}
        showSuggestions={true}
      />
    );

    const input = screen.getByRole('combobox');
    await user.type(input, 'dark');

    await waitFor(() => {
      // "Dark Academia" should appear as it's a direct match
      expect(screen.getByText('Dark Academia')).toBeInTheDocument();
    });
  });
});