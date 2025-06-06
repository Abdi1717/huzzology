import React, { useState, useEffect, useCallback } from 'react';
import { Node, Edge } from 'reactflow';
import { generateLargeGraphData } from '@/lib/mock-data';
import BundledGraphVisualization from '@/components/graph/BundledGraphVisualization';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import GraphPerformanceDoc from '@/components/graph/GraphPerformanceDoc';

/**
 * Demo page for showcasing the edge bundling functionality
 */
export default function BundledGraphDemo() {
  // Generate initial dataset
  const [nodeCount, setNodeCount] = useState(50);
  const [edgeMultiplier, setEdgeMultiplier] = useState(2);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Performance monitoring
  const { fps, startMonitoring, stopMonitoring, renderTime } = usePerformanceMonitor();
  
  // Generate new graph data when parameters change
  const generateGraphData = useCallback(() => {
    setLoading(true);
    
    // Use setTimeout to prevent UI freezing on large datasets
    setTimeout(() => {
      const { nodes: generatedNodes, edges: generatedEdges } = generateLargeGraphData(
        nodeCount,
        edgeMultiplier
      );
      
      setNodes(generatedNodes);
      setEdges(generatedEdges);
      setLoading(false);
    }, 0);
  }, [nodeCount, edgeMultiplier]);
  
  // Initial data generation
  useEffect(() => {
    generateGraphData();
    startMonitoring();
    
    return () => {
      stopMonitoring();
    };
  }, []);
  
  // Calculate performance stats
  const performanceStats = {
    fps,
    nodeCount: nodes.length,
    edgeCount: edges.length,
    renderTime,
  };
  
  // Memory usage estimation (rough approximation)
  const estimatedMemoryUsage = (nodes.length * 2 + edges.length * 3) / 1024;
  
  return (
    <div className="flex flex-col h-screen">
      <div className="p-4 border-b">
        <h1 className="text-2xl font-bold">Edge Bundling Demo</h1>
        <p className="text-muted-foreground">
          Demonstrates edge bundling for complex graphs with many connections
        </p>
      </div>
      
      <div className="flex flex-1">
        {/* Main Visualization */}
        <div className="flex-1 relative">
          <BundledGraphVisualization
            nodes={nodes}
            edges={edges}
            performanceStats={performanceStats}
            memoryUsage={estimatedMemoryUsage}
          />
        </div>
        
        {/* Control Panel */}
        <div className="w-72 p-4 border-l overflow-y-auto">
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-2">Data Generation</h2>
              
              {/* Node Count Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="nodeCount">Nodes</Label>
                  <span className="text-sm text-muted-foreground">{nodeCount}</span>
                </div>
                <Slider
                  id="nodeCount"
                  min={10}
                  max={500}
                  step={10}
                  value={[nodeCount]}
                  onValueChange={([value]) => setNodeCount(value)}
                  aria-label="Number of nodes"
                />
              </div>
              
              {/* Edge Multiplier Slider */}
              <div className="space-y-2 mt-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="edgeMultiplier">Edge Density</Label>
                  <span className="text-sm text-muted-foreground">
                    {edgeMultiplier}x ({nodeCount * edgeMultiplier} edges)
                  </span>
                </div>
                <Slider
                  id="edgeMultiplier"
                  min={1}
                  max={5}
                  step={0.5}
                  value={[edgeMultiplier]}
                  onValueChange={([value]) => setEdgeMultiplier(value)}
                  aria-label="Edge multiplier"
                />
              </div>
              
              {/* Generate Button */}
              <Button
                onClick={generateGraphData}
                className="w-full mt-4"
                disabled={loading}
              >
                {loading ? 'Generating...' : 'Generate Graph'}
              </Button>
            </div>
            
            {/* Performance Stats */}
            <div>
              <h2 className="text-lg font-semibold mb-2">Performance Stats</h2>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex flex-col">
                  <span className="text-muted-foreground">FPS</span>
                  <span className="font-mono">{fps.toFixed(1)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Render Time</span>
                  <span className="font-mono">{renderTime.toFixed(1)} ms</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Nodes</span>
                  <span className="font-mono">{nodes.length}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Edges</span>
                  <span className="font-mono">{edges.length}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Memory Est.</span>
                  <span className="font-mono">{estimatedMemoryUsage.toFixed(2)} MB</span>
                </div>
              </div>
            </div>
            
            {/* Instructions */}
            <div>
              <h2 className="text-lg font-semibold mb-2">Instructions</h2>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>Use the sliders to adjust the graph size</li>
                <li>Enable edge bundling in the top-right panel</li>
                <li>Adjust bundling strength and other parameters</li>
                <li>Toggle between force-directed and hierarchical bundling</li>
                <li>Click the "Re-layout Graph" button to reorganize</li>
              </ul>
            </div>
            
            {/* Documentation */}
            <GraphPerformanceDoc />
          </div>
        </div>
      </div>
    </div>
  );
} 