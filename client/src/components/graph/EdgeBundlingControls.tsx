import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { EdgeBundlingOptions } from '@/utils/edge-bundling';

interface EdgeBundlingControlsProps {
  options: EdgeBundlingOptions;
  onChange: (options: EdgeBundlingOptions) => void;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

/**
 * Control panel for adjusting edge bundling settings
 */
export function EdgeBundlingControls({
  options,
  onChange,
  enabled,
  onToggle,
}: EdgeBundlingControlsProps) {
  // Handle option changes
  const handleOptionChange = <K extends keyof EdgeBundlingOptions>(
    key: K,
    value: EdgeBundlingOptions[K]
  ) => {
    onChange({
      ...options,
      [key]: value,
    });
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Edge Bundling</CardTitle>
          <Switch
            checked={enabled}
            onCheckedChange={onToggle}
            aria-label="Enable edge bundling"
          />
        </div>
        <CardDescription>
          Bundle similar edges to reduce visual clutter
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bundling Strength Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="strength">Bundling Strength</Label>
            <span className="text-xs text-muted-foreground">
              {(options.strength || 0.5).toFixed(1)}
            </span>
          </div>
          <Slider
            id="strength"
            min={0}
            max={1}
            step={0.1}
            value={[options.strength || 0.5]}
            onValueChange={([value]) => handleOptionChange('strength', value)}
            disabled={!enabled}
            aria-label="Bundling strength"
          />
          <p className="text-xs text-muted-foreground">
            Higher values create tighter bundles
          </p>
        </div>

        {/* Distance Threshold Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="distanceThreshold">Distance Threshold</Label>
            <span className="text-xs text-muted-foreground">
              {options.distanceThreshold || 50}px
            </span>
          </div>
          <Slider
            id="distanceThreshold"
            min={10}
            max={100}
            step={5}
            value={[options.distanceThreshold || 50]}
            onValueChange={([value]) => handleOptionChange('distanceThreshold', value)}
            disabled={!enabled}
            aria-label="Distance threshold"
          />
          <p className="text-xs text-muted-foreground">
            Maximum distance between edges to be considered for bundling
          </p>
        </div>

        {/* Max Bundle Size Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="maxBundleSize">Max Bundle Size</Label>
            <span className="text-xs text-muted-foreground">
              {options.maxBundleSize || 10} edges
            </span>
          </div>
          <Slider
            id="maxBundleSize"
            min={2}
            max={20}
            step={1}
            value={[options.maxBundleSize || 10]}
            onValueChange={([value]) => handleOptionChange('maxBundleSize', value)}
            disabled={!enabled}
            aria-label="Maximum bundle size"
          />
          <p className="text-xs text-muted-foreground">
            Maximum number of edges to include in a single bundle
          </p>
        </div>

        {/* Angle Threshold Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="angleThreshold">Angle Threshold</Label>
            <span className="text-xs text-muted-foreground">
              {options.angleThreshold || 15}°
            </span>
          </div>
          <Slider
            id="angleThreshold"
            min={5}
            max={45}
            step={5}
            value={[options.angleThreshold || 15]}
            onValueChange={([value]) => handleOptionChange('angleThreshold', value)}
            disabled={!enabled}
            aria-label="Angle threshold"
          />
          <p className="text-xs text-muted-foreground">
            Maximum angle difference for edges to be bundled together
          </p>
        </div>

        {/* Hierarchical Bundling Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="hierarchical">Hierarchical Bundling</Label>
            <p className="text-xs text-muted-foreground">
              Use hierarchical instead of force-directed bundling
            </p>
          </div>
          <Switch
            id="hierarchical"
            checked={options.hierarchical || false}
            onCheckedChange={(checked) => handleOptionChange('hierarchical', checked)}
            disabled={!enabled}
            aria-label="Use hierarchical bundling"
          />
        </div>

        {/* Simplification Level Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="simplificationLevel">Simplification Level</Label>
            <span className="text-xs text-muted-foreground">
              {options.simplificationLevel || 1}
            </span>
          </div>
          <Slider
            id="simplificationLevel"
            min={1}
            max={5}
            step={1}
            value={[options.simplificationLevel || 1]}
            onValueChange={([value]) => handleOptionChange('simplificationLevel', value)}
            disabled={!enabled}
            aria-label="Simplification level"
          />
          <p className="text-xs text-muted-foreground">
            Higher values simplify paths for better performance
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default EdgeBundlingControls; 