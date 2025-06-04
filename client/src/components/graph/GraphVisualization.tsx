/**
 * GraphVisualization Component
 * 
 * Main graph visualization component using ReactFlow with custom archetype nodes
 */

import React, { useCallback, useMemo, useState, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,

  ReactFlowProvider,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { ArchetypeNode } from './ArchetypeNode';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  GraphComponentProps, 
  ArchetypeNode as ArchetypeNodeType, 
  ArchetypeEdge,
  GraphLayoutOptions,
  GraphStats
} from '@/types/graph';
import { applyLayout } from '@/lib/graph-layout';
import { cn } from '@/lib/utils';

// Define custom node types for ReactFlow
const nodeTypes = {
  archetypeNode: ArchetypeNode,
};

/**
 * Main graph visualization component
 */
export const GraphVisualization: React.FC<GraphComponentProps> = ({
  nodes: initialNodes,
  edges: initialEdges,
  layout = { algorithm: 'dagre', direction: 'TB' },

  events,
  className,
  height = '100%',
  width = '100%',
  interactive = true,
  showMinimap = true,
  showControls = true,
  showBackground = true,
}) => {
  // ReactFlow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  // Layout state
  const [currentLayout, setCurrentLayout] = useState<GraphLayoutOptions>(layout);
  const [isLayouting, setIsLayouting] = useState(false);

  // Apply layout when nodes/edges or layout options change
  useEffect(() => {
    if (initialNodes.length === 0) return;
    
    setIsLayouting(true);
    
    // Apply the selected layout algorithm
    const layoutResult = applyLayout(initialNodes, initialEdges, currentLayout);
    
    // Convert to ReactFlow format
    const reactFlowNodes = layoutResult.nodes.map(node => ({
      ...node,
      type: 'archetypeNode',
    }));
    
    setNodes(reactFlowNodes);
    setEdges(initialEdges);
    setIsLayouting(false);
  }, [initialNodes, initialEdges, currentLayout, setNodes, setEdges]);

  // Handle edge connections
  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge: ArchetypeEdge = {
        ...params,
        id: `${params.source}-${params.target}`,
        type: 'influence',
        data: { strength: 0.5 },
      } as ArchetypeEdge;
      
      setEdges((eds) => addEdge(newEdge, eds));
      events?.onEdgeClick?.(newEdge);
    },
    [setEdges, events]
  );

  // Handle node clicks
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: any) => {
      events?.onNodeClick?.(node as ArchetypeNodeType);
    },
    [events]
  );

  // Handle node double clicks
  const onNodeDoubleClick = useCallback(
    (_event: React.MouseEvent, node: any) => {
      events?.onNodeDoubleClick?.(node as ArchetypeNodeType);
    },
    [events]
  );

  // Handle background clicks
  const onPaneClick = useCallback(() => {
    events?.onBackgroundClick?.();
  }, [events]);

  // Calculate graph statistics
  const stats: GraphStats = useMemo(() => {
    const categories = new Map<string, number>();
    const platforms = new Map<string, number>();
    let totalInfluence = 0;

    nodes.forEach((node) => {
      const { data } = node;
      
      // Count categories
      if (data.metadata.category) {
        categories.set(
          data.metadata.category,
          (categories.get(data.metadata.category) || 0) + 1
        );
      }
      
      // Count platforms
      data.metadata.platforms?.forEach((platform: string) => {
        platforms.set(platform, (platforms.get(platform) || 0) + 1);
      });
      
      // Sum influence scores
      totalInfluence += data.metadata.influence_score || 0;
    });

    return {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      averageInfluence: nodes.length > 0 ? totalInfluence / nodes.length : 0,
      topCategories: Array.from(categories.entries())
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      topPlatforms: Array.from(platforms.entries())
        .map(([platform, count]) => ({ platform, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
    };
  }, [nodes, edges]);

  // Handle layout algorithm change
  const handleLayoutChange = (algorithm: GraphLayoutOptions['algorithm']) => {
    setCurrentLayout(prev => ({ ...prev, algorithm }));
  };

  // Handle layout direction change
  const handleDirectionChange = (direction: string) => {
    setCurrentLayout(prev => ({ ...prev, direction: direction as GraphLayoutOptions['direction'] }));
  };

  return (
    <div className={cn("w-full h-full relative", className)} style={{ height, width }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={interactive ? onConnect : undefined}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        className="bg-background"
      >
        {showBackground && (
          <Background 
            color="#aaa" 
            gap={16} 
          />
        )}
        
        {showControls && <Controls />}
        
        {showMinimap && (
          <MiniMap 
            nodeColor={(node) => {
              const archetypeNode = node as ArchetypeNodeType;
              return archetypeNode.data?.color || '#6366f1';
            }}
            maskColor="rgb(240, 240, 240, 0.6)"
            position="top-right"
          />
        )}

        {/* Control Panel */}
        <Panel position="top-left" className="space-y-2">
          <Card className="w-64">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Layout Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Algorithm Selection */}
              <div className="space-y-1">
                <label className="text-xs font-medium">Algorithm</label>
                <Select 
                  value={currentLayout.algorithm} 
                  onValueChange={handleLayoutChange}
                  disabled={isLayouting}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dagre">Dagre (Hierarchical)</SelectItem>
                    <SelectItem value="force">Force-Directed</SelectItem>
                    <SelectItem value="circular">Circular</SelectItem>
                    <SelectItem value="hierarchical">Hierarchical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Direction Selection (for Dagre) */}
              {currentLayout.algorithm === 'dagre' && (
                <div className="space-y-1">
                  <label className="text-xs font-medium">Direction</label>
                  <Select 
                    value={currentLayout.direction} 
                    onValueChange={handleDirectionChange}
                    disabled={isLayouting}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TB">Top to Bottom</SelectItem>
                      <SelectItem value="BT">Bottom to Top</SelectItem>
                      <SelectItem value="LR">Left to Right</SelectItem>
                      <SelectItem value="RL">Right to Left</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Loading indicator */}
              {isLayouting && (
                <div className="text-xs text-muted-foreground">
                  Applying layout...
                </div>
              )}
            </CardContent>
          </Card>

          {/* Graph Statistics */}
          <Card className="w-64">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Graph Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Nodes:</span>
                  <span className="ml-1 font-medium">{stats.totalNodes}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Edges:</span>
                  <span className="ml-1 font-medium">{stats.totalEdges}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Avg Influence:</span>
                  <span className="ml-1 font-medium">
                    {Math.round(stats.averageInfluence * 100)}%
                  </span>
                </div>
              </div>
              
              {stats.topCategories.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Top Categories:</div>
                  <div className="flex flex-wrap gap-1">
                    {stats.topCategories.slice(0, 3).map(({ category, count }) => (
                      <Badge key={category} variant="outline" className="text-xs">
                        {category} ({count})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </Panel>
      </ReactFlow>
    </div>
  );
};

/**
 * Wrapper component with ReactFlowProvider
 */
export const GraphVisualizationProvider: React.FC<GraphComponentProps> = (props) => {
  return (
    <ReactFlowProvider>
      <GraphVisualization {...props} />
    </ReactFlowProvider>
  );
};

export default GraphVisualizationProvider; 