/**
 * FilterBadge Component
 * 
 * Interactive badge component for filtering functionality
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const filterBadgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground border-input hover:bg-accent hover:text-accent-foreground',
        active: 'border-primary bg-primary/10 text-primary hover:bg-primary/20',
      },
    },
    defaultVariants: {
      variant: 'outline',
    },
  }
);

export interface FilterBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof filterBadgeVariants> {
  active?: boolean;
  onRemove?: () => void;
  removable?: boolean;
}

const FilterBadge = React.forwardRef<HTMLDivElement, FilterBadgeProps>(
  ({ className, variant, active, onRemove, removable = false, children, ...props }, ref) => {
    const badgeVariant = active ? 'active' : variant;

    return (
      <div
        ref={ref}
        className={cn(filterBadgeVariants({ variant: badgeVariant }), className)}
        {...props}
      >
        {children}
        {removable && onRemove && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="ml-1 h-3 w-3 rounded-full hover:bg-black/20 flex items-center justify-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-2 w-2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    );
  }
);
FilterBadge.displayName = 'FilterBadge';

export { FilterBadge, filterBadgeVariants }; 