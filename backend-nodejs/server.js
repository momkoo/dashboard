// backend-nodejs/server.js (enhanced version)
// Integration with Enhanced DOM Service

const express = require('express');
const { chromium } = require('playwright');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs').promises;
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Import enhanced DOM service
const EnhancedDomService = require('./services/dom-service');

// Initialize services
const domService = new EnhancedDomService();

// Initialize Supabase client
const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { 
    auth: { persistSession: false } 
});

const app = express();
const PORT = process.env.PORT || 8082;

// Middleware
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Enhanced CORS setup
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('[Server Error]', err);
    res.status(500).json({ 
        error: 'Internal server error', 
        message: err.message,
        timestamp: new Date().toISOString()
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        version: '2.0.0-enhanced'
    });
});

// Performance analytics endpoint
app.get('/api/analytics/performance', (req, res) => {
    try {
        const analytics = domService.getPerformanceAnalytics();
        res.json(analytics);
    } catch (error) {
        console.error('[Analytics Error]', error);
        res.status(500).json({ error: 'Failed to get performance analytics' });
    }
});

// Enhanced URL analysis endpoint
app.post('/api/web-source/analyze', async (req, res) => {
    let browser;
    const startTime = Date.now();
    
    try {
        const { url, options = {} } = req.body;
        
        if (!url) {
            return res.status(400).json({ 
                error: 'URL is required',
                timestamp: new Date().toISOString()
            });
        }

        console.log(`[Enhanced Server] Starting analysis for: ${url}`);
        console.log(`[Enhanced Server] Options:`, options);

        // Enhanced browser configuration
        const browserConfig = {
            headless: true,
            args: [
                '--no-sandbox', 
                '--disable-dev-shm-usage',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor'
            ]
        };

        // Launch browser
        browser = await chromium.launch(browserConfig);
        const context = await browser.newContext({
            viewport: { 
                width: options.viewportWidth || 1920, 
                height: options.viewportHeight || 1080 
            },
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        });

        const page = await context.newPage();
        
        // Enhanced navigation with retry logic
        let navigationSuccess = false;
        let attempts = 0;
        const maxAttempts = 3;

        while (!navigationSuccess && attempts < maxAttempts) {
            try {
                attempts++;
                console.log(`[Enhanced Server] Navigation attempt ${attempts}/${maxAttempts}`);
                
                await page.goto(url, { 
                    waitUntil: 'networkidle', 
                    timeout: 30000 
                });
                
                navigationSuccess = true;
                console.log(`[Enhanced Server] Successfully navigated to ${url}`);
            } catch (navError) {
                console.warn(`[Enhanced Server] Navigation attempt ${attempts} failed:`, navError.message);
                
                if (attempts === maxAttempts) {
                    throw new Error(`Failed to navigate to ${url} after ${maxAttempts} attempts: ${navError.message}`);
                }
                
                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        // Use enhanced DOM service for analysis
        const analysisOptions = {
            viewportExpansion: options.viewportExpansion || 200,
            includeInvisible: options.includeInvisible || false,
            enableCache: options.enableCache !== false,
            debugMode: options.debugMode || false,
            takeScreenshot: options.takeScreenshot !== false,
            fullPage: options.fullPage !== false,
            waitTimeout: options.waitTimeout || 5000
        };

        const result = await domService.analyzePage(page, analysisOptions);
        
        if (!result.success) {
            throw new Error(result.error || 'DOM analysis failed');
        }

        const totalTime = Date.now() - startTime;
        
        console.log(`[Enhanced Server] Analysis completed in ${totalTime}ms`);
        console.log(`[Enhanced Server] Found ${result.dom_info.length} elements`);

        // Prepare response
        res.json({
            success: true,
            url,
            screenshot: result.screenshot,
            dom_info: result.dom_info,
            originalDocumentWidth: result.documentWidth,
            originalDocumentHeight: result.documentHeight,
            originalViewportWidth: result.viewportWidth,
            originalViewportHeight: result.viewportHeight,
            processingTime: result.processingTime,
            totalTime,
            totalNodes: result.totalNodes,
            processedNodes: result.processedNodes,
            performanceMetrics: result.performanceMetrics,
            analysisConfig: result.analysisConfig,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        const totalTime = Date.now() - startTime;
        console.error('[Enhanced Server] Analysis error:', error);
        
        res.status(500).json({ 
            success: false,
            error: `Failed to analyze URL: ${error.message}`,
            url: req.body.url,
            processingTime: totalTime,
            timestamp: new Date().toISOString()
        });
    } finally {
        if (browser) {
            try {
                await browser.close();
                console.log('[Enhanced Server] Browser closed successfully');
            } catch (closeError) {
                console.warn('[Enhanced Server] Error closing browser:', closeError);
            }
        }
    }
});

// Enhanced element context analysis endpoint
app.post('/api/web-source/analyze-element', async (req, res) => {
    try {
        const { selectedElement, allElements, options = {} } = req.body;
        
        if (!selectedElement || !allElements) {
            return res.status(400).json({ 
                error: 'selectedElement and allElements are required' 
            });
        }

        console.log(`[Enhanced Server] Analyzing element context for node_id: ${selectedElement.node_id}`);

        // Use enhanced DOM service for element analysis  
        const context = domService.analyzeElementContext(selectedElement, allElements);
        
        if (!context) {
            return res.status(500).json({ 
                error: 'Failed to analyze element context' 
            });
        }

        res.json({
            success: true,
            context,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('[Enhanced Server] Element analysis error:', error);
        res.status(500).json({ 
            error: `Failed to analyze element: ${error.message}`,
            timestamp: new Date().toISOString()
        });
    }
});

// Enhanced selector generation endpoint
app.post('/api/web-source/generate-selector', (req, res) => {
    try {
        const { elementInfo } = req.body;
        
        if (!elementInfo) {
            return res.status(400).json({ 
                error: 'elementInfo is required' 
            });
        }

        const selector = domService.generateEnhancedSelector(elementInfo);
        const confidence = domService.calculateSelectorConfidence(elementInfo);
        
        console.log(`[Enhanced Server] Generated selector: ${selector} (confidence: ${confidence})`);
        
        res.json({ 
            success: true,
            selector,
            confidence,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('[Enhanced Server] Selector generation error:', error);
        res.status(500).json({ 
            error: `Failed to generate selector: ${error.message}`,
            timestamp: new Date().toISOString()
        });
    }
});

// Enhanced web source saving endpoint
app.post('/api/web-source/save', async (req, res) => {
    try {
        const { name, url, dataFields, schedule = 'manual', enabled = true, forceUpdate = false } = req.body;
        
        if (!name || !url || !dataFields || !Array.isArray(dataFields)) {
            return res.status(400).json({ 
                error: 'name, url, and dataFields (array) are required',
                timestamp: new Date().toISOString()
            });
        }

        console.log(`[Enhanced Server] Saving web source: ${name}`);
        console.log(`[Enhanced Server] URL: ${url}`);
        console.log(`[Enhanced Server] Data fields: ${dataFields.length} fields`);
        console.log(`[Enhanced Server] Force update: ${forceUpdate}`);

        // Check if a web source with the same URL already exists
        const { data: existingSource, error: findError } = await supabase
            .from('web_sources')
            .select('id, name, url')
            .eq('url', url.trim())
            .maybeSingle();
            
        if (findError) {
            console.error('[Enhanced Server] Error checking for existing source:', findError);
        }
        
        // If a source with the same URL exists and forceUpdate is false, return conflict status
        if (existingSource && !forceUpdate) {
            console.log(`[Enhanced Server] Source with URL ${url} already exists: ${existingSource.id}`);
            return res.status(409).json({
                success: false,
                error: 'duplicate_source',
                message: 'A web source with this URL already exists',
                existingSource: {
                    id: existingSource.id,
                    name: existingSource.name,
                    url: existingSource.url
                },
                timestamp: new Date().toISOString()
            });
        }

        // Validate data fields
        const validatedFields = dataFields.map((field, index) => {
            if (!field.name || !field.rule) {
                throw new Error(`Data field ${index + 1} missing required name or rule`);
            }
            
            return {
                id: field.id || `field_${Date.now()}_${index}`,
                name: field.name.trim(),
                type: field.type || 'text',
                method: field.method || 'css_selector',
                rule: field.rule.trim()
            };
        });

        // Prepare payload
        const payload = {
            name: name.trim(),
            url: url.trim(),
            data_fields: validatedFields,
            schedule: schedule,
            enabled: enabled
            // created_at is handled by database default
            // updated_at column doesn't exist in the schema
        };

        let result;
        
        // Update existing source or insert new one
        if (existingSource && forceUpdate) {
            console.log(`[Enhanced Server] Updating existing source: ${existingSource.id}`);
            const { error: updateError, data: updateData } = await supabase
                .from('web_sources')
                .update(payload)
                .eq('id', existingSource.id)
                .select();
                
            if (updateError) {
                throw new Error(`Database error: ${updateError.message}`);
            }
            
            result = {
                success: true,
                message: 'Web source updated successfully',
                id: existingSource.id,
                updated: true,
                ...updateData[0]
            };
        } else {
            // Save new source to Supabase
            const { error: insertError, data: insertData } = await supabase
                .from('web_sources')
                .insert([payload])
                .select();
                
            if (insertError) {
                throw new Error(`Database error: ${insertError.message}`);
            }
            
            result = {
                success: true,
                message: 'Web source saved successfully',
                id: insertData[0].id,
                updated: false,
                ...insertData[0]
            };
        }

        console.log('[Enhanced Server] Web source operation completed:', result.id);

        // Also save to YAML file for backup (optional)
        try {
            const YAML = require('yamljs');
            const configPath = path.join(__dirname, 'config', 'sources.yaml');
            
            // Ensure config directory exists
            await fs.mkdir(path.dirname(configPath), { recursive: true });

            let existingConfigs = [];
            try {
                const fileContent = await fs.readFile(configPath, 'utf8');
                existingConfigs = YAML.parse(fileContent) || [];
                if (!Array.isArray(existingConfigs)) {
                    existingConfigs = [];
                }
            } catch (readError) {
                // File doesn't exist or is invalid, start fresh
                existingConfigs = [];
            }

            // Add new config or update existing one
            if (existingSource && forceUpdate) {
                // Update existing entry
                const index = existingConfigs.findIndex(config => config.url === url);
                if (index !== -1) {
                    existingConfigs[index] = {
                        name: name,
                        url: url,
                        data_fields: validatedFields
                    };
                } else {
                    // Add if not found (shouldn't happen but just in case)
                    existingConfigs.push({
                        name: name,
                        url: url,
                        data_fields: validatedFields
                    });
                }
            } else {
                // Add new config
                existingConfigs.push({
                    name: name,
                    url: url,
                    data_fields: validatedFields
                });
            }

            await fs.writeFile(configPath, YAML.stringify(existingConfigs, 4), 'utf8');
            console.log('[Enhanced Server] Web source also saved to YAML backup');
        } catch (yamlError) {
            console.warn('[Enhanced Server] Failed to save YAML backup:', yamlError.message);
            // Don't fail the request if YAML backup fails
        }

        // Add fields and timestamp to the result
        result.dataFields = validatedFields;
        result.timestamp = new Date().toISOString();
        
        // Return the result
        res.json(result);

    } catch (error) {
        console.error('[Enhanced Server] Save error:', error);
        res.status(500).json({ 
            error: `Failed to save web source: ${error.message}`,
            timestamp: new Date().toISOString()
        });
    }
});

// Enhanced web sources list endpoint
app.get('/api/web-source/list', async (req, res) => {
    try {
        console.log('[Enhanced Server] Fetching web sources list');
        
        const { data, error } = await supabase
            .from('web_sources')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (error) {
            console.error('[Enhanced Server] Supabase error:', error);
            throw new Error(`Database error: ${error.message}`);
        }
        
        console.log(`[Enhanced Server] Fetched ${data.length} web sources`);
        
        // Transform data for frontend compatibility
        const transformedData = data.map(source => ({
            ...source,
            // Ensure data_fields is always an array
            data_fields: Array.isArray(source.data_fields) ? source.data_fields : [],
            // Add computed fields for compatibility
            lastCrawled: source.last_crawled_at,
            status: source.crawling_status || (source.enabled ? 'active' : 'inactive')
        }));
        
        res.json(transformedData);
        
    } catch (error) {
        console.error('[Enhanced Server] List error:', error);
        res.status(500).json({ 
            error: `Failed to fetch web sources: ${error.message}`,
            timestamp: new Date().toISOString()
        });
    }
});

// Web source detail endpoint
app.get('/api/web-source/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log(`[Enhanced Server] Fetching web source: ${id}`);
        
        const { data, error } = await supabase
            .from('web_sources')
            .select('*')
            .eq('id', id)
            .single();
            
        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({ 
                    error: 'Web source not found',
                    timestamp: new Date().toISOString()
                });
            }
            throw new Error(`Database error: ${error.message}`);
        }
        
        res.json({
            success: true,
            data: {
                ...data,
                data_fields: Array.isArray(data.data_fields) ? data.data_fields : [],
                lastCrawled: data.last_crawled_at,
                status: data.crawling_status || (data.enabled ? 'active' : 'inactive')
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('[Enhanced Server] Detail error:', error);
        res.status(500).json({ 
            error: `Failed to fetch web source: ${error.message}`,
            timestamp: new Date().toISOString()
        });
    }
});

// Update web source endpoint
app.put('/api/web-source/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, url, dataFields, schedule, enabled } = req.body;
        
        console.log(`[Enhanced Server] Updating web source: ${id}`);
        
        const updatePayload = {
            updated_at: new Date().toISOString()
        };
        
        if (name) updatePayload.name = name.trim();
        if (url) updatePayload.url = url.trim();
        if (dataFields) updatePayload.data_fields = dataFields;
        if (schedule !== undefined) updatePayload.schedule = schedule;
        if (enabled !== undefined) updatePayload.enabled = enabled;
        
        const { data, error } = await supabase
            .from('web_sources')
            .update(updatePayload)
            .eq('id', id)
            .select();
            
        if (error) {
            throw new Error(`Database error: ${error.message}`);
        }
        
        if (!data || data.length === 0) {
            return res.status(404).json({ 
                error: 'Web source not found',
                timestamp: new Date().toISOString()
            });
        }
        
        res.json({
            success: true,
            message: 'Web source updated successfully',
            data: data[0],
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('[Enhanced Server] Update error:', error);
        res.status(500).json({ 
            error: `Failed to update web source: ${error.message}`,
            timestamp: new Date().toISOString()
        });
    }
});

// Delete web source endpoint
app.delete('/api/web-source/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log(`[Enhanced Server] Deleting web source: ${id}`);
        
        const { error } = await supabase
            .from('web_sources')
            .delete()
            .eq('id', id);
            
        if (error) {
            throw new Error(`Database error: ${error.message}`);
        }
        
        res.json({
            success: true,
            message: 'Web source deleted successfully',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('[Enhanced Server] Delete error:', error);
        res.status(500).json({ 
            error: `Failed to delete web source: ${error.message}`,
            timestamp: new Date().toISOString()
        });
    }
});

// Start crawling endpoint (placeholder for future implementation)
app.post('/api/web-source/:id/crawl', async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log(`[Enhanced Server] Starting crawl for web source: ${id}`);
        
        // Update status to crawling
        await supabase
            .from('web_sources')
            .update({ 
                crawling_status: 'crawling',
                updated_at: new Date().toISOString()
            })
            .eq('id', id);
        
        // TODO: Implement actual crawling logic here
        // For now, just simulate crawling completion after a delay
        setTimeout(async () => {
            await supabase
                .from('web_sources')
                .update({ 
                    crawling_status: 'completed',
                    last_crawled_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);
        }, 5000);
        
        res.json({
            success: true,
            message: 'Crawling started',
            id,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('[Enhanced Server] Crawl error:', error);
        res.status(500).json({ 
            error: `Failed to start crawling: ${error.message}`,
            timestamp: new Date().toISOString()
        });
    }
});

// Test endpoint for DOM service
app.post('/api/test/dom-analysis', async (req, res) => {
    try {
        const { url } = req.body;
        
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }
        
        console.log(`[Enhanced Server] Testing DOM analysis for: ${url}`);
        
        // This is a simplified test - you could expand this
        res.json({
            success: true,
            message: 'DOM analysis test endpoint',
            url,
            serviceStatus: 'operational',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('[Enhanced Server] Test error:', error);
        res.status(500).json({ 
            error: `Test failed: ${error.message}`,
            timestamp: new Date().toISOString()
        });
    }
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ 
        error: 'Endpoint not found',
        path: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString()
    });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
    console.log('[Enhanced Server] SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('[Enhanced Server] SIGINT received, shutting down gracefully');
    process.exit(0);
});

// Start the server
async function startServer() {
    try {
        // Wait for DOM service to initialize
        console.log('[Enhanced Server] Initializing DOM service...');
        await domService.init();
        console.log('[Enhanced Server] DOM service ready');

        app.listen(PORT, () => {
            console.log(`[Enhanced Server] Server running on http://localhost:${PORT}`);
            console.log(`[Enhanced Server] Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`[Enhanced Server] Enhanced DOM analysis system loaded`);
            console.log(`[Enhanced Server] Available endpoints:`);
            console.log(`  POST /api/web-source/analyze - Enhanced URL analysis`);
            console.log(`  POST /api/web-source/analyze-element - Element context analysis`);
            console.log(`  POST /api/web-source/generate-selector - Enhanced selector generation`);
            console.log(`  GET  /api/web-source/list - List web sources`);
            console.log(`  POST /api/web-source/save - Save web source`);
            console.log(`  GET  /api/analytics/performance - Performance analytics`);
            console.log(`  GET  /health - Health check`);
        });
    } catch (error) {
        console.error('[Enhanced Server] Failed to start server:', error);
        process.exit(1);
    }
}

startServer();