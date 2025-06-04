/**
 * Zustand Store for Archetype Management
 * 
 * This store manages the global state for archetypes, search, and UI state
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { ArchetypeNode, SearchFilters, DateRange } from '@/types/archetype';
import { ArchetypeEdge } from '@/types/graph';

interface ArchetypeStore {
  // Data state
  archetypes: ArchetypeNode[];
  edges: ArchetypeEdge[];
  selectedArchetype: string | null;
  searchFilters: SearchFilters;
  timelineFilter: DateRange | null;
  isLoading: boolean;
  error: string | null;

  // UI state
  sidebarOpen: boolean;
  viewMode: 'graph' | 'list' | 'timeline';
  
  // Actions
  setArchetypes: (archetypes: ArchetypeNode[]) => void;
  addArchetype: (archetype: ArchetypeNode) => void;
  updateArchetype: (archetype: ArchetypeNode) => void;
  removeArchetype: (id: string) => void;
  
  setEdges: (edges: ArchetypeEdge[]) => void;
  addEdge: (edge: ArchetypeEdge) => void;
  removeEdge: (id: string) => void;
  
  setSelectedArchetype: (id: string | null) => void;
  setSearchFilters: (filters: Partial<SearchFilters>) => void;
  setTimelineFilter: (range: DateRange | null) => void;
  
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  setSidebarOpen: (open: boolean) => void;
  setViewMode: (mode: 'graph' | 'list' | 'timeline') => void;
  
  // Computed getters
  getFilteredArchetypes: () => ArchetypeNode[];
  getArchetypeById: (id: string) => ArchetypeNode | undefined;
  getRelatedArchetypes: (id: string) => ArchetypeNode[];
}

export const useArchetypeStore = create<ArchetypeStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      archetypes: [],
      edges: [],
      selectedArchetype: null,
      searchFilters: {
        query: '',
        platforms: [],
      },
      timelineFilter: null,
      isLoading: false,
      error: null,
      sidebarOpen: true,
      viewMode: 'graph',

      // Actions
      setArchetypes: (archetypes) => 
        set({ archetypes }, false, 'setArchetypes'),

      addArchetype: (archetype) =>
        set(
          (state) => ({ archetypes: [...state.archetypes, archetype] }),
          false,
          'addArchetype'
        ),

      updateArchetype: (updatedArchetype) =>
        set(
          (state) => ({
            archetypes: state.archetypes.map((archetype) =>
              archetype.id === updatedArchetype.id ? updatedArchetype : archetype
            ),
          }),
          false,
          'updateArchetype'
        ),

      removeArchetype: (id) =>
        set(
          (state) => ({
            archetypes: state.archetypes.filter((archetype) => archetype.id !== id),
            selectedArchetype: state.selectedArchetype === id ? null : state.selectedArchetype,
          }),
          false,
          'removeArchetype'
        ),

      setEdges: (edges) =>
        set({ edges }, false, 'setEdges'),

      addEdge: (edge) =>
        set(
          (state) => ({ edges: [...state.edges, edge] }),
          false,
          'addEdge'
        ),

      removeEdge: (id) =>
        set(
          (state) => ({ edges: state.edges.filter((edge) => edge.id !== id) }),
          false,
          'removeEdge'
        ),

      setSelectedArchetype: (id) =>
        set({ selectedArchetype: id }, false, 'setSelectedArchetype'),

      setSearchFilters: (filters) =>
        set(
          (state) => ({ searchFilters: { ...state.searchFilters, ...filters } }),
          false,
          'setSearchFilters'
        ),

      setTimelineFilter: (range) =>
        set({ timelineFilter: range }, false, 'setTimelineFilter'),

      setLoading: (loading) =>
        set({ isLoading: loading }, false, 'setLoading'),

      setError: (error) =>
        set({ error }, false, 'setError'),

      setSidebarOpen: (open) =>
        set({ sidebarOpen: open }, false, 'setSidebarOpen'),

      setViewMode: (mode) =>
        set({ viewMode: mode }, false, 'setViewMode'),

      // Computed getters
      getFilteredArchetypes: () => {
        const { archetypes, searchFilters, timelineFilter } = get();
        
        return archetypes.filter((archetype) => {
          // Text search
          if (searchFilters.query) {
            const query = searchFilters.query.toLowerCase();
            const matchesText = 
              archetype.label.toLowerCase().includes(query) ||
              archetype.description.toLowerCase().includes(query) ||
              archetype.keywords.some(keyword => keyword.toLowerCase().includes(query));
            
            if (!matchesText) return false;
          }

          // Platform filter
          if (searchFilters.platforms.length > 0) {
            const hasMatchingPlatform = searchFilters.platforms.some(platform =>
              archetype.metadata.platforms.includes(platform)
            );
            if (!hasMatchingPlatform) return false;
          }

          // Influence score filter
          if (searchFilters.influenceScore) {
            const score = archetype.metadata.influence_score;
            if (score < searchFilters.influenceScore.min || score > searchFilters.influenceScore.max) {
              return false;
            }
          }

          // Timeline filter
          if (timelineFilter && archetype.metadata.origin_date) {
            const originDate = new Date(archetype.metadata.origin_date);
            if (originDate < timelineFilter.start || originDate > timelineFilter.end) {
              return false;
            }
          }

          return true;
        });
      },

      getArchetypeById: (id) => {
        return get().archetypes.find((archetype) => archetype.id === id);
      },

      getRelatedArchetypes: (id) => {
        const { archetypes } = get();
        const archetype = archetypes.find((a) => a.id === id);
        
        if (!archetype) return [];
        
        return archetypes.filter((a) => 
          archetype.influences.includes(a.id) || a.influences.includes(id)
        );
      },
    }),
    {
      name: 'archetype-store',
    }
  )
); 