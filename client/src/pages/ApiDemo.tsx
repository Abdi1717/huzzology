/**
 * API Demo Page
 * 
 * Demonstrates the data fetching and API integration layer
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Search, Plus, Edit, Trash2, TrendingUp, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// API Hooks
import {
  useArchetypes,
  useArchetype,
  useCreateArchetype,
  useUpdateArchetype,
  useDeleteArchetype,
  useArchetypeRelationships,
  useTrendingArchetypes,
  useSearchArchetypes,
  useMultipleApi,
} from '@/hooks/useApi';

// Store
import { useArchetypeStore } from '@/stores/archetypeStore';

// Types
import { ArchetypeNode } from '@/types/archetype';
import { CreateArchetypeRequest } from '@/lib/api-client';

export default function ApiDemo() {
  const { toast } = useToast();
  const { archetypes, edges, isLoading: storeLoading, error: storeError } = useArchetypeStore();

  // State for forms and interactions
  const [selectedArchetypeId, setSelectedArchetypeId] = useState<string>('');
  const [searchQueryText, setSearchQueryText] = useState<string>('');
  const [createForm, setCreateForm] = useState<CreateArchetypeRequest>({
    label: '',
    description: '',
    keywords: [],
    color: '#8B5CF6',
    platforms: ['TikTok'],
  });

  // API Hooks
  const archetypesQuery = useArchetypes(
    { page: 1, limit: 10, sortBy: 'popularity', sortOrder: 'desc' },
    {
      onSuccess: () => toast({ title: 'Success', description: 'Archetypes loaded successfully' }),
      onError: (error) => toast({ title: 'Error', description: error.message, variant: 'destructive' }),
    }
  );

  const archetypeQuery = useArchetype(selectedArchetypeId, {
    onSuccess: (data) => toast({ title: 'Success', description: `Loaded archetype: ${data.label}` }),
  });

  const createMutation = useCreateArchetype({
    onSuccess: (data) => {
      toast({ title: 'Success', description: `Created archetype: ${data.label}` });
      setCreateForm({
        label: '',
        description: '',
        keywords: [],
        color: '#8B5CF6',
        platforms: ['TikTok'],
      });
      archetypesQuery.retry();
    },
    onError: (error) => toast({ title: 'Error', description: error.message, variant: 'destructive' }),
  });

  const updateMutation = useUpdateArchetype({
    onSuccess: (data) => {
      toast({ title: 'Success', description: `Updated archetype: ${data.label}` });
      archetypesQuery.retry();
    },
  });

  const deleteMutation = useDeleteArchetype({
    onSuccess: () => {
      toast({ title: 'Success', description: 'Archetype deleted successfully' });
      archetypesQuery.retry();
    },
  });

  const relationshipsQuery = useArchetypeRelationships({
    onSuccess: (data) => toast({ title: 'Success', description: `Loaded ${data.length} relationships` }),
  });

  const trendingQuery = useTrendingArchetypes(5, {
    onSuccess: (data) => toast({ title: 'Success', description: `Found ${data.length} trending archetypes` }),
  });

  const searchQuery = useSearchArchetypes(searchQueryText, 10, {
    onSuccess: (data) => toast({ title: 'Success', description: `Found ${data.length} search results` }),
  });

  // Multiple API calls demo
  const multipleApiQuery = useMultipleApi(
    {
      trending: () => import('@/lib/api-client').then(({ apiClient }) => apiClient.getTrendingArchetypes(3)),
      relationships: () => import('@/lib/api-client').then(({ apiClient }) => apiClient.getArchetypeRelationships()),
    },
    {
      immediate: false,
      onSuccess: (data) => toast({ 
        title: 'Success', 
        description: `Loaded ${data.trending.length} trending + ${data.relationships.length} relationships` 
      }),
    }
  );

  // Handlers
  const handleCreateArchetype = async () => {
    if (!createForm.label || !createForm.description) {
      toast({ title: 'Error', description: 'Label and description are required', variant: 'destructive' });
      return;
    }

    await createMutation.createArchetype({
      ...createForm,
      keywords: createForm.keywords.length > 0 ? createForm.keywords : createForm.label.split(' '),
    });
  };

  const handleUpdateArchetype = async (archetype: ArchetypeNode) => {
    await updateMutation.updateArchetype({
      id: archetype.id,
      label: archetype.label + ' (Updated)',
      description: archetype.description + ' - Updated via API demo',
    });
  };

  const handleDeleteArchetype = async (id: string) => {
    if (confirm('Are you sure you want to delete this archetype?')) {
      await deleteMutation.deleteArchetype(id);
    }
  };

  const handleSearch = () => {
    if (searchQueryText.trim()) {
      searchQuery.retry();
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">API Integration Demo</h1>
        <p className="text-muted-foreground">
          Comprehensive demonstration of data fetching and API integration layer
        </p>
      </div>

      {/* Store State Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Store State Overview
          </CardTitle>
          <CardDescription>Current state from Zustand store</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{archetypes.length}</div>
              <div className="text-sm text-muted-foreground">Archetypes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{edges.length}</div>
              <div className="text-sm text-muted-foreground">Relationships</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {storeLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : '✓'}
              </div>
              <div className="text-sm text-muted-foreground">Status</div>
            </div>
          </div>
          {storeError && (
            <Alert variant="destructive">
              <AlertDescription>{storeError}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fetch Archetypes */}
        <Card>
          <CardHeader>
            <CardTitle>Fetch Archetypes</CardTitle>
            <CardDescription>Load paginated archetypes with filtering</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => archetypesQuery.retry()} 
              disabled={archetypesQuery.loading}
              className="w-full"
            >
              {archetypesQuery.loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reload Archetypes
            </Button>
            
            {archetypesQuery.error && (
              <Alert variant="destructive">
                <AlertDescription>{archetypesQuery.error}</AlertDescription>
              </Alert>
            )}

            {archetypesQuery.data && (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  Showing {archetypesQuery.data.data.length} of {archetypesQuery.data.pagination.total} archetypes
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {archetypesQuery.data.data.map((archetype) => (
                    <div 
                      key={archetype.id} 
                      className="flex items-center justify-between p-2 border rounded cursor-pointer hover:bg-muted"
                      onClick={() => setSelectedArchetypeId(archetype.id)}
                    >
                      <span className="font-medium">{archetype.label}</span>
                      <Badge variant="secondary">{archetype.metadata.influence_score}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Single Archetype */}
        <Card>
          <CardHeader>
            <CardTitle>Single Archetype</CardTitle>
            <CardDescription>Fetch individual archetype details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter archetype ID"
                value={selectedArchetypeId}
                onChange={(e) => setSelectedArchetypeId(e.target.value)}
              />
              <Button 
                onClick={() => archetypeQuery.retry()} 
                disabled={!selectedArchetypeId || archetypeQuery.loading}
              >
                {archetypeQuery.loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Load
              </Button>
            </div>

            {archetypeQuery.error && (
              <Alert variant="destructive">
                <AlertDescription>{archetypeQuery.error}</AlertDescription>
              </Alert>
            )}

            {archetypeQuery.data && (
              <div className="space-y-2 p-3 border rounded">
                <h4 className="font-semibold">{archetypeQuery.data.label}</h4>
                <p className="text-sm text-muted-foreground">{archetypeQuery.data.description}</p>
                <div className="flex gap-1">
                  {archetypeQuery.data.keywords.map((keyword) => (
                    <Badge key={keyword} variant="outline" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleUpdateArchetype(archetypeQuery.data!)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Update
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => handleDeleteArchetype(archetypeQuery.data!.id)}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Archetype */}
        <Card>
          <CardHeader>
            <CardTitle>Create Archetype</CardTitle>
            <CardDescription>Add a new archetype to the system</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="label">Label</Label>
              <Input
                id="label"
                placeholder="e.g., Clean Girl"
                value={createForm.label}
                onChange={(e) => setCreateForm(prev => ({ ...prev, label: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe this archetype..."
                value={createForm.description}
                onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="keywords">Keywords (comma-separated)</Label>
              <Input
                id="keywords"
                placeholder="minimal, natural, effortless"
                value={createForm.keywords.join(', ')}
                onChange={(e) => setCreateForm(prev => ({ 
                  ...prev, 
                  keywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean)
                }))}
              />
            </div>

            <Button 
              onClick={handleCreateArchetype} 
              disabled={createMutation.loading}
              className="w-full"
            >
              {createMutation.loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Plus className="mr-2 h-4 w-4" />
              Create Archetype
            </Button>
          </CardContent>
        </Card>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle>Search Archetypes</CardTitle>
            <CardDescription>Search through archetype labels and descriptions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search archetypes..."
                value={searchQueryText}
                onChange={(e) => setSearchQueryText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button 
                onClick={handleSearch} 
                disabled={!searchQueryText.trim() || searchQuery.loading}
              >
                {searchQuery.loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {searchQuery.error && (
              <Alert variant="destructive">
                <AlertDescription>{searchQuery.error}</AlertDescription>
              </Alert>
            )}

            {searchQuery.data && (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  Found {searchQuery.data.length} results
                </div>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {searchQuery.data.map((archetype) => (
                    <div key={archetype.id} className="p-2 border rounded">
                      <div className="font-medium">{archetype.label}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {archetype.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trending Archetypes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Trending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => trendingQuery.retry()} 
              disabled={trendingQuery.loading}
              className="w-full mb-4"
            >
              {trendingQuery.loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Load Trending
            </Button>

            {trendingQuery.data && (
              <div className="space-y-2">
                {trendingQuery.data.map((archetype) => (
                  <div key={archetype.id} className="p-2 border rounded">
                    <div className="font-medium text-sm">{archetype.label}</div>
                    <Badge variant="secondary" className="text-xs">
                      {archetype.metadata.influence_score}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Relationships */}
        <Card>
          <CardHeader>
            <CardTitle>Relationships</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => relationshipsQuery.retry()} 
              disabled={relationshipsQuery.loading}
              className="w-full mb-4"
            >
              {relationshipsQuery.loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Load Relationships
            </Button>

            {relationshipsQuery.data && (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  {relationshipsQuery.data.length} relationships
                </div>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {relationshipsQuery.data.slice(0, 5).map((edge) => (
                    <div key={edge.id} className="text-xs p-2 border rounded">
                      {edge.source} → {edge.target}
                      <Badge variant="outline" className="ml-2 text-xs">
                        {edge.data?.label || 'Connection'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Multiple API Calls */}
        <Card>
          <CardHeader>
            <CardTitle>Multiple API Calls</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => multipleApiQuery.execute()} 
              disabled={multipleApiQuery.loading}
              className="w-full mb-4"
            >
              {multipleApiQuery.loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Load Multiple
            </Button>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Trending:</span>
                <span>{multipleApiQuery.states.trending?.success ? '✓' : '⏳'}</span>
              </div>
              <div className="flex justify-between">
                <span>Relationships:</span>
                <span>{multipleApiQuery.states.relationships?.success ? '✓' : '⏳'}</span>
              </div>
              <div className="flex justify-between">
                <span>Overall:</span>
                <span>{multipleApiQuery.allSuccess ? '✓ Complete' : multipleApiQuery.loading ? '⏳ Loading' : '⏸️ Ready'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 