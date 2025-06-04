/**
 * API Hooks
 * 
 * Custom hooks for data fetching with loading, error, and success states
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient, ApiClientError, ApiResponse, PaginatedResponse, GetArchetypesParams } from '@/lib/api-client';
import { ArchetypeEdge } from '@/types/graph';
import { ArchetypeNode } from '@/types/archetype';
import { useArchetypeStore } from '@/stores/archetypeStore';

// Generic API State Interface
export interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  success: boolean;
}

// Hook Options Interface
export interface UseApiOptions {
  immediate?: boolean; // Whether to fetch immediately on mount
  onSuccess?: (data: any) => void;
  onError?: (error: ApiClientError) => void;
  retryCount?: number;
  retryDelay?: number;
}

/**
 * Generic API hook for any API call
 */
export function useApi<T>(
  apiCall: () => Promise<ApiResponse<T>>,
  options: UseApiOptions = {}
) {
  const {
    immediate = true,
    onSuccess,
    onError,
    retryCount = 0,
    retryDelay = 1000,
  } = options;

  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
    success: false,
  });

  const retryCountRef = useRef(0);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const execute = useCallback(async () => {
    if (!mountedRef.current) return;

    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      success: false,
    }));

    try {
      const response = await apiCall();
      
      if (!mountedRef.current) return;

      setState({
        data: response.data,
        loading: false,
        error: null,
        success: true,
      });

      retryCountRef.current = 0;
      onSuccess?.(response.data);
    } catch (error) {
      if (!mountedRef.current) return;

      const apiError = error instanceof ApiClientError ? error : new ApiClientError((error as Error)?.message || 'Unknown error');
      
      // Retry logic
      if (retryCountRef.current < retryCount) {
        retryCountRef.current++;
        setTimeout(() => {
          if (mountedRef.current) {
            execute();
          }
        }, retryDelay);
        return;
      }

      setState({
        data: null,
        loading: false,
        error: apiError.message,
        success: false,
      });

      onError?.(apiError);
    }
  }, [apiCall, onSuccess, onError, retryCount, retryDelay]);

  // Execute immediately if requested
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      success: false,
    });
    retryCountRef.current = 0;
  }, []);

  return {
    ...state,
    execute,
    reset,
    retry: execute,
  };
}

/**
 * Hook for fetching archetypes with pagination and filtering
 */
export function useArchetypes(params?: GetArchetypesParams, options?: UseApiOptions) {
  const { setArchetypes, setLoading, setError } = useArchetypeStore();

  return useApi(
    () => apiClient.getArchetypes(params),
    {
      ...options,
      onSuccess: (data: PaginatedResponse<ArchetypeNode>) => {
        setArchetypes(data.data);
        setLoading(false);
        options?.onSuccess?.(data);
      },
      onError: (error) => {
        setError(error.message);
        setLoading(false);
        options?.onError?.(error);
      },
    }
  );
}

/**
 * Hook for fetching a single archetype
 */
export function useArchetype(id: string, options?: UseApiOptions) {
  const { updateArchetype } = useArchetypeStore();

  return useApi(
    () => apiClient.getArchetype(id),
    {
      immediate: !!id,
      ...options,
      onSuccess: (data: ArchetypeNode) => {
        updateArchetype(data);
        options?.onSuccess?.(data);
      },
    }
  );
}

/**
 * Hook for creating a new archetype
 */
export function useCreateArchetype(options?: UseApiOptions) {
  const { addArchetype } = useArchetypeStore();

  const { ...state } = useApi(
    () => Promise.resolve({ data: null, success: true }), // Placeholder
    {
      immediate: false,
      ...options,
    }
  );

  const createArchetype = useCallback(async (data: any) => {
    try {
      const response = await apiClient.createArchetype(data);
      addArchetype(response.data);
      options?.onSuccess?.(response.data);
      return response;
    } catch (error) {
      const apiError = error instanceof ApiClientError ? error : new ApiClientError((error as Error)?.message || 'Unknown error');
      options?.onError?.(apiError);
      throw apiError;
    }
  }, [addArchetype, options]);

  return {
    ...state,
    createArchetype,
  };
}

/**
 * Hook for updating an archetype
 */
export function useUpdateArchetype(options?: UseApiOptions) {
  const { updateArchetype } = useArchetypeStore();

  const updateArchetypeData = useCallback(async (data: any) => {
    try {
      const response = await apiClient.updateArchetype(data);
      updateArchetype(response.data);
      options?.onSuccess?.(response.data);
      return response;
    } catch (error) {
      const apiError = error instanceof ApiClientError ? error : new ApiClientError((error as Error)?.message || 'Unknown error');
      options?.onError?.(apiError);
      throw apiError;
    }
  }, [updateArchetype, options]);

  return {
    updateArchetype: updateArchetypeData,
  };
}

/**
 * Hook for deleting an archetype
 */
export function useDeleteArchetype(options?: UseApiOptions) {
  const { removeArchetype } = useArchetypeStore();

  const deleteArchetype = useCallback(async (id: string) => {
    try {
      await apiClient.deleteArchetype(id);
      removeArchetype(id);
      options?.onSuccess?.(id);
    } catch (error) {
      const apiError = error instanceof ApiClientError ? error : new ApiClientError((error as Error)?.message || 'Unknown error');
      options?.onError?.(apiError);
      throw apiError;
    }
  }, [removeArchetype, options]);

  return {
    deleteArchetype,
  };
}

/**
 * Hook for fetching archetype relationships
 */
export function useArchetypeRelationships(options?: UseApiOptions) {
  const { setEdges } = useArchetypeStore();

  return useApi(
    () => apiClient.getArchetypeRelationships(),
    {
      ...options,
      onSuccess: (data: ArchetypeEdge[]) => {
        setEdges(data);
        options?.onSuccess?.(data);
      },
    }
  );
}

/**
 * Hook for fetching trending archetypes
 */
export function useTrendingArchetypes(limit?: number, options?: UseApiOptions) {
  return useApi(
    () => apiClient.getTrendingArchetypes(limit),
    options
  );
}

/**
 * Hook for searching archetypes
 */
export function useSearchArchetypes(query: string, limit?: number, options?: UseApiOptions) {
  return useApi(
    () => apiClient.searchArchetypes(query, limit),
    {
      immediate: !!query,
      ...options,
    }
  );
}

/**
 * Hook for managing multiple API calls with combined loading state
 */
export function useMultipleApi<T extends Record<string, any>>(
  apiCalls: { [K in keyof T]: () => Promise<ApiResponse<T[K]>> },
  options?: UseApiOptions
) {
  const [states, setStates] = useState<{ [K in keyof T]: ApiState<T[K]> }>(() => {
    const initialStates = {} as { [K in keyof T]: ApiState<T[K]> };
    Object.keys(apiCalls).forEach(key => {
      initialStates[key as keyof T] = {
        data: null,
        loading: false,
        error: null,
        success: false,
      };
    });
    return initialStates;
  });

  const execute = useCallback(async () => {
    // Set all to loading
    setStates(prev => {
      const newStates = { ...prev };
      Object.keys(apiCalls).forEach(key => {
        newStates[key as keyof T] = {
          ...prev[key as keyof T],
          loading: true,
          error: null,
        };
      });
      return newStates;
    });

    try {
      const promises = Object.entries(apiCalls).map(async ([key, apiCall]) => {
        try {
          const response = await (apiCall as () => Promise<ApiResponse<any>>)();
          return { key, data: response.data, error: null };
        } catch (error) {
          const apiError = error instanceof ApiClientError ? error : new ApiClientError((error as Error)?.message || 'Unknown error');
          return { key, data: null, error: apiError.message };
        }
      });

      const results = await Promise.all(promises);

      setStates(prev => {
        const newStates = { ...prev };
        results.forEach(({ key, data, error }) => {
          newStates[key as keyof T] = {
            data,
            loading: false,
            error,
            success: !error,
          };
        });
        return newStates;
      });

      const hasErrors = results.some(r => r.error);
      if (!hasErrors) {
        const combinedData = {} as T;
        results.forEach(({ key, data }) => {
          combinedData[key as keyof T] = data;
        });
        options?.onSuccess?.(combinedData);
      } else {
        const firstError = results.find(r => r.error)?.error;
        options?.onError?.(new ApiClientError(firstError || 'Multiple API calls failed'));
      }
    } catch (error) {
      const apiError = error instanceof ApiClientError ? error : new ApiClientError((error as Error)?.message || 'Unknown error');
      options?.onError?.(apiError);
    }
  }, [apiCalls, options]);

  useEffect(() => {
    if (options?.immediate !== false) {
      execute();
    }
  }, [execute, options?.immediate]);

  const loading = Object.values(states).some(state => state.loading);
  const hasErrors = Object.values(states).some(state => state.error);
  const allSuccess = Object.values(states).every(state => state.success);

  return {
    states,
    loading,
    hasErrors,
    allSuccess,
    execute,
  };
} 