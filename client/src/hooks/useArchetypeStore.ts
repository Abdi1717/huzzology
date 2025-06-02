/**
 * Zustand store for archetype management in Huzzology
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { ArchetypeNode } from '@huzzology/shared';

interface DateRange {
  start: Date;
  end: Date;
}

interface ArchetypeStore {
  // State
  archetypes: ArchetypeNode[];
  selectedArchetype: string | null;
  timelineFilter: DateRange | null;
  searchQuery: string;
  isLoading: boolean;
  error: string | null;

  // Actions
  setArchetypes: (archetypes: ArchetypeNode[]) => void;
  addArchetype: (archetype: ArchetypeNode) => void;
  updateArchetype: (id: string, updates: Partial<ArchetypeNode>) => void;
  removeArchetype: (id: string) => void;
  setSelectedArchetype: (id: string | null) => void;
  setTimelineFilter: (filter: DateRange | null) => void;
  setSearchQuery: (query: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  // Computed
  filteredArchetypes: () => ArchetypeNode[];
  getArchetypeById: (id: string) => ArchetypeNode | undefined;
}

export const useArchetypeStore = create<ArchetypeStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      archetypes: [],
      selectedArchetype: null,
      timelineFilter: null,
      searchQuery: '',
      isLoading: false,
      error: null,

      // Actions
      setArchetypes: (archetypes) =>
        set({ archetypes }, false, 'setArchetypes'),

      addArchetype: (archetype) =>
        set(
          (state) => ({ archetypes: [...state.archetypes, archetype] }),
          false,
          'addArchetype'
        ),

      updateArchetype: (id, updates) =>
        set(
          (state) => ({
            archetypes: state.archetypes.map((archetype) =>
              archetype.id === id ? { ...archetype, ...updates } : archetype
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

      setSelectedArchetype: (id) =>
        set({ selectedArchetype: id }, false, 'setSelectedArchetype'),

      setTimelineFilter: (filter) =>
        set({ timelineFilter: filter }, false, 'setTimelineFilter'),

      setSearchQuery: (query) =>
        set({ searchQuery: query }, false, 'setSearchQuery'),

      setLoading: (loading) =>
        set({ isLoading: loading }, false, 'setLoading'),

      setError: (error) =>
        set({ error }, false, 'setError'),

      clearError: () =>
        set({ error: null }, false, 'clearError'),

      // Computed values
      filteredArchetypes: () => {
        const { archetypes, searchQuery, timelineFilter } = get();
        
        return archetypes.filter((archetype) => {
          // Search filter
          if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchesLabel = archetype.label.toLowerCase().includes(query);
            const matchesKeywords = archetype.keywords.some((keyword) =>
              keyword.toLowerCase().includes(query)
            );
            const matchesDescription = archetype.description.toLowerCase().includes(query);
            
            if (!matchesLabel && !matchesKeywords && !matchesDescription) {
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
    }),
    {
      name: 'archetype-store',
    }
  )
); 