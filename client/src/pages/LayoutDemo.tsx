/**
 * Layout Demo Page
 * 
 * Demonstrates different layout options and theme switching capabilities
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTheme } from '@/contexts/ThemeContext';
import { Monitor, Sun, Moon, LayoutIcon, Sidebar, Minimize, Maximize } from 'lucide-react';

type LayoutType = 'default' | 'sidebar' | 'minimal' | 'fullscreen';

export const LayoutDemo: React.FC = () => {
  const [currentLayout, setCurrentLayout] = useState<LayoutType>('default');
  const { theme, setTheme, actualTheme } = useTheme();

  const layoutOptions: Array<{
    type: LayoutType;
    label: string;
    description: string;
    icon: React.ComponentType<any>;
    features: string[];
  }> = [
    {
      type: 'default',
      label: 'Default Layout',
      description: 'Standard layout with header, main content, and footer',
      icon: LayoutIcon,
      features: ['Header navigation', 'Footer', 'Responsive container', 'Centered content'],
    },
    {
      type: 'sidebar',
      label: 'Sidebar Layout',
      description: 'Layout with collapsible sidebar for navigation',
      icon: Sidebar,
      features: ['Collapsible sidebar', 'Header with toggle', 'Full-height layout', 'Mobile responsive'],
    },
    {
      type: 'minimal',
      label: 'Minimal Layout',
      description: 'Clean layout with just the main content area',
      icon: Minimize,
      features: ['No header/footer', 'Full content area', 'Minimal chrome', 'Focus on content'],
    },
    {
      type: 'fullscreen',
      label: 'Fullscreen Layout',
      description: 'Immersive fullscreen layout for applications',
      icon: Maximize,
      features: ['No navigation', 'Full viewport', 'Immersive experience', 'App-like interface'],
    },
  ];

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Layout & Theme System Demo</h1>
          <p className="text-muted-foreground">
            Explore different layout options and theme switching capabilities
          </p>
        </div>

        {/* Current Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Current Configuration
              <Badge variant="outline">Live Preview</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Active Layout</h4>
                <Badge variant="secondary" className="text-sm">
                  {layoutOptions.find(l => l.type === currentLayout)?.label}
                </Badge>
              </div>
              <div>
                <h4 className="font-medium mb-2">Active Theme</h4>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-sm">
                    {theme} {theme === 'system' && `(${actualTheme})`}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demo Content */}
        <Tabs defaultValue="layouts" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="layouts">Layout Options</TabsTrigger>
            <TabsTrigger value="themes">Theme System</TabsTrigger>
          </TabsList>

          <TabsContent value="layouts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Layout Switching</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Click on any layout option below to see it in action
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {layoutOptions.map((layout) => {
                    const Icon = layout.icon;
                    const isActive = currentLayout === layout.type;
                    
                    return (
                      <Card 
                        key={layout.type}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          isActive ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => setCurrentLayout(layout.type)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-2">
                            <Icon className="h-5 w-5" />
                            <CardTitle className="text-lg">{layout.label}</CardTitle>
                            {isActive && <Badge>Active</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {layout.description}
                          </p>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <h5 className="text-sm font-medium">Features:</h5>
                            <ul className="text-sm text-muted-foreground space-y-1">
                              {layout.features.map((feature, index) => (
                                <li key={index} className="flex items-center gap-2">
                                  <div className="w-1 h-1 bg-current rounded-full" />
                                  {feature}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="themes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Theme System</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Switch between light, dark, and system themes
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Theme Switcher */}
                <div className="space-y-3">
                  <h4 className="font-medium">Theme Options</h4>
                  <div className="flex gap-2">
                    {themeOptions.map((option) => {
                      const Icon = option.icon;
                      const isActive = theme === option.value;
                      
                      return (
                        <Button
                          key={option.value}
                          variant={isActive ? 'default' : 'outline'}
                          onClick={() => setTheme(option.value as any)}
                          className="flex items-center gap-2"
                        >
                          <Icon className="h-4 w-4" />
                          {option.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Theme Preview */}
                <div className="space-y-3">
                  <h4 className="font-medium">Color Palette Preview</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <div className="h-12 bg-background border rounded" />
                      <p className="text-xs text-center">Background</p>
                    </div>
                    <div className="space-y-2">
                      <div className="h-12 bg-foreground rounded" />
                      <p className="text-xs text-center">Foreground</p>
                    </div>
                    <div className="space-y-2">
                      <div className="h-12 bg-primary rounded" />
                      <p className="text-xs text-center">Primary</p>
                    </div>
                    <div className="space-y-2">
                      <div className="h-12 bg-accent rounded" />
                      <p className="text-xs text-center">Accent</p>
                    </div>
                  </div>
                </div>

                {/* Theme Features */}
                <div className="space-y-3">
                  <h4 className="font-medium">Theme Features</h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-current rounded-full" />
                      Automatic system theme detection
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-current rounded-full" />
                      Persistent theme preference storage
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-current rounded-full" />
                      Smooth transitions between themes
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-current rounded-full" />
                      CSS custom properties for theming
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-current rounded-full" />
                      Tailwind CSS dark mode integration
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Sample Content */}
        <Card>
          <CardHeader>
            <CardTitle>Sample Content</CardTitle>
            <p className="text-sm text-muted-foreground">
              This content demonstrates how the layout system works with different content types
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }, (_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Sample Card {i + 1}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      This is sample content to demonstrate how the layout system 
                      handles different types of content and maintains proper spacing.
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
  );
};

export default LayoutDemo; 