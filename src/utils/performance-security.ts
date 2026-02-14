// Performance and Security Utilities
import { useState } from 'react';

// Performance Monitoring
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number> = new Map();
  private observers: PerformanceObserver[] = [];

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Measure render performance
  measureRender(componentName: string) {
    const start = performance.now();
    return () => {
      const end = performance.now();
      this.metrics.set(`${componentName}-render`, end - start);
      console.log(`${componentName} render time: ${end - start}ms`);
    };
  }

  // Measure API response time
  measureAPI(apiCall: string, startTime: number) {
    const duration = performance.now() - startTime;
    this.metrics.set(`${apiCall}-api`, duration);
    
    // Log slow API calls
    if (duration > 1000) {
      console.warn(`Slow API call: ${apiCall} took ${duration}ms`);
    }
  }

  // Get performance metrics
  getMetrics() {
    return Object.fromEntries(this.metrics);
  }

  // Clear metrics
  clearMetrics() {
    this.metrics.clear();
  }

  // Monitor memory usage
  getMemoryUsage() {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: Math.round(memory.usedJSHeapSize / 1048576), // MB
        total: Math.round(memory.totalJSHeapSize / 1048576), // MB
        limit: Math.round(memory.jsHeapSizeLimit / 1048576) // MB
      };
    }
    return null;
  }
}

// Virtual Scrolling for Large Lists
export class VirtualScroller {
  private containerRef: React.RefObject<HTMLDivElement>;
  private itemHeight: number;
  private visibleCount: number;
  private scrollTop: number = 0;
  private totalItems: number;

  constructor(
    containerRef: React.RefObject<HTMLDivElement>,
    itemHeight: number,
    totalItems: number
  ) {
    this.containerRef = containerRef;
    this.itemHeight = itemHeight;
    this.totalItems = totalItems;
    this.visibleCount = Math.ceil(window.innerHeight / itemHeight) + 2;
  }

  // Get visible items range
  getVisibleRange() {
    const startIndex = Math.floor(this.scrollTop / this.itemHeight);
    const endIndex = Math.min(startIndex + this.visibleCount, this.totalItems);
    return { startIndex, endIndex };
  }

  // Get items to render
  getItemsToRender<T>(items: T[]): { item: T; index: number }[] {
    const { startIndex, endIndex } = this.getVisibleRange();
    return items.slice(startIndex, endIndex).map((item, index) => ({
      item,
      index: startIndex + index
    }));
  }

  // Update scroll position
  updateScrollTop() {
    if (this.containerRef.current) {
      this.scrollTop = this.containerRef.current.scrollTop;
    }
  }

  // Get total height for container
  getTotalHeight() {
    return this.totalItems * this.itemHeight;
  }
}

// Image Optimization
export class ImageOptimizer {
  private static cache: Map<string, HTMLImageElement> = new Map();
  private static loadingPromises: Map<string, Promise<HTMLImageElement>> = new Map();

  // Lazy load image with caching
  static async loadImage(src: string): Promise<HTMLImageElement> {
    // Return from cache if available
    if (this.cache.has(src)) {
      return this.cache.get(src)!;
    }

    // Return existing promise if loading
    if (this.loadingPromises.has(src)) {
      return this.loadingPromises.get(src)!;
    }

    // Load image
    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.cache.set(src, img);
        this.loadingPromises.delete(src);
        resolve(img);
      };
      img.onerror = () => {
        this.loadingPromises.delete(src);
        reject(new Error(`Failed to load image: ${src}`));
      };
      img.src = src;
    });

    this.loadingPromises.set(src, promise);
    return promise;
  }

  // Generate optimized thumbnail
  static generateThumbnail(
    canvas: HTMLCanvasElement,
    maxWidth: number,
    maxHeight: number
  ): string {
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    img.src = canvas.toDataURL();

    const scale = Math.min(maxWidth / img.width, maxHeight / img.height);
    const width = img.width * scale;
    const height = img.height * scale;

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0, width, height);

    return canvas.toDataURL('image/jpeg', 0.8);
  }

  // Clear cache
  static clearCache() {
    this.cache.clear();
    this.loadingPromises.clear();
  }
}

// Security Utilities
export class SecurityUtils {
  // Sanitize user input
  static sanitizeInput(input: string): string {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .trim();
  }

  // Validate file type
  static isValidFileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        const baseType = type.replace('/*', '');
        return file.type.startsWith(baseType);
      }
      return file.type === type;
    });
  }

  // Validate file size
  static isValidFileSize(file: File, maxSizeBytes: number): boolean {
    return file.size <= maxSizeBytes;
  }

  // Generate secure filename
  static generateSecureFilename(originalName: string): string {
    const extension = originalName.split('.').pop();
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `${timestamp}_${random}.${extension}`;
  }

  // Check for XSS patterns
  static containsXSS(input: string): boolean {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe\b[^>]*>/gi,
      /<object\b[^>]*>/gi,
      /<embed\b[^>]*>/gi
    ];

    return xssPatterns.some(pattern => pattern.test(input));
  }

  // Rate limiting
  static createRateLimiter(maxRequests: number, windowMs: number) {
    const requests: number[] = [];

    return (identifier: string): boolean => {
      const now = Date.now();
      const windowStart = now - windowMs;

      // Remove old requests
      while (requests.length > 0 && requests[0] < windowStart) {
        requests.shift();
      }

      // Check if under limit
      if (requests.length < maxRequests) {
        requests.push(now);
        return true;
      }

      return false;
    };
  }

  // CSRF token generation
  static generateCSRFToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Content Security Policy helper
  static getCSPHeaders() {
    return {
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob:",
        "font-src 'self'",
        "connect-src 'self'",
        "media-src 'self' blob:",
        "object-src 'none'",
        "frame-src 'none'",
        "base-uri 'self'",
        "form-action 'self'"
      ].join('; ')
    };
  }
}

// Debounce utility for performance
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle utility for performance
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Memoization utility
export function memoize<T extends (...args: any[]) => any>(func: T): T {
  const cache = new Map();
  
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = func(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

// Intersection Observer for lazy loading
export class LazyLoader {
  private observer: IntersectionObserver;
  private callbacks: Map<Element, () => void> = new Map();

  constructor() {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const callback = this.callbacks.get(entry.target);
            if (callback) {
              callback();
              this.observer.unobserve(entry.target);
              this.callbacks.delete(entry.target);
            }
          }
        });
      },
      { threshold: 0.1 }
    );
  }

  observe(element: Element, callback: () => void) {
    this.callbacks.set(element, callback);
    this.observer.observe(element);
  }

  unobserve(element: Element) {
    this.observer.unobserve(element);
    this.callbacks.delete(element);
  }

  disconnect() {
    this.observer.disconnect();
    this.callbacks.clear();
  }
}

// Performance monitoring hook
export function usePerformanceMonitor(componentName: string) {
  const monitor = PerformanceMonitor.getInstance();
  
  return {
    startRender: () => monitor.measureRender(componentName),
    measureAPI: (apiCall: string, startTime: number) => 
      monitor.measureAPI(apiCall, startTime),
    getMetrics: () => monitor.getMetrics(),
    getMemoryUsage: () => monitor.getMemoryUsage()
  };
}

// Security hook
export function useSecurity() {
  return {
    sanitizeInput: SecurityUtils.sanitizeInput,
    isValidFileType: SecurityUtils.isValidFileType,
    isValidFileSize: SecurityUtils.isValidFileSize,
    generateSecureFilename: SecurityUtils.generateSecureFilename,
    containsXSS: SecurityUtils.containsXSS,
    createRateLimiter: SecurityUtils.createRateLimiter,
    generateCSRFToken: SecurityUtils.generateCSRFToken,
    getCSPHeaders: SecurityUtils.getCSPHeaders
  };
}

// Performance optimization hook for lists
export function useVirtualScroller(
  containerRef: React.RefObject<HTMLDivElement>,
  itemHeight: number,
  totalItems: number
) {
  const [scroller] = useState(() => 
    new VirtualScroller(containerRef, itemHeight, totalItems)
  );

  const updateScroll = () => scroller.updateScrollTop();
  const getVisibleItems = <T,>(items: T[]) => scroller.getItemsToRender(items);
  const getTotalHeight = () => scroller.getTotalHeight();

  return {
    updateScroll,
    getVisibleItems,
    getTotalHeight
  };
}
