/**
 * GraphPage Component
 * 
 * Interactive graph visualization of archetype relationships
 * Prepared for XYreact/Dagre integration
 */

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useArchetypeStore } from '@/stores/archetypeStore';
import { useArchetypeData } from '@/hooks/useArchetypeData';

export const GraphPage = () => {
  const [selectedLayout, setSelectedLayout] = useState<'force' | 'hierarchical' | 'circular'>('force');
  
  const {
    archetypes,
    selectedArchetype,
    setSelectedArchetype,
    viewMode,
    setViewMode,
  } = useArchetypeStore();
  
  const { isLoading } = useArchetypeData();

  const selectedArchetypeData = archetypes.find(a => a.id === selectedArchetype);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Archetype Network
          </h1>
          <p className="text-muted-foreground mb-6">
            Explore the relationships and influences between cultural archetypes
          </p>
          
          {/* Controls */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex gap-2">
              <Button
                variant={selectedLayout === 'force' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedLayout('force')}
              >
                Force Layout
              </Button>
              <Button
                variant={selectedLayout === 'hierarchical' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedLayout('hierarchical')}
              >
                Hierarchical
              </Button>
              <Button
                variant={selectedLayout === 'circular' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedLayout('circular')}
              >
                Circular
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'graph' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('graph')}
              >
                Graph View
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                List View
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Graph Visualization Area */}
          <div className="lg:col-span-3">
            <Card className="h-[600px]">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Network Visualization</span>
                  <Badge variant="outline">
                    {archetypes.length} nodes
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Interactive graph showing archetype relationships and influences
                </CardDescription>
              </CardHeader>
              <CardContent className="h-full">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Loading graph...</p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full bg-muted/20 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-6xl mb-4">🕸️</div>
                      <h3 className="text-lg font-semibold mb-2">Graph Visualization</h3>
                      <p className="text-muted-foreground mb-4">
                        XYreact/Dagre integration will be implemented here
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        <Badge variant="outline">Force-directed layout</Badge>
                        <Badge variant="outline">Interactive nodes</Badge>
                        <Badge variant="outline">Relationship edges</Badge>
                        <Badge variant="outline">Zoom & pan</Badge>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedArchetypeData ? 'Selected Archetype' : 'Graph Info'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedArchetypeData ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-lg mb-2">
                        {selectedArchetypeData.label}
                      </h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        {selectedArchetypeData.description}
                      </p>
                    </div>
                    
                    <div>
                      <h5 className="font-medium mb-2">Keywords</h5>
                      <div className="flex flex-wrap gap-1">
                        {selectedArchetypeData.keywords.map((keyword) => (
                          <Badge key={keyword} variant="secondary" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="font-medium mb-2">Platforms</h5>
                      <div className="flex flex-wrap gap-1">
                        {selectedArchetypeData.metadata.platforms.map((platform) => (
                          <Badge key={platform} variant="outline" className="text-xs">
                            {platform}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="font-medium mb-2">Influence Score</h5>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full"
                            style={{ 
                              width: `${selectedArchetypeData.metadata.influence_score * 100}%` 
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium">
                          {Math.round(selectedArchetypeData.metadata.influence_score * 100)}%
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="font-medium mb-2">Connections</h5>
                      <p className="text-sm text-muted-foreground">
                        {selectedArchetypeData.influences.length} related archetype{selectedArchetypeData.influences.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => setSelectedArchetype(null)}
                    >
                      Clear Selection
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Network Overview</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Archetypes:</span>
                          <span className="font-medium">{archetypes.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Layout:</span>
                          <span className="font-medium capitalize">{selectedLayout}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">View Mode:</span>
                          <span className="font-medium capitalize">{viewMode}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="font-medium mb-2">Instructions</h5>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Click nodes to select archetypes</li>
                        <li>• Drag to pan the view</li>
                        <li>• Scroll to zoom in/out</li>
                        <li>• Use layout controls to change arrangement</li>
                      </ul>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}; 