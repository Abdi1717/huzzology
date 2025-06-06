/* eslint-disable no-restricted-globals */
import { Edge, Node } from 'reactflow';
import { applyEdgeBundling, EdgeBundlingOptions, BundleData } from '../utils/edge-bundling';

// Define the worker context
const ctx: Worker = self as any;

// Define message event types
type WorkerMessage = {
  type: 'bundle-edges';
  payload: {
    nodes: Node[];
    edges: Edge[];
    options: EdgeBundlingOptions;
  };
};

// Handle incoming messages
ctx.addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'bundle-edges':
      try {
        const { nodes, edges, options } = payload;
        const startTime = performance.now();
        
        // Perform the bundling calculation
        const bundles = applyEdgeBundling(nodes, edges, options);
        
        const endTime = performance.now();
        
        // Send back the bundled edges
        ctx.postMessage({
          type: 'bundle-result',
          payload: {
            bundles,
            processingTime: endTime - startTime,
          },
        });
      } catch (error) {
        // Send back error
        ctx.postMessage({
          type: 'bundle-error',
          payload: {
            error: (error as Error).message,
          },
        });
      }
      break;
      
    default:
      console.error('Unknown message type:', type);
  }
});

// Notify that the worker is ready
ctx.postMessage({ type: 'worker-ready' });

export {}; // Needed for TypeScript module format 