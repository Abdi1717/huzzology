import { Edge, Node, Position } from 'reactflow';

/**
 * Edge bundling options configuration
 */
export interface EdgeBundlingOptions {
  /** Bundling strength (0-1), higher values create tighter bundles */
  strength?: number;
  /** Distance threshold for considering edges for bundling */
  distanceThreshold?: number;
  /** Maximum number of edges in a bundle */
  maxBundleSize?: number;
  /** Minimum angle (in degrees) between edges to be bundled */
  angleThreshold?: number;
  /** Whether to use hierarchical bundling (vs force-directed) */
  hierarchical?: boolean;
  /** Level of simplification (reduces points for performance) */
  simplificationLevel?: number;
}

/**
 * Default edge bundling options
 */
const DEFAULT_OPTIONS: EdgeBundlingOptions = {
  strength: 0.5,
  distanceThreshold: 50,
  maxBundleSize: 10,
  angleThreshold: 15,
  hierarchical: false,
  simplificationLevel: 1,
};

/**
 * Represents a bundle of edges sharing similar paths
 */
interface EdgeBundle {
  id: string;
  edges: Edge[];
  controlPoints: Array<{ x: number; y: number }>;
  pathData?: string;
}

/**
 * Apply force-directed edge bundling algorithm to reduce visual clutter
 * 
 * @param edges Original edges to bundle
 * @param nodes Nodes for calculating positions
 * @param options Bundling options
 * @returns Bundled edges with calculated paths
 */
export function applyEdgeBundling(
  edges: Edge[],
  nodes: Node[],
  options: EdgeBundlingOptions = {}
): Edge[] {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  
  // Return original edges if there aren't enough to bundle
  if (edges.length < 3) {
    return edges;
  }
  
  // Create a map for quick node lookups
  const nodeMap = new Map<string, Node>();
  nodes.forEach(node => nodeMap.set(node.id, node));
  
  // Step 1: Group edges that could potentially be bundled
  const edgeBundles = identifyPotentialBundles(edges, nodeMap, mergedOptions);
  
  // Step 2: Calculate control points for each bundle
  const bundlesWithPaths = calculateBundlePaths(edgeBundles, nodeMap, mergedOptions);
  
  // Step 3: Generate edges with updated path data
  return generateBundledEdges(edges, bundlesWithPaths, mergedOptions);
}

/**
 * Helper to identify potential edge bundles based on proximity and angle
 */
function identifyPotentialBundles(
  edges: Edge[],
  nodeMap: Map<string, Node>,
  options: EdgeBundlingOptions
): EdgeBundle[] {
  const { distanceThreshold, angleThreshold, maxBundleSize } = options;
  const bundles: EdgeBundle[] = [];
  const processedEdges = new Set<string>();
  
  // Sort edges by length (shorter edges first, as they tend to be cleaner)
  const sortedEdges = [...edges].sort((a, b) => {
    const aLength = getEdgeLength(a, nodeMap);
    const bLength = getEdgeLength(b, nodeMap);
    return aLength - bLength;
  });
  
  for (const edge of sortedEdges) {
    // Skip already processed edges
    if (processedEdges.has(edge.id)) continue;
    
    const bundleEdges: Edge[] = [edge];
    processedEdges.add(edge.id);
    
    // Find edges that could be bundled with this one
    for (const candidateEdge of sortedEdges) {
      if (
        !processedEdges.has(candidateEdge.id) &&
        bundleEdges.length < maxBundleSize! &&
        areEdgesSimilar(edge, candidateEdge, nodeMap, distanceThreshold!, angleThreshold!)
      ) {
        bundleEdges.push(candidateEdge);
        processedEdges.add(candidateEdge.id);
      }
    }
    
    // Only create a bundle if we have at least 2 edges
    if (bundleEdges.length > 1) {
      bundles.push({
        id: `bundle-${bundles.length}`,
        edges: bundleEdges,
        controlPoints: [],
      });
    }
  }
  
  return bundles;
}

/**
 * Check if two edges are similar enough to be bundled
 */
function areEdgesSimilar(
  edge1: Edge,
  edge2: Edge,
  nodeMap: Map<string, Node>,
  distanceThreshold: number,
  angleThreshold: number
): boolean {
  // Different source and target means these edges shouldn't be bundled
  if (
    edge1.source === edge2.source && 
    edge1.target === edge2.target
  ) {
    return true; // Perfect match
  }
  
  // Get node positions
  const source1 = nodeMap.get(edge1.source);
  const target1 = nodeMap.get(edge1.target);
  const source2 = nodeMap.get(edge2.source);
  const target2 = nodeMap.get(edge2.target);
  
  if (!source1 || !target1 || !source2 || !target2) {
    return false;
  }
  
  // Calculate midpoints
  const midpoint1 = {
    x: (source1.position.x + target1.position.x) / 2,
    y: (source1.position.y + target1.position.y) / 2,
  };
  
  const midpoint2 = {
    x: (source2.position.x + target2.position.x) / 2,
    y: (source2.position.y + target2.position.y) / 2,
  };
  
  // Calculate distance between midpoints
  const distance = Math.sqrt(
    Math.pow(midpoint1.x - midpoint2.x, 2) + 
    Math.pow(midpoint1.y - midpoint2.y, 2)
  );
  
  // Check if distance is within threshold
  if (distance > distanceThreshold) {
    return false;
  }
  
  // Calculate angle between edges
  const angle1 = Math.atan2(
    target1.position.y - source1.position.y,
    target1.position.x - source1.position.x
  );
  
  const angle2 = Math.atan2(
    target2.position.y - source2.position.y,
    target2.position.x - source2.position.x
  );
  
  // Convert to degrees and normalize
  const angleDiff = Math.abs(
    ((angle1 - angle2) * 180 / Math.PI + 180) % 180
  );
  
  // Check if angle is within threshold
  return angleDiff < angleThreshold;
}

/**
 * Calculate the length of an edge
 */
function getEdgeLength(edge: Edge, nodeMap: Map<string, Node>): number {
  const source = nodeMap.get(edge.source);
  const target = nodeMap.get(edge.target);
  
  if (!source || !target) {
    return Infinity;
  }
  
  return Math.sqrt(
    Math.pow(target.position.x - source.position.x, 2) + 
    Math.pow(target.position.y - source.position.y, 2)
  );
}

/**
 * Calculate bundle paths using force-directed or hierarchical bundling
 */
function calculateBundlePaths(
  bundles: EdgeBundle[],
  nodeMap: Map<string, Node>,
  options: EdgeBundlingOptions
): EdgeBundle[] {
  return options.hierarchical
    ? calculateHierarchicalBundlePaths(bundles, nodeMap, options)
    : calculateForceDirectedBundlePaths(bundles, nodeMap, options);
}

/**
 * Calculate bundle paths using force-directed bundling
 */
function calculateForceDirectedBundlePaths(
  bundles: EdgeBundle[],
  nodeMap: Map<string, Node>,
  options: EdgeBundlingOptions
): EdgeBundle[] {
  const { strength, simplificationLevel } = options;
  
  return bundles.map(bundle => {
    // Create a set of control points between the source and target
    const controlPointsCount = Math.max(2, Math.floor(6 / simplificationLevel!));
    const firstEdge = bundle.edges[0];
    const source = nodeMap.get(firstEdge.source);
    const target = nodeMap.get(firstEdge.target);
    
    if (!source || !target) {
      return bundle;
    }
    
    // Create control points along a straight line
    const controlPoints = [];
    for (let i = 0; i <= controlPointsCount; i++) {
      const t = i / controlPointsCount;
      controlPoints.push({
        x: source.position.x + (target.position.x - source.position.x) * t,
        y: source.position.y + (target.position.y - source.position.y) * t,
      });
    }
    
    // Calculate bundle midpoint by averaging positions of all edges
    const midpoint = {
      x: 0,
      y: 0,
    };
    
    bundle.edges.forEach(edge => {
      const edgeSource = nodeMap.get(edge.source);
      const edgeTarget = nodeMap.get(edge.target);
      
      if (edgeSource && edgeTarget) {
        midpoint.x += (edgeSource.position.x + edgeTarget.position.x) / 2;
        midpoint.y += (edgeSource.position.y + edgeTarget.position.y) / 2;
      }
    });
    
    midpoint.x /= bundle.edges.length;
    midpoint.y /= bundle.edges.length;
    
    // Adjust control points toward the bundle midpoint based on strength
    for (let i = 1; i < controlPointsCount; i++) {
      const t = i / controlPointsCount;
      const influenceFactor = Math.sin(t * Math.PI) * strength!;
      
      controlPoints[i].x += (midpoint.x - controlPoints[i].x) * influenceFactor;
      controlPoints[i].y += (midpoint.y - controlPoints[i].y) * influenceFactor;
    }
    
    // Generate SVG path
    const path = controlPoints.reduce((acc, point, index) => {
      if (index === 0) {
        return `M ${point.x},${point.y}`;
      }
      return `${acc} L ${point.x},${point.y}`;
    }, '');
    
    return {
      ...bundle,
      controlPoints,
      pathData: path,
    };
  });
}

/**
 * Calculate bundle paths using hierarchical bundling
 */
function calculateHierarchicalBundlePaths(
  bundles: EdgeBundle[],
  nodeMap: Map<string, Node>,
  options: EdgeBundlingOptions
): EdgeBundle[] {
  const { strength, simplificationLevel } = options;
  
  return bundles.map(bundle => {
    // Create a set of control points for a cubic bezier curve
    const firstEdge = bundle.edges[0];
    const source = nodeMap.get(firstEdge.source);
    const target = nodeMap.get(firstEdge.target);
    
    if (!source || !target) {
      return bundle;
    }
    
    // Calculate bundle midpoint by averaging positions of all edges
    const sourcePoints = [];
    const targetPoints = [];
    
    bundle.edges.forEach(edge => {
      const edgeSource = nodeMap.get(edge.source);
      const edgeTarget = nodeMap.get(edge.target);
      
      if (edgeSource && edgeTarget) {
        sourcePoints.push(edgeSource.position);
        targetPoints.push(edgeTarget.position);
      }
    });
    
    // Average source and target points
    const avgSource = {
      x: sourcePoints.reduce((sum, p) => sum + p.x, 0) / sourcePoints.length,
      y: sourcePoints.reduce((sum, p) => sum + p.y, 0) / sourcePoints.length,
    };
    
    const avgTarget = {
      x: targetPoints.reduce((sum, p) => sum + p.x, 0) / targetPoints.length,
      y: targetPoints.reduce((sum, p) => sum + p.y, 0) / targetPoints.length,
    };
    
    // Calculate distance between average points
    const distance = Math.sqrt(
      Math.pow(avgTarget.x - avgSource.x, 2) + 
      Math.pow(avgTarget.y - avgSource.y, 2)
    );
    
    // Calculate control points for the bundle
    const controlPoint1 = {
      x: avgSource.x + (avgTarget.x - avgSource.x) * 0.25,
      y: avgSource.y + (avgTarget.y - avgSource.y) * 0.25,
    };
    
    const controlPoint2 = {
      x: avgSource.x + (avgTarget.x - avgSource.x) * 0.75,
      y: avgSource.y + (avgTarget.y - avgSource.y) * 0.75,
    };
    
    // Calculate perpendicular vector for curve control
    const perpX = -(avgTarget.y - avgSource.y);
    const perpY = avgTarget.x - avgSource.x;
    const perpLength = Math.sqrt(perpX * perpX + perpY * perpY);
    
    // Normalize and scale
    const curveControl = strength! * distance * 0.5 / (simplificationLevel || 1);
    const normPerpX = perpX / perpLength * curveControl;
    const normPerpY = perpY / perpLength * curveControl;
    
    // Adjust control points
    controlPoint1.x += normPerpX;
    controlPoint1.y += normPerpY;
    controlPoint2.x += normPerpX;
    controlPoint2.y += normPerpY;
    
    // Generate SVG path for a cubic bezier curve
    const pathData = `M ${avgSource.x},${avgSource.y} C ${controlPoint1.x},${controlPoint1.y} ${controlPoint2.x},${controlPoint2.y} ${avgTarget.x},${avgTarget.y}`;
    
    return {
      ...bundle,
      controlPoints: [avgSource, controlPoint1, controlPoint2, avgTarget],
      pathData,
    };
  });
}

/**
 * Generate final bundled edges with updated path data
 */
function generateBundledEdges(
  originalEdges: Edge[],
  bundles: EdgeBundle[],
  options: EdgeBundlingOptions
): Edge[] {
  const result: Edge[] = [];
  const bundledEdgeIds = new Set<string>();
  
  // Add bundle representatives for bundled edges
  bundles.forEach(bundle => {
    // Mark all edges in this bundle
    bundle.edges.forEach(edge => bundledEdgeIds.add(edge.id));
    
    // Get the main edge from the bundle to use as template
    const templateEdge = bundle.edges[0];
    
    // Create a special bundled edge
    const bundledEdge: Edge = {
      ...templateEdge,
      id: `bundled-${templateEdge.id}`,
      type: 'bundledEdge',
      data: {
        ...templateEdge.data,
        bundle: {
          id: bundle.id,
          size: bundle.edges.length,
          edges: bundle.edges.map(e => e.id),
          pathData: bundle.pathData,
          controlPoints: bundle.controlPoints,
        },
      },
      // This will be used by the bundled edge component
      pathData: bundle.pathData,
    };
    
    result.push(bundledEdge);
  });
  
  // Add edges that weren't bundled
  originalEdges.forEach(edge => {
    if (!bundledEdgeIds.has(edge.id)) {
      result.push(edge);
    }
  });
  
  return result;
}

/**
 * Utility function to get node handle positions
 */
export function getHandlePosition(node: Node, position: Position): { x: number; y: number } {
  const { x, y } = node.position;
  const nodeWidth = node.width || 150;
  const nodeHeight = node.height || 40;
  
  switch (position) {
    case Position.Top:
      return { x: x + nodeWidth / 2, y };
    case Position.Bottom:
      return { x: x + nodeWidth / 2, y: y + nodeHeight };
    case Position.Left:
      return { x, y: y + nodeHeight / 2 };
    case Position.Right:
      return { x: x + nodeWidth, y: y + nodeHeight / 2 };
    default:
      return { x: x + nodeWidth / 2, y: y + nodeHeight / 2 };
  }
}

/**
 * Get optimized bundled edge path (for rendering)
 */
export function getBundledEdgePath(
  sourceNode: Node,
  targetNode: Node,
  bundle: {
    pathData?: string;
    controlPoints?: Array<{ x: number; y: number }>;
  }
): string {
  // If we already have calculated path data, use it
  if (bundle.pathData) {
    return bundle.pathData;
  }
  
  // If we have control points, create a path from them
  if (bundle.controlPoints && bundle.controlPoints.length >= 2) {
    return bundle.controlPoints.reduce((acc, point, index) => {
      if (index === 0) {
        return `M ${point.x},${point.y}`;
      }
      return `${acc} L ${point.x},${point.y}`;
    }, '');
  }
  
  // Fallback to straight line
  const { x: sourceX, y: sourceY } = sourceNode.position;
  const { x: targetX, y: targetY } = targetNode.position;
  const sourceWidth = sourceNode.width || 150;
  const sourceHeight = sourceNode.height || 40;
  const targetWidth = targetNode.width || 150;
  const targetHeight = targetNode.height || 40;
  
  return `M ${sourceX + sourceWidth / 2},${sourceY + sourceHeight / 2} L ${
    targetX + targetWidth / 2
  },${targetY + targetHeight / 2}`;
} 