/**
 * Routes Configuration
 * 
 * Centralized routing configuration with TypeScript support
 */

import { createBrowserRouter, RouteObject } from 'react-router-dom';
import { HomePage } from '@/pages/HomePage';
import { GraphDemo } from '@/pages/GraphDemo';
import { ExplorePage } from '@/pages/ExplorePage';
import { ComponentShowcase } from '@/pages/ComponentShowcase';
import { LayoutDemo } from '@/pages/LayoutDemo';
import ApiDemo from '@/pages/ApiDemo';
import { ArchetypePanelDemo } from '@/pages/demo/ArchetypePanelDemo';
import BundledGraphDemo from '@/pages/demo/BundledGraphDemo';
import { FilteredGraphDemo } from '@/pages/demo/FilteredGraphDemo';
import { Layout } from '@/components/Layout';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Route path constants for type safety
export const ROUTES = {
  HOME: '/',
  EXPLORE: '/explore',
  GRAPH: '/graph',
  TRENDING: '/trending',
  ANALYTICS: '/analytics',
  SEARCH: '/search',
  ARCHETYPE: '/archetype/:id',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  COMPONENTS: '/components', // Development route
  LAYOUT: '/layout', // Layout demo route
  API: '/api', // API demo route
  ARCHETYPE_PANEL_DEMO: '/demo/archetype-panel', // Archetype panel demo route
  BUNDLED_GRAPH_DEMO: '/demo/bundled-graph', // Edge bundling demo route
  FILTERED_GRAPH_DEMO: '/demo/filtered-graph', // API integration and filtering demo route
} as const;

// Type for route parameters
export type RouteParams = {
  '/archetype/:id': { id: string };
  '/search': { q?: string };
};

// Route configuration
const routes: RouteObject[] = [
  {
    path: '/',
    element: <Layout />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'explore',
        element: <ExplorePage />,
      },
      {
        path: 'graph',
        element: <GraphDemo />,
      },
      {
        path: 'components',
        element: <ComponentShowcase />,
      },
      {
        path: 'layout',
        element: <LayoutDemo />,
      },
      {
        path: 'api',
        element: <ApiDemo />,
      },
      {
        path: 'demo/archetype-panel',
        element: <ArchetypePanelDemo />,
      },
      {
        path: 'demo/bundled-graph',
        element: <BundledGraphDemo />,
      },
      {
        path: 'demo/filtered-graph',
        element: <FilteredGraphDemo />,
      },
      // Placeholder routes for future implementation
      {
        path: 'trending',
        element: <div className="p-8 text-center">Trending page coming soon...</div>,
      },
      {
        path: 'analytics',
        element: <div className="p-8 text-center">Analytics page coming soon...</div>,
      },
      {
        path: 'search',
        element: <div className="p-8 text-center">Search results page coming soon...</div>,
      },
      {
        path: 'archetype/:id',
        element: <div className="p-8 text-center">Archetype detail page coming soon...</div>,
      },
      {
        path: 'profile',
        element: <div className="p-8 text-center">Profile page coming soon...</div>,
      },
      {
        path: 'settings',
        element: <div className="p-8 text-center">Settings page coming soon...</div>,
      },
    ],
  },
];

// Create router instance
export const router = createBrowserRouter(routes);

// Helper function to generate routes with parameters
export const getRoute = <T extends keyof typeof ROUTES>(
  route: T,
  params?: Record<string, string>
): string => {
  let path = ROUTES[route] as string;
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      path = path.replace(`:${key}`, value);
    });
  }
  
  return path;
}; 