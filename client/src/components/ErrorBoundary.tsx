/**
 * ErrorBoundary Component
 * 
 * Handles routing errors and 404 pages
 */

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouteError, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/lib/routes';

export const ErrorBoundary = () => {
  const error = useRouteError() as any;
  const navigate = useNavigate();

  const is404 = error?.status === 404 || error?.statusText === 'Not Found';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">{is404 ? '🔍' : '⚠️'}</span>
          </div>
          <CardTitle className="text-2xl">
            {is404 ? 'Page Not Found' : 'Something Went Wrong'}
          </CardTitle>
          <CardDescription>
            {is404 
              ? "The page you're looking for doesn't exist or has been moved."
              : 'An unexpected error occurred. Please try again.'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error?.message && !is404 && (
            <div className="p-3 bg-destructive/10 rounded-md">
              <p className="text-sm text-destructive font-mono">
                {error.message}
              </p>
            </div>
          )}
          
          <div className="flex flex-col space-y-2">
            <Button 
              onClick={() => navigate(ROUTES.HOME)}
              className="w-full"
            >
              Go Home
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate(-1)}
              className="w-full"
            >
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 