// backend-nodejs/build_dom_tree.js
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

    const relevantTags = ['a', 'button', 'input', 'select', 'textarea', 'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'img', 'li', 'td', 'th'];
    if (!isClickable && !relevantTags.includes(tagName) && !element.hasAttribute('role')) {
        if (element.children.length === 0 && !element.textContent.trim()) {
            return null;
        }
    }


    let boundingBox = null;
    try {
        const rect = element.getBoundingClientRect();
        boundingBox = {
            // 뷰포트 기준 좌표에 현재 페이지의 스크롤 X/Y 값을 더하여
            // 문서 전체 기준의 좌표를 만듭니다.
            x: rect.x + window.scrollX,
            y: rect.y + window.scrollY,
            width: rect.width,
            height: rect.height,
            right: rect.right + window.scrollX,
            bottom: rect.bottom + window.scrollY,
        };

        const MIN_SIZE = 5;
        if (boundingBox.width < MIN_SIZE || boundingBox.height < MIN_SIZE) {
            return null;
        }
        // 전체 페이지 스크린샷을 찍으므로, 요소가 뷰포트 밖에 있어도 유효하게 처리해야 합니다.
        // 여기서는 뷰포트 내 존재 여부 필터링을 제거합니다.

    } catch (e) {
        boundingBox = null;
    }

    const attributes = {};
    const importantAttributes = ['id', 'class', 'name', 'href', 'value', 'type', 'placeholder', 'role', 'aria-label', 'title', 'alt'];
    for (const attrName of importantAttributes) {
        if (element.hasAttribute(attrName)) {
            attributes[attrName] = element.getAttribute(attrName) || '';
        }
    }

    for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i];
        if (attr.name.startsWith('data-')) {
            attributes[attr.name] = attr.value || '';
        }
    }


    let text = element.textContent ? element.textContent.trim() : '';
    if (text.length > 200) {
        text = text.substring(0, 200) + '...';
    }

    const computedStyle = window.getComputedStyle(element);
    const isVisible = computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden' && computedStyle.opacity !== '0';
    if (!isVisible) {
      // return null; // 주석 처리 또는 제거
    }


    return {
        node_id: nodeId,
        tag: tagName,
        text: text || null,
        attributes: attributes,
        bounding_box: boundingBox, // 이제 이 boundingBox는 문서 전체 기준 좌표입니다.
        is_clickable: isClickable,
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
        if (element.hasAttribute('disabled')) return false;
        if (tagName === 'input' && ['checkbox', 'radio', 'submit', 'reset', 'button', 'image', 'file'].includes(element.type)) {
            return true;
        }
        if (tagName === 'a' && !element.hasAttribute('href') && !element.hasAttribute('role')) {
        }
        return true;
    }

    if (element.hasAttribute('onclick') ||
        element.hasAttribute('tabindex') && element.getAttribute('tabindex') !== '-1' ||
        element.hasAttribute('role') && ['button', 'link', 'checkbox', 'radio', 'tab', 'option', 'menuitem'].includes(element.getAttribute('role').toLowerCase())) {
        return true;
    }

    const computedStyle = window.getComputedStyle(element);
    if (computedStyle.cursor === 'pointer') {
        return true;
    }

    return false;
}


/**
 * Traverses the DOM and extracts information from relevant elements.
 * @returns {object} - A list of structured element information objects, and document dimensions.
 */
function getBrowserUseDomInfo() {
    const elementsInfo = [];
    let nodeIdCounter = 0;

    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_ELEMENT,
        null,
        false
    );

    let currentNode = walker.currentNode;
    while (currentNode) {
        const element = currentNode;
        nodeIdCounter++;

        const info = extractElementInfo(element, nodeIdCounter);
        if (info) {
            elementsInfo.push(info);
        }

        currentNode = walker.nextNode();
    }
    // 문서 전체의 스크롤 가능한 너비와 높이를 함께 반환합니다.
    // 이는 fullPage 스크린샷의 실제 픽셀 크기와 일치합니다.
    return {
        elements: elementsInfo,
        documentWidth: document.documentElement.scrollWidth,
        documentHeight: document.documentElement.scrollHeight
    };
}

window.getBrowserUseDomInfo = getBrowserUseDomInfo;