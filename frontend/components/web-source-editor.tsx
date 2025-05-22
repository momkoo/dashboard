// src/dashboard/frontend/components/web-source-editor.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PagePreview from './page-preview';
import { WebSource, DataField } from '@/types/web-source';
import { generateSelector } from '@/lib/utils';
import { DataFieldsTable } from './data-fields-table';

// Define ElementInfo type that's compatible with both iframe selection and utils.generateSelector
export interface ElementInfo {
    node_id: number;      // Required for generateSelector compatibility
    tag: string;          // Element tag name
    id: string;           // Element ID attribute
    class: string;        // Element class attribute
    text: string;         // Element text content
    attributes: { [key: string]: string }; // Required for generateSelector compatibility
    bounding_box: { x: number; y: number; width: number; height: number }; // Required for generateSelector compatibility
    is_clickable: boolean; // Required for generateSelector compatibility
    selector?: string;    // Optional CSS selector
}

// DataField interface that matches our component's requirements
interface ExtractorField {
    id: string;
    name: string;
    type: string;         // Data type (Text, Number, etc.)
    method: string;       // Extraction method (CSS Selector, XPath, etc.)
    rule: string;         // Extraction rule (selector string, xpath, etc.)
}



function WebSourceEditor() {
  // State management
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [dataFields, setDataFields] = useState<ExtractorField[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);

  // Handler for selecting a field in the table
  const handleSelectField = (fieldId: string | null) => {
    setSelectedFieldId(fieldId);
  };
  
  // Handler for updating a field
  const handleUpdateField = (updatedField: ExtractorField) => {
    setDataFields(fields => fields.map(f => f.id === updatedField.id ? updatedField : f));
  };
  
  // Handler for deleting a field
  const handleDeleteField = (fieldId: string) => {
    setDataFields(fields => fields.filter(f => f.id !== fieldId));
    if (selectedFieldId === fieldId) setSelectedFieldId(null);
  };
  
  // Handler for adding a new field
  const handleAddField = () => {
    const newField: ExtractorField = {
      id: `${Date.now()}`,
      name: '',
      type: 'Text',
      method: 'CSS Selector',
      rule: '',
    };
    setDataFields(fields => [...fields, newField]);
  };

  // Reset and prepare for a new analysis
  const handleAnalyze = () => {
    setShowPreview(false);
    setDataFields([]);
    setSelectedFieldId(null);
    setTimeout(() => setShowPreview(true), 10); // Force re-mount for iframe reload
  };

  // Handle element selection from the iframe
  const handleElementSelect = (elementInfo: ElementInfo) => {
    console.log("Element selected in editor:", elementInfo);
    if (elementInfo) {
      const cssSelector = generateSelector(elementInfo);
      const newField: DataField = {
        id: `${Date.now()}`,
        name: elementInfo.tag || 'field',
        type: 'text',
        method: 'css_selector',
        rule: cssSelector,
      };
      
      // Add the new field if not a duplicate
      const fieldExists = dataFields.some(field => field.rule === newField.rule);
      if (!fieldExists) {
        setDataFields([...dataFields, newField]);
      } else {
        console.log("Skipping duplicate field:", newField.rule);
      }
    }
  };

  // Save the web source configuration
  const handleSaveSource = async () => {
    setLoading(true);
    try {
      // Basic validation
      if (!url || dataFields.length === 0) {
         console.error("URL and Data Fields are required to save.");
         setLoading(false);
         return;
      }

      // Construct the source configuration
      const sourceConfig: WebSource = {
        name: `Source from ${new URL(url).hostname}`,
        url: url,
        data_fields: dataFields as DataField[],
        schedule: 'manual',
        enabled: true,
      };

      // Send to the backend API
      const response = await fetch('/api/web-source/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sourceConfig),
      });

      if (!response.ok) {
         const errorBody = await response.text();
         console.error(`HTTP error! status: ${response.status}`, errorBody);
         throw new Error(`Failed to save source: ${response.statusText}`);
      }

      console.log('Source saved successfully');
    } catch (error) {
      console.error('Error saving source:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>새 웹 소스 추가</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2 mb-4">
            <div className="flex-grow">
              <Label htmlFor="url" className="sr-only">URL</Label>
              <Input
                id="url"
                type="url"
                placeholder="수집할 웹사이트 URL 입력"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={loading}
              />
            </div>
            <Button onClick={handleAnalyze} disabled={loading || !url}>
              {loading ? '분석 중...' : '분석 시작'}
            </Button>
          </div>

          {showPreview && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left pane: Page Preview */}
              <div>
                <h3 className="text-lg font-semibold mb-2">페이지 미리보기 및 요소 선택</h3>
                <div className="border rounded-md overflow-hidden">
                  <PagePreview
                    url={url}
                    onElementSelect={handleElementSelect}
                  />
                </div>
              </div>

              {/* Right pane: Data Fields Definition */}
              <div>
                 <h3 className="text-lg font-semibold mb-2">데이터 추출 필드 정의</h3>
                 <p className="text-sm text-muted-foreground mb-4">
                    페이지 미리보기에서 요소를 클릭하여 선택된 필드에 대한 추출 규칙을 생성합니다.
                 </p>
                 <DataFieldsTable
                    fields={dataFields}
                    selectedFieldId={selectedFieldId}
                    onSelectField={handleSelectField}
                    onUpdateField={handleUpdateField}
                    onDeleteField={handleDeleteField}
                    onAddField={handleAddField}
                 />
                 <Button onClick={handleSaveSource} disabled={loading || dataFields.length === 0 || !url} className="mt-4">
                    설정 저장
                 </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default WebSourceEditor;
