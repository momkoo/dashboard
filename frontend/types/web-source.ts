// frontend/types/web-source.ts

// 공통 데이터 필드 타입
export interface DataField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'url' | 'date' | 'image_url' | 'boolean';
  method: 'css_selector' | 'xpath' | 'llm' | 'attribute';
  rule: string;
}

// 웹소스 설정 타입
export interface WebSource {
  name: string;
  url: string;
  data_fields: DataField[];
  schedule?: string;
  enabled?: boolean;
}

// 저장된 웹소스 타입 (백엔드에서 반환되는 형태)
export interface SavedWebSource {
  id: string;
  name: string;
  url: string;
  status: 'active' | 'inactive' | 'error' | 'crawling';
  lastCrawled: string | null;
  dataFields: DataField[];
  createdAt?: string;
}

// 요소 정보 타입
export interface ElementInfo {
  node_id: number;
  tag: string;
  text: string | null;
  attributes: { [key: string]: string };
  bounding_box: { 
    x: number; 
    y: number; 
    width: number; 
    height: number; 
    right?: number; 
    bottom?: number 
  } | null;
  is_clickable: boolean;
}

// LLM 제안 타입
export interface LlmSuggestion {
  id: string;
  name: string;
  description: string;
  dataType: string;
  extractionMethod: string;
  extractionRule: string;
}

// frontend/types/dashboard.ts

export type WebSourceStatus = "active" | "inactive" | "error" | "processing" | "paused"

// Dashboard용 웹소스 타입 (SavedWebSource와 통합)
export interface WebSource {
  id: string;
  name: string;
  url: string;
  status: WebSourceStatus;
  lastCollected: string; // lastCrawled와 동일
  fields?: string[];
  dataFields?: import('./web-source').DataField[]; // 상세 정보용
}

// 수집된 데이터 타입
export interface CollectedData {
  id: string;
  [key: string]: any;
}