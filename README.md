# 🚀 Enhanced Web Scraping System with AI

> **하이브리드 웹 크롤링 시스템**: 사용자 선택 기반 컨텍스트 + 로컬 LLM = 완벽한 데이터 추출

## 📋 프로젝트 개요

### 핵심 아이디어
- **사용자 직접 선택**: 웹 페이지에서 원하는 데이터 요소를 클릭으로 선택
- **전체 페이지 분석**: Browser-Use 방식으로 DOM 구조 완전 분석
- **AI 기반 인사이트**: 로컬 LLM이 선택 컨텍스트를 분석하여 지능형 필드 생성
- **백그라운드 처리**: 사용자는 계속 작업하고, AI가 뒤에서 분석 완료

### 기술적 혁신점
1. **Performance-Optimized DOM Analysis** (Browser-Use 참조)
   - WeakMap 캐싱으로 60-80% 성능 향상
   - 지능형 요소 필터링 및 가시성 검증
   - 실시간 성능 메트릭스 수집

2. **Context-Aware Field Generation**
   - 선택된 요소 + 상위/하위/형제 요소 컨텍스트
   - 페이지 구조 패턴 자동 감지
   - 유사 요소 분석으로 선택자 최적화

3. **Local LLM Integration**
   - Ollama 기반 로컬 LLM 연동
   - 백그라운드 분석으로 사용자 경험 방해 없음
   - 개인 데이터 보호 (모든 분석이 로컬에서 수행)

## 🏗️ 현재 프로젝트 구조

```
enhanced-web-scraping-system/
├── frontend/                           # Next.js 프론트엔드
│   ├── components/
│   │   ├── dashboard/                  # 대시보드 컴포넌트들
│   │   │   ├── empty-state.tsx
│   │   │   ├── system-status.tsx
│   │   │   ├── web-source-card.tsx
│   │   │   └── data-table.tsx
│   │   ├── web-source-editor-enhanced.tsx  # ✅ 완성
│   │   └── web-source-management.tsx       # ✅ 완성
│   ├── lib/
│   │   ├── enhanced-api.ts             # ✅ 완성
│   │   └── utils.ts
│   ├── hooks/
│   │   └── use-toast.ts
│   └── types/
│       ├── dashboard.ts
│       └── web-source.ts
│
├── backend-nodejs/                     # Node.js 백엔드
│   ├── services/
│   │   └── dom-service.js              # ✅ 완성 (Enhanced)
│   ├── enhanced_build_dom_tree.js      # ✅ 완성 (Browser-Use 방식)
│   ├── server.js                       # ✅ 완성 (Enhanced)
│   ├── package.json
│   └── config/
│       └── sources.yaml
│
├── electron-app/                       # Electron 래퍼 (선택사항)
│   └── main.js
│
└── docs/                              # 프로젝트 문서
    ├── README.md
    ├── DEVELOPMENT_PLAN.md
    └── BROWSER_USE_INTEGRATION.md
```

## 🛠️ 기술 스택

### 현재 구현된 기술
- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express, Playwright
- **Database**: PostgreSQL (Supabase)
- **DOM Analysis**: Browser-Use 방식 (캐싱, 성능 최적화)

### 다음 단계 기술 (LLM 통합)
- **Local LLM**: Ollama, LangChain, Instructor
- **Job Queue**: Bull Queue + Redis (백그라운드 처리)
- **Real-time Updates**: WebSocket 또는 Server-Sent Events

## 🚀 빠른 시작

### 필수 요구사항
- Node.js 18+
- PostgreSQL 14+ (또는 Supabase 계정)
- Git

### 1. 프로젝트 설정
```bash
# Backend 설치 및 실행
cd backend-nodejs
npm install
npm start  # http://localhost:8082

# Frontend 설치 및 실행  
cd frontend
npm install
npm run dev  # http://localhost:3000
```

### 2. 환경 설정
```bash
# backend-nodejs/.env
PORT=8082
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key

# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8082
```

### 3. 데이터베이스 설정 (Supabase)
```sql
CREATE TABLE web_sources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  data_fields JSONB NOT NULL DEFAULT '[]',
  page_analysis JSONB DEFAULT '{}',
  analysis_status TEXT DEFAULT 'pending',
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_crawled_at TIMESTAMP,
  crawling_status TEXT DEFAULT 'inactive'
);
```

## 📱 현재 사용 가능한 기능

### ✅ 완성된 기능
1. **Enhanced DOM Analysis**
   - 웹페이지 전체 구조 분석 (Browser-Use 방식)
   - 성능 최적화된 요소 추출 (캐싱, 필터링)
   - 실시간 스크린샷 기반 요소 선택

2. **Web Source Management**
   - 웹소스 생성, 편집, 삭제
   - 필드 설정 및 관리
   - 상태 모니터링 (활성, 비활성, 오류)

3. **Interactive Page Preview**
   - 실시간 스크린샷 오버레이
   - 클릭으로 요소 선택
   - CSS 선택자 자동 생성

### 🚧 개발 중인 기능
1. **LLM Integration** (다음 단계)
   - Ollama 로컬 LLM 연동
   - 지능형 필드명 생성
   - 백그라운드 분석 시스템

2. **Enhanced Context Analysis**
   - DOM 컨텍스트 수집 (상위/하위/형제 요소)
   - 페이지 패턴 감지
   - 유사 요소 분석

## 🧪 핵심 기능 상세

### Enhanced DOM Analysis Engine
```javascript
// Browser-Use 방식의 성능 최적화
- WeakMap 캐싱: getBoundingClientRect, getComputedStyle
- 지능형 필터링: 상호작용 가능 요소 우선 식별  
- 뷰포트 확장: 200px 확장 영역까지 요소 감지
- 성능 메트릭스: 처리시간, 캐시 적중률, 요소 통계
```

### Context-Aware Element Selection
```javascript
// 선택된 요소의 컨텍스트 정보 수집
- 선택 요소: tag, text, attributes, css_selector
- 유사 요소: 같은 페이지의 비슷한 구조 요소들
- 페이지 구조: 요소 분포, 상호작용 요소 수, 페이지 타입
- 신뢰도: 선택자 안정성, 추출 가능성 평가
```

### Real-time Interactive Preview
```javascript
// 실시간 요소 선택 시스템
- 전체 페이지 스크린샷 기반
- 마우스 오버 하이라이트
- 클릭으로 즉시 필드 생성
- 스케일링 및 좌표 변환 처리
```

## 🔮 다음 개발 계획

### Phase 1: LLM 기본 연동 (우선순위 1)
- [ ] Ollama 설치 및 모델 관리
- [ ] LLM 서비스 백엔드 구현
- [ ] 기본 필드명 생성 API
- [ ] 프론트엔드 LLM 연동

### Phase 2: 백그라운드 분석 시스템 (우선순위 2)  
- [ ] Job Queue 시스템 (Redis + Bull)
- [ ] 웹소스 저장 시 백그라운드 분석 시작
- [ ] 실시간 상태 업데이트 (WebSocket/Polling)
- [ ] 분석 완료 시 필드 자동 업데이트

### Phase 3: Context Enhancement (우선순위 3)
- [ ] DOM 컨텍스트 수집 (상위/하위/형제)
- [ ] 페이지 패턴 감지 시스템
- [ ] 유사 요소 분석 고도화
- [ ] 사용자 패턴 학습

## 🤝 기여 방법

### 개발 환경 설정
1. Repository Fork
2. 로컬 환경 설정 (위 빠른 시작 참조)
3. Feature Branch 생성
4. 개발 및 테스트
5. Pull Request 제출

### 코딩 컨벤션
- TypeScript 필수 (Frontend)
- ESLint + Prettier 준수
- 컴포넌트명: PascalCase
- 함수명: camelCase
- 상수명: UPPER_SNAKE_CASE

## 📄 라이선스

MIT License - 자유롭게 수정하고 배포할 수 있습니다.

## 🙋‍♂️ 문의 및 지원

- **Issues**: GitHub Issues 탭에서 버그 리포트 및 기능 요청
- **Discussions**: 일반적인 질의응답 및 아이디어 공유
- **Wiki**: 상세한 개발 가이드 및 API 문서

---

**🚀 현재 상태**: Enhanced DOM Analysis 완성 → LLM 통합 준비 완료  
**🎯 다음 목표**: Ollama 연동 및 백그라운드 분석 시스템 구현