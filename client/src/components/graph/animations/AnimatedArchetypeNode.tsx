/**
 * AnimatedArchetypeNode Component
 * 
 * Animated version of the ArchetypeNode component using Framer Motion
 * Provides smooth transitions for node movements, expansions, and interactions
 */

import React, { memo, useMemo } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { nodeAnimationVariants } from '@/utils/animation';

// Import the same types from the original ArchetypeNode
export interface ArchetypeNodeData {
  id: string;
  label: string;
  color?: string;
  keywords?: string[];
  metadata?: {
    influenceScore?: number;
    category?: string;
    platforms?: string[];
    [key: string]: any;
  };
  trending?: boolean;
  simplified?: boolean;
  faded?: boolean;
  isExpanded?: boolean; // New property for expansion state
}

export interface AnimatedArchetypeNodeProps extends NodeProps {
  data: ArchetypeNodeData;
  selected: boolean;
  isConnectable: boolean;
  zIndex: number;
}

/**
 * Memoized badge component to reduce re-renders
 */
const MemoizedBadge = memo(({ children, variant, className, style }: any) => (
  <Badge 
    variant={variant} 
    className={className}
    style={style}
  >
    {children}
  </Badge>
));
MemoizedBadge.displayName = 'MemoizedBadge';

/**
 * Animated archetype node component with Framer Motion
 */
const AnimatedArchetypeNode = memo(({ data, selected, ...props }: NodeProps<ArchetypeNodeData>) => {
  const {
    label,
    color = '#6366f1',
    keywords = [],
    metadata = {},
    trending = false,
    simplified = false,
    isExpanded = false
  } = data;
  
  // Access viewport state for level-of-detail rendering
  const { viewport } = useReactFlow();
  const { zoom } = viewport;
  
  // Determine rendering mode based on zoom level and simplified flag
  const isSimpleMode = simplified || zoom < 0.6;
  const isVerySimpleMode = simplified && zoom < 0.3;
  
  // Get node properties
  const { influenceScore = 0 } = metadata;
  
  // Calculate node size based on influence score and expansion state
  const getNodeSize = () => {
    // Use smaller sizes when zoomed out
    if (isVerySimpleMode) {
      return trending ? 14 : 8;
    }
    
    if (isSimpleMode) {
      return trending ? 28 : 16 + Math.min(influenceScore * 12, 8);
    }
    
    // Normal size - influenced by score and trending status
    const baseSize = trending ? 40 : 30;
    const scoreBonus = Math.min(influenceScore * 20, 15);
    const expansionBonus = isExpanded ? 10 : 0;
    return baseSize + scoreBonus + expansionBonus;
  };
  
  const size = getNodeSize();
  
  // Only show node details if not in simple mode
  const showDetails = !isSimpleMode;
  
  // Optimize keyword filtering for performance
  const visibleKeywords = useMemo(() => {
    if (isVerySimpleMode) return [];
    if (isSimpleMode) return trending ? keywords.slice(0, 1) : [];
    // Show more keywords when expanded
    return keywords.slice(0, isExpanded ? 5 : 3);
  }, [keywords, isSimpleMode, isVerySimpleMode, trending, isExpanded]);
  
  // Determine which animation variant to use
  const animationState = useMemo(() => {
    if (data.faded) return "exit";
    return "enter";
  }, [data.faded]);
  
  return (
    <motion.div
      className={cn(
        "archetype-node relative flex items-center justify-center rounded-full border-2 shadow-md cursor-pointer",
        selected && "ring-2 ring-primary ring-offset-2",
        trending && "border-orange-400"
      )}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: color,
        borderColor: selected ? 'white' : trending ? '#fb923c' : color
      }}
      // Apply animation variants
      variants={nodeAnimationVariants}
      initial="initial"
      animate={animationState}
      whileHover="hover"
      whileTap="tap"
      // For smooth layout transitions when size changes
      layout
      layoutId={data.id}
      transition={{
        type: "spring",
        damping: 20,
        stiffness: 150,
        layout: { duration: 0.3 }
      }}
      {...props}
    >
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ visibility: isVerySimpleMode ? 'hidden' : 'visible' }}
      />
      
      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ visibility: isVerySimpleMode ? 'hidden' : 'visible' }}
      />
      
      {/* Show label only in normal or moderately simplified mode */}
      {!isVerySimpleMode && (
        <motion.div
          className={cn(
            "absolute whitespace-nowrap px-1 bg-background/80 rounded-sm border text-center",
            isSimpleMode ? "text-[8px] -bottom-4 max-w-[80px] truncate" : "text-xs -bottom-6 max-w-[120px]"
          )}
          // Animate label for smooth entrance
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          {label}
        </motion.div>
      )}

      {/* Only show icon for trending nodes in very simple mode */}
      {isVerySimpleMode && trending && (
        <motion.div 
          className="text-[8px] flex items-center justify-center"
          // Pulse animation for trending icon
          animate={{ 
            scale: [1, 1.2, 1],
          }}
          transition={{ 
            repeat: Infinity, 
            repeatType: "loop", 
            duration: 2, 
            ease: "easeInOut" 
          }}
        >
          <TrendingUp className="w-2 h-2 text-white" />
        </motion.div>
      )}
      
      {/* Only show keywords when details are visible */}
      {showDetails && (
        <AnimatePresence>
          {visibleKeywords.length > 0 && (
            <motion.div 
              className="absolute -top-6 left-1/2 transform -translate-x-1/2 flex flex-wrap justify-center gap-1 max-w-[200px]"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ staggerChildren: 0.05, delayChildren: 0.1 }}
            >
              {visibleKeywords.map((keyword, index) => (
                <motion.div
                  key={keyword}
                  className="text-[8px] bg-background/80 px-1 rounded-sm border"
                  // Stagger the entrance of each keyword
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {keyword}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}
      
      {/* Show influence score indicator only in normal mode */}
      {!isSimpleMode && (
        <motion.div
          className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 bg-primary text-[8px] text-white rounded-full flex items-center justify-center"
          style={{
            width: `${Math.max(14, size / 3)}px`,
            height: `${Math.max(14, size / 3)}px`
          }}
          // Bounce in animation for the score indicator
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            type: "spring", 
            delay: 0.3,
            damping: 10,
            stiffness: 200
          }}
        >
          {Math.round(influenceScore * 100)}
        </motion.div>
      )}
      
      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && !isSimpleMode && (
          <motion.div
            className="absolute rounded-md bg-background/90 backdrop-blur-sm border shadow-md p-2 z-10"
            style={{ 
              width: `${Math.max(200, size * 2)}px`,
              top: `${size + 10}px`,
              left: `${-Math.max(200, size * 2) / 2 + size / 2}px`
            }}
            // Expand animation
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            transition={{ 
              type: "spring",
              damping: 20,
              stiffness: 100
            }}
          >
            <div className="text-xs font-medium">{label}</div>
            <div className="text-[10px] text-muted-foreground mt-1">
              Influence Score: {Math.round(influenceScore * 100)}%
            </div>
            {metadata.category && (
              <div className="text-[10px] mt-1">
                Category: <span className="font-medium">{metadata.category}</span>
              </div>
            )}
            {metadata.platforms && metadata.platforms.length > 0 && (
              <div className="mt-1">
                <div className="text-[10px] mb-0.5">Platforms:</div>
                <div className="flex flex-wrap gap-1">
                  {metadata.platforms.map(platform => (
                    <Badge key={platform} variant="outline" className="text-[8px] py-0">
                      {platform}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {keywords.length > 0 && (
              <div className="mt-1">
                <div className="text-[10px] mb-0.5">Keywords:</div>
                <div className="flex flex-wrap gap-1">
                  {keywords.map(keyword => (
                    <Badge key={keyword} className="text-[8px] py-0 bg-muted/50">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}, (prev, next) => {
  // Custom equality function for better performance
  if (prev.selected !== next.selected) return false;
  if (prev.xPos !== next.xPos || prev.yPos !== next.yPos) return false;
  
  // Deep comparison of data properties that affect rendering
  const prevData = prev.data;
  const nextData = next.data;
  
  // Quick check for reference equality
  if (prevData === nextData) return true;
  
  // Check for changes in key properties
  return (
    prevData.label === nextData.label &&
    prevData.color === nextData.color &&
    prevData.trending === nextData.trending &&
    prevData.simplified === nextData.simplified &&
    prevData.faded === nextData.faded &&
    prevData.isExpanded === nextData.isExpanded &&
    prevData.metadata?.influenceScore === nextData.metadata?.influenceScore &&
    JSON.stringify(prevData.keywords) === JSON.stringify(nextData.keywords)
  );
});

AnimatedArchetypeNode.displayName = 'AnimatedArchetypeNode';

export default AnimatedArchetypeNode; 