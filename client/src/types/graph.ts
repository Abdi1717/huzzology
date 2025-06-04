/**
 * Graph Visualization Types
 * 
 * TypeScript interfaces for ReactFlow and graph data structures
 */

import { Node, Edge } from 'reactflow';
import { Platform } from '@/types/archetype';

// Base archetype data structure
export interface ArchetypeData {
  id: string;
  label: string;
  description: string;
  keywords: string[];
  influences: string[];
  examples: ContentExample[];
  color: string;
  metadata: ArchetypeMetadata;
}

// Content example from social media platforms
export interface ContentExample {
  platform: Platform;
  url: string;
  caption?: string;
  timestamp: string;
  engagement_metrics?: {
    likes: number;
    shares: number;
    comments: number;
  };
  creator?: {
    username: string;
    follower_count?: number;
  };
}

// Archetype metadata
export interface ArchetypeMetadata {
  origin_date?: string;
  peak_popularity?: string;
  influence_score: number; // 0-1 scale
  platforms: string[];
  trending?: boolean;
  category?: string;
}

// ReactFlow node types
export interface ArchetypeNode extends Node {
  id: string;
  type: 'archetypeNode';
  data: ArchetypeData;
  position: { x: number; y: number };
}

// ReactFlow edge types
export interface ArchetypeEdge extends Omit<Edge, 'type'> {
  id: string;
  source: string;
  target: string;
  type?: 'influence' | 'similarity' | 'evolution';
  data?: {
    strength: number; // 0-1 scale
    label?: string;
    bidirectional?: boolean;
  };
}

// Graph layout options
export interface GraphLayoutOptions {
  algorithm: 'dagre' | 'force' | 'circular' | 'hierarchical';
  direction?: 'TB' | 'BT' | 'LR' | 'RL'; // Top-Bottom, Bottom-Top, Left-Right, Right-Left
  nodeSpacing?: number;
  rankSpacing?: number;
  edgeSpacing?: number;
}

// Graph viewport state
export interface GraphViewport {
  x: number;
  y: number;
  zoom: number;
}

// Graph interaction events
export interface GraphEvents {
  onNodeClick?: (node: ArchetypeNode) => void;
  onNodeDoubleClick?: (node: ArchetypeNode) => void;
  onNodeHover?: (node: ArchetypeNode | null) => void;
  onEdgeClick?: (edge: ArchetypeEdge) => void;
  onBackgroundClick?: () => void;
  onViewportChange?: (viewport: GraphViewport) => void;
}

// Graph filter options
export interface GraphFilters {
  categories?: string[];
  platforms?: string[];
  influenceRange?: [number, number];
  timeRange?: [string, string];
  searchQuery?: string;
  showTrendingOnly?: boolean;
}

// Graph statistics
export interface GraphStats {
  totalNodes: number;
  totalEdges: number;
  averageInfluence: number;
  topCategories: Array<{ category: string; count: number }>;
  topPlatforms: Array<{ platform: string; count: number }>;
}

// Layout algorithm result
export interface LayoutResult {
  nodes: ArchetypeNode[];
  edges: ArchetypeEdge[];
  bounds: {
    width: number;
    height: number;
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
}

// Graph component props
export interface GraphComponentProps {
  nodes: ArchetypeNode[];
  edges: ArchetypeEdge[];
  layout?: GraphLayoutOptions;
  filters?: GraphFilters;
  events?: GraphEvents;
  className?: string;
  height?: number | string;
  width?: number | string;
  interactive?: boolean;
  showMinimap?: boolean;
  showControls?: boolean;
  showBackground?: boolean;
} 