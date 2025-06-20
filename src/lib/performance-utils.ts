/**
 * @file Performance utilities for monitoring and optimizing the application.
 * Includes debouncing, throttling, and performance monitoring functions.
 */

/**
 * Creates a debounced version of a function that delays invoking until after
 * wait milliseconds have elapsed since the last time it was invoked.
 * 
 * @param func - The function to debounce
 * @param wait - The number of milliseconds to delay
 * @param immediate - Whether to trigger on the leading edge
 * @returns The debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
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
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  let lastFunc: NodeJS.Timeout;
  let lastRan: number;
  
  return function(...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      lastRan = Date.now();
      inThrottle = true;
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        if (Date.now() - lastRan >= wait) {
          func.apply(this, args);
          lastRan = Date.now();
        }
      }, Math.max(wait - (Date.now() - lastRan), 0));
    }
  };
}

/**
 * Measures the performance of a function and logs the result.
 * 
 * @param name - The name of the operation being measured
 * @param func - The function to measure
 * @returns The result of the function
 */
export async function measurePerformance<T>(
  name: string,
  func: () => Promise<T> | T
): Promise<T> {
  const startTime = performance.now();
  
  try {
    const result = await func();
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log(`Performance: ${name} took ${duration.toFixed(2)}ms`);
    
    // Log warning for slow operations
    if (duration > 1000) {
      console.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`);
    }
    
    return result;
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    console.error(`Performance: ${name} failed after ${duration.toFixed(2)}ms`, error);
    throw error;
  }
}

/**
 * Creates a cache with LRU (Least Recently Used) eviction policy.
 * 
 * @param maxSize - Maximum number of items to store in cache
 * @returns Cache object with get, set, has, and clear methods
 */
export function createLRUCache<K, V>(maxSize: number) {
  const cache = new Map<K, V>();
  
  return {
    get(key: K): V | undefined {
      if (cache.has(key)) {
        // Move to end (mark as recently used)
        const value = cache.get(key)!;
        cache.delete(key);
        cache.set(key, value);
        return value;
      }
      return undefined;
    },
    
    set(key: K, value: V): void {
      if (cache.has(key)) {
        // Update existing key
        cache.delete(key);
      } else if (cache.size >= maxSize) {
        // Remove least recently used (first item)
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }
      cache.set(key, value);
    },
    
    has(key: K): boolean {
      return cache.has(key);
    },
    
    clear(): void {
      cache.clear();
    },
    
    get size(): number {
      return cache.size;
    }
  };
}

/**
 * Optimizes AI API calls by implementing intelligent batching and caching.
 */
export class AIRequestOptimizer {
  private cache = createLRUCache<string, any>(100);
  private pendingRequests = new Map<string, Promise<any>>();
  private requestQueue: Array<{ key: string; request: () => Promise<any>; resolve: (value: any) => void; reject: (error: any) => void }> = [];
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
        request: request as () => Promise<any>,
        resolve,
        reject
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
 * Monitors application performance and logs metrics.
 */
export class PerformanceMonitor {
  private metrics: { [key: string]: number[] } = {};
  
  /**
   * Records a performance metric.
   * 
   * @param name - Name of the metric
   * @param value - Value to record
   */
  record(name: string, value: number): void {
    if (!this.metrics[name]) {
      this.metrics[name] = [];
    }
    
    this.metrics[name].push(value);
    
    // Keep only last 100 measurements
    if (this.metrics[name].length > 100) {
      this.metrics[name] = this.metrics[name].slice(-100);
    }
  }
  
  /**
   * Gets statistics for a metric.
   * 
   * @param name - Name of the metric
   * @returns Statistics object with min, max, avg, and count
   */
  getStats(name: string): { min: number; max: number; avg: number; count: number } | null {
    const values = this.metrics[name];
    if (!values || values.length === 0) {
      return null;
    }
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    return { min, max, avg, count: values.length };
  }
  
  /**
   * Logs all performance statistics to console.
   */
  logStats(): void {
    console.group('Performance Statistics');
    
    Object.keys(this.metrics).forEach(name => {
      const stats = this.getStats(name);
      if (stats) {
        console.log(`${name}:`, {
          avg: `${stats.avg.toFixed(2)}ms`,
          min: `${stats.min.toFixed(2)}ms`,
          max: `${stats.max.toFixed(2)}ms`,
          samples: stats.count
        });
      }
    });
    
    console.groupEnd();
  }
}

/**
 * Global performance monitor instance.
 */
export const performanceMonitor = new PerformanceMonitor(); 