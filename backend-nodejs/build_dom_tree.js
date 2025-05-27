// backend-nodejs/enhanced_build_dom_tree.js
// Browser-Use 방식으로 개선된 DOM 분석 시스템
// 성능 최적화, 캐싱, 메트릭스 수집 포함

/**
 * Enhanced DOM Tree Builder with Browser-Use optimizations
 * Features:
 * - Performance caching with WeakMap
 * - Element visibility detection
 * - Interactive element identification
 * - Viewport expansion support
 * - Performance metrics collection
 * - Memory efficient processing
 */

(function() {
    'use strict';

    // =============================================================================
    // CONFIGURATION & PERFORMANCE MONITORING
    // =============================================================================

    const CONFIG = {
        DEBUG_MODE: typeof window !== 'undefined' && window.location.search.includes('debug=true'),
        VIEWPORT_EXPANSION: 200, // pixels to expand viewport for element detection
        MIN_ELEMENT_SIZE: 5, // minimum width/height for elements
        MAX_TEXT_LENGTH: 200, // maximum text content length
        CACHE_ENABLED: true,
        PERFORMANCE_TRACKING: true
    };

    // Performance metrics collection
    const PERFORMANCE_METRICS = CONFIG.DEBUG_MODE ? {
        buildDomTreeCalls: 0,
        timings: {
            buildDomTree: 0,
            elementProcessing: 0,
            visibilityCheck: 0,
            boundingRectCalculation: 0,
            styleComputation: 0
        },
        cacheMetrics: {
            boundingRectCacheHits: 0,
            boundingRectCacheMisses: 0,
            computedStyleCacheHits: 0,
            computedStyleCacheMisses: 0,
            overallHitRate: 0
        },
        nodeMetrics: {
            totalNodes: 0,
            processedNodes: 0,
            skippedNodes: 0,
            interactiveNodes: 0,
            visibleNodes: 0
        }
    } : null;

    // =============================================================================
    // CACHING SYSTEM
    // =============================================================================

    const DOM_CACHE = {
        boundingRects: new WeakMap(),
        computedStyles: new WeakMap(),
        elementVisibility: new WeakMap(),
        interactiveElements: new WeakMap(),
        
        clearCache: function() {
            this.boundingRects = new WeakMap();
            this.computedStyles = new WeakMap();
            this.elementVisibility = new WeakMap();
            this.interactiveElements = new WeakMap();
        }
    };

    // =============================================================================
    // UTILITY FUNCTIONS
    // =============================================================================

    function measureTime(fn, metricName) {
        if (!CONFIG.PERFORMANCE_TRACKING || !PERFORMANCE_METRICS) return fn;
        
        return function(...args) {
            const start = performance.now();
            const result = fn.apply(this, args);
            const duration = performance.now() - start;
            
            if (metricName && PERFORMANCE_METRICS.timings[metricName] !== undefined) {
                PERFORMANCE_METRICS.timings[metricName] += duration;
            }
            
            return result;
        };
    }

    function debugLog(...args) {
        if (CONFIG.DEBUG_MODE) {
            console.log('[Enhanced DOM Builder]', ...args);
        }
    }

    // =============================================================================
    // CACHED DOM OPERATIONS
    // =============================================================================

    function getCachedBoundingRect(element) {
        if (!element || !CONFIG.CACHE_ENABLED) {
            return element ? element.getBoundingClientRect() : null;
        }

        if (DOM_CACHE.boundingRects.has(element)) {
            if (PERFORMANCE_METRICS) {
                PERFORMANCE_METRICS.cacheMetrics.boundingRectCacheHits++;
            }
            return DOM_CACHE.boundingRects.get(element);
        }

        if (PERFORMANCE_METRICS) {
            PERFORMANCE_METRICS.cacheMetrics.boundingRectCacheMisses++;
        }

        const rect = measureTime(() => element.getBoundingClientRect(), 'boundingRectCalculation')();
        
        if (rect) {
            DOM_CACHE.boundingRects.set(element, rect);
        }
        
        return rect;
    }

    function getCachedComputedStyle(element) {
        if (!element || !CONFIG.CACHE_ENABLED) {
            return element ? window.getComputedStyle(element) : null;
        }

        if (DOM_CACHE.computedStyles.has(element)) {
            if (PERFORMANCE_METRICS) {
                PERFORMANCE_METRICS.cacheMetrics.computedStyleCacheHits++;
            }
            return DOM_CACHE.computedStyles.get(element);
        }

        if (PERFORMANCE_METRICS) {
            PERFORMANCE_METRICS.cacheMetrics.computedStyleCacheMisses++;
        }

        const style = measureTime(() => window.getComputedStyle(element), 'styleComputation')();
        
        if (style) {
            DOM_CACHE.computedStyles.set(element, style);
        }
        
        return style;
    }

    // =============================================================================
    // ELEMENT ANALYSIS FUNCTIONS
    // =============================================================================

    /**
     * Enhanced visibility detection with viewport expansion
     */
    function isElementVisible(element) {
        if (!element) return false;

        // Check cache first
        if (CONFIG.CACHE_ENABLED && DOM_CACHE.elementVisibility.has(element)) {
            return DOM_CACHE.elementVisibility.get(element);
        }

        const rect = getCachedBoundingRect(element);
        if (!rect) {
            DOM_CACHE.elementVisibility.set(element, false);
            return false;
        }

        // Check if element has meaningful size
        if (rect.width < CONFIG.MIN_ELEMENT_SIZE || rect.height < CONFIG.MIN_ELEMENT_SIZE) {
            DOM_CACHE.elementVisibility.set(element, false);
            return false;
        }

        // Check computed style for visibility
        const style = getCachedComputedStyle(element);
        if (style) {
            const isHidden = style.display === 'none' || 
                           style.visibility === 'hidden' || 
                           style.opacity === '0' ||
                           style.clip === 'rect(0px, 0px, 0px, 0px)';
            
            if (isHidden) {
                DOM_CACHE.elementVisibility.set(element, false);
                return false;
            }
        }

        // Enhanced viewport detection with expansion
        const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
        const expansion = CONFIG.VIEWPORT_EXPANSION;

        const isInExpandedViewport = rect.left < viewportWidth + expansion &&
                                   rect.right > -expansion &&
                                   rect.top < viewportHeight + expansion &&
                                   rect.bottom > -expansion;

        // Element is visible if it's in expanded viewport OR if viewport expansion is -1 (include all)
        const isVisible = CONFIG.VIEWPORT_EXPANSION === -1 || isInExpandedViewport;

        DOM_CACHE.elementVisibility.set(element, isVisible);
        return isVisible;
    }

    /**
     * Enhanced interactive element detection
     */
    function isElementInteractive(element) {
        if (!element) return false;

        // Check cache first
        if (CONFIG.CACHE_ENABLED && DOM_CACHE.interactiveElements.has(element)) {
            return DOM_CACHE.interactiveElements.get(element);
        }

        const tagName = element.tagName.toLowerCase();
        let isInteractive = false;

        // Standard interactive elements
        const interactiveTags = ['a', 'button', 'input', 'select', 'textarea', 'details', 'summary'];
        if (interactiveTags.includes(tagName)) {
            // Check if disabled
            if (element.hasAttribute('disabled')) {
                isInteractive = false;
            } else if (tagName === 'input') {
                // Specific input types that are interactive
                const interactiveInputTypes = [
                    'button', 'submit', 'reset', 'checkbox', 'radio', 
                    'file', 'image', 'color', 'date', 'datetime-local',
                    'email', 'month', 'number', 'password', 'search',
                    'tel', 'text', 'time', 'url', 'week', 'range'
                ];
                isInteractive = !element.type || interactiveInputTypes.includes(element.type);
            } else if (tagName === 'a') {
                // Links need href or role to be considered interactive
                isInteractive = element.hasAttribute('href') || element.hasAttribute('role');
            } else {
                isInteractive = true;
            }
        }

        // Check for interactive attributes
        if (!isInteractive) {
            const hasInteractiveAttributes = element.hasAttribute('onclick') ||
                                           element.hasAttribute('onmousedown') ||
                                           element.hasAttribute('onmouseup') ||
                                           element.hasAttribute('ontouchstart') ||
                                           element.hasAttribute('ontouchend') ||
                                           (element.hasAttribute('tabindex') && element.getAttribute('tabindex') !== '-1');
            
            if (hasInteractiveAttributes) {
                isInteractive = true;
            }
        }

        // Check for interactive roles
        if (!isInteractive) {
            const role = element.getAttribute('role');
            const interactiveRoles = [
                'button', 'link', 'checkbox', 'radio', 'tab', 'option', 
                'menuitem', 'treeitem', 'gridcell', 'columnheader', 'rowheader',
                'slider', 'spinbutton', 'switch', 'textbox', 'combobox',
                'listbox', 'searchbox'
            ];
            
            if (role && interactiveRoles.includes(role.toLowerCase())) {
                isInteractive = true;
            }
        }

        // Check CSS cursor property
        if (!isInteractive) {
            const style = getCachedComputedStyle(element);
            if (style && style.cursor === 'pointer') {
                isInteractive = true;
            }
        }

        // Check for contenteditable
        if (!isInteractive && element.contentEditable === 'true') {
            isInteractive = true;
        }

        DOM_CACHE.interactiveElements.set(element, isInteractive);
        return isInteractive;
    }

    /**
     * Get element's text content with length limitation
     */
    function getElementText(element) {
        if (!element) return null;

        let text = '';
        
        // For input elements, get value or placeholder
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            text = element.value || element.placeholder || '';
        }
        // For images, get alt text
        else if (element.tagName === 'IMG') {
            text = element.alt || element.title || '';
        }
        // For other elements, get text content
        else {
            text = element.textContent || element.innerText || '';
        }

        // Clean and limit text
        text = text.trim();
        if (text.length > CONFIG.MAX_TEXT_LENGTH) {
            text = text.substring(0, CONFIG.MAX_TEXT_LENGTH) + '...';
        }

        return text || null;
    }

    /**
     * Extract important attributes from element
     */
    function extractElementAttributes(element) {
        const attributes = {};
        
        // Important attributes to capture
        const importantAttributes = [
            'id', 'class', 'name', 'href', 'src', 'alt', 'title', 
            'type', 'value', 'placeholder', 'role', 'aria-label', 
            'aria-describedby', 'aria-expanded', 'aria-selected',
            'data-testid', 'data-cy', 'data-test'
        ];

        importantAttributes.forEach(attrName => {
            if (element.hasAttribute(attrName)) {
                const value = element.getAttribute(attrName);
                if (value !== null && value !== '') {
                    attributes[attrName] = value;
                }
            }
        });

        // Capture all data- attributes
        Array.from(element.attributes).forEach(attr => {
            if (attr.name.startsWith('data-') && !attributes[attr.name]) {
                attributes[attr.name] = attr.value;
            }
        });

        return attributes;
    }

    /**
     * Generate enhanced CSS selector for element
     */
    function generateEnhancedSelector(element) {
        if (!element) return null;

        // Priority 1: ID (most specific)
        if (element.id) {
            return `#${element.id}`;
        }

        const tagName = element.tagName.toLowerCase();
        let selector = tagName;

        // Priority 2: Classes (filter out dynamic ones)
        if (element.className && typeof element.className === 'string') {
            const classes = element.className.split(/\s+/)
                .filter(cls => cls.length > 0)
                .filter(cls => {
                    // Filter out likely dynamic classes
                    return !cls.match(/^[a-z]+-\d+$/) && // react-123
                           !cls.match(/^\d+$/) && // pure numbers
                           !cls.includes('active') && // state classes
                           !cls.includes('selected') &&
                           !cls.includes('hover') &&
                           cls.length > 1;
                });

            if (classes.length > 0) {
                // Use only the first 2 most stable classes
                selector += '.' + classes.slice(0, 2).join('.');
            }
        }

        // Priority 3: Attributes for specific elements
        if (tagName === 'input' && element.type) {
            selector += `[type="${element.type}"]`;
        }
        if (tagName === 'input' && element.name) {
            selector += `[name="${element.name}"]`;
        }
        if (tagName === 'a' && element.href) {
            selector += '[href]';
        }
        if (element.role) {
            selector += `[role="${element.role}"]`;
        }

        // Priority 4: Data attributes (testing selectors)
        const testIds = ['data-testid', 'data-cy', 'data-test'];
        for (const testId of testIds) {
            if (element.hasAttribute(testId)) {
                selector += `[${testId}="${element.getAttribute(testId)}"]`;
                break;
            }
        }

        return selector;
    }

    /**
     * Extract comprehensive element information
     */
    function extractElementInfo(element, nodeId) {
        if (!element || element.nodeType !== Node.ELEMENT_NODE) {
            return null;
        }

        if (PERFORMANCE_METRICS) {
            PERFORMANCE_METRICS.nodeMetrics.totalNodes++;
        }

        const tagName = element.tagName.toLowerCase();
        
        // Skip script, style, and other non-visual elements
        const skipTags = ['script', 'style', 'noscript', 'meta', 'link', 'title', 'head'];
        if (skipTags.includes(tagName)) {
            if (PERFORMANCE_METRICS) {
                PERFORMANCE_METRICS.nodeMetrics.skippedNodes++;
            }
            return null;
        }

        // Check visibility
        const isVisible = measureTime(() => isElementVisible(element), 'visibilityCheck')();
        if (!isVisible && CONFIG.VIEWPORT_EXPANSION !== -1) {
            if (PERFORMANCE_METRICS) {
                PERFORMANCE_METRICS.nodeMetrics.skippedNodes++;
            }
            return null;
        }

        // Check if element is interactive
        const isInteractive = isElementInteractive(element);

        // Get bounding box information
        let boundingBox = null;
        try {
            const rect = getCachedBoundingRect(element);
            if (rect && (rect.width >= CONFIG.MIN_ELEMENT_SIZE || rect.height >= CONFIG.MIN_ELEMENT_SIZE)) {
                boundingBox = {
                    x: Math.round(rect.x + window.scrollX),
                    y: Math.round(rect.y + window.scrollY),
                    width: Math.round(rect.width),
                    height: Math.round(rect.height),
                    right: Math.round(rect.right + window.scrollX),
                    bottom: Math.round(rect.bottom + window.scrollY)
                };
            }
        } catch (error) {
            debugLog('Error getting bounding rect for element:', error);
        }

        // Skip elements that are too small and not interactive
        if (!boundingBox && !isInteractive) {
            if (PERFORMANCE_METRICS) {
                PERFORMANCE_METRICS.nodeMetrics.skippedNodes++;
            }
            return null;
        }

        // Extract element information
        const elementInfo = {
            node_id: nodeId,
            tag: tagName,
            text: getElementText(element),
            attributes: extractElementAttributes(element),
            bounding_box: boundingBox,
            is_clickable: isInteractive,
            is_visible: isVisible,
            css_selector: generateEnhancedSelector(element),
            xpath: null // Will be generated if needed
        };

        // Update metrics
        if (PERFORMANCE_METRICS) {
            PERFORMANCE_METRICS.nodeMetrics.processedNodes++;
            if (isInteractive) {
                PERFORMANCE_METRICS.nodeMetrics.interactiveNodes++;
            }
            if (isVisible) {
                PERFORMANCE_METRICS.nodeMetrics.visibleNodes++;
            }
        }

        return elementInfo;
    }

    // =============================================================================
    // MAIN DOM TREE BUILDING FUNCTION
    // =============================================================================

    /**
     * Build enhanced DOM tree with performance optimizations
     */
    function buildEnhancedDomTree(rootElement = document.body) {
        const startTime = performance.now();
        
        if (PERFORMANCE_METRICS) {
            PERFORMANCE_METRICS.buildDomTreeCalls++;
            DOM_CACHE.clearCache(); // Clear cache for fresh analysis
        }

        debugLog('Starting enhanced DOM tree building...');

        const elementsInfo = [];
        let nodeIdCounter = 0;

        // Use TreeWalker for efficient DOM traversal
        const walker = document.createTreeWalker(
            rootElement,
            NodeFilter.SHOW_ELEMENT,
            {
                acceptNode: function(node) {
                    // Pre-filter obviously irrelevant nodes
                    const tagName = node.tagName.toLowerCase();
                    const skipTags = ['script', 'style', 'noscript', 'meta', 'link'];
                    return skipTags.includes(tagName) ? 
                        NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
                }
            },
            false
        );

        let currentNode = walker.currentNode;
        while (currentNode) {
            nodeIdCounter++;
            
            const elementInfo = measureTime(
                () => extractElementInfo(currentNode, nodeIdCounter), 
                'elementProcessing'
            )();
            
            if (elementInfo) {
                elementsInfo.push(elementInfo);
            }

            currentNode = walker.nextNode();
        }

        // Calculate document dimensions
        const documentWidth = Math.max(
            document.documentElement.scrollWidth,
            document.documentElement.offsetWidth,
            document.documentElement.clientWidth,
            document.body ? document.body.scrollWidth : 0,
            document.body ? document.body.offsetWidth : 0
        );

        const documentHeight = Math.max(
            document.documentElement.scrollHeight,
            document.documentElement.offsetHeight,
            document.documentElement.clientHeight,
            document.body ? document.body.scrollHeight : 0,
            document.body ? document.body.offsetHeight : 0
        );

        const processingTime = performance.now() - startTime;
        
        if (PERFORMANCE_METRICS) {
            PERFORMANCE_METRICS.timings.buildDomTree = processingTime;
            
            // Calculate cache hit rates
            const totalBoundingRectAccesses = PERFORMANCE_METRICS.cacheMetrics.boundingRectCacheHits + 
                                            PERFORMANCE_METRICS.cacheMetrics.boundingRectCacheMisses;
            const totalStyleAccesses = PERFORMANCE_METRICS.cacheMetrics.computedStyleCacheHits + 
                                     PERFORMANCE_METRICS.cacheMetrics.computedStyleCacheMisses;
            
            if (totalBoundingRectAccesses > 0) {
                PERFORMANCE_METRICS.cacheMetrics.boundingRectHitRate = 
                    PERFORMANCE_METRICS.cacheMetrics.boundingRectCacheHits / totalBoundingRectAccesses;
            }
            if (totalStyleAccesses > 0) {
                PERFORMANCE_METRICS.cacheMetrics.computedStyleHitRate = 
                    PERFORMANCE_METRICS.cacheMetrics.computedStyleCacheHits / totalStyleAccesses;
            }
            
            PERFORMANCE_METRICS.cacheMetrics.overallHitRate = 
                (PERFORMANCE_METRICS.cacheMetrics.boundingRectCacheHits + PERFORMANCE_METRICS.cacheMetrics.computedStyleCacheHits) /
                Math.max(1, totalBoundingRectAccesses + totalStyleAccesses);
        }

        debugLog(`DOM tree building completed in ${processingTime.toFixed(2)}ms`);
        debugLog(`Processed ${elementsInfo.length} elements from ${nodeIdCounter} total nodes`);

        const result = {
            elements: elementsInfo,
            documentWidth,
            documentHeight,
            processingTime,
            totalNodes: nodeIdCounter,
            processedNodes: elementsInfo.length,
            viewportWidth: window.innerWidth || 1920,
            viewportHeight: window.innerHeight || 1080,
            scrollX: window.scrollX || 0,
            scrollY: window.scrollY || 0
        };

        // Add performance metrics in debug mode
        if (CONFIG.DEBUG_MODE && PERFORMANCE_METRICS) {
            result.performanceMetrics = PERFORMANCE_METRICS;
        }

        return result;
    }

    // =============================================================================
    // EXPORT FUNCTIONS
    // =============================================================================

    // Main function for external use
    window.getBrowserUseDomInfo = function() {
        return buildEnhancedDomTree(document.body);
    };

    // Enhanced function with custom root element
    window.getEnhancedDomInfo = function(rootElement = document.body, options = {}) {
        // Apply custom configuration
        const oldConfig = { ...CONFIG };
        Object.assign(CONFIG, options);
        
        try {
            return buildEnhancedDomTree(rootElement);
        } finally {
            // Restore original configuration
            Object.assign(CONFIG, oldConfig);
        }
    };

    // Utility functions for external use
    window.domAnalysisUtils = {
        isElementVisible,
        isElementInteractive,
        generateEnhancedSelector,
        getCachedBoundingRect,
        getCachedComputedStyle,
        clearDomCache: () => DOM_CACHE.clearCache(),
        getPerformanceMetrics: () => PERFORMANCE_METRICS
    };

    debugLog('Enhanced DOM analysis system loaded successfully');

})();