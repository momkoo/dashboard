// backend-nodejs/server.js
const express = require('express');
const { chromium } = require('playwright');
const bodyParser = require('body-parser');


const YAML = require('yamljs'); // For YAML file operations
const path = require('path');
const fs = require('fs').promises; // Use promise-based fs for async operations
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
// Initialize Supabase client
const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

const app = express();
const PORT = process.env.PORT || 8082; // Use port 8000, matching the frontend's expectation

// Middleware
app.use(bodyParser.json({ limit: '50mb' })); // To parse JSON request bodies, increase limit for screenshots
app.use(bodyParser.urlencoded({ extended: true })); // To parse URL-encoded bodies

// CORS setup (allowing frontend on localhost:3000)
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    next();
});

// Path to the build_dom_tree.js script
const BUILD_DOM_TREE_JS_PATH = path.join(__dirname, 'build_dom_tree.js');
let buildDomTreeScriptContent;

// Load the build_dom_tree.js script content once on server startup
async function loadBuildDomTreeScript() {
    try {
        buildDomTreeScriptContent = await fs.readFile(BUILD_DOM_TREE_JS_PATH, 'utf8');
        console.log('[Backend Node.js] build_dom_tree.js loaded successfully.');
    } catch (error) {
        console.error(`[Backend Node.js] Error loading build_dom_tree.js: ${error}`);
        process.exit(1); // Exit if essential script cannot be loaded
    }
}

// Utility function to generate CSS selector (similar to Python's dom_processor.py)
// Improved to create more useful selectors for web scraping
function generateSelector(elementInfo) {
    console.log('[Backend Node.js] Generating selector for element:', JSON.stringify(elementInfo, null, 2));
    
    // If the element has an ID, use it as it's the most specific
    if (elementInfo.attributes.id) {
        return `#${elementInfo.attributes.id.replace(/[^a-zA-Z0-9_-]/g, '\$&')}`;
    }
    
    // Process class attributes to find the most useful class for selection
    if (elementInfo.attributes.class) {
        const classes = elementInfo.attributes.class.split(/\s+/).filter(Boolean);
        console.log('[Backend Node.js] Element classes:', classes);
        
        // Return just the tag and the first class for simplicity and reliability
        // This is the most general approach that works for most websites
        if (classes.length > 0) {
            // Just use the first class - simple but effective for most cases
            return `${elementInfo.tag}.${classes[0]}`;
        }
    }
    
    // For inputs, include type and name attributes
    if (elementInfo.tag === 'input') {
        const parts = [elementInfo.tag];
        
        if (elementInfo.attributes.type) {
            parts.push(`[type="${elementInfo.attributes.type}"]`);
        }
        if (elementInfo.attributes.name) {
            parts.push(`[name="${elementInfo.attributes.name}"]`);
        }
        return parts.join('');
    } 
    // For links, include href if present
    else if (elementInfo.tag === 'a' && elementInfo.attributes.href) {
        return `${elementInfo.tag}[href]`;
    }
    
    // Fallback to tag name if no better selector could be created
    console.log('[Backend Node.js] Falling back to tag name:', elementInfo.tag);
    return elementInfo.tag;
}


// --- API Endpoints ---

// POST /sources/add/initial
app.post('/sources/add/initial', async (req, res) => {
    let browser;
    let usedEngine = 'playwright';
    try {
        const { url } = req.body;
        console.log(`[Backend Node.js] Received URL for analysis: ${url}`);

        if (!url) {
            return res.status(400).json({ error: 'URL is required.' });
        }

        // Launch Playwright browser and create page (fix: ensure 'page' is defined)
        browser = await chromium.launch({ headless: false }); // Debugging: headless=false
        const page = await browser.newPage();
        const targetViewportWidth = 1920;
        const targetViewportHeight = 1080;
        await page.setViewportSize({ width: targetViewportWidth, height: targetViewportHeight });
        await page.goto(url, { waitUntil: 'networkidle' });

        const targetSelector = 'body';
        try {
            console.log(`[Backend Node.js] Waiting for selector: ${targetSelector}`);
            await page.waitForSelector(targetSelector, { timeout: 20000 });
            console.log(`[Backend Node.js] Selector found: ${targetSelector}`);
        } catch (selectorError) {
            console.warn(`[Backend Node.js] Warning: Timeout or error waiting for selector ${targetSelector}: ${selectorError.message}`);
        }

        console.log('[Backend Node.js] Taking screenshot...');
        // Take full page screenshot
        const screenshotBuffer = await page.screenshot({ fullPage: true });
        const screenshotBase64 = screenshotBuffer.toString('base64');
        console.log('[Backend Node.js] Screenshot taken.');

        console.log('[Backend Node.js] Processing DOM...');
        // Use evaluate to inject DOM script to avoid TrustedScript assignment errors
        await page.evaluate(buildDomTreeScriptContent);
        const domResult = await page.evaluate(() => {
            if (typeof window.getBrowserUseDomInfo === 'function') {
                return window.getBrowserUseDomInfo();
            }
            return { elements: [], documentWidth: 0, documentHeight: 0 };
        });
        console.log(`[Backend Node.js] DOM processing complete. Extracted ${domResult.elements.length} elements.`);

        res.json({
            screenshot: screenshotBase64,
            dom_info: domResult.elements,
            originalDocumentWidth: domResult.documentWidth,
            originalDocumentHeight: domResult.documentHeight,
            originalViewportWidth: targetViewportWidth,
        });

    } catch (error) {
        console.error(`[Backend Node.js] Critical Error during URL analysis: ${error.message}`);
        res.status(500).json({ error: `Failed to analyze URL: ${error.message}` });
    } finally {
        if (browser) {
            console.log('[Backend Node.js] Closing browser.');
            await browser.close();
        }
    }
});

// POST /sources/generate_selector
app.post('/sources/generate_selector', (req, res) => {
    try {
        const { element_info } = req.body;
        if (!element_info) {
            return res.status(400).json({ error: 'element_info is required.' });
        }
        const selector = generateSelector(element_info);
        console.log(`[Backend Node.js] Generated selector: ${selector}`);
        res.json({ selector });
    } catch (error) {
        console.error(`[Backend Node.js] Error generating selector: ${error.message}`);
        res.status(500).json({ error: `Failed to generate selector: ${error.message}` });
    }
});

// GET /api/web-source/list - 모든 웹소스 목록 가져오기
app.get('/api/web-source/list', async (req, res) => {
    try {
        console.log('[Backend Node.js] Fetching web sources list');
        const { data, error } = await supabase
            .from('web_sources')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (error) {
            console.error('[Supabase] Error fetching web sources:', error.message);
            return res.status(500).json({ error: `Failed to fetch web sources: ${error.message}` });
        }
        
        console.log(`[Backend Node.js] Fetched ${data.length} web sources`);
        res.json(data);
    } catch (error) {
        console.error(`[Backend Node.js] Error fetching web sources: ${error.message}`);
        res.status(500).json({ error: `Failed to fetch web sources: ${error.message}` });
    }
});

// POST /sources/add/save
app.post('/sources/add/save', async (req, res) => {
    const configPath = path.join(__dirname, 'config', 'sources.yaml');
    const newConfig = req.body;

    try {
        console.log(`[Backend Node.js] Received config to save: ${newConfig.name}`);

        // Save to Supabase (PostgreSQL)
        // Only save fields that exist in the table
        try {
            // Prepare insert payload
            const insertPayload = {
                name: newConfig.name,
                url: newConfig.url,
                data_fields: newConfig.data_fields || [],
                schedule: newConfig.schedule || 'manual',
                enabled: typeof newConfig.enabled === 'boolean' ? newConfig.enabled : true,
                // created_at, id, etc. are handled by DB default
            };
            const { error: supabaseError, data: supabaseData } = await supabase
                .from('web_sources')
                .insert([insertPayload])
                .select();
            if (supabaseError) {
                console.error('[Supabase] Error inserting web_source:', supabaseError.message);
            } else {
                console.log('[Supabase] Web source inserted:', supabaseData);
            }
        } catch (supabaseCatchError) {
            console.error('[Supabase] Exception during insert:', supabaseCatchError);
        }

        // Ensure config directory exists
        await fs.mkdir(path.dirname(configPath), { recursive: true });

        let existingConfigs = [];
        try {
            const fileContent = await fs.readFile(configPath, 'utf8');
            existingConfigs = YAML.parse(fileContent) || [];
            if (!Array.isArray(existingConfigs)) {
                console.warn(`[Backend Node.js] Warning: Existing config file ${configPath} is not a list. Overwriting.`);
                existingConfigs = [];
            }
        } catch (readError) {
            if (readError.code !== 'ENOENT') { // Ignore file not found error
                console.error(`[Backend Node.js] Error reading existing config file: ${readError.message}`);
            }
            existingConfigs = []; // Initialize as empty if file doesn't exist or read fails
        }

        existingConfigs.push(newConfig);

        await fs.writeFile(configPath, YAML.stringify(existingConfigs, 4), 'utf8'); // Indent with 4 spaces
        console.log(`[Backend Node.js] Config saved successfully to ${configPath}`);
        res.json({ message: 'Configuration saved successfully' });

    } catch (error) {
        console.error(`[Backend Node.js] Error saving config: ${error.message}`);
        res.status(500).json({ error: `Failed to save configuration: ${error.message}` });
    }
});


// Start the server
async function startServer() {
    await loadBuildDomTreeScript(); // Load JS script before starting server
    app.listen(PORT, () => {
        console.log(`[Backend Node.js] Server running on http://localhost:${PORT}`);
    });
}

startServer();