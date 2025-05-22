// src/dashboard/frontend/lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Define ElementInfo type locally if not imported from a shared file
// This should match the structure from the backend's ElementInfo
// Ideally, this should be imported from a shared types file.
export interface ElementInfo {
    node_id: number;
    tag: string;
    text: string | null;
    attributes: { [key: string]: string };
    bounding_box: { x: number; y: number; width: number; height: number; right?: number; bottom?: number } | null;
    is_clickable: boolean;
}


/**
 * Generates a robust CSS selector for a given element based on its information.
 * This is a frontend utility function.
 * Prioritizes unique attributes like ID, then combines tag and classes.
 * Could be enhanced to use other attributes or parent traversal if needed.
 * @param elementInfo - The structured information of the element.
 * @returns A CSS selector string.
 */
export function generateSelector(elementInfo: ElementInfo): string {
    const selectorParts: string[] = [];

    // 1. Prioritize ID if available and not empty
    if (elementInfo.attributes.id) {
        // Basic escaping for ID (though less common needed in practice)
        return `#${elementInfo.attributes.id.replace(/[^a-zA-Z0-9_-]/g, '\\$&')}`;
    }

    // 2. Use tag name
    selectorParts.push(elementInfo.tag);

    // 3. Add classes if available
    if (elementInfo.attributes.class) {
        const classes = elementInfo.attributes.class.split(/\s+/).filter(Boolean); // Split by whitespace and remove empty
        // Filter out potentially dynamic or irrelevant classes if needed
        // Simple heuristic: require hyphen or minimum length
        const validClasses = classes.filter(c => c.length > 2 || c.includes('-')); // Example filter

        if (validClasses.length > 0) {
             // Escape special characters in class names
             const escapedClasses = validClasses.map(c => c.replace(/[^a-zA-Z0-9_-]/g, '\\$&'));
             selectorParts.push("." + escapedClasses.join("."));
        }
    }

    // 4. Add other unique attributes if helpful (e.g., name, type for inputs)
    // Add common input attributes
    if (elementInfo.tag === 'input') {
        if (elementInfo.attributes.type) {
            selectorParts.push(`[type="${elementInfo.attributes.type}"]`);
        }
        if (elementInfo.attributes.name) {
             selectorParts.push(`[name="${elementInfo.attributes.name}"]`);
        }
    } else if (elementInfo.tag === 'a' && elementInfo.attributes.href) {
         // For links, include href if it's a full URL (might be too specific)
         // Or just check for presence: [href]
         selectorParts.push('[href]');
    }
    // Add attributes like [role="button"], [aria-label="..."] if they are reliable indicators

    // Combine parts. Join with '' as they are already in CSS selector format (tag.class#id[attr])
    let selector = selectorParts.join("");

    // Fallback to tag name if the generated selector is empty (shouldn't happen with tag added)
    if (!selector) {
        return elementInfo.tag;
    }

    // TODO: Implement a more robust selector generation logic, possibly
    // by considering parent elements or using XPath.

    return selector;
}
