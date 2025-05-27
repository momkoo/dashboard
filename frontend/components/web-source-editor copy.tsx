// frontend/components/web-source-editor.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { DataField, ElementInfo } from '@/types/web-source';

import { generateSelector } from '@/lib/utils';


interface ExtractorField {
  id: string;
  name: string;
  type: string;
  method: string;
  rule: string;
}

interface DataFieldsTableProps {
  fields: ExtractorField[];
  selectedFieldId: string | null;
  onSelectField: (fieldId: string | null) => void;
  onUpdateField: (field: ExtractorField) => void;
  onDeleteField: (fieldId: string) => void;
  onAddField: () => void;
}

function DataFieldsTable({
  fields,
  selectedFieldId,
  onSelectField,
  onUpdateField,
  onDeleteField,
  onAddField,
}: DataFieldsTableProps) {
  return (
    <div className="space-y-4">
      <div className="border rounded-md">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="p-2 text-left text-xs font-medium">필드명</th>
              <th className="p-2 text-left text-xs font-medium">타입</th>
              <th className="p-2 text-left text-xs font-medium">방식</th>
              <th className="p-2 text-left text-xs font-medium">규칙</th>
              <th className="p-2 text-left text-xs font-medium">액션</th>
            </tr>
          </thead>
          <tbody>
            {fields.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  필드가 없습니다. "필드 추가" 버튼을 클릭하세요.
                </td>
              </tr>
            ) : (
              fields.map((field) => (
                <tr
                  key={field.id}
                  className={`cursor-pointer hover:bg-gray-50 ${
                    selectedFieldId === field.id ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => onSelectField(field.id)}
                >
                  <td className="p-2">
                    <Input
                      value={field.name}
                      onChange={(e) => onUpdateField({ ...field, name: e.target.value })}
                      placeholder="필드명"
                      className="h-8"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td className="p-2">
                    <select
                      value={field.type}
                      onChange={(e) => onUpdateField({ ...field, type: e.target.value })}
                      className="h-8 w-full border rounded px-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="text">텍스트</option>
                      <option value="number">숫자</option>
                      <option value="url">URL</option>
                      <option value="date">날짜</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <select
                      value={field.method}
                      onChange={(e) => onUpdateField({ ...field, method: e.target.value })}
                      className="h-8 w-full border rounded px-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="css_selector">CSS 선택자</option>
                      <option value="xpath">XPath</option>
                      <option value="llm">LLM</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <Input
                      value={field.rule}
                      onChange={(e) => onUpdateField({ ...field, rule: e.target.value })}
                      placeholder="추출 규칙"
                      className="h-8"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td className="p-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteField(field.id);
                      }}
                      className="h-8 w-8 p-0 text-red-500"
                    >
                      ×
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Button variant="outline" size="sm" onClick={onAddField}>
        + 필드 추가
      </Button>
    </div>
  );
}


interface WebSourceEditorProps {
  initialUrl?: string;
}

function WebSourceEditor({ initialUrl = '' }: WebSourceEditorProps) {
  const { toast } = useToast();
  const [url, setUrl] = useState(initialUrl);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [dataFields, setDataFields] = useState<ExtractorField[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [domInfo, setDomInfo] = useState<ElementInfo[]>([]);

  const screenshotRef = useRef<HTMLImageElement>(null);
  const screenshotContainerRef = useRef<HTMLDivElement>(null);

  const [imageLoaded, setImageLoaded] = useState(false);
  const [scaleX, setScaleX] = useState(1);
  const [scaleY, setScaleY] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);

  // 백엔드에서 전달받은 원본 문서(스크린샷) 크기
  const [originalDocumentWidth, setOriginalDocumentWidth] = useState(0);
  const [originalDocumentHeight, setOriginalDocumentHeight] = useState(0);
  // 백엔드에서 전달받은 뷰포트 너비 (DOM 좌표의 X축 스케일 기준)
  const [originalViewportWidth, setOriginalViewportWidth] = useState(1920); // Playwright 설정 값과 동일
  const [selectedElementId, setSelectedElementId] = useState<number | null>(null);
  // initialUrl이 있을 때 자동으로 분석 시작
  useEffect(() => {
    if (initialUrl && !showPreview) {
      handleAnalyze();
    }
  }, [initialUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  // 스크린샷 이미지 로드 시 크기 및 스케일 계산
  useEffect(() => {
    const calculateScales = () => {
      const img = screenshotRef.current;
      const container = screenshotContainerRef.current;

      if (!img || !container || !screenshot || originalDocumentWidth === 0 || originalDocumentHeight === 0) {
        setImageLoaded(false);
        return;
      }

      // 프런트엔드에서 렌더링된 스크린샷 이미지의 실제 크기
      const renderedWidth = img.offsetWidth;
      const renderedHeight = img.offsetHeight;

      // 스케일 계산: (프런트엔드 렌더링 너비) / (원본 문서 너비)
      // DOM element의 x, y는 이미 문서 전체 기준이므로,
      // 렌더링된 이미지의 실제 픽셀 크기(offsetWidth/Height)와
      // 원본 스크린샷의 픽셀 크기(originalDocumentWidth/Height) 간의 비율로 스케일합니다.
      const newScaleX = renderedWidth / originalDocumentWidth;
      const newScaleY = renderedHeight / originalDocumentHeight;

      // w-full h-auto block으로 인해 여백은 0에 가까워야 함.
      const calculatedOffsetX = 0;
      const calculatedOffsetY = 0;

      setScaleX(newScaleX);
      setScaleY(newScaleY);
      setOffsetX(calculatedOffsetX);
      setOffsetY(calculatedOffsetY);
      setImageLoaded(true);
    };

    const img = screenshotRef.current;
    if (img) {
      img.addEventListener('load', calculateScales);
      if (img.complete) {
        calculateScales();
      }
    }
    window.addEventListener('resize', calculateScales);

    // originalDocumentWidth/Height가 업데이트될 때도 다시 계산
    if (originalDocumentWidth > 0 && originalDocumentHeight > 0) {
        calculateScales();
    }


    return () => {
      if (img) img.removeEventListener('load', calculateScales);
      window.removeEventListener('resize', calculateScales);
    };
  }, [screenshot, originalDocumentWidth, originalDocumentHeight, originalViewportWidth]);


  const handleSelectField = (fieldId: string | null) => {
    setSelectedFieldId(fieldId);
  };
  
  const handleUpdateField = (updatedField: ExtractorField) => {
    setDataFields(fields => fields.map(f => f.id === updatedField.id ? updatedField : f));
  };
  
  const handleDeleteField = (fieldId: string) => {
    setDataFields(fields => fields.filter(f => f.id !== fieldId));
    if (selectedFieldId === fieldId) setSelectedFieldId(null);
  };
  
  const handleAddField = () => {
    const newField: ExtractorField = {
      id: `field_${Date.now()}`,
      name: '',
      type: 'text',
      method: 'css_selector',
      rule: '',
    };
    setDataFields(fields => [...fields, newField]);
  };

  const handleAnalyze = async () => {
    if (!url) {
      toast({
        title: "오류",
        description: "URL을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setShowPreview(false);
    setDataFields([]);
    setSelectedFieldId(null);
    setScreenshot(null);
    setDomInfo([]);
    setImageLoaded(false);
    setOriginalDocumentWidth(0); // 초기화
    setOriginalDocumentHeight(0); // 초기화
    setOriginalViewportWidth(1920); // Playwright 설정 값

    try {
      console.log('Analyzing URL:', url);
      
      const response = await fetch('/api/web-source/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('Analysis result:', data);

      if (data.screenshot) {
        setScreenshot(data.screenshot);
      }
      if (data.originalDocumentWidth) { // 백엔드에서 받은 전체 문서 너비
        setOriginalDocumentWidth(data.originalDocumentWidth);
      }
      if (data.originalDocumentHeight) { // 백엔드에서 받은 전체 문서 높이
        setOriginalDocumentHeight(data.originalDocumentHeight);
      }
      if (data.originalViewportWidth) { // 백엔드에서 받은 뷰포트 너비
        setOriginalViewportWidth(data.originalViewportWidth);
      }

      if (data.dom_info && data.dom_info.length > 0) {
        setDomInfo(data.dom_info); // dom_info는 이제 문서 전체 기준 좌표
        // 자동 추천 필드 기능 (원치 않으면 아래 3줄을 주석 처리/제거)
        
      } else {
          setDataFields([]); // DOM 정보가 없으면 추천 필드도 비움
      }


      setShowPreview(true);

      toast({
        title: "분석 완료",
        description: "웹사이트 분석이 완료되었습니다. 스크린샷 위에서 요소를 클릭해 규칙을 자동 생성해보세요!",
      });

    } catch (error: any) {
      console.error('Analysis error:', error);
      toast({
        title: "분석 실패",
        description: error.message || "웹사이트 분석에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleElementClick = (elementInfo: ElementInfo) => {
    const newSelector = generateSelector(elementInfo);
    
    // 중복 셀렉터 확인
    const existingField = dataFields.find(field => field.rule === newSelector);
    
    if (existingField) {
      // 기존 필드가 있으면 선택만 하고 토스트 표시
      setSelectedFieldId(existingField.id);
      toast({
        title: "이미 추가된 요소",
        description: "이 요소는 이미 필드에 추가되어 있습니다.",
        variant: "destructive",
      });
    } else {
      // 새 필드 생성
      const newField: ExtractorField = {
        id: `field_${Date.now()}`,
        name: `필드_${dataFields.length + 1}`,
        type: 'text',
        method: 'css_selector',
        rule: newSelector
      };
      
      setDataFields(prev => [...prev, newField]);
      setSelectedFieldId(newField.id);
      setSelectedElementId(elementInfo.node_id);
      
      toast({
        title: "새 필드 추가됨",
        description: `"${elementInfo.tag}" 요소가 새 필드로 추가되었습니다.`,
      });
    }
  };

  const handleSaveSource = async () => {
    if (!url) {
      toast({
        title: "오류",
        description: "URL이 필요합니다.",
        variant: "destructive",
      });
      return;
    }
    
    if (dataFields.length === 0) {
      toast({
        title: "오류", 
        description: "최소 하나의 데이터 필드가 필요합니다.",
        variant: "destructive",
      });
      return;
    }

    const emptyFields = dataFields.filter(field => !field.name || !field.rule);
    if (emptyFields.length > 0) {
      toast({
        title: "오류",
        description: "모든 필드에 이름과 추출 규칙을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const convertedFields: DataField[] = dataFields.map(field => ({
        id: field.id,
        name: field.name,
        type: field.type as DataField['type'],
        method: field.method as DataField['method'],
        rule: field.rule,
      }));

      const response = await fetch('/api/web-source/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `웹소스 - ${new URL(url).hostname}`,
          url: url,
          dataFields: convertedFields,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('Save result:', result);

      toast({
        title: "저장 완료",
        description: "웹소스가 성공적으로 저장되었습니다.",
      });

      // Navigate to management page instead of clearing form
      window.location.href = '/management';
      return;
      
      // This code won't run due to the return above
      setUrl('');
      setShowPreview(false);
      setDataFields([]);
      setSelectedFieldId(null);
      setScreenshot(null);
      setDomInfo([]);
      setImageLoaded(false);
      setScaleX(1);
      setScaleY(1);
      setOffsetX(0);
      setOffsetY(0);
      setOriginalDocumentWidth(0);
      setOriginalDocumentHeight(0);
      setOriginalViewportWidth(1920);
    } catch (error: any) {
      console.error('Save error:', error);
      toast({
        title: "저장 실패",
        description: error.message || "웹소스 저장에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>새 웹소스 추가</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2 mb-4">
            <div className="flex-grow">
              <Label htmlFor="url" className="sr-only">URL</Label>
              <Input
                id="url"
                type="url"
                placeholder="수집할 웹사이트 URL 입력 (예: https://example.com)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={loading}
              />
            </div>
            <Button onClick={handleAnalyze} disabled={loading || !url}>
              {loading ? '분석 중...' : '분석 시작'}
            </Button>
          </div>

          {showPreview && screenshot && (
            <div className="flex flex-col gap-4">
              {/* 상단: 미리보기 (스크린샷 기반 상호작용) */}
              <div>
                <h3 className="text-lg font-semibold mb-2">페이지 미리보기 (클릭하여 규칙 생성)</h3>
                <p className="text-sm text-gray-600 mb-2">
                  아래 스크린샷 위에서 요소를 클릭하면 선택된 데이터 필드에 추출 규칙이 자동 입력됩니다.
                </p>
                {/* 스크린샷 컨테이너: 고정된 최대 너비와 스크롤 가능하도록 */}
                <div
                  ref={screenshotContainerRef}
                  className="relative border rounded-md overflow-hidden overflow-y-auto"
                  style={{
                    maxWidth: '1920px', // UI에 맞게 컨테이너의 최대 너비 설정
                    width: '100%',
                    height: '600px', // 컨테이너 고정 높이로 스크롤 가능하게 함
                    margin: '0 auto',
                    background: 'white'
                  }}
                >
                  <img
                    ref={screenshotRef}
                    src={`data:image/png;base64,${screenshot}`}
                    alt="웹사이트 스크린샷"
                    className="w-full h-auto block"
                    // img 태그의 width와 height를 originalDocumentWidth/Height에 직접 바인딩합니다.
                    // 이렇게 해야 이미지의 원본 픽셀 크기대로 렌더링되고,
                    // 스크린샷 컨테이너의 overflow-y-auto가 스크롤을 처리합니다.
                    style={{
                      width: originalDocumentWidth > 0 ? `${originalDocumentWidth}px` : 'auto',
                      height: originalDocumentHeight > 0 ? `${originalDocumentHeight}px` : 'auto',
                    }}
                  />
                  {/* DOM 정보 기반 오버레이 레이어 */}
                  {imageLoaded && domInfo.map((element: ElementInfo) => {
                    if (!element.bounding_box || !element.is_clickable) return null;

                    // 스케일 및 오프셋 적용
                    // 이제 element.bounding_box는 문서 전체 기준 좌표입니다.
                    // 스케일은 렌더링된 이미지 크기 / 원본 문서 크기 입니다.
                    // offsetX, offsetY는 현재 w-full h-auto block이므로 0이 되어야 합니다.
                    const scaledX = (element.bounding_box.x * scaleX) + offsetX + (14 * 0.4 * scaleX);
                    const scaledY = element.bounding_box.y * scaleY + offsetY;
                    const scaledWidth = element.bounding_box.width * scaleX;
                    const scaledHeight = element.bounding_box.height * scaleY;

                    const style = {
                                  position: 'absolute',
                                  left: `${scaledX}px`,
                                  top: `${scaledY}px`,
                                  width: `${scaledWidth}px`,
                                  height: `${scaledHeight}px`,
                                  backgroundColor: 'transparent', // Always transparent background
                                  pointerEvents: 'auto',
                                  zIndex: 10,
                                  transition: 'all 0.1s ease-in-out',
                                  boxSizing: 'border-box' as 'border-box',
                                  cursor: 'pointer',
                                  border: selectedElementId === element.node_id ? '2px solid red' : '1px solid blue',
                                  boxShadow: selectedElementId === element.node_id ? '0 0 0 2px rgba(255, 0, 0, 0.3)' : 'none',
                                };
                    return (
                      <div
                        key={element.node_id}
                        style={style}
                        onClick={() => handleElementClick(element)}
                        className="
                          hover:border-red-500 hover:bg-red-500 hover:bg-opacity-30
                          transition-all duration-100 ease-in-out
                          z-10"
                        title={`태그: ${element.tag}, 텍스트: ${element.text || '없음'}, ID: ${element.attributes.id || '없음'}, 클래스: ${element.attributes.class || '없음'}`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* 하단: 데이터 필드 */}
              <div>
                <h3 className="text-lg font-semibold mb-2">데이터 추출 필드</h3>
                <p className="text-sm text-gray-600 mb-4">
                  추출할 데이터 필드를 정의하세요. CSS 선택자나 XPath를 사용할 수 있습니다.
                </p>
                <DataFieldsTable
                  fields={dataFields}
                  selectedFieldId={selectedFieldId}
                  onSelectField={handleSelectField}
                  onUpdateField={handleUpdateField}
                  onDeleteField={handleDeleteField}
                  onAddField={handleAddField}
                />
                <div className="mt-4 space-x-2">
                  <Button
                    onClick={handleSaveSource}
                    disabled={loading || dataFields.length === 0 || !url}
                  >
                    {loading ? '저장 중...' : '웹소스 저장'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setUrl('');
                      setShowPreview(false);
                      setDataFields([]);
                      setSelectedFieldId(null);
                      setScreenshot(null);
                      setDomInfo([]);
                      setImageLoaded(false);
                      setScaleX(1);
                      setScaleY(1);
                      setOffsetX(0);
                      setOffsetY(0);
                      setOriginalDocumentWidth(0);
                      setOriginalDocumentHeight(0);
                      setOriginalViewportWidth(1920);
                    }}
                  >
                    취소
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default WebSourceEditor;