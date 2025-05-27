// backend-nodejs/services/dom-service.js
// Enhanced DOM Service with Browser-Use optimizations

const path = require('path');
const fs = require('fs').promises;

class EnhancedDomService {
    constructor() {
        this.domScriptContent = null;
        this.performanceCache = new Map();
        this.init();
    }

    async init() {
        await this.loadDomScript();
    }

    /**
     * Load the enhanced DOM analysis script
     */
    async loadDomScript() {
        try {
            const scriptPath = path.join(__dirname, '..', 'build_dom_tree.js');
            this.domScriptContent = await fs.readFile(scriptPath, 'utf8');
            console.log('[Enhanced DOM Service] DOM analysis script loaded successfully');
        } catch (error) {
            console.error('[Enhanced DOM Service] Failed to load DOM script:', error);
            throw error;
        }
    }

    /**
     * Analyze page with enhanced DOM extraction
     */
    async analyzePage(page, options = {}) {
        const startTime = Date.now();
        
        try {
            // Default options
            const defaultOptions = {
                viewportExpansion: 200,
                includeInvisible: false,
                enableCache: true,
                debugMode: false,
                takeScreenshot: true,
                fullPage: true
            };

            const config = { ...defaultOptions, ...options };

            console.log(`[Enhanced DOM Service] Starting page analysis with options:`, config);

            // Set viewport if specified
            if (config.viewportWidth && config.viewportHeight) {
                await page.setViewportSize({
                    width: config.viewportWidth,
                    height: config.viewportHeight
                });
            }

            // Wait for page to be ready
            await this.waitForPageReady(page, config.waitTimeout || 5000);

            // Take screenshot if requested
            let screenshot = null;
            if (config.takeScreenshot) {
                const screenshotOptions = {
                    fullPage: config.fullPage,
                    type: 'png'
                };
                
                const screenshotBuffer = await page.screenshot(screenshotOptions);
                screenshot = screenshotBuffer.toString('base64');
                console.log(`[Enhanced DOM Service] Screenshot taken (${screenshotBuffer.length} bytes)`);
            }

            // Inject and execute enhanced DOM analysis script
            await page.evaluate(this.domScriptContent);

            // Configure and run DOM analysis
            const domResult = await page.evaluate((analysisConfig) => {
                // Configure the analysis
                if (typeof window.getEnhancedDomInfo === 'function') {
                    return window.getEnhancedDomInfo(document.body, {
                        VIEWPORT_EXPANSION: analysisConfig.viewportExpansion,
                        DEBUG_MODE: analysisConfig.debugMode,
                        CACHE_ENABLED: analysisConfig.enableCache
                    });
                } else {
                    // Fallback to basic function
                    return window.getBrowserUseDomInfo();
                }
            }, config);

            const processingTime = Date.now() - startTime;

            console.log(`[Enhanced DOM Service] Analysis completed in ${processingTime}ms`);
            console.log(`[Enhanced DOM Service] Found ${domResult.elements.length} elements from ${domResult.totalNodes} total nodes`);

            // Store performance metrics
            this.storePerformanceMetrics(page.url(), {
                processingTime,
                elementCount: domResult.elements.length,
                totalNodes: domResult.totalNodes,
                timestamp: new Date().toISOString()
            });

            return {
                success: true,
                screenshot,
                dom_info: domResult.elements,
                documentWidth: domResult.documentWidth,
                documentHeight: domResult.documentHeight,
                viewportWidth: domResult.viewportWidth,
                viewportHeight: domResult.viewportHeight,
                processingTime,
                totalNodes: domResult.totalNodes,
                processedNodes: domResult.processedNodes,
                performanceMetrics: domResult.performanceMetrics || null,
                analysisConfig: config
            };

        } catch (error) {
            const processingTime = Date.now() - startTime;
            console.error('[Enhanced DOM Service] Analysis failed:', error);
            
            return {
                success: false,
                error: error.message,
                processingTime,
                analysisConfig: options
            };
        }
    }

    /**
     * Wait for page to be in ready state
     */
    async waitForPageReady(page, timeout = 5000) {
        try {
            // Wait for network to be idle
            await page.waitForLoadState('networkidle', { timeout });
            
            // Wait for DOM content loaded
            await page.waitForFunction(() => {
                return document.readyState === 'complete';
            }, { timeout });

            // Additional wait for dynamic content
            await page.waitForTimeout(500);

            console.log('[Enhanced DOM Service] Page ready for analysis');
        } catch (error) {
            console.warn('[Enhanced DOM Service] Page ready timeout, proceeding anyway:', error.message);
        }
    }

    /**
     * Generate enhanced CSS selector for element info
     */
    generateEnhancedSelector(elementInfo) {
        if (!elementInfo) return null;

        // Priority 1: Use existing CSS selector if available
        if (elementInfo.css_selector) {
            return elementInfo.css_selector;
        }

        // Priority 2: ID selector
        if (elementInfo.attributes.id) {
            return `#${elementInfo.attributes.id}`;
        }

        let selector = elementInfo.tag;

        // Priority 3: Class selector (filter dynamic classes)
        if (elementInfo.attributes.class) {
            const classes = elementInfo.attributes.class.split(/\s+/)
                .filter(cls => cls.length > 1)
                .filter(cls => {
                    // Filter out likely dynamic classes
                    return !cls.match(/^[a-z]+-\d+$/) &&
                           !cls.match(/^\d+$/) &&
                           !cls.includes('active') &&
                           !cls.includes('selected') &&
                           !cls.includes('hover');
                });

            if (classes.length > 0) {
                selector += '.' + classes.slice(0, 2).join('.');
            }
        }

        // Priority 4: Attribute selectors
        if (elementInfo.tag === 'input' && elementInfo.attributes.type) {
            selector += `[type="${elementInfo.attributes.type}"]`;
        }
        if (elementInfo.tag === 'input' && elementInfo.attributes.name) {
            selector += `[name="${elementInfo.attributes.name}"]`;
        }
        if (elementInfo.tag === 'a' && elementInfo.attributes.href) {
            selector += '[href]';
        }
        if (elementInfo.attributes.role) {
            selector += `[role="${elementInfo.attributes.role}"]`;
        }

        // Priority 5: Test ID attributes
        const testIds = ['data-testid', 'data-cy', 'data-test'];
        for (const testId of testIds) {
            if (elementInfo.attributes[testId]) {
                selector += `[${testId}="${elementInfo.attributes[testId]}"]`;
                break;
            }
        }

        return selector;
    }

    /**
     * Analyze element context for LLM
     */
    analyzeElementContext(selectedElement, allElements) {
        if (!selectedElement || !allElements) {
            return null;
        }

        // Find similar elements
        const similarElements = this.findSimilarElements(selectedElement, allElements);
        
        // Analyze page structure
        const pageStructure = this.analyzePageStructure(allElements);
        
        // Generate element insights
        const elementInsights = this.generateElementInsights(selectedElement, similarElements);

        return {
            selectedElement: {
                ...selectedElement,
                enhancedSelector: this.generateEnhancedSelector(selectedElement),
                confidence: this.calculateSelectorConfidence(selectedElement)
            },
            similarElements: similarElements.map(el => ({
                ...el,
                similarity: this.calculateSimilarity(selectedElement, el),
                reason: this.getSimilarityReason(selectedElement, el)
            })),
            pageStructure,
            elementInsights,
            recommendations: this.generateRecommendations(selectedElement, similarElements, pageStructure)
        };
    }

    /**
     * Find elements similar to the selected one
     */
    findSimilarElements(selectedElement, allElements) {
        const similarElements = [];
        const selectedTag = selectedElement.tag;
        const selectedClasses = selectedElement.attributes.class ? 
            selectedElement.attributes.class.split(/\s+/) : [];

        for (const element of allElements) {
            if (element.node_id === selectedElement.node_id) continue;

            let similarity = 0;
            let reasons = [];

            // Tag similarity (40% weight)
            if (element.tag === selectedTag) {
                similarity += 0.4;
                reasons.push('same_tag');
            }

            // Class similarity (30% weight)
            if (element.attributes.class && selectedClasses.length > 0) {
                const elementClasses = element.attributes.class.split(/\s+/);
                const commonClasses = selectedClasses.filter(cls => elementClasses.includes(cls));
                const classScore = commonClasses.length / Math.max(selectedClasses.length, elementClasses.length);
                similarity += classScore * 0.3;
                if (commonClasses.length > 0) {
                    reasons.push(`common_classes:${commonClasses.join(',')}`);
                }
            }

            // Position similarity (20% weight)
            if (selectedElement.bounding_box && element.bounding_box) {
                const selectedPos = selectedElement.bounding_box;
                const elementPos = element.bounding_box;
                
                // Similar Y position (likely same row/section)
                const yDiff = Math.abs(selectedPos.y - elementPos.y);
                if (yDiff < 50) {
                    similarity += 0.15;
                    reasons.push('similar_y_position');
                }
                
                // Similar size
                const sizeDiff = Math.abs(selectedPos.width - elementPos.width) + 
                               Math.abs(selectedPos.height - elementPos.height);
                if (sizeDiff < 100) {
                    similarity += 0.05;
                    reasons.push('similar_size');
                }
            }

            // Attribute similarity (10% weight)
            const selectedAttrs = Object.keys(selectedElement.attributes);
            const elementAttrs = Object.keys(element.attributes);
            const commonAttrs = selectedAttrs.filter(attr => elementAttrs.includes(attr));
            if (commonAttrs.length > 0) {
                const attrScore = commonAttrs.length / Math.max(selectedAttrs.length, elementAttrs.length);
                similarity += attrScore * 0.1;
                reasons.push(`common_attributes:${commonAttrs.join(',')}`);
            }

            // Only include elements with meaningful similarity
            if (similarity > 0.3) {
                similarElements.push({
                    ...element,
                    similarity,
                    similarityReasons: reasons
                });
            }
        }

        // Sort by similarity and return top 10
        return similarElements
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, 10);
    }

    /**
     * Analyze overall page structure
     */
    analyzePageStructure(allElements) {
        const structure = {
            totalElements: allElements.length,
            elementTypes: {},
            interactiveElements: 0,
            visibleElements: 0,
            pageType: 'unknown',
            contentDistribution: {}
        };

        // Count element types
        for (const element of allElements) {
            structure.elementTypes[element.tag] = (structure.elementTypes[element.tag] || 0) + 1;
            
            if (element.is_clickable) {
                structure.interactiveElements++;
            }
            
            if (element.is_visible) {
                structure.visibleElements++;
            }
        }

        // Determine page type based on element patterns
        structure.pageType = this.determinePageType(structure.elementTypes, allElements);
        
        // Analyze content distribution
        structure.contentDistribution = this.analyzeContentDistribution(allElements);

        return structure;
    }

    /**
     * Determine page type based on element patterns
     */
    determinePageType(elementTypes, allElements) {
        // Article/Blog patterns
        if (elementTypes.article || elementTypes.main) {
            return 'article';
        }

        // E-commerce patterns
        if (elementTypes.form && (elementTypes.button > 5 || elementTypes.input > 5)) {
            const hasPrice = allElements.some(el => 
                el.text && /[\$£€¥][\d,]+/.test(el.text)
            );
            if (hasPrice) return 'ecommerce';
        }

        // List/Directory patterns
        const listElements = (elementTypes.ul || 0) + (elementTypes.ol || 0) + (elementTypes.li || 0);
        if (listElements > 10) {
            return 'list';
        }

        // News patterns
        if (elementTypes.a > 20 && elementTypes.img > 10) {
            return 'news';
        }

        // Form patterns
        if (elementTypes.form && elementTypes.input > 3) {
            return 'form';
        }

        // Dashboard patterns
        if (elementTypes.table || (elementTypes.div > 50 && structure.interactiveElements > 20)) {
            return 'dashboard';
        }

        return 'general';
    }

    /**
     * Analyze content distribution across the page
     */
    analyzeContentDistribution(allElements) {
        const distribution = {
            header: 0,
            main: 0,
            sidebar: 0,
            footer: 0,
            navigation: 0
        };

        const pageHeight = Math.max(...allElements.map(el => 
            el.bounding_box ? el.bounding_box.bottom : 0
        ));

        for (const element of allElements) {
            if (!element.bounding_box) continue;

            const yPosition = element.bounding_box.y;
            const yPercent = yPosition / pageHeight;

            // Classify by position
            if (yPercent < 0.15) {
                distribution.header++;
            } else if (yPercent > 0.85) {
                distribution.footer++;
            } else {
                distribution.main++;
            }

            // Classify by semantic tags
            if (element.tag === 'nav' || element.attributes.role === 'navigation') {
                distribution.navigation++;
            }
        }

        return distribution;
    }

    /**
     * Generate insights about the selected element
     */
    generateElementInsights(selectedElement, similarElements) {
        const insights = {
            uniqueness: 'medium',
            stability: 'medium',
            semanticValue: 'medium',
            extractionDifficulty: 'medium',
            recommendations: []
        };

        // Analyze uniqueness
        if (selectedElement.attributes.id) {
            insights.uniqueness = 'high';
            insights.recommendations.push('Element has unique ID - very reliable selector');
        } else if (similarElements.length === 0) {
            insights.uniqueness = 'high';
            insights.recommendations.push('No similar elements found - unique structure');
        } else if (similarElements.length > 10) {
            insights.uniqueness = 'low';
            insights.recommendations.push('Many similar elements - consider parent context');
        }

        // Analyze stability (CSS class patterns)
        if (selectedElement.attributes.class) {
            const classes = selectedElement.attributes.class.split(/\s+/);
            const hasStableClasses = classes.some(cls => 
                !cls.match(/^[a-z]+-\d+$/) && // Not generated classes
                !cls.includes('active') &&    // Not state classes
                cls.length > 3               // Not too short
            );
            
            if (hasStableClasses) {
                insights.stability = 'high';
                insights.recommendations.push('Has stable CSS classes');
            } else {
                insights.stability = 'low';
                insights.recommendations.push('Classes appear dynamic - use structural selector');
            }
        }

        // Analyze semantic value
        const semanticAttributes = ['aria-label', 'title', 'alt', 'role'];
        const hasSemanticAttrs = semanticAttributes.some(attr => 
            selectedElement.attributes[attr]
        );
        
        if (selectedElement.tag === 'main' || selectedElement.tag === 'article' || hasSemanticAttrs) {
            insights.semanticValue = 'high';
            insights.recommendations.push('Element has semantic meaning');
        }

        // Analyze extraction difficulty
        if (selectedElement.text && selectedElement.text.length > 5) {
            insights.extractionDifficulty = 'low';
            insights.recommendations.push('Element has clear text content');
        } else if (selectedElement.attributes.href || selectedElement.attributes.src) {
            insights.extractionDifficulty = 'low';
            insights.recommendations.push('Element has extractable URL/source');
        } else {
            insights.extractionDifficulty = 'high';
            insights.recommendations.push('Consider what data to extract from this element');
        }

        return insights;
    }

    /**
     * Generate recommendations for element selection
     */
    generateRecommendations(selectedElement, similarElements, pageStructure) {
        const recommendations = [];

        // Selector recommendations
        if (selectedElement.attributes.id) {
            recommendations.push({
                type: 'selector',
                priority: 'high',
                message: 'Use ID selector for maximum reliability',
                selector: `#${selectedElement.attributes.id}`
            });
        } else if (selectedElement.css_selector) {
            recommendations.push({
                type: 'selector',
                priority: 'medium',
                message: 'Generated CSS selector should work reliably',
                selector: selectedElement.css_selector
            });
        }

        // Field name recommendations
        const fieldNameSuggestions = this.generateFieldNameSuggestions(selectedElement, pageStructure);
        recommendations.push({
            type: 'field_name',
            priority: 'medium',
            message: 'Suggested field names based on element analysis',
            suggestions: fieldNameSuggestions
        });

        // Data type recommendations
        const dataType = this.inferDataType(selectedElement);
        recommendations.push({
            type: 'data_type',
            priority: 'medium',
            message: `Inferred data type: ${dataType}`,
            dataType
        });

        // Similar elements warning
        if (similarElements.length > 5) {
            recommendations.push({
                type: 'warning',
                priority: 'high',
                message: `Found ${similarElements.length} similar elements - selector may match multiple items`,
                suggestion: 'Consider using more specific selector or parent context'
            });
        }

        return recommendations;
    }

    /**
     * Generate field name suggestions based on element context
     */
    generateFieldNameSuggestions(element, pageStructure) {
        const suggestions = [];
        
        // Based on element text
        if (element.text) {
            const text = element.text.toLowerCase();
            if (text.includes('title') || text.includes('제목')) {
                suggestions.push('title', 'headline', '제목');
            }
            if (text.includes('price') || text.includes('가격') || /[\$£€¥]/.test(element.text)) {
                suggestions.push('price', 'cost', '가격');
            }
            if (text.includes('date') || text.includes('날짜') || /\d{4}-\d{2}-\d{2}/.test(element.text)) {
                suggestions.push('date', 'published_date', '날짜');
            }
        }

        // Based on attributes
        if (element.attributes.class) {
            const classNames = element.attributes.class.split(/\s+/);
            for (const className of classNames) {
                if (className.includes('title')) suggestions.push('title');
                if (className.includes('price')) suggestions.push('price');
                if (className.includes('date')) suggestions.push('date');
                if (className.includes('link')) suggestions.push('link');
                if (className.includes('image')) suggestions.push('image');
            }
        }

        // Based on page type
        if (pageStructure.pageType === 'news') {
            suggestions.push('news_title', 'article_link', 'publish_date', '뉴스_제목');
        } else if (pageStructure.pageType === 'ecommerce') {
            suggestions.push('product_name', 'product_price', 'product_image', '상품명');
        } else if (pageStructure.pageType === 'list') {
            suggestions.push('list_item', 'item_title', 'item_link', '목록_항목');
        }

        // Based on element tag
        if (element.tag === 'a') {
            suggestions.push('link', 'url', 'href', '링크');
        } else if (element.tag === 'img') {
            suggestions.push('image', 'image_url', 'alt_text', '이미지');
        } else if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(element.tag)) {
            suggestions.push('heading', 'title', 'headline', '제목');
        }

        // Remove duplicates and return top 5
        return [...new Set(suggestions)].slice(0, 5);
    }

    /**
     * Infer data type based on element content and attributes
     */
    inferDataType(element) {
        // URL patterns
        if (element.attributes.href || element.attributes.src) {
            return 'url';
        }

        // Image patterns
        if (element.tag === 'img' || 
            (element.attributes.src && element.attributes.src.match(/\.(jpg|jpeg|png|gif|webp)$/i))) {
            return 'image_url';
        }

        // Number patterns
        if (element.text) {
            if (/^\d+$/.test(element.text.trim())) {
                return 'number';
            }
            if (/[\$£€¥]\d+/.test(element.text)) {
                return 'number'; // price
            }
        }

        // Date patterns
        if (element.text && /\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}/.test(element.text)) {
            return 'date';
        }

        // Boolean patterns
        if (element.attributes.type === 'checkbox' || 
            (element.text && /^(true|false|yes|no|on|off)$/i.test(element.text.trim()))) {
            return 'boolean';
        }

        // Default to text
        return 'text';
    }

    /**
     * Store performance metrics for analysis
     */
    storePerformanceMetrics(url, metrics) {
        const domain = new URL(url).hostname;
        
        if (!this.performanceCache.has(domain)) {
            this.performanceCache.set(domain, []);
        }
        
        const domainMetrics = this.performanceCache.get(domain);
        domainMetrics.push(metrics);
        
        // Keep only last 10 metrics per domain
        if (domainMetrics.length > 10) {
            domainMetrics.shift();
        }
    }

    /**
     * Get performance analytics
     */
    getPerformanceAnalytics() {
        const analytics = {
            totalAnalyses: 0,
            averageProcessingTime: 0,
            domainStats: {}
        };

        for (const [domain, metrics] of this.performanceCache.entries()) {
            analytics.totalAnalyses += metrics.length;
            
            const avgTime = metrics.reduce((sum, m) => sum + m.processingTime, 0) / metrics.length;
            const avgElements = metrics.reduce((sum, m) => sum + m.elementCount, 0) / metrics.length;
            
            analytics.domainStats[domain] = {
                analyses: metrics.length,
                averageProcessingTime: Math.round(avgTime),
                averageElementCount: Math.round(avgElements),
                lastAnalyzed: metrics[metrics.length - 1].timestamp
            };
        }

        if (analytics.totalAnalyses > 0) {
            const allTimes = Array.from(this.performanceCache.values())
                .flat()
                .map(m => m.processingTime);
            analytics.averageProcessingTime = Math.round(
                allTimes.reduce((sum, time) => sum + time, 0) / allTimes.length
            );
        }

        return analytics;
    }

    /**
     * Calculate similarity between two elements
     */
    calculateSimilarity(element1, element2) {
        // This is a simplified version - the full implementation is in findSimilarElements
        let similarity = 0;
        
        if (element1.tag === element2.tag) similarity += 0.4;
        
        if (element1.attributes.class && element2.attributes.class) {
            const classes1 = element1.attributes.class.split(/\s+/);
            const classes2 = element2.attributes.class.split(/\s+/);
            const common = classes1.filter(c => classes2.includes(c));
            similarity += (common.length / Math.max(classes1.length, classes2.length)) * 0.3;
        }
        
        return Math.round(similarity * 100) / 100;
    }

    /**
     * Get similarity reason between elements
     */
    getSimilarityReason(element1, element2) {
        const reasons = [];
        
        if (element1.tag === element2.tag) {
            reasons.push(`Same tag: ${element1.tag}`);
        }
        
        if (element1.attributes.class && element2.attributes.class) {
            const classes1 = element1.attributes.class.split(/\s+/);
            const classes2 = element2.attributes.class.split(/\s+/);
            const common = classes1.filter(c => classes2.includes(c));
            if (common.length > 0) {
                reasons.push(`Common classes: ${common.join(', ')}`);
            }
        }
        
        return reasons.join('; ') || 'Structural similarity';
    }

    /**
     * Calculate selector confidence score
     */
    calculateSelectorConfidence(element) {
        let confidence = 0.5; // base confidence
        
        if (element.attributes.id) {
            confidence = 0.95; // ID is very reliable
        } else if (element.attributes.class) {
            const classes = element.attributes.class.split(/\s+/);
            const stableClasses = classes.filter(cls => 
                !cls.match(/^[a-z]+-\d+$/) && 
                !cls.includes('active') &&
                cls.length > 2
            );
            confidence += (stableClasses.length / classes.length) * 0.3;
        }
        
        // Test attributes increase confidence
        const testAttrs = ['data-testid', 'data-cy', 'data-test'];
        if (testAttrs.some(attr => element.attributes[attr])) {
            confidence += 0.2;
        }
        
        return Math.min(0.99, Math.max(0.1, confidence));
    }
}

module.exports = EnhancedDomService;