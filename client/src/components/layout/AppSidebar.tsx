/**
 * App Sidebar Component
 * 
 * Collapsible sidebar with navigation and quick actions
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Compass, 
  Network, 
  TrendingUp, 
  BarChart3, 
  Settings, 
  ChevronLeft,
  Plus,
  Bookmark,
  History
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/routes';

interface AppSidebarProps {
  open: boolean;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onClose: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  open,
  collapsed,
  onToggleCollapse,
  onClose,
}) => {
  const location = useLocation();

  const navigationItems = [
    { 
      label: 'Home', 
      href: ROUTES.HOME, 
      icon: Home,
      badge: null
    },
    { 
      label: 'Explore', 
      href: ROUTES.EXPLORE, 
      icon: Compass,
      badge: null
    },
    { 
      label: 'Graph View', 
      href: ROUTES.GRAPH, 
      icon: Network,
      badge: null
    },
    { 
      label: 'Trending', 
      href: ROUTES.TRENDING, 
      icon: TrendingUp,
      badge: '12'
    },
    { 
      label: 'Analytics', 
      href: ROUTES.ANALYTICS, 
      icon: BarChart3,
      badge: null
    },
  ];

  const quickActions = [
    {
      label: 'Create Archetype',
      icon: Plus,
      action: () => console.log('Create archetype'),
    },
    {
      label: 'Bookmarks',
      icon: Bookmark,
      action: () => console.log('View bookmarks'),
    },
    {
      label: 'History',
      icon: History,
      action: () => console.log('View history'),
    },
  ];

  const isActiveRoute = (href: string) => {
    if (href === ROUTES.HOME) {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <>
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-16 z-50 h-[calc(100vh-4rem)] bg-background border-r transition-all duration-300',
          'lg:relative lg:top-0 lg:h-full lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b">
            {!collapsed && (
              <h2 className="font-semibold text-lg">Navigation</h2>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
              className="hidden lg:flex"
            >
              <ChevronLeft 
                className={cn(
                  'h-4 w-4 transition-transform',
                  collapsed && 'rotate-180'
                )}
              />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            <div className="space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = isActiveRoute(item.href);
                
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => onClose()}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      'hover:bg-accent hover:text-accent-foreground',
                      isActive 
                        ? 'bg-accent text-accent-foreground' 
                        : 'text-muted-foreground',
                      collapsed && 'justify-center px-2'
                    )}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="flex-1">{item.label}</span>
                        {item.badge && (
                          <Badge variant="secondary" className="text-xs">
                            {item.badge}
                          </Badge>
                        )}
                      </>
                    )}
                  </Link>
                );
              })}
            </div>

            {!collapsed && (
              <>
                <Separator className="my-4" />
                
                {/* Quick Actions */}
                <div className="space-y-1">
                  <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Quick Actions
                  </h3>
                  {quickActions.map((action) => {
                    const Icon = action.icon;
                    
                    return (
                      <Button
                        key={action.label}
                        variant="ghost"
                        onClick={action.action}
                        className="w-full justify-start gap-3 px-3 py-2 h-auto font-medium text-sm text-muted-foreground hover:text-accent-foreground"
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        <span>{action.label}</span>
                      </Button>
                    );
                  })}
                </div>
              </>
            )}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t">
            <Link
              to={ROUTES.SETTINGS}
              onClick={() => onClose()}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                'hover:bg-accent hover:text-accent-foreground text-muted-foreground',
                collapsed && 'justify-center px-2'
              )}
            >
              <Settings className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>Settings</span>}
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}; 