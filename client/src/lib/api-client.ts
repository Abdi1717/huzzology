/**
 * API Client
 * 
 * Typed API client with error handling and request/response interceptors
 */

import { ArchetypeEdge } from '@/types/graph';
import { ArchetypeNode } from '@/types/archetype';
import { MockApiService, USE_MOCK_API } from '@/lib/mock-api';

// API Configuration
const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3001/api';

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
}

// Create and export API client instance
export const apiClient = new ApiClient(API_BASE_URL);

// Types are already exported above 