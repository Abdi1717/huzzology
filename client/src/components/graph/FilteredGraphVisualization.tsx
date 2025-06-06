/**
 * FilteredGraphVisualization - Enhanced graph visualization with filtering and search
 * Implements subtasks 7.6 (API integration) and 7.7 (filtering and search functionality)
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  ReactFlowProvider,
  Panel,
  useReactFlow
} from 'reactflow';
import 'reactflow/dist/style.css';

import { ArchetypeNode as ArchetypeNodeType, ArchetypeEdge } from '@/types/graph';
import { ArchetypeNode } from '@/types/archetype';
import useGraphData, { GraphDataOptions } from '@/hooks/useGraphData';
import { MemoizedArchetypeNode } from './MemoizedArchetypeNode';
import { CustomEdge } from './edges/CustomEdge';
import GraphFilterPanel from './GraphFilterPanel';
import GraphSearch from './GraphSearch';
import { LoadMoreButton } from './LoadMoreButton';
import { GraphLoadingOverlay } from './GraphLoadingOverlay';
import { useResponsive } from '@/hooks/useResponsive';
import { applyLayout } from '@/lib/graph-layout';
import useSearchSuggestions from '@/hooks/useSearchSuggestions';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  Filter, 
  AlertCircle, 
  Route,
  EyeOff,
  RotateCcw
} from 'lucide-react';

interface FilteredGraphVisualizationProps {
  layout?: 'dagre' | 'force' | 'circular' | 'hierarchical';
  className?: string;
  enablePathfinding?: boolean;
  enableRealTimeUpdates?: boolean;
}

const nodeTypes = {
  archetypeNode: MemoizedArchetypeNode
};

const edgeTypes = {
  customEdge: CustomEdge
};

// Convert API data to ReactFlow format
const convertToReactFlowFormat = (
  apiNodes: ArchetypeNode[], 
  apiEdges: ArchetypeEdge[]
): { nodes: ArchetypeNodeType[]; edges: ArchetypeEdge[] } => {
  const nodes: ArchetypeNodeType[] = apiNodes.map((archetype, index) => ({
    id: archetype.id,
    type: 'archetypeNode',
    position: { x: index * 200, y: index * 100 }, // Will be overridden by layout
    data: archetype
  }));

  return { nodes, edges: apiEdges };
};

const FilteredGraphVisualizationInner: React.FC<FilteredGraphVisualizationProps> = ({
  layout = 'dagre',
  className = '',
  enablePathfinding = true,
  enableRealTimeUpdates = false
}) => {
  const { isMobile } = useResponsive();
  const { fitView } = useReactFlow();
  
  // Graph data hook with API integration
  const {
    data: graphData,
    loading,
    error,
    fetchData,
    loadMore,
    loadingProgress,
    setOptions
  } = useGraphData({
    page: 1,
    limit: 20,
    sortBy: 'popularity',
    sortOrder: 'desc'
  });

  // State for filtering and search
  const [showFilters, setShowFilters] = useState(!isMobile);
  const [searchQuery, setSearchQuery] = useState('');
  const [pathfindingState, setPathfindingState] = useState<{
    enabled: boolean;
    sourceId?: string;
    targetId?: string;
    path?: string[];
  }>({ enabled: false });

  // Search suggestions integration
  const { suggestions, trendingSuggestions } = useSearchSuggestions({
    archetypes: graphData?.nodes || [],
    maxSuggestions: 15
  });

  // Convert API data to ReactFlow format
  const { nodes: reactFlowNodes, edges: reactFlowEdges } = useMemo(() => {
    if (!graphData) {
      return { nodes: [], edges: [] };
    }
    return convertToReactFlowFormat(graphData.nodes, graphData.edges);
  }, [graphData]);

  // Apply layout to nodes and edges
  const layoutedElements = useMemo(() => {
    if (reactFlowNodes.length === 0) {
      return { nodes: [], edges: [] };
    }
    return applyLayout(reactFlowNodes, reactFlowEdges, layout);
  }, [reactFlowNodes, reactFlowEdges, layout]);

  // ReactFlow state
  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedElements.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedElements.edges);

  // Update nodes and edges when layout changes
  useEffect(() => {
    setNodes(layoutedElements.nodes);
    setEdges(layoutedElements.edges);
  }, [layoutedElements, setNodes, setEdges]);

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    fetchData({ search: query, page: 1 }); // Reset to first page when searching
  }, [fetchData]);

  // Handle filter changes
  const handleFilterChange = useCallback((options: GraphDataOptions) => {
    setOptions(options);
    fetchData(options);
  }, [setOptions, fetchData]);

  // Handle pathfinding
  const handlePathFind = useCallback((sourceId: string, targetId: string) => {
    // Simple pathfinding implementation using BFS
    const findShortestPath = (start: string, end: string): string[] | null => {
      if (start === end) return [start];
      
      const visited = new Set<string>();
      const queue: { nodeId: string; path: string[] }[] = [{ nodeId: start, path: [start] }];
      
      while (queue.length > 0) {
        const { nodeId, path } = queue.shift()!;
        
        if (visited.has(nodeId)) continue;
        visited.add(nodeId);
        
        // Find connected nodes
        const connectedNodes = edges
          .filter(edge => edge.source === nodeId || edge.target === nodeId)
          .map(edge => edge.source === nodeId ? edge.target : edge.source);
        
        for (const connectedNode of connectedNodes) {
          if (connectedNode === end) {
            return [...path, connectedNode];
          }
          
          if (!visited.has(connectedNode)) {
            queue.push({ nodeId: connectedNode, path: [...path, connectedNode] });
          }
        }
      }
      
      return null; // No path found
    };

    const path = findShortestPath(sourceId, targetId);
    
    if (path) {
      // Highlight the path
      const pathNodeIds = new Set(path);
      const pathEdgeIds = new Set();
      
      // Find edges in the path
      for (let i = 0; i < path.length - 1; i++) {
        const edge = edges.find(e => 
          (e.source === path[i] && e.target === path[i + 1]) ||
          (e.source === path[i + 1] && e.target === path[i])
        );
        if (edge) {
          pathEdgeIds.add(edge.id);
        }
      }
      
      // Update nodes with highlighting
      setNodes(currentNodes => 
        currentNodes.map(node => ({
          ...node,
          data: {
            ...node.data,
            highlighted: pathNodeIds.has(node.id),
            dimmed: !pathNodeIds.has(node.id)
          }
        }))
      );
      
      // Update edges with highlighting
      setEdges(currentEdges =>
        currentEdges.map(edge => ({
          ...edge,
          style: {
            ...edge.style,
            stroke: pathEdgeIds.has(edge.id) ? '#ff6b6b' : '#e2e8f0',
            strokeWidth: pathEdgeIds.has(edge.id) ? 3 : 1,
            opacity: pathEdgeIds.has(edge.id) ? 1 : 0.3
          }
        }))
      );
      
      setPathfindingState({
        enabled: true,
        sourceId,
        targetId,
        path
      });
    }
  }, [edges, setNodes, setEdges]);

  // Clear pathfinding highlights
  const clearPathfinding = useCallback(() => {
    setNodes(currentNodes => 
      currentNodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          highlighted: false,
          dimmed: false
        }
      }))
    );
    
    setEdges(currentEdges =>
      currentEdges.map(edge => ({
        ...edge,
        style: {
          ...edge.style,
          stroke: '#e2e8f0',
          strokeWidth: 1,
          opacity: 1
        }
      }))
    );
    
    setPathfindingState({ enabled: false });
  }, [setNodes, setEdges]);

  // Real-time updates (if enabled)
  useEffect(() => {
    if (!enableRealTimeUpdates) return;
    
    const interval = setInterval(() => {
      // Refresh data every 30 seconds
      fetchData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [enableRealTimeUpdates, fetchData]);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load graph data: {error.message}
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2 w-full"
              onClick={() => fetchData()}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className={`w-full h-full relative ${className}`}>
      {/* Loading Overlay */}
      {loading && (
        <GraphLoadingOverlay 
          progress={loadingProgress} 
          message="Loading graph data..."
        />
      )}

      {/* Main Graph */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        attributionPosition="bottom-left"
        className="bg-background"
        minZoom={0.1}
        maxZoom={4}
      >
        <Background />
        <Controls />
        
        {!isMobile && (
          <MiniMap 
            className="!bg-muted" 
            maskColor="rgba(0, 0, 0, 0.1)"
            nodeColor={(node) => {
              const data = node.data as ArchetypeNode;
              return data.color;
            }}
          />
        )}

        {/* Search Panel */}
        <Panel position="top-left">
          <div className="space-y-2">
            <GraphSearch
              onSearch={handleSearch}
              initialValue={searchQuery}
              className="w-80"
              archetypes={graphData?.nodes || []}
              suggestions={suggestions}
              showSuggestions={true}
              enableFuzzySearch={true}
            />
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-1" />
                Filters
              </Button>
              
              {pathfindingState.enabled && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearPathfinding}
                >
                  <EyeOff className="h-4 w-4 mr-1" />
                  Clear Path
                </Button>
              )}
            </div>
          </div>
        </Panel>

        {/* Stats Panel */}
        <Panel position="top-right">
          <Card className="min-w-48">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Graph Stats</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-1">
              <div className="flex justify-between text-xs">
                <span>Nodes:</span>
                <Badge variant="secondary">
                  {graphData?.stats.totalNodes || 0}
                </Badge>
              </div>
              <div className="flex justify-between text-xs">
                <span>Edges:</span>
                <Badge variant="secondary">
                  {graphData?.stats.totalEdges || 0}
                </Badge>
              </div>
              <div className="flex justify-between text-xs">
                <span>Load Time:</span>
                <Badge variant="secondary">
                  {graphData?.stats.loadTime.toFixed(0)}ms
                </Badge>
              </div>
              {enableRealTimeUpdates && (
                <div className="flex justify-between text-xs">
                  <span>Live Updates:</span>
                  <Badge variant="default" className="bg-green-500">
                    ON
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </Panel>

        {/* Load More Button */}
        {graphData && graphData.stats.currentPage < graphData.stats.totalPages && (
          <Panel position="bottom-center">
            <LoadMoreButton 
              onLoadMore={loadMore}
              loading={loading}
              hasMore={graphData.stats.currentPage < graphData.stats.totalPages}
            />
          </Panel>
        )}

        {/* Pathfinding Info */}
        {pathfindingState.enabled && pathfindingState.path && (
          <Panel position="bottom-right">
            <Card className="max-w-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center">
                  <Route className="h-4 w-4 mr-2" />
                  Path Found
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground mb-2">
                  {pathfindingState.path.length} steps from {pathfindingState.sourceId} to {pathfindingState.targetId}
                </p>
                <div className="flex flex-wrap gap-1">
                  {pathfindingState.path.map((nodeId, index) => (
                    <React.Fragment key={nodeId}>
                      <Badge variant="outline" className="text-xs">
                        {nodeId}
                      </Badge>
                      {index < pathfindingState.path!.length - 1 && (
                        <span className="text-muted-foreground">→</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Panel>
        )}
      </ReactFlow>

      {/* Filter Panel */}
      {showFilters && (
        <div className="absolute top-4 right-4 w-80 z-10">
          <GraphFilterPanel
            onFilterChange={handleFilterChange}
            onPathFind={enablePathfinding ? handlePathFind : undefined}
            className="shadow-lg"
          />
        </div>
      )}
    </div>
  );
};

export const FilteredGraphVisualization: React.FC<FilteredGraphVisualizationProps> = (props) => {
  return (
    <ReactFlowProvider>
      <FilteredGraphVisualizationInner {...props} />
    </ReactFlowProvider>
  );
};