/**
 * ArchetypeNode Component
 * 
 * Custom ReactFlow node for displaying archetype data with rich visual information
 */

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArchetypeData } from '@/types/graph';
import { cn } from '@/lib/utils';

export interface ArchetypeNodeProps extends NodeProps {
  data: ArchetypeData;
  selected: boolean;
}

/**
 * Custom ReactFlow node component for displaying archetype information
 */
export const ArchetypeNode = memo(({ data, selected }: ArchetypeNodeProps) => {
  const {
    label,
    description,
    keywords,
    color,
    metadata,
    examples
  } = data;

  // Get platform icons/badges
  const platforms = metadata.platforms || [];
  const influenceScore = metadata.influence_score || 0;
  const trending = metadata.trending || false;

  // Truncate description for display
  const truncatedDescription = description.length > 100 
    ? `${description.substring(0, 100)}...` 
    : description;

  // Get initials for avatar
  const initials = label
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  return (
    <TooltipProvider>
      <Card 
        className={cn(
          "w-[200px] min-h-[120px] transition-all duration-200 hover:shadow-lg",
          "border-2 cursor-pointer",
          selected ? "border-primary shadow-lg" : "border-border",
          trending && "ring-2 ring-yellow-400 ring-opacity-50"
        )}
        style={{ 
          borderColor: selected ? undefined : color,
          backgroundColor: `${color}10` // 10% opacity of the color
        }}
      >
        {/* Input/Output Handles */}
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 !bg-primary"
        />
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 !bg-primary"
        />

        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 flex-1">
              <Avatar className="w-8 h-8" style={{ backgroundColor: color }}>
                <AvatarFallback className="text-white text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-sm font-semibold leading-tight truncate">
                  {label}
                </CardTitle>
                {trending && (
                  <Badge variant="secondary" className="text-xs mt-1 bg-yellow-100 text-yellow-800">
                    🔥 Trending
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0 space-y-2">
          {/* Description */}
          <Tooltip>
            <TooltipTrigger asChild>
              <p className="text-xs text-muted-foreground leading-tight line-clamp-2">
                {truncatedDescription}
              </p>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              <p>{description}</p>
            </TooltipContent>
          </Tooltip>

          {/* Influence Score */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Influence:</span>
            <div className="flex-1 bg-secondary rounded-full h-1.5">
              <div 
                className="bg-primary h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${influenceScore * 100}%` }}
              />
            </div>
            <span className="text-xs font-medium">
              {Math.round(influenceScore * 100)}%
            </span>
          </div>

          {/* Platforms */}
          {platforms.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {platforms.slice(0, 3).map((platform) => (
                <Badge 
                  key={platform} 
                  variant="outline" 
                  className="text-xs px-1 py-0"
                >
                  {platform}
                </Badge>
              ))}
              {platforms.length > 3 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="text-xs px-1 py-0">
                      +{platforms.length - 3}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1">
                      {platforms.slice(3).map((platform) => (
                        <div key={platform} className="text-xs">{platform}</div>
                      ))}
                    </div>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          )}

          {/* Keywords */}
          {keywords.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {keywords.slice(0, 2).map((keyword) => (
                <Badge 
                  key={keyword} 
                  variant="secondary" 
                  className="text-xs px-1 py-0 bg-opacity-50"
                  style={{ backgroundColor: `${color}20` }}
                >
                  {keyword}
                </Badge>
              ))}
              {keywords.length > 2 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge 
                      variant="secondary" 
                      className="text-xs px-1 py-0"
                      style={{ backgroundColor: `${color}20` }}
                    >
                      +{keywords.length - 2}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1">
                      {keywords.slice(2).map((keyword) => (
                        <div key={keyword} className="text-xs">{keyword}</div>
                      ))}
                    </div>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          )}

          {/* Content Examples Count */}
          {examples.length > 0 && (
            <div className="text-xs text-muted-foreground">
              {examples.length} example{examples.length !== 1 ? 's' : ''}
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
});

ArchetypeNode.displayName = 'ArchetypeNode';

export default ArchetypeNode; 