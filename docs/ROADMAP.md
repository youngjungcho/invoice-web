# ROADMAP.md

> **프로젝트명**: Notion 기반 견적서 공유 & PDF 다운로드 서비스 (MVP)
> **생성일**: 2026-06-27
> **버전**: 1.0.0
> **작성자**: PRD-to-Roadmap Agent

---

## 📋 Executive Summary

본 프로젝트는 Notion을 견적서 데이터의 단일 진실 공급원(Source of Truth)으로 사용하는 프리랜서·소규모 에이전시를 위한 견적서 공유 서비스입니다. 작성자가 Notion에 입력한 견적서를 별도 가입 없이 고객에게 공유 URL로 전달하고, 고객은 브라우저에서 견적서를 열람하고 PDF로 저장할 수 있습니다.

기술적으로는 Next.js 16 App Router 기반 서버 컴포넌트 우선 설계를 따르며, Notion API에서 읽어온 데이터를 `unstable_cache`로 60초 TTL 캐싱하고 SQLite(`QuoteShare`, `QuoteViewLog`)로 공유 토큰과 조회 이력을 관리합니다. Notion API Rate Limit(3 req/sec) 대응을 위한 exponential backoff 래퍼(`withRateLimit`)가 포함됩니다.

**현재 구현 상태**: 코드베이스 분석 결과 핵심 인프라(Notion 클라이언트 싱글톤, DB 모델 마이그레이션, 공유 생성/회수 API, 공개 견적서 페이지, 조회 로그)가 이미 구현 완료된 상태입니다. 이 로드맵은 완성된 항목을 문서화하고 미완성·미검증 항목과 베타 런칭을 위한 나머지 작업을 명확히 구분합니다.

---

## 🎯 Goals & Success Criteria

| 목표 | 측정 지표 | 목표값 |
|------|----------|--------|
| 사용자 활성화 | 가입 후 7일 내 공유 링크 1개 이상 생성한 유저 비율 | ≥ 40% |
| 고객 열람률 | 공유된 견적서의 클라이언트 조회율 | ≥ 70% |
| PDF 전환율 | 조회된 견적서 중 PDF 저장 발생 비율 | ≥ 30% |
| 서비스 안정성 | 공개 페이지(`/q/[slug]`) 5xx 에러율 | < 0.5% |
| 응답 속도 | 공개 견적서 TTFB (캐시 미스 시) | < 800ms |
| 응답 속도 | 공개 견적서 TTFB (캐시 히트 시) | < 200ms |

---

## 🏗️ Architecture Decisions

### 1. Notion을 데이터 원본으로, SQLite를 메타데이터 저장소로 분리
- 견적서 본문 데이터: Notion API (`@notionhq/client`) — 작성자는 기존 Notion 워크스페이스 유지
- 공유 토큰·조회 로그: Prisma `QuoteShare`, `QuoteViewLog` (SQLite) — Notion API 호출 최소화
- **근거**: Notion 쓰기 API는 속성 업데이트(`share_slug`, `is_public`)만 사용. formula/rollup은 읽기 전용이므로 쓰기 금지.

### 2. 서버 컴포넌트 우선 + 선택적 클라이언트 컴포넌트
- 공개 견적서 페이지(`/q/[slug]/page.tsx`): 서버 컴포넌트 — SEO 제어(`noindex`), 조회 로그 서버 사이드 기록
- 상호작용 UI(`QuoteView`, `QuotesTable`, `SharePanel`): `"use client"` — `window.print()`, 클립보드 복사, fetch 호출
- **근거**: `auth()` 세션 확인은 서버, `useSession()`은 클라이언트 전용으로 명확히 분리

### 3. 슬러그 기반 Capability URL 방식
- nanoid 21자(URL-safe, ~126 bit 엔트로피) → UUID v4 수준 보안
- 슬러그가 곧 접근 자격증명. 별도 토큰·서명 불필요
- `is_public=false` 토글 시 즉시 404 + `revalidatePath`로 캐시 무효화

### 4. PDF 생성: 브라우저 print 방식 (MVP)
- `window.print()` + `@media print` CSS — 0 의존성, 서버 부하 없음
- 다음 버전: `/api/quotes/by-slug/[slug]/pdf` Puppeteer 라우트로 마이그레이션 예정

### 5. 캐싱: `unstable_cache` 60초 TTL
- 공개 견적서와 슬러그 조회 모두 60초 캐시
- **트레이드오프 명시**: 작성자가 Notion에서 수정해도 최대 60초 반영 지연 발생

### 6. line items 처리: Option B (child page 본문 Notion 블록 테이블)
- 별도 "Quote Items" DB 없이 견적서 row의 child page 블록으로 관리
- `notion.blocks.children.list(pageId)` 호출로 테이블 블록 파싱
- **트레이드오프**: 추가 API 호출 1회 필요, 단 N+1 없음

---

## 📊 Feature Inventory

| 기능 | 우선순위 | 복잡도 | 단계 | 의존성 | 현재 상태 |
|------|---------|--------|------|--------|----------|
| 환경변수 설정 (NOTION_TOKEN, NOTION_DATABASE_ID, IP_HASH_SALT) | P0 | S | Phase 0 | — | 완료 |
| Prisma 스키마: QuoteShare, QuoteViewLog | P0 | S | Phase 0 | — | 완료 |
| Notion 싱글톤 클라이언트 + 헬퍼 함수 | P0 | M | Phase 0 | 환경변수 | 완료 |
| `withRateLimit` exponential backoff 래퍼 | P0 | S | Phase 0 | Notion 클라이언트 | 완료 |
| `queryAll` 페이지네이션 헬퍼 | P0 | S | Phase 0 | Notion 클라이언트 | 완료 |
| `findBySlug` + `generateAndAttachSlug` | P0 | S | Phase 0 | Notion 클라이언트 | 완료 |
| `robots.ts` 검색엔진 차단 | P0 | S | Phase 0 | — | 완료 |
| `GET /api/quotes` — 견적서 목록 | P0 | S | Phase 1 | Notion 헬퍼 | 완료 |
| `/dashboard/quotes` 견적서 목록 페이지 | P0 | M | Phase 1 | API 라우트 | 완료 |
| `QuotesTable` 클라이언트 컴포넌트 (목록 테이블) | P0 | M | Phase 1 | 목록 페이지 | 완료 |
| `/dashboard/quotes/[id]` 견적서 상세 페이지 | P0 | M | Phase 1 | Notion 헬퍼 | 완료 |
| `SharePanel` 클라이언트 컴포넌트 | P0 | M | Phase 1 | 상세 페이지 | 완료 |
| `POST /api/quotes/[id]/share` — 공유 링크 생성 | P0 | M | Phase 1 | QuoteShare 모델 | 완료 |
| `POST /api/quotes/[id]/revoke` — 공유 해제 | P0 | M | Phase 1 | QuoteShare 모델 | 완료 |
| `/q/[slug]` 공개 견적서 페이지 | P0 | M | Phase 2 | findBySlug | 완료 |
| `QuoteView` 클라이언트 컴포넌트 + print 버튼 | P0 | M | Phase 2 | 공개 페이지 | 완료 |
| `/q/[slug]/not-found.tsx` 404 처리 | P0 | S | Phase 2 | 공개 페이지 | 완료 |
| 만료 처리 (`valid_until` 비교 + 만료 배너) | P0 | S | Phase 2 | 공개 페이지 | 완료 |
| 조회 로그 기록 (`QuoteViewLog`, SHA-256 IP 해시) | P0 | S | Phase 2 | DB 모델 | 완료 |
| `@media print` CSS 최적화 + A4 페이지 설정 | P0 | S | Phase 2 | QuoteView | **미완성** |
| 사이드바 "견적서" 메뉴 링크 추가 | P0 | S | Phase 1 | 목록 페이지 | **미확인** |
| 미들웨어: `/dashboard/quotes/*` 인증 보호 | P0 | S | Phase 1 | NextAuth 미들웨어 | **미확인** |
| 상태 필터링 (작성중/발송완료/승인 등) | P1 | M | Phase 3 | 목록 페이지 | 미구현 |
| 페이지네이션 UI (커서 기반) | P1 | M | Phase 3 | queryAll 헬퍼 | 미구현 |
| Line items 렌더링 (Notion child blocks 파싱) | P1 | L | Phase 3 | 공개 페이지 | 미구현 |
| `/api/quotes/by-slug/[slug]` GET — 슬러그 조회 캐시 | P1 | S | Phase 2 | findBySlug | 완료 |
| QuoteShare DB와 캐시 무효화 통합 검증 | P1 | S | Phase 2 | revoke API | **미검증** |
| 비공개 베타 출시 체크리스트 | P0 | S | Phase 4 | 전체 기능 | 미완성 |
| 이메일 발송 기능 | P2 | L | 미래 | — | 미구현 |
| 클라이언트 승인/반려 버튼 (Notion 역전파) | P2 | L | 미래 | — | 미구현 |
| Puppeteer 기반 서버 PDF 생성 | P2 | XL | 미래 | — | 미구현 |
| 다중 통화 지원 | P3 | L | 미래 | — | 미구현 |

---

## 🗺️ Phase Breakdown

### Phase 0: 기반 인프라 (완료)
**기간**: W1 (완료)
**목표**: Notion 연동 기반, DB 스키마, 보안 설정 완료

#### 완료된 태스크

- [x] **환경변수 설정** — `.env.example`
  - `NOTION_TOKEN`, `NOTION_DATABASE_ID`, `IP_HASH_SALT` 추가 완료
  - **인수 기준**: `.env.example`에 3개 변수 자리표시자 포함, 실제 `.env`에 값 설정

- [x] **Prisma 스키마 확장** — `prisma/schema.prisma`
  - `QuoteShare`, `QuoteViewLog` 모델 추가
  - 마이그레이션: `20260627093355_add_quote_models`
  - **인수 기준**: `npx prisma migrate dev` 성공, `prisma studio`에서 두 테이블 확인 가능

- [x] **Notion 싱글톤 클라이언트** — `src/lib/notion.ts`
  - `Client` 싱글톤, `notionVersion: "2022-06-28"` 고정
  - 헬퍼: `getTitle`, `getRichText`, `getNumber`, `getDate`, `getStatus`, `getCheckbox`, `getEmail`, `getFormula`
  - `QuoteData` 인터페이스 및 `parseQuotePage` 함수
  - **인수 기준**: TypeScript 컴파일 오류 없음, `any` 타입 미사용

- [x] **페이지네이션 헬퍼** — `src/lib/notion.ts`의 `queryAll`
  - `has_more` 루프, 최대 100건씩 커서 기반 조회
  - **인수 기준**: 100건 초과 DB에서도 전체 레코드 반환

- [x] **슬러그 함수** — `src/lib/notion.ts`의 `findBySlug`, `generateAndAttachSlug`, `revokeQuote`
  - `findBySlug`: `share_slug.equals(slug)` + `is_public.equals(true)` 복합 필터
  - `generateAndAttachSlug`: `nanoid(21)` → `pages.update`
  - **인수 기준**: 생성된 슬러그가 21자 URL-safe 문자열

- [x] **Rate Limit 래퍼** — `src/lib/notion.ts`의 `withRateLimit`
  - `APIErrorCode.RateLimited` 감지 → delays: [250, 500, 1000, 2000, 4000ms], 최대 5회
  - **인수 기준**: Rate Limit 에러 시 재시도 후 성공 반환, 5회 초과 시 에러 throw

- [x] **검색엔진 차단** — `src/app/robots.ts`
  - `/q/`, `/dashboard/`, `/settings/`, `/api/` disallow 설정
  - **인수 기준**: `GET /robots.txt` 응답에 `Disallow: /q/` 포함

---

### Phase 1: 작성자 대시보드 (완료)
**기간**: W2–W3 (완료)
**목표**: 인증된 작성자가 Notion 견적서 목록을 조회하고 공유 링크를 생성·관리할 수 있는 대시보드

#### 완료된 태스크

- [x] **견적서 목록 API** — `src/app/api/quotes/route.ts`
  - `GET /api/quotes` — `auth()` 세션 확인 → `withRateLimit(() => queryAll(...))` → `parseQuotePage` 매핑 → JSON 응답
  - **인수 기준**: 미인증 요청 시 401, 인증 요청 시 `QuoteData[]` 배열 반환

- [x] **견적서 목록 페이지** — `src/app/(dashboard)/dashboard/quotes/page.tsx`
  - 서버 컴포넌트, `auth()` 세션 없으면 `/login` redirect
  - `PageHeader` + `QuotesTable` 클라이언트 컴포넌트 구성
  - **인수 기준**: 미인증 상태 접근 시 로그인 페이지로 리다이렉트

- [x] **QuotesTable 클라이언트 컴포넌트** — `src/app/(dashboard)/dashboard/quotes/QuotesTable.tsx`
  - `useReducer`로 loading/error/success 상태 관리
  - `AbortController`로 언마운트 시 요청 취소
  - 로딩: `Skeleton` 5개, 빈 상태: `EmptyState`, 에러: `toast.error()`
  - 공유 링크 생성: `POST /api/quotes/[id]/share` → 클립보드 복사 → `toast.success()`
  - **인수 기준**: 로딩 중 Skeleton 표시, 빈 목록 시 EmptyState 표시, 공유 버튼 클릭 시 toast 알림

- [x] **견적서 상세 페이지** — `src/app/(dashboard)/dashboard/quotes/[id]/page.tsx`
  - 서버 컴포넌트, `notion.pages.retrieve({ page_id: id })` 직접 호출
  - 견적서 정보 카드 + 금액 카드 + 결제조건/비고 카드 + `SharePanel` 사이드바
  - **인수 기준**: 존재하지 않는 ID 접근 시 `notFound()` 호출

- [x] **SharePanel 클라이언트 컴포넌트** — `src/app/(dashboard)/dashboard/quotes/[id]/SharePanel.tsx`
  - 공유 상태 표시(공개/비공개 Badge), 공유 URL 표시, 링크 복사 버튼
  - "공유 링크 생성" / "공유 다시 활성화" / "공유 해제" 세 가지 상태 분기
  - **인수 기준**: 공유 해제 후 Badge가 "비공개"로 전환, toast 알림 표시

- [x] **공유 링크 생성 API** — `src/app/api/quotes/[id]/share/route.ts`
  - `POST /api/quotes/[id]/share` — 인증 확인 → DB `QuoteShare` 조회 → 신규/재활성화/기존 분기
  - 신규: `generateAndAttachSlug` → `QuoteShare.create`
  - 재활성화: `generateAndAttachSlug` → `QuoteShare.update({ revokedAt: null })`
  - 기존: slug만 반환
  - **인수 기준**: 미인증 401, 성공 시 `{ slug, url }` 반환

- [x] **공유 해제 API** — `src/app/api/quotes/[id]/revoke/route.ts`
  - `POST /api/quotes/[id]/revoke` — 인증 확인 → `revokeQuote` (Notion `is_public=false`) → `QuoteShare.update({ revokedAt: now })` → `revalidatePath(/q/${slug})`
  - **인수 기준**: 회수 후 `/q/[slug]` 접근 시 404 반환

#### 미확인 태스크

- [ ] **사이드바 "견적서" 메뉴 링크 추가** — `src/components/layout/sidebar.tsx`, `src/components/layout/MobileSidebar.tsx`
  - **Context**: 현재 사이드바에 `/dashboard/quotes` 링크 존재 여부 미확인. `sidebar.tsx` 수정 필요 시 `FileText` 아이콘(lucide-react)과 함께 추가
  - **Technical Notes**: 기존 nav 항목 배열에 `{ href: "/dashboard/quotes", label: "견적서", icon: FileText }` 추가. `cn()` 사용하여 active 상태 스타일 병합
  - **인수 기준**: 사이드바에서 "/dashboard/quotes" 링크 클릭 시 견적서 목록 페이지 진입

- [ ] **미들웨어 보호 범위 검증** — `src/middleware.ts`
  - **Context**: 현재 미들웨어가 `/dashboard/quotes/*` 라우트를 인증 필요 경로로 처리하는지 확인
  - **인수 기준**: 미로그인 상태에서 `/dashboard/quotes` 접근 시 `/login` 리다이렉트

---

### Phase 2: 공개 견적서 페이지 & PDF (완료 + 미완성 1건)
**기간**: W3–W4 (대부분 완료)
**목표**: 인증 없는 고객이 공유 URL로 견적서를 열람하고 PDF로 저장할 수 있는 공개 페이지

#### 완료된 태스크

- [x] **공개 견적서 페이지** — `src/app/q/[slug]/page.tsx`
  - 서버 컴포넌트, `unstable_cache` 60초 TTL (`["public-quote"]` 키)
  - `valid_until` 경과 시 `isExpired=true` → `QuoteView`에 전달
  - 조회 로그: `x-forwarded-for` → SHA-256(`IP_HASH_SALT:ip`) → `QuoteViewLog.create` (비동기, 실패 무시)
  - `generateMetadata`: `robots: { index: false, follow: false }`
  - **인수 기준**: 유효한 slug 접근 시 견적서 렌더링, 잘못된 slug 접근 시 `notFound()` 호출

- [x] **QuoteView 클라이언트 컴포넌트** — `src/app/q/[slug]/QuoteView.tsx`
  - "PDF 저장" 버튼 → `window.print()` 호출
  - 만료 배너: `AlertTriangle` 아이콘 + destructive 스타일 (화면 전용, `print:hidden`)
  - 인쇄 가이드 텍스트: "PDF로 저장을 선택하세요" (화면 전용)
  - **인수 기준**: "PDF 저장" 버튼 클릭 시 브라우저 인쇄 다이얼로그 열림

- [x] **404/만료/비공개 처리** — `src/app/q/[slug]/not-found.tsx`
  - `FileX` 아이콘 + "견적서를 찾을 수 없습니다" 메시지 + "홈으로 돌아가기" 버튼
  - **인수 기준**: 존재하지 않는/비공개/회수된 slug 접근 시 404 페이지 표시

- [x] **슬러그 조회 캐시 API** — `src/app/api/quotes/by-slug/[slug]/route.ts`
  - `GET /api/quotes/by-slug/[slug]` — `unstable_cache` 60초 캐시 (캐시 키: `["quote-by-slug"]`)
  - **인수 기준**: 동일 slug 60초 내 재요청 시 Notion API 호출 없이 캐시 응답

- [x] **조회 로그 모델** — `prisma/schema.prisma`의 `QuoteViewLog`
  - `@@index([slug, viewedAt])` 복합 인덱스
  - **인수 기준**: `/q/[slug]` 접근마다 `QuoteViewLog` 레코드 생성, IP는 해시값으로 저장

#### 미완성 태스크

- [ ] **`@media print` CSS 최적화** — `src/app/globals.css` 또는 `src/app/q/[slug]/print.css`
  - **Context**: 현재 `QuoteView.tsx`에 `print:hidden` Tailwind 유틸리티가 사용되고 있으나, A4 페이지 크기·여백 설정과 세밀한 인쇄 스타일이 누락된 상태
  - **Technical Notes**: `globals.css` 내 `@media print` 블록 추가 또는 별도 `print.css` import
    ```css
    @media print {
      @page { size: A4; margin: 15mm; }
      body { font-size: 11pt; color: #000; }
      .print\:hidden { display: none !important; }
    }
    ```
    Tailwind CSS v4 환경에서는 `@layer utilities` 내 `@media print` 블록으로 작성
  - **인수 기준**: Chrome/Safari/Edge에서 "PDF로 저장" 시 A4 용지에 견적서 본문만 출력, 헤더·버튼·만료 배너 제외 확인
  - **테스트 (Playwright MCP)**:
    - Given: 유효한 공개 견적서 slug가 존재할 때
    - When: `browser_navigate`로 `/q/[slug]` 진입 후 `browser_snapshot`으로 페이지 상태 캡처
    - Then: 인쇄 스타일 시트(`@media print`)가 `globals.css`에 존재하는지 확인. 개발자 도구 콘솔에서 `window.matchMedia('print')` 평가값 `browser_console_messages`로 검증. `print:hidden` 클래스가 적용된 요소가 스냅샷에 존재하는지 확인

- [ ] **공유 회수 후 캐시 무효화 통합 검증** — `src/app/api/quotes/[id]/revoke/route.ts`
  - **Context**: `revoke` API에서 `revalidatePath(/q/${share.slug})`를 호출하지만, `unstable_cache` 키(`"public-quote"`)와 `revalidatePath`의 캐시 무효화 범위가 일치하는지 검증 필요. `revalidateTag` 사용으로 전환이 필요할 수 있음
  - **Technical Notes**: `unstable_cache`의 세 번째 인자에 `tags: ["public-quote", slug]` 추가 후 revoke API에서 `revalidateTag(slug)` 호출로 변경 권장
    ```typescript
    // src/app/q/[slug]/page.tsx
    const getCachedQuote = unstable_cache(fn, ["public-quote"], {
      revalidate: 60,
      tags: ["public-quote", slug], // slug별 태그 추가
    });
    // src/app/api/quotes/[id]/revoke/route.ts
    import { revalidateTag } from "next/cache";
    revalidateTag(share.slug); // 해당 슬러그 캐시만 무효화
    ```
  - **인수 기준**: 공유 해제 직후 `/q/[slug]` 접근 시 캐시 갱신 없이 즉시 404 반환
  - **테스트 (Playwright MCP)**:
    - Given: 공유 링크가 활성화된 견적서가 존재할 때
    - When: `browser_navigate`로 `/dashboard/quotes/[id]` 진입 → `browser_click`으로 "공유 해제" 버튼 클릭 → `browser_network_request`로 `POST /api/quotes/[id]/revoke` 응답 확인 (200 상태 코드 검증)
    - Then: 즉시 `browser_navigate`로 `/q/[slug]` 재진입 후 `browser_snapshot`에서 404 페이지("견적서를 찾을 수 없습니다") 텍스트 확인. 60초 TTL이 지나지 않았음에도 즉시 404가 반환되는지 검증

#### Phase 2 단계 검증 체크리스트
- [ ] `@media print` CSS 적용 후 Chrome/Safari/Edge에서 PDF 출력 시 A4 레이아웃 정상 렌더링 확인
- [ ] Playwright MCP: 공유 해제 직후 `/q/[slug]` 즉시 404 반환 테스트 통과

---

### Phase 3: 품질 강화 (W5 — 미구현)
**기간**: W5 (7일 예상 → 버퍼 포함 9일)
**목표**: 사용성 개선, 견적 항목 상세 표시, QA 완료

#### 태스크

- [ ] **상태 필터링 UI** — `src/app/(dashboard)/dashboard/quotes/QuotesTable.tsx`
  - **Context**: 현재 `queryAll`은 필터 없이 전체 조회. 상태(작성중/발송완료/승인/반려/만료) 필터 드롭다운 추가 필요
  - **Technical Notes**: `npx shadcn add select` 컴포넌트 추가. `QuotesTable` 내 `Select` 컴포넌트로 상태값 관리, `fetch("/api/quotes?status=발송완료")` 파라미터 추가. API 라우트에서 `request.nextUrl.searchParams.get("status")`로 수신 후 `queryAll`의 filter 조건에 `{ property: "status", status: { equals: statusValue } }` 전달
  - **인수 기준**: 드롭다운에서 상태 선택 시 해당 상태 견적서만 표시, "전체" 선택 시 전체 목록 표시
  - **테스트 (Playwright MCP)**:
    - Given: 다양한 상태(작성중, 발송완료)의 견적서가 2건 이상 Notion DB에 존재할 때
    - When: `browser_navigate`로 `/dashboard/quotes` 진입 → `browser_snapshot`으로 초기 전체 목록 확인 → `browser_select_option`으로 상태 필터 드롭다운에서 "발송완료" 선택
    - Then: `browser_network_request`로 `GET /api/quotes?status=발송완료` 호출 확인, `browser_snapshot`에서 "작성중" 상태 행이 사라지고 "발송완료" 행만 표시되는지 검증. 이후 "전체" 선택 시 전체 목록 복원 확인

- [ ] **커서 기반 페이지네이션 UI** — `src/app/(dashboard)/dashboard/quotes/QuotesTable.tsx` + `src/app/api/quotes/route.ts`
  - **Context**: Notion API는 100건 페이지 크기 제한. 현재 `queryAll`은 전체 페이지를 루프로 조회하지만, 대규모 DB에서 성능 이슈 발생 가능
  - **Technical Notes**: API 라우트에서 `cursor` 쿼리 파라미터 수신 → `notion.databases.query({ start_cursor: cursor, page_size: 20 })` 단일 호출로 변경. 응답에 `{ quotes, nextCursor, hasMore }` 포함. UI에서 "더 보기" 버튼으로 `nextCursor` 전달
  - **인수 기준**: 20건씩 분할 조회, "더 보기" 버튼 클릭 시 다음 페이지 로드
  - **테스트 (Playwright MCP)**:
    - Given: Notion DB에 20건 초과 견적서가 존재할 때
    - When: `browser_navigate`로 `/dashboard/quotes` 진입 → `browser_snapshot`으로 초기 20건 목록 확인 → `browser_network_request`로 첫 응답의 `hasMore: true`, `nextCursor` 필드 검증
    - Then: `browser_click`으로 "더 보기" 버튼 클릭 → `browser_network_request`로 `GET /api/quotes?cursor=[nextCursor]` 호출 확인 → `browser_snapshot`으로 추가 항목이 테이블에 append되었는지 확인. 마지막 페이지에서 "더 보기" 버튼이 사라지는지 검증

- [ ] **Line items 렌더링** — `src/lib/notion.ts` + `src/app/q/[slug]/QuoteView.tsx`
  - **Context**: PRD Option B 채택 — 견적서 row의 child page 본문 Notion 테이블 블록 파싱. 현재 `QuoteView`는 금액 요약만 표시하고 개별 항목 테이블은 없음
  - **Technical Notes**: `src/lib/notion.ts`에 `getLineItems(pageId)` 함수 추가
    ```typescript
    export async function getLineItems(pageId: string) {
      const response = await withRateLimit(() =>
        notion.blocks.children.list({ block_id: pageId, page_size: 100 })
      );
      // block.type === "table" 필터 후 table_row 파싱
    }
    ```
    `src/app/q/[slug]/page.tsx`에서 `getLineItems(quote.id)` 병렬 호출 (`Promise.all`). `QuoteView`에 `lineItems` prop 추가
  - **주의**: Notion API 추가 호출 1회 발생 — `withRateLimit` 래퍼 필수
  - **인수 기준**: 공개 견적서 페이지에서 개별 항목(품목명, 수량, 단가, 소계) 테이블 렌더링
  - **테스트 (Playwright MCP)**:
    - Given: Notion 견적서 페이지에 child page가 존재하고 그 안에 테이블 블록(품목명, 수량, 단가, 소계 컬럼)이 있을 때
    - When: `browser_navigate`로 해당 견적서의 `/q/[slug]` 진입 → `browser_network_request`로 페이지 로드 중 발생하는 Notion API 호출 모니터링
    - Then: `browser_snapshot`으로 페이지 스냅샷 캡처 후 line items 테이블이 존재하는지 확인. 테이블에 "품목명", "수량", "단가", "소계" 컬럼 헤더가 렌더링되었는지 검증. `browser_console_messages`로 파싱 에러 없는지 확인

- [ ] **견적서 상세 페이지 line items 표시** — `src/app/(dashboard)/dashboard/quotes/[id]/page.tsx`
  - **Context**: 작성자 상세 페이지에도 동일한 항목 테이블 필요
  - **Technical Notes**: `getLineItems` 공유 함수 재사용. 서버 컴포넌트에서 직접 호출
  - **인수 기준**: 상세 페이지의 "견적 항목" 카드에 테이블 형식으로 항목 표시
  - **테스트 (Playwright MCP)**:
    - Given: 로그인된 작성자 세션이 유효할 때
    - When: `browser_navigate`로 `/dashboard/quotes/[id]` 진입 → `browser_snapshot`으로 페이지 스냅샷 캡처
    - Then: "견적 항목" 카드 섹션이 존재하고 테이블 행이 1개 이상 렌더링되었는지 확인. 공개 페이지(`/q/[slug]`)와 동일한 항목 데이터가 표시되는지 `browser_snapshot` 비교 검증

- [ ] **조회 통계 패널** — `src/app/(dashboard)/dashboard/quotes/[id]/page.tsx`
  - **Context**: 작성자가 공유된 견적서의 조회 횟수를 확인할 수 있어야 함
  - **Technical Notes**: `db.quoteViewLog.count({ where: { slug: quote.shareSlug ?? "" } })` 서버 컴포넌트에서 직접 조회. `StatCard` 공통 컴포넌트 재사용 (`title: "조회 수"`, `icon: Eye`)
  - **인수 기준**: 상세 페이지에서 해당 견적서의 총 조회 수 표시
  - **테스트 (Playwright MCP)**:
    - Given: 공유된 견적서의 `/q/[slug]`를 2회 이상 방문한 기록이 DB에 있을 때
    - When: `browser_navigate`로 `/dashboard/quotes/[id]` 진입
    - Then: `browser_snapshot`으로 "조회 수" StatCard가 렌더링되었는지 확인. 표시된 숫자가 `QuoteViewLog` DB 레코드 수와 일치하는지 검증. `browser_navigate`로 `/q/[slug]` 1회 추가 방문 후 상세 페이지 새로고침 시 조회 수가 1 증가했는지 확인

- [ ] **에러 바운더리 및 Suspense 처리** — `src/app/(dashboard)/dashboard/quotes/loading.tsx`
  - **Context**: 견적서 목록 페이지에 로딩 경계가 없어 서버 컴포넌트 지연 시 빈 화면 노출 가능
  - **Technical Notes**: `src/app/(dashboard)/dashboard/quotes/loading.tsx` 파일 생성. Skeleton 카드 형태로 구현. `src/app/q/[slug]/` 라우트에는 별도 `loading.tsx` 불필요 (캐시 우선 응답)
  - **인수 기준**: 견적서 목록 페이지 진입 시 로딩 상태에서 Skeleton UI 표시
  - **테스트 (Playwright MCP — 시각적 확인)**:
    - Given: 네트워크 응답이 느린 환경(또는 Notion API 응답 지연 시뮬레이션)에서
    - When: `browser_navigate`로 `/dashboard/quotes` 진입 직후 즉시 `browser_snapshot` 캡처
    - Then: 스냅샷에 Skeleton 컴포넌트 형태의 로딩 UI가 표시되고 빈 화면이 아닌지 확인. `browser_wait_for`로 테이블 데이터 로드 완료 후 Skeleton이 사라지고 실제 목록이 표시되는지 검증

#### Phase 3 단계 검증 체크리스트
- [ ] Playwright MCP: 상태 필터 드롭다운 선택 시 API 파라미터 전달 및 결과 필터링 테스트 통과
- [ ] Playwright MCP: 커서 기반 페이지네이션 "더 보기" 버튼 클릭 시 추가 항목 append 테스트 통과
- [ ] Playwright MCP: `/q/[slug]` 공개 페이지에서 line items 테이블 렌더링 테스트 통과
- [ ] Playwright MCP: 견적서 상세 페이지(`/dashboard/quotes/[id]`) 조회 수 StatCard 표시 테스트 통과
- [ ] Playwright MCP: `/dashboard/quotes` 진입 시 Skeleton 로딩 UI 표시 시각적 확인 통과

---

### Phase 4: 베타 출시 준비 (W6 — 미구현)
**기간**: W6 (5일 예상)
**목표**: 비공개 베타 5명 출시를 위한 최종 검증 및 안정화

#### 태스크

- [ ] **통합 E2E 테스트 수동 검증** — 전체 플로우
  - **Context**: 자동화 테스트 없이 수동 QA로 MVP 범위 검증
  - 작성자 플로우: 로그인 → 목록 → 상세 → 공유 생성 → 클립보드 확인 → 공유 해제
  - 클라이언트 플로우: 공유 URL → 견적서 확인 → PDF 저장 → 만료 URL 접근 시 404
  - **인수 기준**: 체크리스트 항목 전체 통과
  - **테스트 (Playwright MCP — 전체 E2E)**:
    - **작성자 플로우**:
      - Given: 테스트용 계정과 Notion DB에 견적서 1건 이상 존재할 때
      - When: `browser_navigate`로 `/login` → `browser_fill_form`으로 이메일/비밀번호 입력 → `browser_click`으로 로그인 버튼 → `browser_navigate`로 `/dashboard/quotes` → 목록 테이블에서 견적서 행 클릭 → 상세 페이지의 "공유 링크 생성" 버튼 클릭
      - Then: `browser_snapshot`으로 공유 URL이 SharePanel에 표시되는지 확인 → `browser_network_request`로 `POST /api/quotes/[id]/share` 201 응답 검증 → "공유 해제" 버튼 클릭 후 `browser_snapshot`으로 "비공개" Badge 확인
    - **클라이언트 플로우**:
      - Given: 활성화된 공유 링크 URL이 있을 때
      - When: `browser_navigate`로 `/q/[slug]` 진입
      - Then: `browser_snapshot`으로 견적서 내용 렌더링 확인 → `browser_console_messages`로 JS 에러 없는지 확인 → 만료된 slug로 `browser_navigate` 후 404 페이지 텍스트 검증

- [ ] **보안 헤더 설정** — `next.config.ts`
  - **Context**: CSP, X-Frame-Options, X-Content-Type-Options 등 보안 헤더 미설정 상태
  - **Technical Notes**: `next.config.ts`의 `headers()` 함수에 추가
    ```typescript
    {
      key: "X-Frame-Options", value: "DENY"
    },
    {
      key: "X-Content-Type-Options", value: "nosniff"
    },
    {
      key: "Referrer-Policy", value: "strict-origin-when-cross-origin"
    }
    ```
    `/q/[slug]`에는 `Content-Security-Policy`로 `frame-ancestors 'none'` 추가
  - **인수 기준**: `curl -I https://도메인/q/[slug]` 응답에 보안 헤더 포함
  - **테스트 (Playwright MCP)**:
    - Given: `next.config.ts`에 보안 헤더 설정이 완료된 상태에서 개발 서버 실행 시
    - When: `browser_navigate`로 `/q/[slug]` 진입 → `browser_network_requests`로 응답 헤더 캡처
    - Then: 응답 헤더에 `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` 값이 포함되었는지 검증. `browser_snapshot`으로 페이지 정상 렌더링 확인 (헤더 추가로 인한 렌더링 이상 없음)

- [ ] **환경변수 프로덕션 설정 가이드** — `docs/` 또는 팀 내부 문서
  - `IP_HASH_SALT`: `openssl rand -base64 32`로 생성, 변경 시 기존 해시 불일치 주의
  - `AUTH_URL`: 실제 프로덕션 도메인으로 설정 (`https://yourdomain.com`)
  - `NOTION_TOKEN`: 통합 토큰의 페이지 접근 권한 확인
  - **인수 기준**: 팀원이 문서만으로 환경 설정 완료 가능

- [ ] **Notion 데이터베이스 스키마 검증** — Notion 워크스페이스
  - **Context**: `parseQuotePage`가 가정하는 property key들(`share_slug`, `is_public`, `project_name` 등)이 실제 Notion DB에 존재하는지 확인
  - 필수 속성 키 목록:
    - `title` (type: title) — 견적서 번호
    - `project_name` (type: rich_text)
    - `client_company` (type: rich_text)
    - `client_contact_name` (type: rich_text)
    - `client_email` (type: email)
    - `issued_date` (type: date)
    - `valid_until` (type: date)
    - `status` (type: status) — 옵션: 작성중, 발송완료, 승인, 반려, 만료
    - `subtotal` (type: number)
    - `vat` (type: formula — `prop(subtotal) * 0.1`)
    - `total` (type: formula — `prop(subtotal) + prop(vat)`)
    - `payment_terms` (type: rich_text)
    - `notes` (type: rich_text)
    - `share_slug` (type: rich_text)
    - `is_public` (type: checkbox)
  - **인수 기준**: `/dashboard/quotes` 페이지에서 Notion DB의 모든 견적서가 올바르게 파싱되어 표시
  - **테스트 (Playwright MCP)**:
    - Given: 실제 Notion DB와 연동된 개발 환경에서
    - When: `browser_navigate`로 `/dashboard/quotes` 진입
    - Then: `browser_snapshot`으로 견적서 목록이 렌더링되었는지 확인. 각 행에서 `project_name`, `client_company`, `status`, `total` 컬럼 값이 `null`이나 `undefined` 없이 표시되는지 검증. `browser_console_messages`로 파싱 관련 에러 또는 경고 없는지 확인

- [ ] **성능 검증** — Chrome DevTools / Lighthouse
  - **인수 기준**:
    - 캐시 미스 시 `/q/[slug]` TTFB < 800ms
    - 캐시 히트 시 `/q/[slug]` TTFB < 200ms
    - LCP < 2.5s (Chrome Lighthouse)
  - **테스트 (Playwright MCP)**:
    - Given: 프로덕션 또는 프로덕션 동등 환경에서 개발 서버 실행 시
    - When: `browser_navigate`로 `/q/[slug]`에 캐시 미스 요청(최초 접근) → `browser_network_requests`로 응답 시간 측정
    - Then: 첫 요청 TTFB가 800ms 미만인지 확인. 즉시 동일 slug 재요청(캐시 히트) 후 TTFB가 200ms 미만인지 검증. `browser_snapshot`으로 페이지 완전 렌더링 완료 상태 확인

- [ ] **베타 사용자 5명 초대 및 피드백 채널 설정**
  - **인수 기준**: 5명 초대 완료, 피드백 수집 채널(이메일/슬랙) 준비

#### Phase 4 단계 검증 체크리스트
- [ ] Playwright MCP: 작성자 전체 플로우 E2E 테스트 통과 (로그인 → 공유 생성 → 공유 해제)
- [ ] Playwright MCP: 클라이언트 전체 플로우 E2E 테스트 통과 (공유 URL → 견적서 확인 → 만료 404)
- [ ] Playwright MCP: 보안 헤더 응답 헤더 검증 테스트 통과
- [ ] Playwright MCP: Notion DB 스키마 파싱 정상 동작 테스트 통과
- [ ] Playwright MCP: `/q/[slug]` TTFB 캐시 미스 < 800ms, 캐시 히트 < 200ms 성능 검증 통과

---

## 🔗 Dependency Graph

```
환경변수 설정
    │
    ▼
Prisma 스키마 (QuoteShare, QuoteViewLog)   ──────────────────────┐
    │                                                              │
    ▼                                                             │
Notion 클라이언트 + 헬퍼 함수 (notion.ts)                        │
    │                                                             │
    ├──► queryAll ──────────────────────────────────────────────► │
    │                                                             │
    ├──► findBySlug ─────────────────────────────────────────┐   │
    │                                                         │   │
    ├──► generateAndAttachSlug ───────────────────────────┐  │   │
    │                                                      │  │   │
    └──► withRateLimit (모든 Notion 호출 래퍼)            │  │   │
                                                           │  │   │
                           ┌───────────────────────────────┘  │   │
                           ▼                                   │   │
GET /api/quotes       POST /api/quotes/[id]/share              │   │
    │                     │                                    │   │
    │              ┌──────┘                         ←──────────┘   │
    │              │                                               │
    ▼              ▼                                               │
QuotesTable   SharePanel                                          │
(클라이언트)  (클라이언트)                                        │
    │              │                                               │
    └──────────────┘                                               │
                                                                   │
POST /api/quotes/[id]/revoke ──► revalidateTag(slug) ←────────────┘
                                        │
                                        ▼
GET /api/quotes/by-slug/[slug] ──► unstable_cache (60s)
                                        │
                                        ▼
/q/[slug]/page.tsx (서버) ──► QuoteView.tsx (클라이언트)
                    │
                    └──► QuoteViewLog.create (비동기)
```

---

## 🧪 테스트 전략

### 테스트 원칙: 구현 → 검증 → 다음 단계 사이클

모든 태스크는 다음 사이클을 따릅니다. 테스트가 통과되기 전까지 태스크를 완료 처리하지 않습니다.

```
구현 완료
    │
    ▼
Playwright MCP 테스트 실행
    │
    ├─── 실패 ──► 원인 분석 → 수정 → 재테스트 (사이클 반복)
    │
    └─── 통과 ──► 태스크 완료 처리 → 다음 태스크
```

### Playwright MCP 도구 목록 및 사용 방법

| 도구 | 용도 | 주요 사용 시점 |
|------|------|---------------|
| `browser_navigate` | URL 이동 | 모든 테스트 시작, 페이지 전환 |
| `browser_fill_form` | 폼 입력 | 로그인, 폼 제출 테스트 |
| `browser_click` | 버튼/링크 클릭 | CTA 버튼, 메뉴 선택 |
| `browser_select_option` | 드롭다운 선택 | 상태 필터 선택 |
| `browser_snapshot` | 접근성 트리 스냅샷 | 페이지 렌더링 확인, 요소 존재 검증 |
| `browser_network_request` | 단일 API 요청 | 응답 상태 코드, 헤더 검증 |
| `browser_network_requests` | 복수 요청 목록 | 불필요한 API 호출 감지, 성능 검증 |
| `browser_console_messages` | 콘솔 메시지 수집 | JS 에러·경고 없는지 확인 |
| `browser_wait_for` | 조건 대기 | 비동기 로딩 완료 대기 |

### 테스트 대상 분류표

| 분류 | 대상 | 필수 여부 | 주요 도구 |
|------|------|----------|----------|
| **Playwright MCP 필수** | API 라우트 (`/api/quotes/*`) | 필수 | `browser_network_request`, `browser_network_requests` |
| **Playwright MCP 필수** | 비즈니스 로직 (공유 생성/회수, 캐시 무효화) | 필수 | `browser_click`, `browser_network_request`, `browser_snapshot` |
| **Playwright MCP 필수** | 폼 제출 (로그인, 필터 선택) | 필수 | `browser_fill_form`, `browser_click`, `browser_snapshot` |
| **Playwright MCP 필수** | 인증 플로우 (로그인, 보호 라우트 리다이렉트) | 필수 | `browser_navigate`, `browser_snapshot` |
| **스냅샷 확인 필수** | 모든 페이지 렌더링 (목록, 상세, 공개, 404) | 필수 | `browser_snapshot` |
| **시각적 확인 권장** | 에러 상태 (API 실패 토스트) | 권장 | `browser_snapshot`, `browser_console_messages` |
| **시각적 확인 권장** | 빈 상태 (EmptyState 컴포넌트) | 권장 | `browser_snapshot` |
| **시각적 확인 권장** | 로딩 상태 (Skeleton UI) | 권장 | `browser_snapshot`, `browser_wait_for` |

### 테스트 실패 시 대응 절차

1. `browser_console_messages`로 JS 에러 메시지 확인
2. `browser_network_requests`로 실패한 API 요청 응답 코드·본문 확인
3. `browser_snapshot`으로 현재 DOM 상태 캡처 후 예상 UI와 비교
4. 원인 특정 후 코드 수정
5. 수정 후 동일 테스트 재실행 → 통과 확인 후 다음 태스크 진행

---

## ⚠️ Risks & Mitigations

| 위험 | 발생 가능성 | 영향도 | 대응책 |
|------|-----------|--------|--------|
| Notion API Rate Limit (3 req/sec) 초과 | 중 | 높음 | `withRateLimit` exponential backoff(최대 5회), 60초 캐시로 실제 호출 최소화 |
| 캐시 TTL 60초로 인한 회수 지연 | 중 | 중 | `revalidateTag(slug)` 즉시 무효화. 단, `unstable_cache` 태그 기반 무효화로 전환 필요(현재 `revalidatePath` 사용, 효과 미검증) |
| Notion property key 불일치 | 높음 | 높음 | Phase 4에서 Notion DB 스키마 검증 태스크 필수. `parseQuotePage`는 없는 속성에 `null` 반환으로 안전 처리 |
| `formula`/`rollup` 타입 읽기 전용 | 낮음 (인지됨) | 높음 | `getFormula` 헬퍼로 읽기만 수행, 쓰기 API 호출 금지. PRD에 명시됨 |
| IP_HASH_SALT 미설정 시 기본값 사용 | 중 | 중 | `.env`에 명시적 설정 강제. `SALT` 변수에 경고 로그 추가 권장 |
| 슬러그 추측 공격 (brute-force) | 낮음 | 높음 | nanoid 21자 (126 bit 엔트로피). 추가로 IP별 요청 속도 제한 고려(P2) |
| 브라우저 print CSS 디자인 한계 | 낮음 (의도됨) | 낮음 | MVP 트레이드오프로 명시. 다음 버전 Puppeteer로 마이그레이션 예정 |
| Notion API 장애 시 서비스 불가 | 낮음 | 높음 | `unstable_cache` stale-while-revalidate로 60초 내 캐시 응답 유지 |

---

## 🚀 Launch Checklist

### 인프라
- [ ] 프로덕션 환경변수 설정 완료 (`NOTION_TOKEN`, `NOTION_DATABASE_ID`, `AUTH_SECRET`, `AUTH_URL`, `IP_HASH_SALT`)
- [ ] Prisma 마이그레이션 프로덕션 적용 (`npx prisma migrate deploy`)
- [ ] Notion 통합 토큰의 데이터베이스 접근 권한 확인

### 기능 검증
- [ ] 로그인 → 견적서 목록 → 상세 → 공유 생성 → 클립보드 복사 플로우 수동 검증
- [ ] 공유 URL → 견적서 열람 → PDF 저장 플로우 수동 검증
- [ ] 공유 해제 → 즉시 404 반환 검증
- [ ] 만료된 견적서 URL 접근 시 만료 배너 표시 검증
- [ ] 잘못된 슬러그 접근 시 404 페이지 표시 검증

### 보안
- [ ] `/robots.txt` 접근 시 `/q/` disallow 포함 확인
- [ ] 보안 헤더 적용 확인 (`X-Frame-Options`, `X-Content-Type-Options`)
- [ ] `NOTION_TOKEN`이 클라이언트 번들에 포함되지 않음을 확인 (서버 컴포넌트/API 라우트 전용)
- [ ] `IP_HASH_SALT` 기본값 `"default-salt-change-in-production"` 미사용 확인

### 성능
- [ ] 캐시 히트 시 `/q/[slug]` TTFB < 200ms 확인
- [ ] 캐시 미스 시 `/q/[slug]` TTFB < 800ms 확인
- [ ] LCP < 2.5s (Lighthouse) 확인

### 테스트
- [ ] Playwright MCP: 로그인 → 견적서 목록 → 상세 → 공유 생성 → 공유 해제 E2E 플로우 통과
- [ ] Playwright MCP: `/q/[slug]` 공개 견적서 렌더링 스냅샷 확인 통과
- [ ] Playwright MCP: 공유 해제 직후 즉시 404 반환 (캐시 무효화 검증) 통과
- [ ] Playwright MCP: 미인증 상태에서 `/dashboard/quotes` 접근 시 `/login` 리다이렉트 확인
- [ ] Playwright MCP: 존재하지 않는 slug 접근 시 404 페이지 렌더링 확인
- [ ] Playwright MCP: 보안 헤더 (`X-Frame-Options`, `X-Content-Type-Options`) 응답 포함 확인
- [ ] Playwright MCP: `/q/[slug]` TTFB 캐시 미스 < 800ms, 캐시 히트 < 200ms 성능 검증

### 접근성
- [ ] "PDF 저장" 버튼 키보드 접근 가능 확인
- [ ] 만료 배너 색 대비 4.5:1 이상 확인 (WCAG AA)

---

## 📅 Milestone Summary

| 마일스톤 | 목표일 | 산출물 | 현재 상태 |
|---------|--------|--------|----------|
| M0: 인프라 기반 완성 | 2026-07-04 (W1) | DB 스키마, Notion 클라이언트, 환경변수 | 완료 |
| M1: 작성자 대시보드 | 2026-07-18 (W3) | 견적서 목록/상세, 공유 생성/회수 | 완료 (사이드바 링크 검증 필요) |
| M2: 공개 견적서 & PDF | 2026-07-25 (W4) | `/q/[slug]` 공개 페이지, 조회 로그, 만료 처리 | 완료 (print CSS 최적화 미완) |
| M3: 품질 강화 | 2026-08-01 (W5) | 상태 필터, 페이지네이션, line items, QA | 미구현 |
| M4: 비공개 베타 출시 | 2026-08-08 (W6) | 5명 베타 유저, 보안 헤더, 성능 검증 | 미구현 |

---

## 🔮 Future Considerations (Post-MVP)

### 다음 버전 (V1.1)
- **이메일 발송 기능**: 공유 링크를 클라이언트 이메일로 직접 발송 (Resend / Nodemailer). `client_email` property 활용
- **클라이언트 승인/반려**: 공개 페이지에서 버튼 클릭 → `POST /api/quotes/by-slug/[slug]/respond` → Notion `status` property 업데이트 (역전파)
- **Puppeteer PDF 생성**: `/api/quotes/by-slug/[slug]/pdf` 라우트. 헤드리스 Chromium으로 동일 공개 페이지 렌더링 후 PDF buffer 반환. 한국어 폰트(Noto Sans KR) 임베드 필요

### V1.2+
- **다중 Notion 데이터베이스 지원**: 사용자별 `NOTION_DATABASE_ID` 설정 (현재 환경변수 단일 DB)
- **조회 통계 대시보드**: `QuoteViewLog` 기반 일별/주별 조회 추이 차트 (`Recharts` 활용)
- **슬러그별 요청 속도 제한**: IP별 토큰버킷 또는 `@upstash/ratelimit` 도입
- **다중 통화 지원**: KRW 외 USD, EUR 등 추가 (`Intl.NumberFormat` currency 옵션 활용)
- **PostgreSQL 마이그레이션**: `DATABASE_URL` PostgreSQL 변경 + `better-sqlite3` 어댑터 제거 (기존 스키마 호환)
- **템플릿 시스템**: 자주 쓰는 항목 템플릿 저장 (Notion 별도 DB 또는 로컬 DB)
