/**
 * Graph Layout Utilities
 * 
 * Automatic graph layout algorithms using Dagre and custom implementations
 */

import dagre from 'dagre';
import { 
  ArchetypeNode, 
  ArchetypeEdge, 
  GraphLayoutOptions, 
  LayoutResult 
} from '@/types/graph';

// Default layout options
const DEFAULT_LAYOUT_OPTIONS: GraphLayoutOptions = {
  algorithm: 'dagre',
  direction: 'TB',
  nodeSpacing: 100,
  rankSpacing: 150,
  edgeSpacing: 50,
};

// Node dimensions for layout calculations
const NODE_WIDTH = 200;
const NODE_HEIGHT = 100;

/**
 * Apply Dagre layout algorithm to nodes and edges
 */
export const applyDagreLayout = (
  nodes: ArchetypeNode[],
  edges: ArchetypeEdge[],
  options: Partial<GraphLayoutOptions> = {}
): LayoutResult => {
  const layoutOptions = { ...DEFAULT_LAYOUT_OPTIONS, ...options };
  
  // Create a new directed graph
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  
  // Set graph layout options
  dagreGraph.setGraph({
    rankdir: layoutOptions.direction,
    nodesep: layoutOptions.nodeSpacing,
    ranksep: layoutOptions.rankSpacing,
    edgesep: layoutOptions.edgeSpacing,
  });

  // Add nodes to the graph
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { 
      width: NODE_WIDTH, 
      height: NODE_HEIGHT 
    });
  });

  // Add edges to the graph
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Calculate layout
  dagre.layout(dagreGraph);

  // Apply calculated positions to nodes
  const layoutedNodes: ArchetypeNode[] = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: nodeWithPosition.y - NODE_HEIGHT / 2,
      },
    };
  });

  // Calculate bounds
  const bounds = calculateBounds(layoutedNodes);

  return {
    nodes: layoutedNodes,
    edges,
    bounds,
  };
};

/**
 * Apply force-directed layout (simple implementation)
 */
export const applyForceLayout = (
  nodes: ArchetypeNode[],
  edges: ArchetypeEdge[],
  _options: Partial<GraphLayoutOptions> = {}
): LayoutResult => {
  
  // Simple force-directed layout simulation
  const layoutedNodes: ArchetypeNode[] = nodes.map((node, index) => {
    // Arrange nodes in a rough circle initially
    const angle = (index / nodes.length) * 2 * Math.PI;
    const radius = Math.max(200, nodes.length * 30);
    
    return {
      ...node,
      position: {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
      },
    };
  });

  // Apply force simulation (simplified)
  const iterations = 50;
  const repulsionStrength = 1000;
  const attractionStrength = 0.1;
  
  for (let i = 0; i < iterations; i++) {
    // Apply repulsion between all nodes
    for (let j = 0; j < layoutedNodes.length; j++) {
      for (let k = j + 1; k < layoutedNodes.length; k++) {
        const nodeA = layoutedNodes[j];
        const nodeB = layoutedNodes[k];
        
        const dx = nodeB.position.x - nodeA.position.x;
        const dy = nodeB.position.y - nodeA.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        
        const force = repulsionStrength / (distance * distance);
        const fx = (dx / distance) * force;
        const fy = (dy / distance) * force;
        
        nodeA.position.x -= fx;
        nodeA.position.y -= fy;
        nodeB.position.x += fx;
        nodeB.position.y += fy;
      }
    }
    
    // Apply attraction along edges
    edges.forEach((edge) => {
      const sourceNode = layoutedNodes.find(n => n.id === edge.source);
      const targetNode = layoutedNodes.find(n => n.id === edge.target);
      
      if (sourceNode && targetNode) {
        const dx = targetNode.position.x - sourceNode.position.x;
        const dy = targetNode.position.y - sourceNode.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        
        const force = distance * attractionStrength;
        const fx = (dx / distance) * force;
        const fy = (dy / distance) * force;
        
        sourceNode.position.x += fx;
        sourceNode.position.y += fy;
        targetNode.position.x -= fx;
        targetNode.position.y -= fy;
      }
    });
  }

  const bounds = calculateBounds(layoutedNodes);

  return {
    nodes: layoutedNodes,
    edges,
    bounds,
  };
};

/**
 * Apply circular layout
 */
export const applyCircularLayout = (
  nodes: ArchetypeNode[],
  edges: ArchetypeEdge[],
  _options: Partial<GraphLayoutOptions> = {}
): LayoutResult => {
  const radius = Math.max(200, nodes.length * 40);
  
  const layoutedNodes: ArchetypeNode[] = nodes.map((node, index) => {
    const angle = (index / nodes.length) * 2 * Math.PI;
    
    return {
      ...node,
      position: {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
      },
    };
  });

  const bounds = calculateBounds(layoutedNodes);

  return {
    nodes: layoutedNodes,
    edges,
    bounds,
  };
};

/**
 * Apply hierarchical layout (tree-like structure)
 */
export const applyHierarchicalLayout = (
  nodes: ArchetypeNode[],
  edges: ArchetypeEdge[],
  options: Partial<GraphLayoutOptions> = {}
): LayoutResult => {
  const layoutOptions = { ...DEFAULT_LAYOUT_OPTIONS, ...options };
  
  // Find root nodes (nodes with no incoming edges)
  const incomingEdges = new Set(edges.map(e => e.target));
  const rootNodes = nodes.filter(node => !incomingEdges.has(node.id));
  
  // If no clear roots, use the first node
  if (rootNodes.length === 0 && nodes.length > 0) {
    rootNodes.push(nodes[0]);
  }

  const layoutedNodes: ArchetypeNode[] = [...nodes];
  const positioned = new Set<string>();
  const levelSpacing = layoutOptions.rankSpacing || 150;
  const nodeSpacing = layoutOptions.nodeSpacing || 100;

  // Position nodes level by level
  let currentLevel = 0;
  let currentLevelNodes = [...rootNodes];

  while (currentLevelNodes.length > 0 && positioned.size < nodes.length) {
    // Position current level nodes
    currentLevelNodes.forEach((node, index) => {
      if (!positioned.has(node.id)) {
        const nodeIndex = layoutedNodes.findIndex(n => n.id === node.id);
        if (nodeIndex !== -1) {
          layoutedNodes[nodeIndex].position = {
            x: (index - (currentLevelNodes.length - 1) / 2) * nodeSpacing,
            y: currentLevel * levelSpacing,
          };
          positioned.add(node.id);
        }
      }
    });

    // Find next level nodes
    const nextLevelNodes: ArchetypeNode[] = [];
    currentLevelNodes.forEach(node => {
      const childEdges = edges.filter(e => e.source === node.id);
      childEdges.forEach(edge => {
        const childNode = nodes.find(n => n.id === edge.target);
        if (childNode && !positioned.has(childNode.id)) {
          nextLevelNodes.push(childNode);
        }
      });
    });

    currentLevelNodes = nextLevelNodes;
    currentLevel++;
  }

  // Position any remaining unconnected nodes
  const unpositioned = layoutedNodes.filter(node => !positioned.has(node.id));
  unpositioned.forEach((node, index) => {
    const nodeIndex = layoutedNodes.findIndex(n => n.id === node.id);
    if (nodeIndex !== -1) {
      layoutedNodes[nodeIndex].position = {
        x: index * nodeSpacing,
        y: currentLevel * levelSpacing,
      };
    }
  });

  const bounds = calculateBounds(layoutedNodes);

  return {
    nodes: layoutedNodes,
    edges,
    bounds,
  };
};

/**
 * Main layout function that delegates to specific algorithms
 */
export const applyLayout = (
  nodes: ArchetypeNode[],
  edges: ArchetypeEdge[],
  options: Partial<GraphLayoutOptions> = {}
): LayoutResult => {
  const layoutOptions = { ...DEFAULT_LAYOUT_OPTIONS, ...options };

  switch (layoutOptions.algorithm) {
    case 'dagre':
      return applyDagreLayout(nodes, edges, options);
    case 'force':
      return applyForceLayout(nodes, edges, options);
    case 'circular':
      return applyCircularLayout(nodes, edges, options);
    case 'hierarchical':
      return applyHierarchicalLayout(nodes, edges, options);
    default:
      return applyDagreLayout(nodes, edges, options);
  }
};

/**
 * Calculate bounding box for a set of nodes
 */
function calculateBounds(nodes: ArchetypeNode[]) {
  if (nodes.length === 0) {
    return {
      width: 0,
      height: 0,
      minX: 0,
      minY: 0,
      maxX: 0,
      maxY: 0,
    };
  }

  const positions = nodes.map(node => node.position);
  const minX = Math.min(...positions.map(p => p.x)) - NODE_WIDTH / 2;
  const maxX = Math.max(...positions.map(p => p.x)) + NODE_WIDTH / 2;
  const minY = Math.min(...positions.map(p => p.y)) - NODE_HEIGHT / 2;
  const maxY = Math.max(...positions.map(p => p.y)) + NODE_HEIGHT / 2;

  return {
    width: maxX - minX,
    height: maxY - minY,
    minX,
    minY,
    maxX,
    maxY,
  };
} 