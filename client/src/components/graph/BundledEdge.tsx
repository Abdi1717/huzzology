import React, { memo, useState, useCallback } from 'react';
import { EdgeProps, getBezierPath, useStore } from 'reactflow';
import { getBundledEdgePath } from '@/utils/edge-bundling';

export interface BundleData {
  id: string;
  size: number;
  edges: string[];
  pathData?: string;
  controlPoints?: Array<{ x: number; y: number }>;
}

interface BundledEdgeProps extends EdgeProps {
  pathData?: string;
  data?: {
    bundle: BundleData;
    width?: number;
    label?: string;
    color?: string;
    animated?: boolean;
  };
}

const getStrokeWidth = (size: number): number => {
  // Scale stroke width based on bundle size, but cap it
  return Math.min(Math.max(1, size * 0.75), 7);
};

const getStrokeOpacity = (isHovered: boolean): number => {
  return isHovered ? 0.9 : 0.65;
};

/**
 * A custom edge that renders bundled edges with interactive features
 */
export const BundledEdge: React.FC<BundledEdgeProps> = memo(({ 
  id, 
  source, 
  target, 
  selected, 
  pathData, 
  data, 
  sourceX, 
  sourceY, 
  targetX, 
  targetY, 
  sourcePosition, 
  targetPosition, 
  style = {}, 
  markerEnd,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Get nodes from ReactFlow store
  const sourceNode = useStore(
    useCallback((store) => store.nodeInternals.get(source), [source])
  );
  
  const targetNode = useStore(
    useCallback((store) => store.nodeInternals.get(target), [target])
  );
  
  // Can't draw edge if either node is missing
  if (!sourceNode || !targetNode) {
    return null;
  }
  
  // Extract bundle data
  const bundle = data?.bundle;
  const size = bundle?.size || 1;
  const color = data?.color || '#444';
  const edgeLabel = data?.label;
  const animated = data?.animated;
  
  // Get path coordinates
  let path = '';
  
  // First try to use provided pathData
  if (pathData) {
    path = pathData;
  } 
  // Then try to use bundle path data
  else if (bundle?.pathData) {
    path = bundle.pathData;
  }
  // Then try to calculate from bundle control points
  else if (bundle?.controlPoints && bundle.controlPoints.length >= 2) {
    path = getBundledEdgePath(sourceNode, targetNode, bundle);
  }
  // Fallback to standard bezier path
  else {
    const [bezierPath] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });
    path = bezierPath;
  }
  
  // Calculate width based on bundle size
  const strokeWidth = getStrokeWidth(size);
  const strokeOpacity = getStrokeOpacity(isHovered);
  
  // Event handlers
  const handleMouseEnter = () => {
    setIsHovered(true);
  };
  
  const handleMouseLeave = () => {
    setIsHovered(false);
  };
  
  return (
    <>
      {/* Main Edge Path */}
      <path
        id={id}
        className="react-flow__edge-path"
        d={path}
        style={{
          ...style,
          stroke: color,
          strokeWidth,
          strokeOpacity,
          transition: 'stroke-width 0.2s, stroke-opacity 0.2s',
        }}
        markerEnd={markerEnd}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />
      
      {/* Glow Effect for Hover */}
      {isHovered && (
        <path
          d={path}
          style={{
            stroke: color,
            strokeWidth: strokeWidth + 2,
            strokeOpacity: 0.15,
            filter: 'blur(3px)',
          }}
        />
      )}
      
      {/* Animation Path (if animated) */}
      {animated && (
        <path
          d={path}
          style={{
            stroke: color,
            strokeWidth: strokeWidth * 0.6,
            strokeOpacity: 0.35,
            strokeDasharray: '5, 5',
          }}
          className="react-flow__edge-path-animated"
        />
      )}
      
      {/* Edge Label */}
      {edgeLabel && (
        <text
          style={{
            fill: isHovered ? '#000' : '#666',
            fontSize: 10,
            textAnchor: 'middle',
            paintOrder: 'stroke',
            stroke: '#fff',
            strokeWidth: 2,
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            fontWeight: isHovered ? 'bold' : 'normal',
            pointerEvents: 'none',
            transition: 'fill 0.2s, font-weight 0.2s',
          }}
          startOffset="50%"
          x="0"
          y="-5"
          textAnchor="middle"
          alignmentBaseline="middle"
          dominantBaseline="central"
        >
          <textPath
            href={`#${id}`}
            startOffset="50%"
            textAnchor="middle"
            dominantBaseline="central"
          >
            {edgeLabel} {size > 1 && `(${size})`}
          </textPath>
        </text>
      )}
      
      {/* Bundle Size Indicator */}
      {size > 1 && !edgeLabel && (
        <text
          style={{
            fill: isHovered ? '#000' : '#666',
            fontSize: 10,
            fontWeight: 'bold',
            textAnchor: 'middle',
            dominantBaseline: 'central',
            paintOrder: 'stroke',
            stroke: '#fff',
            strokeWidth: 2,
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            pointerEvents: 'none',
          }}
        >
          <textPath
            href={`#${id}`}
            startOffset="50%"
            textAnchor="middle"
            dominantBaseline="central"
          >
            {size}
          </textPath>
        </text>
      )}
    </>
  );
});

BundledEdge.displayName = 'BundledEdge';

export default BundledEdge; 