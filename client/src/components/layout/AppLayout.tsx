/**
 * App Layout Component
 * 
 * Main application layout with responsive design and layout switching
 */

import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';
import { AppFooter } from './AppFooter';

export type LayoutType = 'default' | 'sidebar' | 'minimal' | 'fullscreen';

interface AppLayoutProps {
  children?: React.ReactNode;
  layout?: LayoutType;
  className?: string;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  layout = 'default',
  className,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleSidebarCollapse = () => setSidebarCollapsed(!sidebarCollapsed);

  // Layout configurations
  const layoutConfig = {
    default: {
      showHeader: true,
      showSidebar: false,
      showFooter: true,
      containerClass: 'container mx-auto px-4',
    },
    sidebar: {
      showHeader: true,
      showSidebar: true,
      showFooter: false,
      containerClass: 'flex-1 overflow-hidden',
    },
    minimal: {
      showHeader: false,
      showSidebar: false,
      showFooter: false,
      containerClass: 'w-full h-full',
    },
    fullscreen: {
      showHeader: false,
      showSidebar: false,
      showFooter: false,
      containerClass: 'w-screen h-screen overflow-hidden',
    },
  };

  const config = layoutConfig[layout];

  if (layout === 'fullscreen') {
    return (
      <div className="w-screen h-screen overflow-hidden bg-background">
        <main className="w-full h-full">
          {children || <Outlet />}
        </main>
      </div>
    );
  }

  if (layout === 'minimal') {
    return (
      <div className="min-h-screen bg-background">
        <main className={cn(config.containerClass, className)}>
          {children || <Outlet />}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      {config.showHeader && (
        <AppHeader
          onToggleSidebar={config.showSidebar ? toggleSidebar : undefined}
          sidebarOpen={sidebarOpen}
        />
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {config.showSidebar && (
          <AppSidebar
            open={sidebarOpen}
            collapsed={sidebarCollapsed}
            onToggleCollapse={toggleSidebarCollapse}
            onClose={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main 
          className={cn(
            'flex-1 overflow-auto',
            config.containerClass,
            className,
            {
              'transition-all duration-300': config.showSidebar,
              'ml-0': !config.showSidebar,
              'lg:ml-64': config.showSidebar && !sidebarCollapsed,
              'lg:ml-16': config.showSidebar && sidebarCollapsed,
            }
          )}
        >
          <div className="py-6">
            {children || <Outlet />}
          </div>
        </main>
      </div>

      {/* Footer */}
      {config.showFooter && <AppFooter />}

      {/* Mobile Sidebar Overlay */}
      {config.showSidebar && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}; 