/**
 * Custom hook for archetype data management
 * 
 * Handles fetching, caching, and synchronizing archetype data with the backend API
 */

import { useEffect, useCallback } from 'react';
import { useArchetypeStore } from '@/stores/archetypeStore';
import { ArchetypeNode } from '@/types/archetype';

const API_BASE_URL = '/api';

export const useArchetypeData = () => {
  const {
    archetypes,
    isLoading,
    error,
    setArchetypes,
    setLoading,
    setError,
    addArchetype,
    updateArchetype,
    removeArchetype,
  } = useArchetypeStore();

  // Fetch all archetypes
  const fetchArchetypes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/archetypes`);
      if (!response.ok) {
        throw new Error(`Failed to fetch archetypes: ${response.statusText}`);
      }
      
      const data = await response.json();
      setArchetypes(data.data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch archetypes';
      setError(errorMessage);
      console.error('Error fetching archetypes:', err);
    } finally {
      setLoading(false);
    }
  }, [setArchetypes, setLoading, setError]);

  // Fetch trending archetypes
  const fetchTrendingArchetypes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/archetypes/trending`);
      if (!response.ok) {
        throw new Error(`Failed to fetch trending archetypes: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.data || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch trending archetypes';
      setError(errorMessage);
      console.error('Error fetching trending archetypes:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  // Search archetypes
  const searchArchetypes = useCallback(async (query: string, filters?: any) => {
    try {
      setLoading(true);
      setError(null);
      
      const searchParams = new URLSearchParams();
      if (query) searchParams.append('q', query);
      if (filters?.platforms?.length) {
        searchParams.append('platforms', filters.platforms.join(','));
      }
      if (filters?.limit) searchParams.append('limit', filters.limit.toString());
      
      const response = await fetch(`${API_BASE_URL}/archetypes/search?${searchParams}`);
      if (!response.ok) {
        throw new Error(`Failed to search archetypes: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.data || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search archetypes';
      setError(errorMessage);
      console.error('Error searching archetypes:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  // Create new archetype
  const createArchetype = useCallback(async (archetypeData: Omit<ArchetypeNode, 'id'>) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/archetypes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(archetypeData),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create archetype: ${response.statusText}`);
      }
      
      const data = await response.json();
      const newArchetype = data.data;
      addArchetype(newArchetype);
      return newArchetype;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create archetype';
      setError(errorMessage);
      console.error('Error creating archetype:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [addArchetype, setLoading, setError]);

  // Update existing archetype
  const updateArchetypeData = useCallback(async (id: string, updates: Partial<ArchetypeNode>) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/archetypes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update archetype: ${response.statusText}`);
      }
      
      const data = await response.json();
      const updatedArchetype = data.data;
      updateArchetype(updatedArchetype);
      return updatedArchetype;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update archetype';
      setError(errorMessage);
      console.error('Error updating archetype:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [updateArchetype, setLoading, setError]);

  // Delete archetype
  const deleteArchetype = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/archetypes/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete archetype: ${response.statusText}`);
      }
      
      removeArchetype(id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete archetype';
      setError(errorMessage);
      console.error('Error deleting archetype:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [removeArchetype, setLoading, setError]);

  // Load initial data on mount
  useEffect(() => {
    if (archetypes.length === 0) {
      fetchArchetypes();
    }
  }, [fetchArchetypes, archetypes.length]);

  return {
    // Data
    archetypes,
    isLoading,
    error,
    
    // Actions
    fetchArchetypes,
    fetchTrendingArchetypes,
    searchArchetypes,
    createArchetype,
    updateArchetype: updateArchetypeData,
    deleteArchetype,
    
    // Utilities
    refetch: fetchArchetypes,
  };
}; 