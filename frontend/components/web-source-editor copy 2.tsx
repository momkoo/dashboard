// frontend/components/web-source-editor-enhanced.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { enhancedApi, type ElementInfo, type AnalysisResult, type ElementContext } from '@/lib/enhanced-api';
import { 
  Loader2, 
  Zap, 
  Eye, 
  Target, 
  BarChart3, 
  CheckCircle, 
  AlertTriangle,
  Info,
  Sparkles
} from 'lucide-react';

interface ExtractorField {
  id: string;
  name: string;
  type: string;
  method: string;
  rule: string;
  confidence?: number;
  insights?: any;
}

interface PerformanceMetrics {
  processingTime: number;
  totalNodes: number;
  processedNodes: number;
  cacheHitRate?: number;
}

interface EnhancedWebSourceEditorProps {
  initialUrl?: string;
}

function EnhancedWebSourceEditor({ initialUrl = '' }: EnhancedWebSourceEditorProps) {
  const { toast } = useToast();
  
  // Basic state
  const [url, setUrl] = useState(initialUrl);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [dataFields, setDataFields] = useState<ExtractorField[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  
  // Enhanced analysis state
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<number | null>(null);
  const [elementContext, setElementContext] = useState<ElementContext | null>(null);
  
  // UI state
  const [activeTab, setActiveTab] = useState('preview');
  const [analysisProgress, setAnalysisProgress] = useState(0);
  
  // Refs
  const screenshotRef = useRef<HTMLImageElement>(null);
  const screenshotContainerRef = useRef<HTMLDivElement>(null);
  
  // Screenshot positioning state
  const [imageLoaded, setImageLoaded] = useState(false);
  const [scaleX, setScaleX] = useState(1);
  const [scaleY, setScaleY] = useState(1);

  // Auto-analyze on mount if URL provided
  useEffect(() => {
    if (initialUrl && !showPreview) {
      handleAnalyze();
    }
  }, [initialUrl]);

  // Calculate screenshot scaling
  useEffect(() => {
    const calculateScales = () => {
      const img = screenshotRef.current;
      const container = screenshotContainerRef.current;

      if (!img || !container || !analysisResult) {
        setImageLoaded(false);
        return;
      }

      const renderedWidth = img.offsetWidth;
      const renderedHeight = img.offsetHeight;

      const newScaleX = renderedWidth / analysisResult.originalDocumentWidth;
      const newScaleY = renderedHeight / analysisResult.originalDocumentHeight;

      setScaleX(newScaleX);
      setScaleY(newScaleY);
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

    if (analysisResult) {
      calculateScales();
    }

    return () => {
      if (img) img.removeEventListener('load', calculateScales);
      window.removeEventListener('resize', calculateScales);
    };
  }, [analysisResult]);

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
    setAnalysisResult(null);
    setPerformanceMetrics(null);
    setElementContext(null);
    setImageLoaded(false);
    setAnalysisProgress(0);

    try {
      console.log('Starting enhanced analysis for:', url);
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await enhancedApi.analyzeUrl(url, {
        viewportExpansion: 200,
        enableCache: true,
        debugMode: false,
        takeScreenshot: true,
        fullPage: true
      });

      clearInterval(progressInterval);
      setAnalysisProgress(100);

      if (!result.success) {
        throw new Error('Analysis failed');
      }

      setAnalysisResult(result);
      setPerformanceMetrics({
        processingTime: result.processingTime,
        totalNodes: result.totalNodes,
        processedNodes: result.processedNodes,
        cacheHitRate: result.performanceMetrics?.cacheMetrics?.overallHitRate
      });

      setShowPreview(true);
      setActiveTab('preview');

      toast({
        title: "분석 완료",
        description: `${result.dom_info.length}개 요소를 ${result.processingTime}ms에 분석했습니다.`,
      });

    } catch (error: any) {
      console.error('Enhanced analysis error:', error);
      setAnalysisProgress(0);
      toast({
        title: "분석 실패",
        description: error.message || "웹사이트 분석에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleElementClick = async (elementInfo: ElementInfo) => {
    if (!analysisResult) return;

    try {
      console.log('Analyzing element context for:', elementInfo.node_id);
      
      // Get element context from enhanced API
      const context = await enhancedApi.analyzeElementContext(elementInfo, analysisResult.dom_info);
      setElementContext(context);
      setSelectedElementId(elementInfo.node_id);

      // Check if element already exists in fields
      const existingField = dataFields.find(field => field.rule === context.selectedElement.enhancedSelector);
      
      if (existingField) {
        setSelectedFieldId(existingField.id);
        toast({
          title: "이미 추가된 요소",
          description: "이 요소는 이미 필드에 추가되어 있습니다.",
          variant: "destructive",
        });
        return;
      }

      // Generate field name suggestions from context
      const fieldNameSuggestions = context.recommendations
        .find(r => r.type === 'field_name')?.suggestions || [];
      
      const suggestedName = fieldNameSuggestions[0] || `필드_${dataFields.length + 1}`;
      
      // Get suggested data type
      const dataTypeRec = context.recommendations.find(r => r.type === 'data_type');
      const suggestedType = dataTypeRec?.dataType || 'text';

      // Create new field with enhanced information
      const newField: ExtractorField = {
        id: `field_${Date.now()}`,
        name: suggestedName,
        type: suggestedType,
        method: 'css_selector',
        rule: context.selectedElement.enhancedSelector,
        confidence: context.selectedElement.confidence,
        insights: context.elementInsights
      };
      
      setDataFields(prev => [...prev, newField]);
      setSelectedFieldId(newField.id);
      setActiveTab('fields');
      
      toast({
        title: "새 필드 추가됨",
        description: `"${elementInfo.tag}" 요소가 새 필드로 추가되었습니다.`,
      });

    } catch (error: any) {
      console.error('Element context analysis error:', error);
      toast({
        title: "요소 분석 실패",
        description: error.message || "요소 컨텍스트 분석에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleFieldUpdate = (updatedField: ExtractorField) => {
    setDataFields(fields => fields.map(f => f.id === updatedField.id ? updatedField : f));
  };

  const handleFieldDelete = (fieldId: string) => {
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
    setSelectedFieldId(newField.id);
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
      const result = await enhancedApi.saveWebSource({
        name: `웹소스 - ${new URL(url).hostname}`,
        url: url,
        dataFields: dataFields.map(field => ({
          id: field.id,
          name: field.name,
          type: field.type,
          method: field.method,
          rule: field.rule,
        })),
      });

      toast({
        title: "저장 완료",
        description: "웹소스가 성공적으로 저장되었습니다.",
      });

      // Navigate to management page
      window.location.href = '/management';
      
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

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBadgeVariant = (confidence: number) => {
    if (confidence >= 0.8) return 'default';
    if (confidence >= 0.6) return 'secondary';
    return 'destructive';
  };

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            Enhanced Web Source Editor
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* URL Input Section */}
          <div className="flex space-x-2 mb-6">
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
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  분석 중...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Enhanced 분석
                </>
              )}
            </Button>
          </div>

          {/* Progress Bar */}
          {loading && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>페이지 분석 중...</span>
                <span>{analysisProgress}%</span>
              </div>
              <Progress value={analysisProgress} className="w-full" />
            </div>
          )}

          {/* Performance Metrics */}
          {performanceMetrics && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <BarChart3 className="h-4 w-4 text-blue-500" />
                  <span>처리시간: {performanceMetrics.processingTime}ms</span>
                </div>
                <div className="flex items-center gap-1">
                  <Target className="h-4 w-4 text-green-500" />
                  <span>처리된 요소: {performanceMetrics.processedNodes}/{performanceMetrics.totalNodes}</span>
                </div>
                {performanceMetrics.cacheHitRate && (
                  <div className="flex items-center gap-1">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <span>캐시 적중률: {Math.round(performanceMetrics.cacheHitRate * 100)}%</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Main Content Tabs */}
          {showPreview && analysisResult && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="preview" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  페이지 미리보기
                </TabsTrigger>
                <TabsTrigger value="fields" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  데이터 필드 ({dataFields.length})
                </TabsTrigger>
                <TabsTrigger value="insights" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  분석 인사이트
                </TabsTrigger>
              </TabsList>

              {/* Preview Tab */}
              <TabsContent value="preview" className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Interactive Page Preview</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    요소를 클릭하면 자동으로 필드가 생성되고 향상된 분석 정보를 제공합니다.
                  </p>
                  
                  <div
                    ref={screenshotContainerRef}
                    className="relative border rounded-md overflow-hidden overflow-y-auto"
                    style={{
                      maxWidth: '1920px',
                      width: '100%',
                      height: '600px',
                      margin: '0 auto',
                      background: 'white'
                    }}
                  >
                    <img
                      ref={screenshotRef}
                      src={`data:image/png;base64,${analysisResult.screenshot}`}
                      alt="웹사이트 스크린샷"
                      className="w-full h-auto block"
                      style={{
                        width: analysisResult.originalDocumentWidth > 0 ? 
                          `${analysisResult.originalDocumentWidth}px` : 'auto',
                        height: analysisResult.originalDocumentHeight > 0 ? 
                          `${analysisResult.originalDocumentHeight}px` : 'auto',
                      }}
                    />
                    
                    {/* Interactive Element Overlays */}
                    {imageLoaded && analysisResult.dom_info.map((element: ElementInfo) => {
                      if (!element.bounding_box || !element.is_clickable) return null;

                      const scaledX = (element.bounding_box.x * scaleX);
                      const scaledY = element.bounding_box.y * scaleY;
                      const scaledWidth = element.bounding_box.width * scaleX;
                      const scaledHeight = element.bounding_box.height * scaleY;

                      const isSelected = selectedElementId === element.node_id;

                      return (
                        <div
                          key={element.node_id}
                          style={{
                            position: 'absolute',
                            left: `${scaledX}px`,
                            top: `${scaledY}px`,
                            width: `${scaledWidth}px`,
                            height: `${scaledHeight}px`,
                            backgroundColor: 'transparent',
                            pointerEvents: 'auto',
                            zIndex: 10,
                            transition: 'all 0.1s ease-in-out',
                            boxSizing: 'border-box',
                            cursor: 'pointer',
                            border: isSelected ? '2px solid red' : '1px solid blue',
                            boxShadow: isSelected ? '0 0 0 2px rgba(255, 0, 0, 0.3)' : 'none',
                          }}
                          onClick={() => handleElementClick(element)}
                          className="hover:border-red-500 hover:bg-red-500 hover:bg-opacity-30"
                          title={`${element.tag}${element.text ? `: ${element.text.substring(0, 50)}` : ''}${element.attributes.class ? ` (${element.attributes.class})` : ''}`}
                        />
                      );
                    })}
                  </div>
                </div>
              </TabsContent>

              {/* Fields Tab */}
              <TabsContent value="fields" className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Data Extraction Fields</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    추출할 데이터 필드를 관리하세요. 신뢰도와 인사이트가 함께 표시됩니다.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border rounded-md">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4 border">
                              필드명
                            </th>
                            <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4 border">
                              타입
                            </th>
                            <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4 border">
                              추출 규칙
                            </th>
                            <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4 border">
                              신뢰도
                            </th>
                            <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4 border">
                              액션
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {dataFields.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-4 px-4 text-center text-gray-500 border">
                                필드가 없습니다. 페이지 미리보기에서 요소를 클릭하거나 "필드 추가" 버튼을 사용하세요.
                              </td>
                            </tr>
                          ) : (
                            dataFields.map((field) => (
                              <tr
                                key={field.id}
                                className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                                  selectedFieldId === field.id ? 'bg-blue-50' : ''
                                }`}
                                onClick={() => setSelectedFieldId(field.id)}
                              >
                                <td className="py-2 px-4 border">
                                  <Input
                                    value={field.name}
                                    onChange={(e) => handleFieldUpdate({ ...field, name: e.target.value })}
                                    placeholder="필드명"
                                    className="h-8"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </td>
                                <td className="py-2 px-4 border">
                                  <select
                                    value={field.type}
                                    onChange={(e) => handleFieldUpdate({ ...field, type: e.target.value })}
                                    className="h-8 w-full border rounded px-2"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <option value="text">텍스트</option>
                                    <option value="number">숫자</option>
                                    <option value="url">URL</option>
                                    <option value="date">날짜</option>
                                    <option value="image_url">이미지 URL</option>
                                    <option value="boolean">불린</option>
                                  </select>
                                </td>
                                <td className="py-2 px-4 border">
                                  <Input
                                    value={field.rule}
                                    onChange={(e) => handleFieldUpdate({ ...field, rule: e.target.value })}
                                    placeholder="CSS 선택자"
                                    className="h-8 font-mono text-xs"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </td>
                                <td className="py-2 px-4 border">
                                  {field.confidence ? (
                                    <Badge 
                                      variant={getConfidenceBadgeVariant(field.confidence)}
                                      className="text-xs"
                                    >
                                      {Math.round(field.confidence * 100)}%
                                    </Badge>
                                  ) : (
                                    <span className="text-gray-400 text-xs">-</span>
                                  )}
                                </td>
                                <td className="py-2 px-4 border">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleFieldDelete(field.id);
                                    }}
                                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
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

                    <Button variant="outline" size="sm" onClick={handleAddField}>
                      + 필드 추가
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Insights Tab */}
              <TabsContent value="insights" className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Analysis Insights</h3>
                  
                  {elementContext ? (
                    <div className="space-y-6">
                      {/* Selected Element Info */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            선택된 요소 정보
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-500">태그:</span>
                              <p className="font-mono">{elementContext.selectedElement.tag}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-500">신뢰도:</span>
                              <p className={getConfidenceColor(elementContext.selectedElement.confidence)}>
                                {Math.round(elementContext.selectedElement.confidence * 100)}%
                              </p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-500">고유성:</span>
                              <p>{elementContext.elementInsights.uniqueness}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-500">안정성:</span>
                              <p>{elementContext.elementInsights.stability}</p>
                            </div>
                          </div>
                          
                          {elementContext.selectedElement.text && (
                            <div className="mt-4">
                              <span className="font-medium text-gray-500">텍스트:</span>
                              <p className="mt-1 p-2 bg-gray-50 rounded text-sm">
                                {elementContext.selectedElement.text}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Recommendations */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <Info className="h-4 w-4" />
                            추천사항
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {elementContext.recommendations.map((rec, index) => (
                              <div key={index} className="flex items-start gap-3">
                                {rec.priority === 'high' ? (
                                  <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                                ) : rec.priority === 'medium' ? (
                                  <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                                ) : (
                                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                                )}
                                <div>
                                  <p className="text-sm font-medium">{rec.message}</p>
                                  {rec.suggestion && (
                                    <p className="text-xs text-gray-600 mt-1">{rec.suggestion}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Similar Elements */}
                      {elementContext.similarElements.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                              <Eye className="h-4 w-4" />
                              유사한 요소들 ({elementContext.similarElements.length})
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {elementContext.similarElements.slice(0, 5).map((element, index) => (
                                <div key={element.node_id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                                  <div>
                                    <span className="font-mono">{element.tag}</span>
                                    {element.text && (
                                      <span className="ml-2 text-gray-600">
                                        {element.text.substring(0, 30)}...
                                      </span>
                                    )}
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {Math.round(element.similarity * 100)}% 유사
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Page Structure */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <BarChart3 className="h-4 w-4" />
                            페이지 구조 분석
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-500">페이지 타입:</span>
                              <p className="capitalize">{elementContext.pageStructure.pageType}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-500">전체 요소:</span>
                              <p>{elementContext.pageStructure.totalElements}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-500">상호작용 요소:</span>
                              <p>{elementContext.pageStructure.interactiveElements}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-500">가시적 요소:</span>
                              <p>{elementContext.pageStructure.visibleElements}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>페이지 미리보기에서 요소를 선택하면 상세한 분석 정보가 표시됩니다.</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}

          {/* Action Buttons */}
          {showPreview && (
            <div className="mt-6 flex justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  setUrl('');
                  setShowPreview(false);
                  setDataFields([]);
                  setSelectedFieldId(null);
                  setAnalysisResult(null);
                  setPerformanceMetrics(null);
                  setElementContext(null);
                  setImageLoaded(false);
                }}
              >
                새로 시작
              </Button>
              
              <div className="space-x-2">
                <Button
                  onClick={handleSaveSource}
                  disabled={loading || dataFields.length === 0 || !url}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      저장 중...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Enhanced 웹소스 저장
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default EnhancedWebSourceEditor;