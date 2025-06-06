/**
 * Mock API Service
 * 
 * Provides realistic API responses for development and testing
 */

import { ArchetypeEdge } from '@/types/graph';
import { ArchetypeNode, Platform } from '@/types/archetype';
import { ApiResponse, PaginatedResponse, GetArchetypesParams, CreateArchetypeRequest, UpdateArchetypeRequest } from '@/lib/api-client';
import { mockArchetypes, mockEdges } from '@/lib/mock-data';
import { generateNodes, generateEdges } from './mock-data';
import { GraphDataOptions } from '@/hooks/useGraphData';

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

// Singleton mock API instance
let mockApiInstance: MockApiService | null = null;

export function getMockApiInstance(): MockApiService {
  if (!mockApiInstance) {
    mockApiInstance = new MockApiService();
  }
  return mockApiInstance;
}

export class MockApiService {
  private nodes: ArchetypeNode[];
  private edges: ArchetypeEdge[];
  
  constructor() {
    // Initialize with mock data
    this.nodes = generateNodes(50);
    this.edges = generateEdges(this.nodes);
    
    console.log('Mock API initialized with', this.nodes.length, 'nodes and', this.edges.length, 'edges');
  }
  
  // Auth methods
  auth = {
    login: async (email: string, password: string) => {
      // Simulate API delay
      await this.delay(500);
      
      // Mock response
      return {
        token: 'mock-auth-token-' + Math.random().toString(36).substring(2),
        user: {
          id: '1',
          email,
          name: 'Mock User',
        },
      };
    },
    
    register: async (userData: any) => {
      await this.delay(800);
      
      return {
        token: 'mock-auth-token-' + Math.random().toString(36).substring(2),
        user: {
          id: '1',
          ...userData,
        },
      };
    },
    
    logout: async () => {
      await this.delay(300);
      
      return { success: true };
    },
  };
  
  // Archetype methods
  archetypes = {
    getAll: async (options?: GraphDataOptions) => {
      await this.delay(600);
      
      let filteredNodes = [...this.nodes];
      
      // Apply search filter
      if (options?.search) {
        const searchLower = options.search.toLowerCase();
        filteredNodes = filteredNodes.filter(node => 
          node.data.label.toLowerCase().includes(searchLower) ||
          node.data.keywords.some(kw => kw.toLowerCase().includes(searchLower))
        );
      }
      
      // Apply platform filter
      if (options?.platform) {
        filteredNodes = filteredNodes.filter(node => 
          node.data.metadata.platforms.includes(options.platform as any)
        );
      }
      
      // Apply sorting
      if (options?.sortBy) {
        filteredNodes.sort((a, b) => {
          switch (options.sortBy) {
            case 'popularity':
              return b.data.metadata.influence_score - a.data.metadata.influence_score;
            case 'recent':
              return new Date(b.data.metadata.origin_date || '').getTime() - 
                     new Date(a.data.metadata.origin_date || '').getTime();
            case 'alphabetical':
              return a.data.label.localeCompare(b.data.label);
            default:
              return 0;
          }
        });
        
        // Apply sort order
        if (options.sortOrder === 'asc') {
          filteredNodes.reverse();
        }
      }
      
      // Apply pagination
      const page = options?.page || 1;
      const limit = options?.limit || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedNodes = filteredNodes.slice(startIndex, endIndex);
      
      // Get edges for the paginated nodes
      const nodeIds = paginatedNodes.map(node => node.id);
      const relevantEdges = this.edges.filter(edge => 
        nodeIds.includes(edge.source) && nodeIds.includes(edge.target)
      );
      
      return {
        nodes: paginatedNodes,
        edges: relevantEdges,
        stats: {
          totalNodes: filteredNodes.length,
          totalEdges: this.edges.length,
          totalPages: Math.ceil(filteredNodes.length / limit),
          currentPage: page,
        },
      };
    },
    
    getById: async (id: string) => {
      await this.delay(300);
      
      const node = this.nodes.find(node => node.id === id);
      
      if (!node) {
        throw new Error('Archetype not found');
      }
      
      return node;
    },
    
    getExamples: async (id: string, limit?: number) => {
      await this.delay(700);
      
      const node = this.nodes.find(node => node.id === id);
      
      if (!node) {
        throw new Error('Archetype not found');
      }
      
      // Return examples or generate random ones
      return node.data.examples || [
        {
          platform: 'tiktok',
          url: 'https://www.tiktok.com/@user/video/123456789',
          caption: 'Example content for ' + node.data.label,
          timestamp: new Date().toISOString(),
          engagement_metrics: {
            likes: Math.floor(Math.random() * 10000),
            shares: Math.floor(Math.random() * 1000),
            comments: Math.floor(Math.random() * 500),
          },
        },
        {
          platform: 'instagram',
          url: 'https://www.instagram.com/p/abcdef123/',
          caption: 'Another example for ' + node.data.label,
          timestamp: new Date().toISOString(),
          engagement_metrics: {
            likes: Math.floor(Math.random() * 10000),
            shares: Math.floor(Math.random() * 1000),
            comments: Math.floor(Math.random() * 500),
          },
        },
      ].slice(0, limit || 10);
    },
    
    getRelated: async (id: string) => {
      await this.delay(500);
      
      // Find edges connected to this node
      const relatedEdges = this.edges.filter(edge => 
        edge.source === id || edge.target === id
      );
      
      // Get the connected node IDs
      const relatedNodeIds = relatedEdges.map(edge => 
        edge.source === id ? edge.target : edge.source
      );
      
      // Get the node objects
      const relatedNodes = this.nodes.filter(node => 
        relatedNodeIds.includes(node.id)
      );
      
      return {
        nodes: relatedNodes,
        edges: relatedEdges,
      };
    },
  };
  
  // Graph data methods
  graph = {
    getGraphData: async (options?: GraphDataOptions) => {
      // Reuse the archetypes.getAll method as it has the same functionality
      return this.archetypes.getAll(options);
    },
    
    updateNode: async (id: string, data: Partial<ArchetypeNode>) => {
      await this.delay(300);
      
      const nodeIndex = this.nodes.findIndex(node => node.id === id);
      
      if (nodeIndex === -1) {
        throw new Error('Node not found');
      }
      
      // Update the node
      this.nodes[nodeIndex] = {
        ...this.nodes[nodeIndex],
        ...data,
        data: {
          ...this.nodes[nodeIndex].data,
          ...data.data,
        },
      };
      
      return this.nodes[nodeIndex];
    },
    
    updateEdge: async (id: string, data: Partial<ArchetypeEdge>) => {
      await this.delay(300);
      
      const edgeIndex = this.edges.findIndex(edge => edge.id === id);
      
      if (edgeIndex === -1) {
        throw new Error('Edge not found');
      }
      
      // Update the edge
      this.edges[edgeIndex] = {
        ...this.edges[edgeIndex],
        ...data,
        data: {
          ...this.edges[edgeIndex].data,
          ...data.data,
        },
      };
      
      return this.edges[edgeIndex];
    },
    
    createEdge: async (edge: Omit<ArchetypeEdge, 'id'>) => {
      await this.delay(400);
      
      // Check if source and target nodes exist
      const sourceExists = this.nodes.some(node => node.id === edge.source);
      const targetExists = this.nodes.some(node => node.id === edge.target);
      
      if (!sourceExists || !targetExists) {
        throw new Error('Source or target node not found');
      }
      
      // Create new edge with generated ID
      const newEdge: ArchetypeEdge = {
        ...edge,
        id: `${edge.source}-${edge.target}`,
      };
      
      // Add to edges list
      this.edges.push(newEdge);
      
      return newEdge;
    },
    
    deleteEdge: async (id: string) => {
      await this.delay(300);
      
      const edgeIndex = this.edges.findIndex(edge => edge.id === id);
      
      if (edgeIndex === -1) {
        throw new Error('Edge not found');
      }
      
      // Remove the edge
      this.edges.splice(edgeIndex, 1);
      
      return { success: true };
    },
  };
  
  // Trend analysis methods
  trends = {
    getTimeline: async (period: 'week' | 'month' | 'quarter' | 'year' = 'month') => {
      await this.delay(800);
      
      // Generate timeline data based on period
      const timePoints = period === 'week' ? 7 : 
                          period === 'month' ? 30 : 
                          period === 'quarter' ? 12 : 52;
      
      // Get top 5 archetypes by influence score
      const topArchetypes = [...this.nodes]
        .sort((a, b) => b.data.metadata.influence_score - a.data.metadata.influence_score)
        .slice(0, 5);
      
      // Generate timeline data for each archetype
      const timelineData = topArchetypes.map(archetype => {
        // Create data points with some randomness but overall trend
        const dataPoints = Array.from({ length: timePoints }, (_, i) => {
          const baseValue = archetype.data.metadata.influence_score * 100;
          const trend = Math.sin(i / (timePoints / 2) * Math.PI) * 20; // Sine wave trend
          const random = Math.random() * 10 - 5; // Random fluctuation
          return Math.max(0, Math.round(baseValue + trend + random));
        });
        
        return {
          id: archetype.id,
          label: archetype.data.label,
          color: archetype.data.color || '#' + Math.floor(Math.random() * 16777215).toString(16),
          data: dataPoints,
        };
      });
      
      // Generate time labels based on period
      const now = new Date();
      const timeLabels = Array.from({ length: timePoints }, (_, i) => {
        const date = new Date();
        switch (period) {
          case 'week':
            date.setDate(now.getDate() - (timePoints - 1 - i));
            return date.toLocaleDateString('en-US', { weekday: 'short' });
          case 'month':
            date.setDate(now.getDate() - (timePoints - 1 - i));
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          case 'quarter':
            date.setMonth(now.getMonth() - (timePoints - 1 - i));
            return date.toLocaleDateString('en-US', { month: 'short' });
          case 'year':
            date.setDate(now.getDate() - (timePoints - 1 - i) * 7);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
      });
      
      return {
        archetypes: timelineData,
        timeLabels,
        period,
      };
    },
    
    getPlatformComparison: async () => {
      await this.delay(600);
      
      // Get distribution of archetypes across platforms
      const platforms = ['tiktok', 'instagram', 'twitter', 'youtube', 'pinterest'];
      
      // Count archetypes per platform
      const platformCounts = platforms.reduce((acc, platform) => {
        acc[platform] = this.nodes.filter(node => 
          node.data.metadata.platforms.includes(platform as any)
        ).length;
        return acc;
      }, {} as Record<string, number>);
      
      // Generate random engagement metrics
      const engagementMetrics = platforms.reduce((acc, platform) => {
        acc[platform] = {
          views: Math.floor(Math.random() * 10000000) + 1000000,
          engagement: Math.random() * 0.2 + 0.01,
          growth: (Math.random() * 40 - 20) / 100,
        };
        return acc;
      }, {} as Record<string, any>);
      
      return {
        distribution: platformCounts,
        engagement: engagementMetrics,
        platforms,
      };
    },
  };
  
  // Helper method to simulate API delay
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

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

// Always use mock API for development and testing
export const USE_MOCK_API = true; 