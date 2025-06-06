import React, { useCallback, useMemo, useState, useEffect } from 'react';
import ReactFlow, { 
  Edge, 
  Node, 
  NodeChange, 
  applyNodeChanges, 
  applyEdgeChanges, 
  EdgeChange,
  Controls,
  Background,
  useReactFlow,
  ReactFlowProvider,
  Panel
} from 'reactflow';
import 'reactflow/dist/style.css';

import { ArchetypeNode } from './ArchetypeNode';
import BundledEdge from './BundledEdge';
import { applyLayout } from '@/lib/graph-layout';
import { EdgeBundlingControls } from './EdgeBundlingControls';
import { applyEdgeBundling, EdgeBundlingOptions } from '@/utils/edge-bundling';
import LoadMoreButton from './LoadMoreButton';

interface BundledGraphVisualizationProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange?: (changes: NodeChange[]) => void;
  onEdgesChange?: (changes: EdgeChange[]) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
  memoryUsage?: number;
  performanceStats?: {
    fps: number;
    nodeCount: number;
    edgeCount: number;
    renderTime: number;
  };
}

// Default edge bundling options
const defaultBundlingOptions: EdgeBundlingOptions = {
  strength: 0.5,
  distanceThreshold: 50,
  maxBundleSize: 10,
  angleThreshold: 15,
  hierarchical: false,
  simplificationLevel: 1,
};

/**
 * A React component that displays a graph with bundled edges for improved visualization
 */
export function BundledGraphVisualization({
  nodes: initialNodes,
  edges: initialEdges,
  onNodesChange,
  onEdgesChange,
  onLoadMore,
  hasMore,
  loading,
  memoryUsage,
  performanceStats,
}: BundledGraphVisualizationProps) {
  // State for nodes and edges
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  
  // State for edge bundling
  const [bundlingEnabled, setBundlingEnabled] = useState(false);
  const [bundlingOptions, setBundlingOptions] = useState<EdgeBundlingOptions>(defaultBundlingOptions);
  
  // Access to ReactFlow instance
  const reactFlowInstance = useReactFlow();
  
  // Update nodes when initialNodes change
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes]);
  
  // Update edges when initialEdges change or bundling settings change
  useEffect(() => {
    if (bundlingEnabled && initialEdges.length > 0) {
      // Apply edge bundling
      const bundledEdges = applyEdgeBundling(initialEdges, initialNodes, bundlingOptions);
      setEdges(bundledEdges);
    } else {
      // Use original edges
      setEdges(initialEdges);
    }
  }, [initialEdges, bundlingEnabled, bundlingOptions, initialNodes]);
  
  // Node types configuration
  const nodeTypes = useMemo(() => ({
    archetypeNode: ArchetypeNode,
  }), []);
  
  // Edge types configuration
  const edgeTypes = useMemo(() => ({
    bundledEdge: BundledEdge,
  }), []);
  
  // Handle node changes
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      if (onNodesChange) {
        onNodesChange(changes);
      } else {
        setNodes((nds) => applyNodeChanges(changes, nds));
      }
    },
    [onNodesChange]
  );
  
  // Handle edge changes
  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      if (onEdgesChange) {
        onEdgesChange(changes);
      } else {
        setEdges((eds) => applyEdgeChanges(changes, eds));
      }
    },
    [onEdgesChange]
  );
  
  // Layout the graph when it changes significantly
  const onLayout = useCallback(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = applyLayout(nodes, edges);
    
    // Update nodes with new positions
    setNodes([...layoutedNodes]);
    
    // If bundling is enabled, bundle the edges again after layout
    if (bundlingEnabled) {
      const bundledEdges = applyEdgeBundling(layoutedEdges, layoutedNodes, bundlingOptions);
      setEdges(bundledEdges);
    } else {
      setEdges([...layoutedEdges]);
    }
    
    // Center the graph
    setTimeout(() => {
      reactFlowInstance.fitView({ padding: 0.2 });
    }, 100);
  }, [nodes, edges, reactFlowInstance, bundlingEnabled, bundlingOptions]);
  
  // Perform initial layout
  useEffect(() => {
    if (nodes.length > 0 && edges.length > 0) {
      onLayout();
    }
  }, []);
  
  // Toggle edge bundling
  const handleToggleBundling = useCallback((enabled: boolean) => {
    setBundlingEnabled(enabled);
  }, []);
  
  // Update bundling options
  const handleBundlingOptionsChange = useCallback((options: EdgeBundlingOptions) => {
    setBundlingOptions(options);
  }, []);
  
  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
      >
        <Controls />
        <Background />
        
        {/* Edge Bundling Controls Panel */}
        <Panel position="top-right" className="m-2">
          <EdgeBundlingControls
            options={bundlingOptions}
            onChange={handleBundlingOptionsChange}
            enabled={bundlingEnabled}
            onToggle={handleToggleBundling}
          />
        </Panel>
        
        {/* Layout and Load More Controls */}
        <Panel position="bottom-center" className="m-2 flex gap-4">
          <button
            onClick={onLayout}
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded"
          >
            Re-layout Graph
          </button>
          
          {onLoadMore && (
            <LoadMoreButton
              onClick={onLoadMore}
              hasMore={hasMore || false}
              loading={loading || false}
              memoryUsage={memoryUsage}
            />
          )}
        </Panel>
        
        {/* Performance Stats */}
        {performanceStats && (
          <Panel position="bottom-left" className="m-2 p-2 bg-black/10 rounded text-xs">
            <div>FPS: {performanceStats.fps.toFixed(1)}</div>
            <div>Nodes: {performanceStats.nodeCount}</div>
            <div>Edges: {performanceStats.edgeCount}</div>
            <div>Render: {performanceStats.renderTime.toFixed(1)}ms</div>
            {bundlingEnabled && <div>Bundling: Enabled</div>}
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}

/**
 * Wrap BundledGraphVisualization with ReactFlowProvider
 */
export default function BundledGraphVisualizationWrapper(props: BundledGraphVisualizationProps) {
  return (
    <ReactFlowProvider>
      <BundledGraphVisualization {...props} />
    </ReactFlowProvider>
  );
} 