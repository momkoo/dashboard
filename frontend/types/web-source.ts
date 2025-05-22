// src/dashboard/frontend/types/web-source.ts

// Define the DataField interface (assuming it's part of the WebSource structure)
// This should match the backend's DataField model
export interface DataField {
  id: string;
  name: string;
  type: string; // e.g., 'text', 'number', 'url', 'date'
  method: string; // e.g., 'css_selector', 'xpath', 'llm'
  rule: string; // The selector, XPath, or LLM instruction
}

// Define the WebSource interface
// This should match the backend's WebSourceConfig model
export interface WebSource {
  name: string;
  url: string;
  data_fields: DataField[]; // Use the DataField interface
  schedule?: string; // e.g., 'manual', 'daily', 'hourly'
  enabled?: boolean;
  // Add other configuration fields as needed (e.g., login credentials, headers)
}

// You might also want to export ElementInfo if it's considered a shared type
// import { ElementInfo } from './dashboard'; // If defined in dashboard.ts
// export { ElementInfo }; // Re-export if needed

// Or define ElementInfo here if it logically belongs with web sources
/*
export interface ElementInfo {
  node_id: number;
  tag: string;
  text: string | null;
  attributes: { [key: string]: string };
  bounding_box: { x: number; y: number; width: number; height: number; right?: number; bottom?: number } | null;
  is_clickable: boolean;
}
*/
