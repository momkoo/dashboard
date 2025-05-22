// backend-nodejs/server.js
const express = require('express');
const { chromium } = require('playwright');
const bodyParser = require('body-parser');
const YAML = require('yamljs'); // For YAML file operations
const path = require('path');
const fs = require('fs').promises; // Use promise-based fs for async operations

const app = express();
const PORT = process.env.PORT || 8000; // Use port 8000, matching the frontend's expectation

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
function generateSelector(elementInfo) {
    const selectorParts = [];

    if (elementInfo.attributes.id) {
        return `#${elementInfo.attributes.id.replace(/[^a-zA-Z0-9_-]/g, '\\$&')}`;
    }

    selectorParts.push(elementInfo.tag);

    if (elementInfo.attributes.class) {
        const classes = elementInfo.attributes.class.split(/\s+/).filter(Boolean);
        const validClasses = classes.filter(c => c.length > 2 || c.includes('-'));
        if (validClasses.length > 0) {
            const escapedClasses = validClasses.map(c => c.replace(/[^a-zA-Z0-9_-]/g, '\\$&'));
            selectorParts.push("." + escapedClasses.join("."));
        }
    }

    if (elementInfo.tag === 'input') {
        if (elementInfo.attributes.type) {
            selectorParts.push(`[type="${elementInfo.attributes.type}"]`);
        }
        if (elementInfo.attributes.name) {
            selectorParts.push(`[name="${elementInfo.attributes.name}"]`);
        }
    } else if (elementInfo.tag === 'a' && elementInfo.attributes.href) {
        selectorParts.push('[href]');
    }

    let selector = selectorParts.join("");
    if (!selector) {
        return elementInfo.tag;
    }
    return selector;
}


// --- API Endpoints ---

// POST /sources/add/initial
app.post('/sources/add/initial', async (req, res) => {
    let browser;
    try {
        const { url } = req.body;
        console.log(`[Backend Node.js] Received URL for analysis: ${url}`);

        if (!url) {
            return res.status(400).json({ error: 'URL is required.' });
        }

        console.log('[Backend Node.js] Launching browser...');
        // Launch browser in non-headless mode for debugging, change to true for production
        browser = await chromium.launch({ headless: false }); // Debugging: headless=false
        const page = await browser.newPage();
        console.log('[Backend Node.js] Browser launched, new page created.');

        console.log(`[Backend Node.js] Navigating to: ${url}`);
        await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 }); // Increased timeout
        console.log(`[Backend Node.js] Navigation to ${url} complete.`);

        // Wait for body or a specific selector to ensure content is loaded
        const targetSelector = 'body'; // Default to body, but more specific is better
        try {
            console.log(`[Backend Node.js] Waiting for selector: ${targetSelector}`);
            await page.waitForSelector(targetSelector, { timeout: 20000 }); // Wait for 20 seconds
            console.log(`[Backend Node.js] Selector found: ${targetSelector}`);
        } catch (selectorError) {
            console.warn(`[Backend Node.js] Warning: Timeout or error waiting for selector ${targetSelector}: ${selectorError.message}`);
            // Continue even if selector not found, as page might still have content
        }

        console.log('[Backend Node.js] Taking screenshot...');
        const screenshotBuffer = await page.screenshot();
        const screenshotBase64 = screenshotBuffer.toString('base64');
        console.log('[Backend Node.js] Screenshot taken.');

        console.log('[Backend Node.js] Processing DOM...');
        // Inject the build_dom_tree.js script and execute its function
        await page.evaluate(buildDomTreeScriptContent);
        const domInfo = await page.evaluate(() => {
            // Assuming build_dom_tree.js defines getBrowserUseDomInfo() globally
            if (typeof window.getBrowserUseDomInfo === 'function') {
                return window.getBrowserUseDomInfo();
            }
            return [];
        });
        console.log(`[Backend Node.js] DOM processing complete. Extracted ${domInfo.length} elements.`);

        res.json({ screenshot: screenshotBase64, dom_info: domInfo });

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

// POST /sources/add/save
app.post('/sources/add/save', async (req, res) => {
    const configPath = path.join(__dirname, 'config', 'sources.yaml');
    const newConfig = req.body;

    try {
        console.log(`[Backend Node.js] Received config to save: ${newConfig.name}`);

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

