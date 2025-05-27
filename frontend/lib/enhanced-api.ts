// frontend/lib/enhanced-api.ts
// Enhanced API client for DOM analysis system

interface AnalysisOptions {
    viewportWidth?: number;
    viewportHeight?: number;
    viewportExpansion?: number;
    includeInvisible?: boolean;
    enableCache?: boolean;
    debugMode?: boolean;
    takeScreenshot?: boolean;
    fullPage?: boolean;
    waitTimeout?: number;
  }
  
  interface ElementInfo {
    node_id: number;
    tag: string;
    text: string | null;
    attributes: { [key: string]: string };
    bounding_box: {
      x: number;
      y: number;
      width: number;
      height: number;
      right: number;
      bottom: number;
    } | null;
    is_clickable: boolean;
    is_visible: boolean;
    css_selector?: string;
    xpath?: string;
  }
  
  interface AnalysisResult {
    success: boolean;
    url: string;
    screenshot: string;
    dom_info: ElementInfo[];
    originalDocumentWidth: number;
    originalDocumentHeight: number;
    originalViewportWidth: number;
    originalViewportHeight: number;
    processingTime: number;
    totalTime: number;
    totalNodes: number;
    processedNodes: number;
    performanceMetrics?: any;
    analysisConfig: AnalysisOptions;
    timestamp: string;
  }
  
  interface ElementContext {
    selectedElement: ElementInfo & {
      enhancedSelector: string;
      confidence: number;
    };
    similarElements: Array<ElementInfo & {
      similarity: number;
      reason: string;
    }>;
    pageStructure: {
      totalElements: number;
      elementTypes: { [key: string]: number };
      interactiveElements: number;
      visibleElements: number;
      pageType: string;
      contentDistribution: { [key: string]: number };
    };
    elementInsights: {
      uniqueness: string;
      stability: string;
      semanticValue: string;
      extractionDifficulty: string;
      recommendations: string[];
    };
    recommendations: Array<{
      type: string;
      priority: string;
      message: string;
      [key: string]: any;
    }>;
  }
  
  class EnhancedApiClient {
    private baseUrl: string;
    private timeout: number;
  
    constructor(baseUrl: string = 'http://localhost:8082', timeout: number = 60000) {
      this.baseUrl = baseUrl;
      this.timeout = timeout;
    }
  
    /**
     * Enhanced URL analysis with performance optimization
     */
    async analyzeUrl(url: string, options: AnalysisOptions = {}): Promise<AnalysisResult> {
      const startTime = Date.now();
      
      try {
        console.log('[Enhanced API] Starting URL analysis:', url);
        
        const response = await fetch(`${this.baseUrl}/api/web-source/analyze`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url, options }),
          signal: AbortSignal.timeout(this.timeout)
        });
  
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }
  
        const result = await response.json();
        
        const clientTime = Date.now() - startTime;
        console.log(`[Enhanced API] Analysis completed in ${clientTime}ms (server: ${result.processingTime}ms)`);
        console.log(`[Enhanced API] Found ${result.dom_info.length} elements`);
  
        return result;
      } catch (error) {
        console.error('[Enhanced API] Analysis failed:', error);
        throw error;
      }
    }
  
    /**
     * Analyze element context for enhanced insights
     */
    async analyzeElementContext(selectedElement: ElementInfo, allElements: ElementInfo[]): Promise<ElementContext> {
      try {
        console.log(`[Enhanced API] Analyzing context for element: ${selectedElement.node_id}`);
        
        const response = await fetch(`${this.baseUrl}/api/web-source/analyze-element`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ selectedElement, allElements }),
          signal: AbortSignal.timeout(10000) // Shorter timeout for element analysis
        });
  
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }
  
        const result = await response.json();
        console.log('[Enhanced API] Element context analysis completed');
        
        return result.context;
      } catch (error) {
        console.error('[Enhanced API] Element context analysis failed:', error);
        throw error;
      }
    }
  
    /**
     * Generate enhanced CSS selector
     */
    async generateSelector(elementInfo: ElementInfo): Promise<{ selector: string; confidence: number }> {
      try {
        const response = await fetch(`${this.baseUrl}/api/web-source/generate-selector`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ elementInfo }),
          signal: AbortSignal.timeout(5000)
        });
  
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }
  
        const result = await response.json();
        return { selector: result.selector, confidence: result.confidence };
      } catch (error) {
        console.error('[Enhanced API] Selector generation failed:', error);
        throw error;
      }
    }
  
    /**
     * Get performance analytics
     */
    async getPerformanceAnalytics() {
      try {
        const response = await fetch(`${this.baseUrl}/api/analytics/performance`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        });
  
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
  
        return await response.json();
      } catch (error) {
        console.error('[Enhanced API] Failed to get performance analytics:', error);
        throw error;
      }
    }
  
    /**
     * Health check
     */
    async healthCheck() {
      try {
        const response = await fetch(`${this.baseUrl}/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        });
  
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
  
        return await response.json();
      } catch (error) {
        console.error('[Enhanced API] Health check failed:', error);
        throw error;
      }
    }
  
    /**
     * Save web source with validation
     */
    async saveWebSource(webSourceData: {
      name: string;
      url: string;
      dataFields: Array<{
        id?: string;
        name: string;
        type: string;
        method: string;
        rule: string;
      }>;
      schedule?: string;
      enabled?: boolean;
      forceUpdate?: boolean;
    }) {
      try {
        console.log('[Enhanced API] Saving web source:', webSourceData.name);
        
        const response = await fetch(`${this.baseUrl}/api/web-source/save`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webSourceData),
          signal: AbortSignal.timeout(10000)
        });
  
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          
          // Handle 409 Conflict (duplicate source) specially
          if (response.status === 409 && errorData.error === 'duplicate_source') {
            // Create a custom error with additional properties
            const error: Error & { status?: number; data?: any } = new Error('duplicate_source');
            error.status = 409;
            error.data = errorData;
            throw error;
          }
          
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }
  
        const result = await response.json();
        console.log('[Enhanced API] Web source saved successfully:', result.id);
        
        return result;
      } catch (error) {
        console.error('[Enhanced API] Failed to save web source:', error);
        throw error;
      }
    }
  
    /**
     * Get list of web sources
     */
    async getWebSources() {
      try {
        const response = await fetch(`${this.baseUrl}/api/web-source/list`, {
          method: 'GET',
          signal: AbortSignal.timeout(10000)
        });
  
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
  
        return await response.json();
      } catch (error) {
        console.error('[Enhanced API] Failed to get web sources:', error);
        throw error;
      }
    }
  }
  
  // Export singleton instance
  export const enhancedApi = new EnhancedApiClient();
  
  // Export types for use in components
  export type { 
    AnalysisOptions, 
    ElementInfo, 
    AnalysisResult, 
    ElementContext 
  };