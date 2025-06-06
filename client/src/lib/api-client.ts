/**
 * API Client
 * 
 * Typed API client with error handling and request/response interceptors
 */

import { ArchetypeEdge } from '@/types/graph';
import { ArchetypeNode } from '@/types/archetype';
import { MockApiService, USE_MOCK_API } from '@/lib/mock-api';
import axios from 'axios';
import { getMockApiInstance } from './mock-api';
import { GraphDataOptions } from '@/hooks/useGraphData';

// API Configuration
const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000/api';

// API Response Types
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Request/Response Types
export interface GetArchetypesParams {
  page?: number;
  limit?: number;
  search?: string;
  platform?: string;
  sortBy?: 'popularity' | 'recent' | 'alphabetical';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateArchetypeRequest {
  label: string;
  description: string;
  keywords: string[];
  color?: string;
  platforms: string[];
}

export interface UpdateArchetypeRequest extends Partial<CreateArchetypeRequest> {
  id: string;
}

// Custom Error Class
export class ApiClientError extends Error {
  public status?: number;
  public code?: string;
  public details?: any;

  constructor(message: string, status?: number, code?: string, details?: any) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// Request Configuration
interface RequestConfig extends RequestInit {
  timeout?: number;
}

// API Client Class
class ApiClient {
  private baseURL: string;
  private defaultTimeout: number = 10000; // 10 seconds

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  /**
   * Make HTTP request with error handling and timeout
   */
  private async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const { timeout = this.defaultTimeout, ...requestConfig } = config;
    
    const url = `${this.baseURL}${endpoint}`;
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...requestConfig,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...requestConfig.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiClientError(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData.code,
          errorData.details
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof ApiClientError) {
        throw error;
      }
      
      if ((error as any)?.name === 'AbortError') {
        throw new ApiClientError('Request timeout', 408, 'TIMEOUT');
      }
      
      throw new ApiClientError(
        (error as any)?.message || 'Network error occurred',
        0,
        'NETWORK_ERROR'
      );
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const url = new URL(endpoint, this.baseURL);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return this.request<T>(url.pathname + url.search);
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }

  // Archetype API Methods
  
  /**
   * Get all archetypes with optional filtering and pagination
   */
  async getArchetypes(params?: GetArchetypesParams): Promise<ApiResponse<PaginatedResponse<ArchetypeNode>>> {
    if (USE_MOCK_API) {
      return MockApiService.getArchetypes(params);
    }
    return this.get<PaginatedResponse<ArchetypeNode>>('/archetypes', params);
  }

  /**
   * Get a specific archetype by ID
   */
  async getArchetype(id: string): Promise<ApiResponse<ArchetypeNode>> {
    if (USE_MOCK_API) {
      return MockApiService.getArchetype(id);
    }
    return this.get<ArchetypeNode>(`/archetypes/${id}`);
  }

  /**
   * Create a new archetype
   */
  async createArchetype(data: CreateArchetypeRequest): Promise<ApiResponse<ArchetypeNode>> {
    if (USE_MOCK_API) {
      return MockApiService.createArchetype(data);
    }
    return this.post<ArchetypeNode>('/archetypes', data);
  }

  /**
   * Update an existing archetype
   */
  async updateArchetype(data: UpdateArchetypeRequest): Promise<ApiResponse<ArchetypeNode>> {
    if (USE_MOCK_API) {
      return MockApiService.updateArchetype(data);
    }
    return this.put<ArchetypeNode>(`/archetypes/${data.id}`, data);
  }

  /**
   * Delete an archetype
   */
  async deleteArchetype(id: string): Promise<ApiResponse<void>> {
    if (USE_MOCK_API) {
      return MockApiService.deleteArchetype(id);
    }
    return this.delete<void>(`/archetypes/${id}`);
  }

  /**
   * Get archetype relationships/edges
   */
  async getArchetypeRelationships(): Promise<ApiResponse<ArchetypeEdge[]>> {
    if (USE_MOCK_API) {
      return MockApiService.getArchetypeRelationships();
    }
    return this.get<ArchetypeEdge[]>('/archetypes/relationships');
  }

  /**
   * Get trending archetypes
   */
  async getTrendingArchetypes(limit?: number): Promise<ApiResponse<ArchetypeNode[]>> {
    if (USE_MOCK_API) {
      return MockApiService.getTrendingArchetypes(limit);
    }
    return this.get<ArchetypeNode[]>('/archetypes/trending', { limit });
  }

  /**
   * Search archetypes
   */
  async searchArchetypes(query: string, limit?: number): Promise<ApiResponse<ArchetypeNode[]>> {
    if (USE_MOCK_API) {
      return MockApiService.searchArchetypes(query, limit);
    }
    return this.get<ArchetypeNode[]>('/archetypes/search', { q: query, limit });
  }

  /**
   * Fetch graph data with optimized loading for large datasets
   * Includes support for abort signals and detailed stats
   */
  async fetchGraphData(options: GraphDataOptions, signal?: AbortSignal): Promise<GraphData> {
    const startTime = performance.now();
    
    try {
      // Fetch nodes with pagination/filtering
      const nodesResponse = await this.getArchetypes({
        page: options.page || 1,
        limit: options.limit || 10,
        search: options.search,
        platform: options.platform,
        sortBy: options.sortBy,
        sortOrder: options.sortOrder,
      }, signal);
      
      const { data: nodesData, pagination } = nodesResponse.data;
      
      // Fetch edges for these nodes
      const edgesResponse = await this.getArchetypeRelationships(signal);
      
      // Optimize edge filtering for large datasets
      const nodeIds = new Set(nodesData.map(node => node.id));
      const filteredEdges = edgesResponse.data.filter(
        edge => nodeIds.has(edge.source) && nodeIds.has(edge.target)
      );
      
      // Calculate load time
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      return {
        nodes: nodesData,
        edges: filteredEdges,
        stats: {
          totalNodes: pagination.total,
          totalEdges: edgesResponse.data.length,
          totalPages: pagination.totalPages,
          currentPage: pagination.page,
          loadTime,
        },
      };
    } catch (error) {
      // Handle abort errors differently
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error('Request was cancelled');
      }
      
      console.error('Error fetching graph data:', error);
      throw error;
    }
  }

}

// Create and export API client instance
export const apiClient = new ApiClient(API_BASE_URL);

// Types are already exported above 

// Use environment variable or default to development mode
const isDev = (import.meta as any).env?.MODE === 'development';
const useMockApi = isDev || (import.meta as any).env?.VITE_USE_MOCK_API === 'true';

// Base API URL from environment variable or default
const baseURL = (import.meta as any).env?.VITE_API_URL || 'https://api.huzzology.com';

// Create axios instance
const apiClientAxios = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication
apiClientAxios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for error handling
apiClientAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle specific error cases
    if (error.response) {
      // Authentication errors
      if (error.response.status === 401) {
        // Clear token and redirect to login if needed
        localStorage.removeItem('auth_token');
        // window.location.href = '/login';
      }
      
      // Return custom error message based on server response
      return Promise.reject({
        message: error.response.data.message || 'An error occurred',
        status: error.response.status,
        data: error.response.data,
      });
    }
    
    // Network errors
    if (error.request) {
      return Promise.reject({
        message: 'Network error. Please check your connection.',
        isNetworkError: true,
      });
    }
    
    // Other errors
    return Promise.reject({
      message: error.message || 'An unknown error occurred',
    });
  }
);

// API service methods
const apiService = {
  // Auth methods
  auth: {
    login: async (email: string, password: string) => {
      if (useMockApi) return getMockApiInstance().auth.login(email, password);
      const response = await apiClientAxios.post('/auth/login', { email, password });
      return response.data;
    },
    register: async (userData: any) => {
      if (useMockApi) return getMockApiInstance().auth.register(userData);
      const response = await apiClientAxios.post('/auth/register', userData);
      return response.data;
    },
    logout: async () => {
      if (useMockApi) return getMockApiInstance().auth.logout();
      const response = await apiClientAxios.post('/auth/logout');
      localStorage.removeItem('auth_token');
      return response.data;
    },
  },
  
  // Archetype methods
  archetypes: {
    getAll: async (options?: GraphDataOptions) => {
      if (useMockApi) return getMockApiInstance().archetypes.getAll(options);
      
      // Convert options to query parameters
      const params = new URLSearchParams();
      if (options) {
        if (options.page) params.append('page', options.page.toString());
        if (options.limit) params.append('limit', options.limit.toString());
        if (options.search) params.append('search', options.search);
        if (options.platform) params.append('platform', options.platform);
        if (options.sortBy) params.append('sortBy', options.sortBy);
        if (options.sortOrder) params.append('sortOrder', options.sortOrder);
      }
      
      const response = await apiClientAxios.get(`/archetypes?${params.toString()}`);
      return response.data;
    },
    
    getById: async (id: string) => {
      if (useMockApi) return getMockApiInstance().archetypes.getById(id);
      const response = await apiClientAxios.get(`/archetypes/${id}`);
      return response.data;
    },
    
    getExamples: async (id: string, limit?: number) => {
      if (useMockApi) return getMockApiInstance().archetypes.getExamples(id, limit);
      const params = limit ? `?limit=${limit}` : '';
      const response = await apiClientAxios.get(`/archetypes/${id}/examples${params}`);
      return response.data;
    },
    
    getRelated: async (id: string) => {
      if (useMockApi) return getMockApiInstance().archetypes.getRelated(id);
      const response = await apiClientAxios.get(`/archetypes/${id}/related`);
      return response.data;
    },
  },
  
  // Graph data methods
  graph: {
    getGraphData: async (options?: GraphDataOptions) => {
      if (useMockApi) return getMockApiInstance().graph.getGraphData(options);
      
      // Convert options to query parameters
      const params = new URLSearchParams();
      if (options) {
        if (options.page) params.append('page', options.page.toString());
        if (options.limit) params.append('limit', options.limit.toString());
        if (options.search) params.append('search', options.search);
        if (options.platform) params.append('platform', options.platform);
        if (options.sortBy) params.append('sortBy', options.sortBy);
        if (options.sortOrder) params.append('sortOrder', options.sortOrder);
      }
      
      const response = await apiClientAxios.get(`/graph?${params.toString()}`);
      return response.data;
    },
    
    updateNode: async (id: string, data: Partial<ArchetypeNode>) => {
      if (useMockApi) return getMockApiInstance().graph.updateNode(id, data);
      const response = await apiClientAxios.patch(`/graph/nodes/${id}`, data);
      return response.data;
    },
    
    updateEdge: async (id: string, data: Partial<ArchetypeEdge>) => {
      if (useMockApi) return getMockApiInstance().graph.updateEdge(id, data);
      const response = await apiClientAxios.patch(`/graph/edges/${id}`, data);
      return response.data;
    },
    
    createEdge: async (edge: Omit<ArchetypeEdge, 'id'>) => {
      if (useMockApi) return getMockApiInstance().graph.createEdge(edge);
      const response = await apiClientAxios.post('/graph/edges', edge);
      return response.data;
    },
    
    deleteEdge: async (id: string) => {
      if (useMockApi) return getMockApiInstance().graph.deleteEdge(id);
      const response = await apiClientAxios.delete(`/graph/edges/${id}`);
      return response.data;
    },
  },
  
  // Trend analysis methods
  trends: {
    getTimeline: async (period: 'week' | 'month' | 'quarter' | 'year' = 'month') => {
      if (useMockApi) return getMockApiInstance().trends.getTimeline(period);
      const response = await apiClientAxios.get(`/trends/timeline?period=${period}`);
      return response.data;
    },
    
    getPlatformComparison: async () => {
      if (useMockApi) return getMockApiInstance().trends.getPlatformComparison();
      const response = await apiClientAxios.get('/trends/platforms');
      return response.data;
    },
  },
};

export default apiService; 