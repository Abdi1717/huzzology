/**
 * Graph Demo Page
 * 
 * Demonstration of the graph visualization components with sample data
 */

import React, { useState } from 'react';
import { GraphVisualizationProvider } from '@/components/graph';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockEdges, mockArchetypes } from '@/lib/mock-data';
import { ArchetypeNode as ArchetypeNodeType, GraphEvents } from '@/types/graph';

export const GraphDemo: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<ArchetypeNodeType | null>(null);
  const [selectedLayout, setSelectedLayout] = useState<'dagre' | 'force' | 'circular'>('dagre');

  // Convert mockArchetypes to graph nodes
  const mockNodes: ArchetypeNodeType[] = mockArchetypes.map((archetype, index) => ({
    id: archetype.id,
    type: 'archetypeNode' as const,
    position: { x: (index % 3) * 200, y: Math.floor(index / 3) * 200 },
    data: {
      id: archetype.id,
      label: archetype.label,
      description: archetype.description,
      keywords: archetype.keywords,
      influences: archetype.influences,
      examples: archetype.examples,
      color: archetype.color,
      metadata: {
        origin_date: archetype.metadata.origin_date,
        peak_popularity: archetype.metadata.peak_popularity,
        influence_score: archetype.metadata.influence_score,
        platforms: archetype.metadata.platforms,
        trending: archetype.metadata.trending,
        category: archetype.metadata.category,
      },
    },
  }));

  // Graph event handlers
  const graphEvents: GraphEvents = {
    onNodeClick: (node) => setSelectedNode(node),
    onBackgroundClick: () => setSelectedNode(null),
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Graph Visualization Demo</h1>
        <p className="text-muted-foreground">
          Interactive visualization of women's pop culture archetypes
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card className="h-[600px]">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle>Archetype Network</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant={selectedLayout === 'dagre' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedLayout('dagre')}
                  >
                    Hierarchical
                  </Button>
                  <Button
                    variant={selectedLayout === 'force' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedLayout('force')}
                  >
                    Force
                  </Button>
                  <Button
                    variant={selectedLayout === 'circular' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedLayout('circular')}
                  >
                    Circular
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 h-[500px]">
              <GraphVisualizationProvider
                nodes={mockNodes}
                edges={mockEdges}
                layout={{ algorithm: selectedLayout, direction: 'TB' }}
                events={graphEvents}
                height="100%"
                showMinimap={true}
                showControls={true}
                showBackground={true}
                interactive={true}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {selectedNode ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: selectedNode.data.color }}
                  />
                  {selectedNode.data.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {selectedNode.data.description}
                </p>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Influence Score</h4>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-secondary rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${selectedNode.data.metadata.influence_score * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">
                      {Math.round(selectedNode.data.metadata.influence_score * 100)}%
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Platforms</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedNode.data.metadata.platforms.map((platform) => (
                      <Badge key={platform} variant="outline" className="text-xs">
                        {platform}
                      </Badge>
                    ))}
                  </div>
                </div>

                {selectedNode.data.metadata.trending && (
                  <Badge className="bg-yellow-100 text-yellow-800">
                    🔥 Trending
                  </Badge>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                Click on a node to see details
              </CardContent>
            </Card>
          )}

          {/* Graph Statistics */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Network Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Nodes:</span>
                  <span className="ml-1 font-medium">{mockNodes.length}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Edges:</span>
                  <span className="ml-1 font-medium">{mockEdges.length}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Categories</h4>
                <div className="space-y-1">
                  {['Beauty', 'Lifestyle', 'Fashion', 'Aesthetic'].map((category) => {
                    const count = mockArchetypes.filter(a => a.metadata.category === category).length;
                    return (
                      <div key={category} className="flex justify-between text-xs">
                        <span>{category}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Trending</h4>
                <div className="text-xs">
                  {mockArchetypes.filter(a => a.metadata.trending).length} of {mockArchetypes.length} archetypes
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle>About This Demo</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="features" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="interactions">Interactions</TabsTrigger>
              <TabsTrigger value="data">Data Structure</TabsTrigger>
            </TabsList>
            
            <TabsContent value="features" className="space-y-3">
              <h3 className="font-medium">Graph Visualization Features</h3>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Multiple layout algorithms (Dagre, Force-directed, Circular)</li>
                <li>Interactive node and edge selection</li>
                <li>Real-time layout switching</li>
                <li>Minimap for navigation</li>
                <li>Zoom and pan controls</li>
                <li>Custom node styling with archetype data</li>
                <li>Relationship visualization with typed edges</li>
              </ul>
            </TabsContent>
            
            <TabsContent value="interactions" className="space-y-3">
              <h3 className="font-medium">Available Interactions</h3>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Click nodes to view detailed information</li>
                <li>Double-click nodes for expanded view (future feature)</li>
                <li>Drag nodes to reposition them</li>
                <li>Use mouse wheel to zoom in/out</li>
                <li>Click and drag background to pan</li>
                <li>Use minimap for quick navigation</li>
                <li>Switch layout algorithms with buttons</li>
              </ul>
            </TabsContent>
            
            <TabsContent value="data" className="space-y-3">
              <h3 className="font-medium">Data Structure</h3>
              <p className="text-sm text-muted-foreground">
                Each archetype node contains rich metadata including influence scores, 
                platform presence, trending status, content examples, and relationship data. 
                Edges represent different types of connections: influence, similarity, and evolution.
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default GraphDemo; 