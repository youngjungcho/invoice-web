# Development Guidelines — invoice-web

## 1. Project Overview

- **목적**: Notion을 CMS로 사용하는 견적서(Quote) 생성·공유·PDF 다운로드 웹앱
- **스택**: Next.js 16 App Router · React 19 · TypeScript · NextAuth v5 (JWT) · Prisma 7 + SQLite · shadcn/ui · Tailwind CSS v4 · Zod v4 · Recharts · Sonner · lucide-react · nanoid · @notionhq/client
- **핵심 데이터 흐름**: Notion DB → `src/lib/notion.ts` → `/api/quotes/*` → 대시보드 / `/q/[slug]` 공개 링크

---

## 2. Project Architecture

```
src/
  app/
    (auth)/           # 공개 — 로그인·회원가입
    (dashboard)/      # 인증 필수 — Sidebar+Header 레이아웃
      dashboard/
        quotes/       # 견적서 목록·상세·공유패널
    q/[slug]/         # 공개 견적서 공유 링크 (인증 불필요)
    api/
      auth/           # NextAuth 핸들러 + 회원가입
      quotes/         # Notion 연동 CRUD + share/revoke
      user/profile/   # 프로필 PATCH
    actions.ts        # signOutAction() 서버 액션
  components/
    ui/               # shadcn/ui (직접 생성 금지)
    layout/           # Sidebar, Header, MobileSidebar, …
    common/           # PageHeader, StatCard, DataTable, EmptyState, …
    providers/        # ThemeProvider, SessionProvider
  hooks/              # 커스텀 훅 (index.ts re-export)
  lib/
    auth.ts           # 전체 NextAuth 설정 (Node.js 전용)
    auth.config.ts    # 미들웨어용 설정 (Edge 안전)
    db.ts             # Prisma 싱글톤
    notion.ts         # Notion 클라이언트 + 헬퍼 함수
    utils.ts          # cn() 유틸리티
prisma/
  schema.prisma       # DB 스키마
  migrations/         # 마이그레이션 파일 (직접 수정 금지)
```

---

## 3. Code Standards

- 모든 className 병합은 `cn()` (`src/lib/utils.ts`) 사용. 직접 문자열 연결 금지
- 토스트 알림은 `sonner` 라이브러리만 사용 (`toast.success/error/warning/info`)
- 아이콘은 `lucide-react`만 사용
- 서버 컴포넌트에서 세션: `auth()` / 클라이언트 컴포넌트에서 세션: `useSession()`
- 모든 폼: React Hook Form + Zod v4 + `zodResolver`. 스키마는 해당 페이지 파일 내 정의
- TypeScript strict 모드 — `any` 사용 금지

---

## 4. Key File Interaction Rules

### Notion 필드 추가/변경 시 반드시 동시 수정

| 변경 대상 | 함께 수정할 파일 |
|-----------|----------------|
| Notion DB 프로퍼티 추가 | `QuoteData` 인터페이스 + `parseQuotePage()` (둘 다 `src/lib/notion.ts`) |
| 견적서 공유 로직 변경 | `/api/quotes/[id]/share/route.ts` + `/api/quotes/[id]/revoke/route.ts` + `QuoteShare` Prisma 모델 |
| 공개 견적서 뷰 변경 | `src/app/q/[slug]/QuoteView.tsx` + `src/app/q/[slug]/page.tsx` |
| 사이드바 메뉴 추가 | `src/components/layout/sidebar.tsx` + `src/components/layout/MobileSidebar.tsx` |
| 새 보호 라우트 추가 | `middleware.ts` matcher 또는 조건부 redirect 확인 |
| Prisma 모델 변경 | `prisma/schema.prisma` 수정 후 `npx prisma migrate dev` 실행 필수 |

---

## 5. Authentication Rules

- **서버 컴포넌트/Route Handler**: `import { auth } from "@/lib/auth"` 사용
- **미들웨어**: `import authConfig from "@/lib/auth.config"` 사용 (Node.js 모듈 import 절대 금지)
- **`src/lib/auth.config.ts`에 절대 금지**: `bcryptjs`, `prisma`, `@prisma/*`, Node.js 전용 모듈 import
- 보호 라우트 인증 실패 시 `redirect("/login")` 사용
- 로그아웃은 `src/app/actions.ts`의 `signOutAction()` 서버 액션만 사용

---

## 6. Database Rules

- Prisma 클라이언트는 **반드시** `src/lib/db.ts`에서 `import { db } from "@/lib/db"` 로만 사용
- Route Handler나 서버 컴포넌트에서 직접 `new PrismaClient()` 인스턴스 생성 금지
- 스키마 변경 후 반드시: `npx prisma migrate dev --name <설명>` 실행
- `prisma/migrations/` 파일은 직접 수정 금지

---

## 7. Notion Integration Rules

- Notion API 호출은 **반드시** `withRateLimit()` 래퍼 사용 (Rate Limit 대응)
- 필수 환경변수: `NOTION_TOKEN`, `NOTION_DATABASE_ID`
- Notion 클라이언트는 `src/lib/notion.ts`의 싱글톤 `notion` 사용. 직접 `new Client()` 생성 금지
- 견적서 슬러그: `nanoid(21)` 생성, Notion 페이지의 `share_slug`(rich_text) + `is_public`(checkbox) 동기화 필수
- 새 Notion 프로퍼티 타입 추출 시 `getTitle/getRichText/getNumber/getDate/getStatus/getCheckbox/getEmail/getFormula` 헬퍼 활용

---

## 8. UI Component Rules

- `src/components/ui/` 파일은 **절대 수동 생성/수정 금지** → `npx shadcn add <component>` 사용
- 이미 설치된 shadcn/ui 컴포넌트: `alert`, `alert-dialog`, `avatar`, `badge`, `button`, `card`, `dialog`, `dropdown-menu`, `form`, `input`, `label`, `progress`, `select`, `separator`, `sheet`, `skeleton`, `switch`, `table`, `tabs`, `textarea`, `tooltip`
- 새 컴포넌트 추가 전 위 목록 확인 → 없으면 `npx shadcn add` 실행
- 공통 컴포넌트(`PageHeader`, `StatCard`, `DataTable`, `EmptyState`) 재사용 우선

---

## 9. API Route Rules

- 인증이 필요한 Route Handler: 반드시 `auth()` 호출 후 세션 검사 → 없으면 `401` 반환
- 에러 응답 형식: `NextResponse.json({ error: "..." }, { status: N })`
- 성공 응답: `NextResponse.json(data)`
- Notion 연동 API에서는 `console.error("[GET /api/quotes]", error)` 형식으로 로깅

---

## 10. Routing & Middleware

- `(dashboard)/` 그룹: `src/app/(dashboard)/layout.tsx`가 Sidebar+Header 자동 적용
- `q/[slug]/` 그룹: `src/app/q/layout.tsx`가 별도 레이아웃 (인증 불필요)
- 미들웨어(`middleware.ts`)는 `/((?!api|_next/static|_next/image|favicon.ico).*)` 패턴 적용
- 새 공개 경로 추가 시 미들웨어의 조건 분기 확인

---

## 11. Environment Variables

필수 환경변수 (`.env` 기준):
```
DATABASE_URL="file:./dev.db"
AUTH_SECRET="<random base64>"
AUTH_URL="http://localhost:3000"
NOTION_TOKEN="<notion integration token>"
NOTION_DATABASE_ID="<notion database id>"
```
- `.env.example` 수정 시 실제 `.env` 값은 커밋 금지

---

## 12. Prohibited Actions

- **`src/components/ui/`에 파일 직접 생성/수정 금지**
- **`src/lib/db.ts` 외부에서 `new PrismaClient()` 생성 금지**
- **`src/lib/auth.config.ts`에 Node.js 전용 패키지 import 금지**
- **Notion API 직접 호출 (`notion.databases.query()` 등)을 `withRateLimit()` 없이 사용 금지**
- **`prisma/migrations/` 파일 직접 수정 금지**
- **`any` 타입 사용 금지**
- **`toast()` 외 다른 알림 라이브러리 사용 금지**
- **`cn()` 없이 className 문자열 직접 연결 금지**
- **새 shadcn 컴포넌트를 `npx shadcn add` 없이 수동으로 만들기 금지**

---

## 13. AI Decision-Making

### 새 기능 추가 결정 트리

```
새 기능 요청
├── Notion DB 필드 관련?
│   └── YES → notion.ts QuoteData + parseQuotePage 동시 수정
├── 새 페이지(라우트)?
│   ├── 인증 필요? → (dashboard)/ 그룹에 추가 + middleware 확인
│   └── 공개? → app/ 또는 q/ 그룹에 추가
├── 새 DB 모델 필요?
│   └── prisma/schema.prisma 수정 → migrate dev 실행
├── 새 UI 컴포넌트 필요?
│   ├── shadcn/ui 목록에 있음? → import만
│   ├── shadcn/ui에 없음? → npx shadcn add
│   └── 완전 커스텀? → src/components/common/ 또는 해당 페이지 디렉토리
└── 사이드바 메뉴 변경? → sidebar.tsx + MobileSidebar.tsx 동시 수정
```
