/**
 * useTypedNavigation Hook
 * 
 * Provides type-safe navigation utilities for React Router
 */

import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { ROUTES, getRoute, RouteParams } from '@/lib/routes';

export const useTypedNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  /**
   * Type-safe navigation function
   */
  const navigateTo = <T extends keyof typeof ROUTES>(
    route: T,
    params?: T extends keyof RouteParams ? RouteParams[T] : never,
    options?: { replace?: boolean; state?: any }
  ) => {
    const path = getRoute(route, params as Record<string, string>);
    navigate(path, options);
  };

  /**
   * Check if current route matches the given path
   */
  const isActive = (path: string, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    if (path === ROUTES.HOME) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  /**
   * Get current route parameters
   */
  const getParams = () => {
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  };

  /**
   * Navigate back in history
   */
  const goBack = () => {
    navigate(-1);
  };

  /**
   * Navigate forward in history
   */
  const goForward = () => {
    navigate(1);
  };

  return {
    navigateTo,
    isActive,
    getParams,
    goBack,
    goForward,
    location,
    searchParams,
  };
}; 