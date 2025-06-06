import { useState, useEffect, useCallback, useRef } from 'react';
import { ArchetypeNode, Edge } from '@/types/graph';
import { apiClient } from '@/lib/api-client';

export interface GraphDataOptions {
  page?: number;
  limit?: number;
  search?: string;
  platform?: string;
  category?: string;
  tags?: string[];
  sortBy?: 'popularity' | 'recent' | 'alphabetical';
  sortOrder?: 'asc' | 'desc';
  startDate?: string;
  endDate?: string;
  trending?: boolean;
  influenceMin?: number;
  influenceMax?: number;
}

export interface GraphDataStats {
  totalNodes: number;
  totalEdges: number;
  currentPage: number;
  totalPages: number;
  loadTime: number;
}

export interface GraphData {
  nodes: ArchetypeNode[];
  edges: Edge[];
  stats: GraphDataStats;
}

const CACHE_EXPIRY_TIME = 5 * 60 * 1000; // 5 minutes

// Cache structure
interface CacheEntry {
  data: GraphData;
  timestamp: number;
  cacheKey: string;
}

// Create a global cache to persist between hook instances
const globalCache = new Map<string, CacheEntry>();

/**
 * Hook for fetching graph data from the API with caching, batched loading,
 * and optimized memory usage for large datasets
 */
export default function useGraphData(initialOptions: GraphDataOptions = {}) {
  // State for graph data
  const [data, setData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [options, setOptions] = useState<GraphDataOptions>(initialOptions);
  
  // Refs for tracking state across renders
  const currentRequestId = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const pageRef = useRef<number>(initialOptions.page || 1);
  
  // Generate a cache key from options
  const generateCacheKey = useCallback((opts: GraphDataOptions): string => {
    return Object.entries(opts)
      .filter(([_, value]) => value !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join('|');
  }, []);
  
  // Check if cache is valid
  const isCacheValid = useCallback((cacheEntry: CacheEntry | undefined): boolean => {
    if (!cacheEntry) return false;
    const now = Date.now();
    return now - cacheEntry.timestamp < CACHE_EXPIRY_TIME;
  }, []);
  
  // Merge new data with existing data
  const mergeGraphData = useCallback((existingData: GraphData | null, newData: GraphData): GraphData => {
    if (!existingData) return newData;
    
    // Create a map of existing nodes by ID for fast lookup
    const existingNodesMap = new Map(existingData.nodes.map(node => [node.id, node]));
    
    // Add new nodes, replacing any with the same ID
    const mergedNodes = [...existingData.nodes];
    for (const newNode of newData.nodes) {
      if (existingNodesMap.has(newNode.id)) {
        // Replace existing node
        const index = mergedNodes.findIndex(node => node.id === newNode.id);
        if (index !== -1) {
          mergedNodes[index] = newNode;
        }
      } else {
        // Add new node
        mergedNodes.push(newNode);
      }
    }
    
    // Create a map of existing edges by ID
    const existingEdgesMap = new Map(existingData.edges.map(edge => [edge.id, edge]));
    
    // Add new edges, replacing any with the same ID
    const mergedEdges = [...existingData.edges];
    for (const newEdge of newData.edges) {
      if (existingEdgesMap.has(newEdge.id)) {
        // Replace existing edge
        const index = mergedEdges.findIndex(edge => edge.id === newEdge.id);
        if (index !== -1) {
          mergedEdges[index] = newEdge;
        }
      } else {
        // Add new edge
        mergedEdges.push(newEdge);
      }
    }
    
    return {
      nodes: mergedNodes,
      edges: mergedEdges,
      stats: newData.stats,
    };
  }, []);
  
  // Fetch data from API
  const fetchDataFromApi = useCallback(async (
    opts: GraphDataOptions, 
    append: boolean = false,
    abortController?: AbortController
  ): Promise<GraphData> => {
    const requestId = Math.random().toString(36).substring(2);
    currentRequestId.current = requestId;
    
    try {
      setLoading(true);
      setError(null);
      setLoadingProgress(0);
      
      // If we're appending, we need to fetch the next page
      const fetchOptions = append ? { ...opts, page: pageRef.current + 1 } : opts;
      
      // Generate cache key
      const cacheKey = generateCacheKey(fetchOptions);
      
      // Check if we have a valid cache entry
      const cacheEntry = globalCache.get(cacheKey);
      if (isCacheValid(cacheEntry)) {
        setLoadingProgress(100);
        
        // Only return cache if we're still on the same request
        // This prevents race conditions with multiple requests
        if (currentRequestId.current === requestId) {
          return cacheEntry!.data;
        }
      }
      
      // Prepare for progress tracking
      const progressIntervals = [10, 25, 40, 60, 80, 90, 95];
      let currentIntervalIndex = 0;
      const progressInterval = setInterval(() => {
        if (currentIntervalIndex < progressIntervals.length) {
          setLoadingProgress(progressIntervals[currentIntervalIndex]);
          currentIntervalIndex++;
        }
      }, 150);
      
      // Initialize fetch signal
      const signal = abortController?.signal;
      
      // Fetch data with a timeout
      const fetchPromise = apiClient.fetchGraphData(fetchOptions, signal);
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out')), 30000);
      });
      
      // Race the fetch with a timeout
      const result = await Promise.race([fetchPromise, timeoutPromise]) as GraphData;
      
      // Clear the progress interval
      clearInterval(progressInterval);
      setLoadingProgress(100);
      
      // Cache the result
      globalCache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
        cacheKey
      });
      
      // Update page reference if we're appending
      if (append) {
        pageRef.current += 1;
      } else {
        pageRef.current = fetchOptions.page || 1;
      }
      
      // Only return data if we're still on the same request
      if (currentRequestId.current === requestId) {
        return result;
      } else {
        throw new Error('Request superseded by newer request');
      }
    } catch (err: any) {
      // Only set error if we're still on the same request
      if (currentRequestId.current === requestId) {
        setError(err);
      }
      throw err;
    } finally {
      // Only update loading state if we're still on the same request
      if (currentRequestId.current === requestId) {
        setLoading(false);
      }
    }
  }, [generateCacheKey, isCacheValid]);
  
  // Fetch data function (exposed to component)
  const fetchData = useCallback(async (newOptions?: GraphDataOptions) => {
    // Cancel any in-flight requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create a new abort controller
    abortControllerRef.current = new AbortController();
    
    // Update options if provided
    const fetchOptions = newOptions ? { ...options, ...newOptions } : options;
    if (newOptions) {
      setOptions(fetchOptions);
    }
    
    try {
      const result = await fetchDataFromApi(
        fetchOptions, 
        false, 
        abortControllerRef.current
      );
      setData(result);
      return result;
    } catch (err) {
      console.error('Error fetching graph data:', err);
      return null;
    }
  }, [options, fetchDataFromApi]);
  
  // Load more data (for pagination)
  const loadMore = useCallback(async () => {
    if (loading || !data) return null;
    
    // Cancel any in-flight requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create a new abort controller
    abortControllerRef.current = new AbortController();
    
    try {
      const nextPageData = await fetchDataFromApi(
        options, 
        true, 
        abortControllerRef.current
      );
      
      // Merge with existing data
      const mergedData = mergeGraphData(data, nextPageData);
      setData(mergedData);
      return mergedData;
    } catch (err) {
      console.error('Error loading more graph data:', err);
      return null;
    }
  }, [loading, data, options, fetchDataFromApi, mergeGraphData]);
  
  // Fetch initial data on mount or when options change
  useEffect(() => {
    fetchData();
    
    // Clean up function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  
  // Evict stale cache entries periodically
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of globalCache.entries()) {
        if (now - entry.timestamp > CACHE_EXPIRY_TIME) {
          globalCache.delete(key);
        }
      }
    }, CACHE_EXPIRY_TIME);
    
    return () => clearInterval(cleanupInterval);
  }, []);
  
  return {
    data,
    loading,
    error,
    fetchData,
    loadMore,
    loadingProgress,
    setOptions,
    clearCache: () => globalCache.clear()
  };
} 