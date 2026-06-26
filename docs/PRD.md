# PRD 작성 지시 프롬프트: Notion 기반 견적서 공유 & PDF 다운로드 서비스 (MVP)

당신은 **시니어 프로덕트 매니저 겸 기술 PM**입니다. 아래 컨텍스트와 요구사항을 바탕으로 **MVP PRD 문서**를 작성하세요. 각 섹션은 명시된 형식과 깊이를 정확히 준수해야 하며, 모호한 표현 대신 **측정 가능한 명세**로 작성합니다.

---

## 0. 프로젝트 컨텍스트 (전제 조건)

다음 기술 스택을 **고정 전제**로 PRD를 작성하세요. 대안 기술을 제안하더라도 이 스택 위에서 동작하는 형태여야 합니다.

- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Auth**: NextAuth v5 (JWT, Credentials Provider)
- **DB**: Prisma 7 + SQLite (better-sqlite3) — 견적서 메타데이터(공유 토큰, 조회 로그 등) 저장용
- **UI**: shadcn/ui, Tailwind CSS v4, lucide-react
- **Form**: React Hook Form + Zod v4
- **외부 데이터 소스**: Notion API (`@notionhq/client`) — 견적서 본문 데이터의 **Source of Truth**
- **알림**: Sonner

서비스 흐름의 핵심 가정:
- **견적서 작성자(=인증 사용자)**: NextAuth로 로그인한 내부 사용자. Notion DB에 견적서 한 행(row)을 작성한다.
- **클라이언트(=고객)**: 인증 없이 공유 URL로만 접근하는 외부 사용자. 견적서 열람 및 PDF 다운로드만 가능.
- **Notion DB**: 작성자는 Notion 워크스페이스에서 직접 데이터를 입력. 본 서비스는 Notion DB를 **읽어서 렌더링**하는 역할이 핵심.

---

## 1. 작성해야 할 PRD 섹션 (순서 고정)

다음 12개 섹션을 **순서대로**, **모든 섹션을 빠짐없이** 작성하세요. 각 섹션 헤더는 H2(`##`)로 통일합니다.

### 1) 문서 정보
- 문서 버전, 작성일(2026-06-27 기준), 작성자(PM), 상태(Draft/Review/Approved), 관련 문서 링크 자리표시자.

### 2) 제품 개요 (Executive Summary)
- 한 문장 엘리베이터 피치
- 해결하려는 문제(Problem Statement) 3~5줄
- 솔루션 요약(Solution) 3~5줄
- MVP의 목표와 **명시적 비목표(Non-Goals)** 각 5개 이상

### 3) 타겟 사용자 & 페르소나
- **작성자 페르소나**: 프리랜서/소규모 에이전시 운영자. Notion을 이미 사용 중이며 견적서 관리에 별도 SaaS를 도입하기 부담스러운 사람.
- **클라이언트 페르소나**: 견적서를 받는 고객. 가입/로그인 없이 즉시 열람 및 PDF 저장이 가능해야 함.
- 각 페르소나별 Jobs-To-Be-Done 3개씩.

### 4) Notion 데이터베이스 스키마 설계 ⭐ 핵심
견적서 한 행에 들어갈 **모든 속성(Property)** 을 다음 표 형식으로 명세하세요. 누락 없이 작성하고, 각 속성에 **Notion property type**을 정확히 기재합니다.

| 속성명 (한글) | Notion 속성 키 | Property Type | 필수 여부 | 설명 | 예시 값 |
|---|---|---|---|---|---|

최소 포함 속성 (필요 시 추가):
- **견적서 번호** (`quote_number`, `title`) — DB의 title 컬럼
- **견적서 제목/프로젝트명** (`project_name`, `rich_text`)
- **클라이언트 회사명** (`client_company`, `rich_text`)
- **클라이언트 담당자명** (`client_contact_name`, `rich_text`)
- **클라이언트 이메일** (`client_email`, `email`)
- **발행일** (`issued_date`, `date`)
- **유효기한** (`valid_until`, `date`)
- **상태** (`status`, `status` — 작성중/발송완료/승인/반려/만료)
- **공급가액 합계** (`subtotal`, `number` — formula 가능)
- **세액(VAT 10%)** (`vat`, `formula`)
- **총액** (`total`, `formula`)
- **결제 조건** (`payment_terms`, `rich_text`)
- **비고/특이사항** (`notes`, `rich_text`)
- **공유 슬러그** (`share_slug`, `rich_text` — 본 서비스가 생성·기입하는 unique key)
- **공개 여부** (`is_public`, `checkbox`)

**견적 항목(line items) 처리 방식**에 대해 두 가지 옵션을 비교 분석하고 **하나를 선정**하여 권장하세요:
- **Option A**: 별도 "Quote Items" DB를 만들고 Relation 속성으로 연결 (정규화, 항목별 개별 관리 가능, 추가 API 호출 필요)
- **Option B**: 견적서 row의 child page 본문에 Notion 테이블 블록으로 작성 (단순, blocks.children.list 호출 필요)

**중요 제약사항을 PRD에 명시할 것**:
- `formula` / `rollup` / `created_time` 속성은 **API 읽기 전용** — 본 서비스에서 쓰기 시도 금지
- `relation` 속성은 ID만 반환 → 항목 내용 가져오려면 **각 페이지에 추가 retrieve 호출 필요** (N+1 주의)
- `rich_text` 1개 블록당 **2,000자 제한**
- 페이지 1회 쿼리 최대 **100건** — 페이지네이션 필수

### 5) MVP 기능 범위
다음 형식으로 기능을 분류하세요.

#### 5.1 MUST (MVP 포함)
1. Notion 통합 토큰 설정 (환경변수 `NOTION_TOKEN`, `NOTION_DATABASE_ID`)
2. 작성자 대시보드 — Notion DB에서 견적서 목록 조회 (페이지네이션, 상태 필터)
3. 공유 링크 생성 — `share_slug` 자동 생성(nanoid 21자) 후 Notion property 업데이트, `is_public=true` 토글
4. 공개 견적서 페이지 — `/q/[slug]` 라우트, 인증 없이 접근, 견적서 전체 렌더링
5. PDF 다운로드 — 공개 페이지에서 "PDF로 저장" 버튼 제공
6. 조회 로그 — 클라이언트 접근 시점/IP/UA를 로컬 SQLite에 기록 (`QuoteViewLog` 모델)
7. 만료 처리 — `valid_until` 경과 시 공개 페이지에서 "만료됨" 안내 표시

#### 5.2 SHOULD (다음 버전)
- 이메일 발송 기능
- 클라이언트 측 "승인/반려" 버튼 (Notion status 역전파)
- 다중 통화 지원

#### 5.3 WON'T (MVP 명시적 제외)
- Notion DB 자동 생성 (사용자가 수동 셋업)
- 전자서명, 결제 연동, 다국어, 템플릿 마켓플레이스

각 MUST 기능은 다음 형식의 **유저 스토리 + 인수 기준(Given-When-Then)** 으로 상세화하세요.

```
US-01: 작성자로서, Notion에 입력한 견적서의 공유 링크를 한 번의 클릭으로 생성하고 싶다.

Given 작성자가 견적서 목록에서 한 행을 선택했고
When "공유 링크 생성" 버튼을 클릭하면
Then 시스템은 nanoid로 share_slug를 생성하여 Notion에 PATCH하고,
     is_public을 true로 설정하며,
     클립보드에 복사된 URL을 sonner 토스트로 알린다.
```

최소 7개의 US를 작성하세요 (US-01 ~ US-07).

### 6) 사용자 플로우
다음 두 플로우를 각각 **번호 단계 + Mermaid 다이어그램**으로 작성하세요.

#### 6.1 작성자 플로우
NextAuth 로그인 → 대시보드 → 견적서 목록 → 행 선택 → 공유 링크 생성 → 클립보드 복사 → 클라이언트에게 전달

#### 6.2 클라이언트 플로우
공유 URL 클릭 → 공개 견적서 페이지 진입 → 견적 내용 확인 → "PDF 다운로드" 클릭 → PDF 저장 → (조회 로그 자동 기록)

### 7) 화면 명세 (Screen Spec)
다음 화면 각각에 대해 **목적 / 구성요소 / 상태 분기(로딩·에러·빈상태·만료) / shadcn/ui 컴포넌트 매핑**을 작성하세요.

1. `/dashboard/quotes` — 견적서 목록 (DataTable, Badge로 status)
2. `/dashboard/quotes/[id]` — 견적서 상세 미리보기 + 공유 링크 패널
3. `/q/[slug]` — **공개 견적서 뷰** (헤더에 회사 로고, 본문에 항목 테이블, 푸터에 결제조건, 우측 상단에 "PDF 저장" 버튼)
4. `/q/[slug]/not-found` — 잘못된/비공개/만료된 슬러그 처리

### 8) 기술 구현 가이드라인 ⭐ 핵심

#### 8.1 라우트 구조 (App Router)
```
src/app/
  (dashboard)/
    quotes/
      page.tsx              # 목록 (Server Component, notion.databases.query)
      [id]/page.tsx         # 상세 (Server Component, notion.pages.retrieve)
  q/
    [slug]/
      page.tsx              # 공개 견적서 (Server Component, 캐시 적극 활용)
      print/page.tsx        # PDF용 print 전용 레이아웃 (선택)
  api/
    quotes/
      [id]/share/route.ts   # POST — 공유 링크 생성 (slug 발급 + Notion update)
      [id]/revoke/route.ts  # POST — is_public=false 토글
    quotes/by-slug/[slug]/
      route.ts              # GET — 슬러그 → 페이지 조회 (캐시)
```

#### 8.2 Notion 클라이언트 (`src/lib/notion.ts`)
- 싱글톤 Client 인스턴스
- `Notion-Version: 2022-06-28` 명시
- **헬퍼 함수 요구사항**:
  - `getTitle(page)`, `getRichText(prop)`, `getNumber(prop)`, `getDate(prop)`, `getStatus(prop)`, `getCheckbox(prop)` — 모두 정확한 타입 가드(`prop.type !== 'X' return null`) 포함
  - `queryAll(filter)` — has_more 페이지네이션 헬퍼
  - `findBySlug(slug)` — `filter: { property: 'share_slug', rich_text: { equals: slug } }` + `is_public.equals = true`
  - `generateAndAttachSlug(pageId)` — nanoid 21자 생성 → `pages.update`

#### 8.3 Rate Limit & 캐싱 전략
- Notion API: **3 req/sec/integration** → 큐잉 또는 `p-queue` 도입 고려
- 공개 견적서 페이지는 Next.js `unstable_cache` 또는 `fetch` 캐시로 **slug 기준 60초 캐시** (작성자가 Notion에서 수정 시 즉시 반영되지 않는 트레이드오프 PRD에 명시)
- `APIErrorCode.RateLimited` 발생 시 exponential backoff (250ms, 500ms, 1s, 2s, 4s, max 5회)

#### 8.4 로컬 DB 스키마 (Prisma)
다음 모델을 PRD에 정의:
```prisma
model QuoteShare {
  id           String    @id @default(cuid())
  notionPageId String    @unique
  slug         String    @unique
  createdBy    String    // User.id
  createdAt    DateTime  @default(now())
  revokedAt    DateTime?
}

model QuoteViewLog {
  id        String   @id @default(cuid())
  slug      String
  ipHash    String   // SHA-256(ip + salt)
  userAgent String
  viewedAt  DateTime @default(now())
  @@index([slug, viewedAt])
}
```

### 9) PDF 생성 방식 ⭐ 핵심
다음 3가지 옵션을 **비교표**로 분석하고 **MVP 권장안을 명시**하세요.

| 방식 | 구현 난이도 | 디자인 자유도 | 서버 비용 | 의존성 | 한국어 폰트 |
|---|---|---|---|---|---|
| **A. 브라우저 print (`window.print()` + `@media print` CSS)** | 매우 낮음 | 중 | 0 | 없음 | OS 폰트 사용 |
| **B. Puppeteer/Playwright 헤드리스 렌더링 (서버)** | 중간 | 매우 높음 | 높음(메모리) | Chromium | 임베드 필요 |
| **C. `@react-pdf/renderer` (React로 PDF DSL 작성)** | 높음 | 낮음~중 | 낮음 | react-pdf | Pretendard 등 명시 등록 |

**MVP 권장: Option A (브라우저 print)**
- 이유: 0 의존성, 서버 부하 없음, MVP 검증 속도 우선
- 구현 명세:
  - `/q/[slug]/page.tsx`에 "PDF 저장" 버튼 → `window.print()` 호출
  - `print.css`에 `@page { size: A4; margin: 15mm }`, `@media print` 시 헤더/푸터/버튼 숨김
  - 다이얼로그에서 "PDF로 저장" 선택 유도 안내 텍스트 제공
- **다음 버전**에서 Option B로 마이그레이션 시: `/api/quotes/by-slug/[slug]/pdf` 라우트에서 Puppeteer로 동일 페이지 렌더링 후 buffer 반환

### 10) 보안 & 프라이버시 ⭐ 핵심
다음 위협 모델과 대응책을 표로 정리하세요.

| 위협 | 시나리오 | 대응책 |
|---|---|---|
| **슬러그 추측 공격** | 공격자가 짧은 slug를 brute-force | nanoid 21자(URL-safe, 약 126 bit 엔트로피) — UUID v4 수준 |
| **인덱싱 노출** | 검색엔진이 공개 견적서를 크롤링 | `/q/[slug]` 라우트에 `noindex, nofollow` 메타 + `robots.txt`에서 `/q/` 차단 |
| **링크 회수 불가** | 잘못 공유된 링크를 무력화 못함 | `is_public=false` 토글 즉시 404 처리. 캐시 즉시 무효화(`revalidatePath`) |
| **만료 우회** | 만료 후에도 캐시된 페이지로 접근 | 서버에서 `valid_until` 비교 후 만료 페이지 렌더링 |
| **PII 누출** | View log에 raw IP 저장 | IP는 `salt + SHA-256` 해시로만 저장 |
| **Notion 토큰 유출** | 환경변수 노출 | 서버 컴포넌트/API 라우트에서만 사용. 클라이언트 번들 포함 금지 |
| **Rate limit DoS** | 외부에서 공개 URL 폭주 호출 | 슬러그별 SQLite/메모리 토큰버킷 또는 캐시 우선 응답 |

추가 명시 사항:
- 클라이언트 접근은 **인증 없음**이 의도된 동작 — 슬러그가 곧 자격증명(capability URL).
- HTTPS 강제, SameSite 쿠키, CSP 헤더 권장값 명시.

### 11) 비기능 요구사항 (NFR)
- **성능**: 공개 견적서 페이지 TTFB < 800ms(캐시 히트 시 < 200ms), LCP < 2.5s
- **가용성**: Notion API 장애 시 stale-while-revalidate로 60초 이내 캐시 응답
- **접근성**: WCAG AA, 키보드 네비게이션, 색 대비 4.5:1
- **국제화**: MVP는 한국어 단일, KRW 단일 통화 (₩ 기호, 천 단위 구분)
- **브라우저 지원**: Chrome/Safari/Edge 최신 2개 메이저 버전

### 12) 성공 지표 (Success Metrics) & 마일스톤
- **활성화**: 가입 후 7일 내 공유 링크 1개 이상 생성한 유저 비율 ≥ 40%
- **전환**: 공유된 견적서의 클라이언트 조회율 ≥ 70%
- **PDF 다운로드율**: 조회된 견적서 중 PDF 저장 발생 비율 ≥ 30%
- **에러율**: 공개 페이지 5xx 비율 < 0.5%

**마일스톤 (2026-06-27 기준)**:
- W1–W2: Notion 스키마 확정 + 클라이언트 헬퍼 + 인증 연동
- W3: 작성자 대시보드 (목록/상세/공유 발급)
- W4: 공개 페이지 + 브라우저 print PDF
- W5: 만료/회수/조회 로그 + QA
- W6: 비공개 베타 출시 (5명)

---

## 2. 작성 규칙

1. **모든 표는 마크다운 표 문법**으로 작성. 표 안에 코드는 백틱으로 감쌀 것.
2. **모든 기능은 측정 가능한 인수 기준**을 가져야 함. "잘 보인다", "빠르다" 같은 모호한 표현 금지.
3. **Notion API 제약사항**을 적극적으로 본문에 명시. 특히 rate limit(3 req/sec), 페이지 크기(100), rich_text 2000자, formula/rollup 읽기 전용.
4. **트레이드오프를 숨기지 말 것**. 캐시 TTL로 인한 반영 지연, 브라우저 print의 디자인 한계, 슬러그 capability URL의 위험성을 PRD에 명시적으로 적시.
5. 코드 예시는 **TypeScript**로, `any` 사용 금지, `@notionhq/client`의 공식 타입(`PageObjectResponse`, `QueryDatabaseParameters` 등) 사용.
6. 견적서 도메인 용어는 **한국어 기준**으로 통일 (견적서, 공급가액, 부가세, 합계, 유효기한, 결제조건).
7. PRD 분량: **최소 3,500단어 / 최대 7,000단어**. 부족하면 화면 명세와 US를 늘려 채울 것.
8. PRD 최상단에 **TL;DR 박스**(5줄 이내)를 배치할 것.
