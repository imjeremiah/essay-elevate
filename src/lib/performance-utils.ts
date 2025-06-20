/**
 * @file Performance monitoring and optimization utilities for EssayElevate.
 * Provides tools for measuring AI request performance, caching, and debugging.
 */

interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: number;
  success: boolean;
  error?: string;
}

/**
 * Creates a debounced version of a function that delays invoking until after
 * wait milliseconds have elapsed since the last time it was invoked.
 * 
 * @param func - The function to debounce
 * @param wait - The number of milliseconds to delay
 * @param immediate - Whether to trigger on the leading edge
 * @returns The debounced function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
  immediate = false
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  };
}

/**
 * Creates a throttled version of a function that only invokes at most once
 * per every wait milliseconds.
 * 
 * @param func - The function to throttle
 * @param wait - The number of milliseconds to throttle invocations to
 * @returns The throttled function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  let lastFunc: NodeJS.Timeout;
  let lastRan: number;
  
  return function(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      lastRan = Date.now();
      inThrottle = true;
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        if (Date.now() - lastRan >= wait) {
          func(...args);
          lastRan = Date.now();
        }
      }, Math.max(wait - (Date.now() - lastRan), 0));
    }
  };
}

/**
 * Measures the execution time of an async operation and returns both result and timing.
 * @param operationName - Name of the operation being measured
 * @param operation - The async operation to measure
 * @returns Promise containing the result and performance metrics
 */
export async function measurePerformance<T>(
  operationName: string,
  operation: () => Promise<T>
): Promise<T> {
  const startTime = performance.now();
  let success = true;
  let error: string | undefined;

  try {
    const result = await operation();
    return result;
  } catch (e: unknown) {
    success = false;
    error = e instanceof Error ? e.message : 'Unknown error';
    throw e;
  } finally {
    const duration = performance.now() - startTime;
    
    // Log performance metric
    console.log(`⏱️  ${operationName}: ${duration.toFixed(2)}ms ${success ? '✅' : '❌'}`);
    
    // Store metric for potential analysis
    performanceMonitor.addMetric({
      operation: operationName,
      duration,
      timestamp: Date.now(),
      success,
      error
    });
  }
}

/**
 * Measures the execution time of a sync operation and returns both result and timing.
 * @param operationName - Name of the operation being measured
 * @param operation - The sync operation to measure
 * @returns The result with side-effect performance logging
 */
export function measureSyncPerformance<T>(
  operationName: string,
  operation: () => T
): T {
  const startTime = performance.now();
  let success = true;
  let error: string | undefined;

  try {
    const result = operation();
    return result;
  } catch (e: unknown) {
    success = false;
    error = e instanceof Error ? e.message : 'Unknown error';
    throw e;
  } finally {
    const duration = performance.now() - startTime;
    
    // Log performance metric
    console.log(`⏱️  ${operationName}: ${duration.toFixed(2)}ms ${success ? '✅' : '❌'}`);
    
    // Store metric for potential analysis
    performanceMonitor.addMetric({
      operation: operationName,
      duration,
      timestamp: Date.now(),
      success,
      error
    });
  }
}

/**
 * Simple LRU (Least Recently Used) cache implementation for performance optimization.
 */
export class LRUCache<K, V> {
  private maxSize: number;
  private cache: Map<K, V>;

  constructor(maxSize: number = 50) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  /**
   * Gets a value from the cache. Moves the key to the front.
   * @param key - The cache key
   * @returns The cached value or undefined
   */
  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to front (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  /**
   * Sets a value in the cache. Evicts oldest if at capacity.
   * @param key - The cache key
   * @param value - The value to cache
   */
  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      // Update existing key - move to front
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Evict least recently used (first item)
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    
    this.cache.set(key, value);
  }

  /**
   * Checks if a key exists in the cache.
   * @param key - The cache key
   * @returns Whether the key exists
   */
  has(key: K): boolean {
    return this.cache.has(key);
  }

  /**
   * Clears all entries from the cache.
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Gets the current size of the cache.
   * @returns The number of cached entries
   */
  size(): number {
    return this.cache.size;
  }
}

/**
 * Optimizes AI API calls by implementing intelligent batching and caching.
 */
export class AIRequestOptimizer {
  private cache = new LRUCache<string, unknown>(100);
  private pendingRequests = new Map<string, Promise<unknown>>();
  private requestQueue: Array<{ key: string; request: () => Promise<unknown>; resolve: (value: unknown) => void; reject: (error: unknown) => void }> = [];
  private isProcessing = false;
  
  /**
   * Makes an optimized AI request with caching and deduplication.
   * 
   * @param key - Unique key for caching
   * @param request - Function that makes the AI request
   * @returns Promise resolving to the AI response
   */
  async makeRequest<T>(key: string, request: () => Promise<T>): Promise<T> {
    // Check cache first
    if (this.cache.has(key)) {
      return this.cache.get(key) as T;
    }
    
    // Check if same request is already pending
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key) as Promise<T>;
    }
    
    // Create new request promise
    const requestPromise = new Promise<T>((resolve, reject) => {
      this.requestQueue.push({
        key,
        request: request as () => Promise<unknown>,
        resolve: resolve as (value: unknown) => void,
        reject: reject as (error: unknown) => void
      });
      
      this.processQueue();
    });
    
    this.pendingRequests.set(key, requestPromise);
    
    return requestPromise;
  }
  
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.requestQueue.length === 0) {
      return;
    }
    
    this.isProcessing = true;
    
    while (this.requestQueue.length > 0) {
      const { key, request, resolve, reject } = this.requestQueue.shift()!;
      
      try {
        const result = await measurePerformance(`AI Request: ${key}`, request);
        this.cache.set(key, result);
        this.pendingRequests.delete(key);
        resolve(result);
      } catch (error) {
        this.pendingRequests.delete(key);
        reject(error);
      }
      
      // Small delay between requests to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    this.isProcessing = false;
  }
  
  /**
   * Clears the cache and pending requests.
   */
  clear(): void {
    this.cache.clear();
    this.pendingRequests.clear();
    this.requestQueue.length = 0;
  }
}

/**
 * Global AI request optimizer instance.
 */
export const aiOptimizer = new AIRequestOptimizer();

/**
 * Performance monitoring singleton to track application performance.
 */
class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 100; // Keep last 100 metrics

  /**
   * Adds a performance metric to the monitor.
   * @param metric - The performance metric to add
   */
  addMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  /**
   * Gets all performance metrics.
   * @returns Array of performance metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Gets metrics for a specific operation.
   * @param operationName - Name of the operation
   * @returns Array of metrics for the operation
   */
  getMetricsForOperation(operationName: string): PerformanceMetric[] {
    return this.metrics.filter(m => m.operation === operationName);
  }

  /**
   * Gets average execution time for an operation.
   * @param operationName - Name of the operation
   * @returns Average duration in milliseconds
   */
  getAverageTime(operationName: string): number {
    const operationMetrics = this.getMetricsForOperation(operationName);
    if (operationMetrics.length === 0) return 0;
    
    const totalTime = operationMetrics.reduce((sum, m) => sum + m.duration, 0);
    return totalTime / operationMetrics.length;
  }

  /**
   * Gets success rate for an operation.
   * @param operationName - Name of the operation
   * @returns Success rate as a percentage (0-100)
   */
  getSuccessRate(operationName: string): number {
    const operationMetrics = this.getMetricsForOperation(operationName);
    if (operationMetrics.length === 0) return 100;
    
    const successCount = operationMetrics.filter(m => m.success).length;
    return (successCount / operationMetrics.length) * 100;
  }

  /**
   * Clears all performance metrics.
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Gets a summary of performance statistics.
   * @returns Performance summary object
   */
  getSummary(): Record<string, { avgTime: number; successRate: number; count: number }> {
    const operations = [...new Set(this.metrics.map(m => m.operation))];
    const summary: Record<string, { avgTime: number; successRate: number; count: number }> = {};
    
    operations.forEach(op => {
      const metrics = this.getMetricsForOperation(op);
      summary[op] = {
        avgTime: this.getAverageTime(op),
        successRate: this.getSuccessRate(op),
        count: metrics.length
      };
    });
    
    return summary;
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor(); 