// src/browser_agent/build_dom_tree.js
// Adapted from browser-use-main/browser_use/dom/buildDomTree.js
// This script is injected into the browser page to extract structured DOM information.

/**
 * Extracts relevant information from a DOM element.
 * @param {Element} element - The DOM element.
 * @param {number} nodeId - A unique identifier for the element.
 * @returns {object | null} - Extracted element information or null if not relevant.
 */
function extractElementInfo(element, nodeId) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) {
        return null;
    }

    const tagName = element.tagName.toLowerCase();
    const isClickable = isElementClickable(element);

    // Only extract info for relevant elements (clickable, input, select, textarea, etc.)
    // Or for elements that might contain important text/data
    // This logic can be refined based on specific needs.
    const relevantTags = ['a', 'button', 'input', 'select', 'textarea', 'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'img', 'li', 'td', 'th'];
    if (!isClickable && !relevantTags.includes(tagName) && !element.hasAttribute('role')) {
         // Skip elements that are not directly interactive and not in relevantTags
         // unless they have a 'role' attribute which might indicate semantic meaning
         if (element.children.length === 0 && !element.textContent.trim()) {
              // Skip empty non-relevant elements
              return null;
         }
         // Optionally, add more conditions to filter irrelevant elements
    }


    let boundingBox = null;
    try {
        const rect = element.getBoundingClientRect();
        boundingBox = {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
            // Add right and bottom for easier calculation if needed
            right: rect.right,
            bottom: rect.bottom,
        };

        // Filter out elements that are too small or outside the viewport
        const MIN_SIZE = 5; // Minimum size in pixels
        if (boundingBox.width < MIN_SIZE || boundingBox.height < MIN_SIZE) {
             return null;
        }

        // Check if element is in viewport (at least partially)
        const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

        if (boundingBox.bottom < 0 || boundingBox.top > viewportHeight ||
            boundingBox.right < 0 || boundingBox.left > viewportWidth) {
            // Element is completely outside the viewport
            // return null; // Uncomment this line if you only want elements in the current viewport
        }


    } catch (e) {
        // Ignore errors getting bounding box
        boundingBox = null;
    }

    const attributes = {};
    // Extract important attributes
    const importantAttributes = ['id', 'class', 'name', 'href', 'value', 'type', 'placeholder', 'role', 'aria-label', 'title', 'alt'];
    for (const attrName of importantAttributes) {
        if (element.hasAttribute(attrName)) {
            attributes[attrName] = element.getAttribute(attrName) || ''; // Use empty string for empty attributes
        }
    }

    // Add data-* attributes
     for (let i = 0; i < element.attributes.length; i++) {
         const attr = element.attributes[i];
         if (attr.name.startsWith('data-')) {
             attributes[attr.name] = attr.value || '';
         }
     }


    // Get visible text content, excluding text from child scripts/styles
    let text = element.textContent ? element.textContent.trim() : '';
     // Basic filtering for excessive text or non-visible text
     if (text.length > 200) { // Limit text length
         text = text.substring(0, 200) + '...';
     }
     // Further refine text extraction if needed to get only user-visible text

    // Check visibility based on computed style
    const computedStyle = window.getComputedStyle(element);
    const isVisible = computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden' && computedStyle.opacity !== '0';
    if (!isVisible) {
        // return null; // Uncomment this line if you only want visible elements
    }
     // Note: Checking if an element is actually interactive (e.g., disabled)
     // might require more sophisticated checks. isElementClickable handles some of this.


    return {
        node_id: nodeId,
        tag: tagName,
        text: text || null, // Use null if text is empty after trim
        attributes: attributes,
        bounding_box: boundingBox,
        is_clickable: isClickable,
        // Add parent info or other structural info if needed
    };
}

/**
 * Checks if an element is likely clickable or interactive.
 * Adapted from common heuristics.
 * @param {Element} element - The DOM element.
 * @returns {boolean} - True if the element is likely clickable.
 */
function isElementClickable(element) {
    const tagName = element.tagName.toLowerCase();

    // Standard interactive elements
    if (['a', 'button', 'input', 'select', 'textarea'].includes(tagName)) {
        // Check for disabled attribute
        if (element.hasAttribute('disabled')) return false;
        // Check input types that are not typically interactive (hidden, text, etc.)
        if (tagName === 'input' && ['text', 'email', 'password', 'number', 'tel', 'url', 'search', 'date', 'time', 'datetime-local', 'month', 'week'].includes(element.type)) {
             // These are typically for input, not clicking, unless they have a specific role or event listener
             // However, a text input might be clicked to focus. Let's consider them clickable for selection purposes.
        }
         if (tagName === 'input' && ['checkbox', 'radio', 'submit', 'reset', 'button', 'image', 'file'].includes(element.type)) {
             return true; // These input types are clearly interactive
         }
         if (tagName === 'a' && !element.hasAttribute('href') && !element.hasAttribute('role')) {
             // Anchor tags without href might not be links, but could have click handlers
             // Consider them potentially clickable
         }
        return true;
    }

    // Elements with click listeners (heuristic - not perfect)
    // This requires checking for common event listener properties, which is complex.
    // A simpler heuristic is checking for common attributes or roles indicating interactivity.
    if (element.hasAttribute('onclick') ||
        element.hasAttribute('tabindex') && element.getAttribute('tabindex') !== '-1' ||
        element.hasAttribute('role') && ['button', 'link', 'checkbox', 'radio', 'tab', 'option', 'menuitem'].includes(element.getAttribute('role').toLowerCase())) {
        return true;
    }

    // Elements with specific CSS properties indicating interactivity (heuristic)
    const computedStyle = window.getComputedStyle(element);
    if (computedStyle.cursor === 'pointer') {
        return true;
    }

    // Check if the element contains interactive children (might indicate the parent is also interactive)
    // This can lead to over-selection, use with caution.
    // if (element.querySelector('a, button, input, select, textarea')) {
    //     return true;
    // }

    return false;
}


/**
 * Traverses the DOM and extracts information from relevant elements.
 * @returns {Array<object>} - A list of structured element information objects.
 */
function getBrowserUseDomInfo() {
    const elementsInfo = [];
    let nodeIdCounter = 0;

    // Use a TreeWalker for efficient traversal
    const walker = document.createTreeWalker(
        document.body, // Start from the body
        NodeFilter.SHOW_ELEMENT, // Show only element nodes
        null, // No custom filter function
        false // Don't expand entity references
    );

    let currentNode = walker.currentNode;
    while (currentNode) {
        const element = currentNode;
        nodeIdCounter++; // Assign a unique ID

        const info = extractElementInfo(element, nodeIdCounter);
        if (info) {
            elementsInfo.push(info);
        }

        currentNode = walker.nextNode();
    }

    // Optionally, add elements from head if needed (e.g., meta tags)
    // This walker only traverses the body.

    return elementsInfo;
}

// Make the function accessible globally after the script is injected
// This allows the Python side to call this function via page.evaluate()
window.getBrowserUseDomInfo = getBrowserUseDomInfo;

// Optional: Immediately execute and store the result if the script is meant
// to be self-executing and attach the result to the window object.
// window.browserUseDomData = getBrowserUseDomInfo();


