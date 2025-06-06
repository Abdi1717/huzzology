import { useState, useEffect, useRef, useCallback } from 'react';
import { Edge, Node } from 'reactflow';
import { EdgeBundlingOptions, BundleData } from '@/utils/edge-bundling';

// Create a Worker with specific type support
const createWorker = () => {
  return new Worker(new URL('../workers/edge-bundling.worker.ts', import.meta.url), { type: 'module' });
};

interface UseEdgeBundlingOptions {
  initialEnabled?: boolean;
  initialOptions?: Partial<EdgeBundlingOptions>;
}

interface UseEdgeBundlingResult {
  bundles: BundleData[];
  isEnabled: boolean;
  setEnabled: (enabled: boolean) => void;
  options: EdgeBundlingOptions;
  setOptions: (options: EdgeBundlingOptions) => void;
  isProcessing: boolean;
  processingTime: number;
  error: string | null;
  updateBundles: (nodes: Node[], edges: Edge[]) => void;
}

/**
 * Custom hook for edge bundling with web worker
 */
export function useEdgeBundling(
  nodes: Node[],
  edges: Edge[],
  {
    initialEnabled = false,
    initialOptions = {},
  }: UseEdgeBundlingOptions = {}
): UseEdgeBundlingResult {
  // State for edge bundling
  const [isEnabled, setEnabled] = useState<boolean>(initialEnabled);
  const [options, setOptions] = useState<EdgeBundlingOptions>({
    strength: 0.7,
    distanceThreshold: 150,
    maxBundleSize: 8,
    angleThreshold: 30,
    hierarchical: false,
    simplificationLevel: 1,
    ...initialOptions,
  });
  
  // State for worker output
  const [bundles, setBundles] = useState<BundleData[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingTime, setProcessingTime] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  
  // Worker reference
  const workerRef = useRef<Worker | null>(null);
  
  // Initialize worker
  useEffect(() => {
    // Only create the worker if edge bundling is enabled
    if (isEnabled && !workerRef.current) {
      try {
        workerRef.current = createWorker();
        
        // Set up event handlers
        workerRef.current.onmessage = (event) => {
          const { type, payload } = event.data;
          
          switch (type) {
            case 'worker-ready':
              // Worker is ready to process
              console.log('Edge bundling worker initialized');
              break;
              
            case 'bundle-result':
              setIsProcessing(false);
              setBundles(payload.bundles);
              setProcessingTime(payload.processingTime);
              setError(null);
              break;
              
            case 'bundle-error':
              setIsProcessing(false);
              setError(payload.error);
              break;
          }
        };
        
        workerRef.current.onerror = (error) => {
          console.error('Edge bundling worker error:', error);
          setIsProcessing(false);
          setError(error.message);
        };
      } catch (err) {
        console.error('Failed to initialize edge bundling worker:', err);
        setError('Failed to initialize edge bundling worker');
        setEnabled(false);
      }
    }
    
    // Clean up worker when disabled or unmounted
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, [isEnabled]);
  
  // Update bundles when nodes, edges, or options change
  useEffect(() => {
    if (isEnabled && workerRef.current && nodes.length > 0 && edges.length > 0) {
      updateBundles(nodes, edges);
    }
  }, [isEnabled, nodes, edges, options]);
  
  // Function to manually trigger bundling
  const updateBundles = useCallback(
    (currentNodes: Node[], currentEdges: Edge[]) => {
      if (!isEnabled || !workerRef.current) return;
      
      setIsProcessing(true);
      
      // Send data to worker
      workerRef.current.postMessage({
        type: 'bundle-edges',
        payload: {
          nodes: currentNodes,
          edges: currentEdges,
          options,
        },
      });
    },
    [isEnabled, options]
  );
  
  return {
    bundles,
    isEnabled,
    setEnabled,
    options,
    setOptions,
    isProcessing,
    processingTime,
    error,
    updateBundles,
  };
} 