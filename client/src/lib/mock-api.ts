/**
 * Mock API Service
 * 
 * Provides realistic API responses for development and testing
 */

import { ArchetypeEdge } from '@/types/graph';
import { ArchetypeNode, Platform } from '@/types/archetype';
import { ApiResponse, PaginatedResponse, GetArchetypesParams, CreateArchetypeRequest, UpdateArchetypeRequest } from '@/lib/api-client';
import { mockArchetypes, mockEdges } from '@/lib/mock-data';

// Simulate network delay
const delay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Mock error simulation (10% chance of error)
const shouldSimulateError = () => Math.random() < 0.1;

// Generate mock error
const generateMockError = () => {
  const errors = [
    { message: 'Network connection failed', status: 500, code: 'NETWORK_ERROR' },
    { message: 'Service temporarily unavailable', status: 503, code: 'SERVICE_UNAVAILABLE' },
    { message: 'Request timeout', status: 408, code: 'TIMEOUT' },
    { message: 'Rate limit exceeded', status: 429, code: 'RATE_LIMIT' },
  ];
  return errors[Math.floor(Math.random() * errors.length)];
};

// Mock data storage (simulates a database)
let mockArchetypeData = [...mockArchetypes];
let mockEdgeData = [...mockEdges];
let nextId = mockArchetypeData.length + 1;

export class MockApiService {
  /**
   * Get all archetypes with optional filtering and pagination
   */
  static async getArchetypes(params?: GetArchetypesParams): Promise<ApiResponse<PaginatedResponse<ArchetypeNode>>> {
    await delay();
    
    if (shouldSimulateError()) {
      const error = generateMockError();
      throw new Error(error.message);
    }

    let filteredArchetypes = [...mockArchetypeData];

    // Apply search filter
    if (params?.search) {
      const searchTerm = params.search.toLowerCase();
      filteredArchetypes = filteredArchetypes.filter(archetype =>
        archetype.label.toLowerCase().includes(searchTerm) ||
        archetype.description.toLowerCase().includes(searchTerm) ||
        archetype.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm))
      );
    }

    // Apply platform filter
    if (params?.platform) {
      filteredArchetypes = filteredArchetypes.filter(archetype =>
        archetype.metadata.platforms.includes(params.platform as Platform)
      );
    }

    // Apply sorting
    if (params?.sortBy) {
      filteredArchetypes.sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (params.sortBy) {
          case 'popularity':
            aValue = a.metadata.influence_score;
            bValue = b.metadata.influence_score;
            break;
          case 'recent':
            aValue = new Date(a.metadata.origin_date || 0);
            bValue = new Date(b.metadata.origin_date || 0);
            break;
          case 'alphabetical':
            aValue = a.label.toLowerCase();
            bValue = b.label.toLowerCase();
            break;
          default:
            return 0;
        }

        if (params.sortOrder === 'desc') {
          return aValue < bValue ? 1 : -1;
        }
        return aValue > bValue ? 1 : -1;
      });
    }

    // Apply pagination
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = filteredArchetypes.slice(startIndex, endIndex);

    return {
      data: {
        data: paginatedData,
        pagination: {
          page,
          limit,
          total: filteredArchetypes.length,
          totalPages: Math.ceil(filteredArchetypes.length / limit),
        },
      },
      success: true,
      message: 'Archetypes retrieved successfully',
    };
  }

  /**
   * Get a specific archetype by ID
   */
  static async getArchetype(id: string): Promise<ApiResponse<ArchetypeNode>> {
    await delay();
    
    if (shouldSimulateError()) {
      const error = generateMockError();
      throw new Error(error.message);
    }

    const archetype = mockArchetypeData.find(a => a.id === id);
    
    if (!archetype) {
      throw new Error(`Archetype with ID ${id} not found`);
    }

    return {
      data: archetype,
      success: true,
      message: 'Archetype retrieved successfully',
    };
  }

  /**
   * Create a new archetype
   */
  static async createArchetype(data: CreateArchetypeRequest): Promise<ApiResponse<ArchetypeNode>> {
    await delay();
    
    if (shouldSimulateError()) {
      const error = generateMockError();
      throw new Error(error.message);
    }

    const newArchetype: ArchetypeNode = {
      id: `archetype-${nextId++}`,
      label: data.label,
      description: data.description,
      keywords: data.keywords,
      color: data.color || '#8B5CF6',
      influences: [],
      examples: [],
      metadata: {
        influence_score: Math.random(), // 0-1 scale as per interface
        platforms: data.platforms as Platform[],
        origin_date: new Date().toISOString(),
      },
    };

    mockArchetypeData.push(newArchetype);

    return {
      data: newArchetype,
      success: true,
      message: 'Archetype created successfully',
    };
  }

  /**
   * Update an existing archetype
   */
  static async updateArchetype(data: UpdateArchetypeRequest): Promise<ApiResponse<ArchetypeNode>> {
    await delay();
    
    if (shouldSimulateError()) {
      const error = generateMockError();
      throw new Error(error.message);
    }

    const index = mockArchetypeData.findIndex(a => a.id === data.id);
    
    if (index === -1) {
      throw new Error(`Archetype with ID ${data.id} not found`);
    }

    const updatedArchetype = {
      ...mockArchetypeData[index],
      ...data,
    };

    mockArchetypeData[index] = updatedArchetype;

    return {
      data: updatedArchetype,
      success: true,
      message: 'Archetype updated successfully',
    };
  }

  /**
   * Delete an archetype
   */
  static async deleteArchetype(id: string): Promise<ApiResponse<void>> {
    await delay();
    
    if (shouldSimulateError()) {
      const error = generateMockError();
      throw new Error(error.message);
    }

    const index = mockArchetypeData.findIndex(a => a.id === id);
    
    if (index === -1) {
      throw new Error(`Archetype with ID ${id} not found`);
    }

    mockArchetypeData.splice(index, 1);

    // Remove related edges
    mockEdgeData = mockEdgeData.filter(edge => 
      edge.source !== id && edge.target !== id
    );

    return {
      data: undefined,
      success: true,
      message: 'Archetype deleted successfully',
    };
  }

  /**
   * Get archetype relationships/edges
   */
  static async getArchetypeRelationships(): Promise<ApiResponse<ArchetypeEdge[]>> {
    await delay();
    
    if (shouldSimulateError()) {
      const error = generateMockError();
      throw new Error(error.message);
    }

    return {
      data: mockEdgeData,
      success: true,
      message: 'Relationships retrieved successfully',
    };
  }

  /**
   * Get trending archetypes
   */
  static async getTrendingArchetypes(limit?: number): Promise<ApiResponse<ArchetypeNode[]>> {
    await delay();
    
    if (shouldSimulateError()) {
      const error = generateMockError();
      throw new Error(error.message);
    }

    const trendingArchetypes = mockArchetypeData
      .filter(archetype => archetype.metadata.trending)
      .sort((a, b) => b.metadata.influence_score - a.metadata.influence_score)
      .slice(0, limit || 5);

    return {
      data: trendingArchetypes,
      success: true,
      message: 'Trending archetypes retrieved successfully',
    };
  }

  /**
   * Search archetypes
   */
  static async searchArchetypes(query: string, limit?: number): Promise<ApiResponse<ArchetypeNode[]>> {
    await delay();
    
    if (shouldSimulateError()) {
      const error = generateMockError();
      throw new Error(error.message);
    }

    const searchTerm = query.toLowerCase();
    const results = mockArchetypeData
      .filter(archetype =>
        archetype.label.toLowerCase().includes(searchTerm) ||
        archetype.description.toLowerCase().includes(searchTerm) ||
        archetype.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm))
      )
      .slice(0, limit || 10);

    return {
      data: results,
      success: true,
      message: 'Search completed successfully',
    };
  }

  /**
   * Reset mock data to initial state
   */
  static resetMockData(): void {
    mockArchetypeData = [...mockArchetypes];
    mockEdgeData = [...mockEdges];
    nextId = mockArchetypeData.length + 1;
  }

  /**
   * Get current mock data (for debugging)
   */
  static getMockData(): { archetypes: ArchetypeNode[]; edges: ArchetypeEdge[] } {
    return {
      archetypes: [...mockArchetypeData],
      edges: [...mockEdgeData],
    };
  }
}

// Environment-based API switching
const USE_MOCK_API = (import.meta as any).env?.VITE_USE_MOCK_API === 'true' || (import.meta as any).env?.DEV;

export { USE_MOCK_API }; 