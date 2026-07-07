# V1.1 관리자 대시보드 고도화 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 견적서 관리 전용 레이아웃(사이드바 + 헤더 + 상단 탭 필터 + 테이블)과 목록에서 링크 복사 기능을 구현한다.

**Architecture:** `(dashboard)/quotes/layout.tsx`에 견적서 전용 레이아웃을 분리하고, URL searchParam `?status=`로 서버 컴포넌트가 Notion API를 필터링한다. `QuoteStatusTabs`는 탭 클릭 시 URL을 변경하고, `QuotesTable`은 클라이언트에서 링크 복사 로직을 처리한다.

**Tech Stack:** Next.js 16 App Router, shadcn/ui (Tabs, Badge, Table, Button, Skeleton), Tailwind CSS v4, lucide-react (Link2, Loader2), sonner, useCopyToClipboard hook

## Global Constraints

- Next.js 16 App Router — `searchParams`는 서버 컴포넌트 props로 받음 (`Promise<{status?: string}>` 타입)
- 경로 별칭 `@/*` = `src/*`
- shadcn/ui 컴포넌트는 `src/components/ui/`에 위치
- 커스텀 훅은 `src/hooks/`에 위치, `src/hooks/index.ts`에서 re-export
- 클라이언트 컴포넌트에는 `"use client"` 선언 필수
- 인증: 기존 미들웨어가 `/dashboard/*` 전체 보호 중 — 추가 처리 불필요
- toast: `import { toast } from "sonner"` 사용
- 금액 포맷: `new Intl.NumberFormat("ko-KR").format(amount)` + "원"

---

## File Map

| 파일 | 동작 |
|------|------|
| `src/app/(dashboard)/quotes/layout.tsx` | 신규 — 견적서 전용 레이아웃 |
| `src/app/(dashboard)/quotes/page.tsx` | 신규 — 견적서 목록 서버 컴포넌트 |
| `src/app/(dashboard)/quotes/loading.tsx` | 신규 — Skeleton UI |
| `src/components/quotes/QuoteStatusTabs.tsx` | 신규 — 탭 필터 클라이언트 컴포넌트 |
| `src/components/quotes/QuotesTable.tsx` | 신규 — 테이블 + 링크 복사 클라이언트 컴포넌트 |
| `src/components/quotes/QuoteStatusBadge.tsx` | 신규 — 상태 배지 |
| `src/components/quotes/QuoteTableSkeleton.tsx` | 신규 — 테이블 skeleton |

---

### Task 1: QuoteStatusBadge 컴포넌트

**Files:**
- Create: `src/components/quotes/QuoteStatusBadge.tsx`

**Interfaces:**
- Produces: `QuoteStatusBadge({ status: string | null }): JSX.Element`

- [ ] **Step 1: 파일 생성**

```tsx
// src/components/quotes/QuoteStatusBadge.tsx
import { Badge } from "@/components/ui/badge";
import type { QuoteStatus } from "@/types/notion";

const STATUS_STYLES: Record<string, string> = {
  "작성중": "bg-gray-100 text-gray-700 hover:bg-gray-100",
  "발송완료": "bg-blue-100 text-blue-700 hover:bg-blue-100",
  "승인": "bg-green-100 text-green-700 hover:bg-green-100",
  "반려": "bg-red-100 text-red-700 hover:bg-red-100",
  "만료": "bg-orange-100 text-orange-700 hover:bg-orange-100",
};

export function QuoteStatusBadge({ status }: { status: QuoteStatus | string | null }) {
  if (!status) return <Badge variant="outline">-</Badge>;
  const style = STATUS_STYLES[status] ?? "bg-gray-100 text-gray-700 hover:bg-gray-100";
  return <Badge className={style}>{status}</Badge>;
}
```

- [ ] **Step 2: 빌드 타입 검사**

```bash
npx tsc --noEmit
```

예상: 오류 없음

- [ ] **Step 3: 커밋**

```bash
git add src/components/quotes/QuoteStatusBadge.tsx
git commit -m "feat: QuoteStatusBadge 컴포넌트 추가"
```

---

### Task 2: QuoteStatusTabs 컴포넌트

**Files:**
- Create: `src/components/quotes/QuoteStatusTabs.tsx`

**Interfaces:**
- Consumes: 없음 (URL searchParam을 `useSearchParams()`로 직접 읽음)
- Produces: `QuoteStatusTabs(): JSX.Element`

- [ ] **Step 1: 파일 생성**

```tsx
// src/components/quotes/QuoteStatusTabs.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const STATUSES = ["전체", "작성중", "발송완료", "승인", "반려", "만료"] as const;

export function QuoteStatusTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("status") ?? "전체";

  function handleChange(value: string) {
    if (value === "전체") {
      router.push("/dashboard/quotes");
    } else {
      router.push(`/dashboard/quotes?status=${encodeURIComponent(value)}`);
    }
  }

  return (
    <div className="border-b border-border bg-background px-6">
      <Tabs value={current} onValueChange={handleChange}>
        <TabsList className="h-auto rounded-none bg-transparent p-0 gap-0">
          {STATUSES.map((s) => (
            <TabsTrigger
              key={s}
              value={s}
              className="rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              {s}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
```

- [ ] **Step 2: 타입 검사**

```bash
npx tsc --noEmit
```

예상: 오류 없음

- [ ] **Step 3: 커밋**

```bash
git add src/components/quotes/QuoteStatusTabs.tsx
git commit -m "feat: QuoteStatusTabs 컴포넌트 추가"
```

---

### Task 3: QuotesTable 컴포넌트

**Files:**
- Create: `src/components/quotes/QuotesTable.tsx`

**Interfaces:**
- Consumes: `Invoice` from `@/types/notion`, `QuoteStatusBadge` from Task 1, `useCopyToClipboard` from `@/hooks`
- Produces: `QuotesTable({ quotes: Invoice[] }): JSX.Element`

- [ ] **Step 1: 파일 생성**

```tsx
// src/components/quotes/QuotesTable.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Link2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCopyToClipboard } from "@/hooks";
import { QuoteStatusBadge } from "./QuoteStatusBadge";
import type { Invoice } from "@/types/notion";

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatAmount(amount: number | null): string {
  if (amount === null) return "-";
  return new Intl.NumberFormat("ko-KR").format(amount) + "원";
}

export function QuotesTable({ quotes }: { quotes: Invoice[] }) {
  const router = useRouter();
  const { copy } = useCopyToClipboard();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleCopyLink(e: React.MouseEvent, quote: Invoice) {
    e.stopPropagation();

    // 이미 활성 공유 링크가 있는 경우 즉시 복사
    if (quote.shareSlug && quote.isPublic) {
      const origin = window.location.origin;
      await copy(`${origin}/q/${quote.shareSlug}`);
      return;
    }

    // 공유 링크 생성 후 복사
    setLoadingId(quote.id);
    try {
      const res = await fetch(`/api/quotes/${quote.id}/share`, { method: "POST" });
      if (!res.ok) throw new Error("공유 링크 생성 실패");
      const data: { url: string } = await res.json();
      await copy(data.url);
    } catch {
      toast.error("공유 링크 생성에 실패했습니다.");
    } finally {
      setLoadingId(null);
    }
  }

  if (quotes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p className="text-sm">견적서가 없습니다.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>견적서 번호</TableHead>
          <TableHead>클라이언트</TableHead>
          <TableHead>발행일</TableHead>
          <TableHead>유효기한</TableHead>
          <TableHead className="text-right">금액</TableHead>
          <TableHead>상태</TableHead>
          <TableHead className="w-12" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {quotes.map((quote) => (
          <TableRow
            key={quote.id}
            className="cursor-pointer"
            onClick={() => router.push(`/dashboard/quotes/${quote.id}`)}
          >
            <TableCell className="font-medium">{quote.quoteNumber ?? "-"}</TableCell>
            <TableCell>{quote.clientCompany ?? "-"}</TableCell>
            <TableCell>{formatDate(quote.issuedDate)}</TableCell>
            <TableCell>{formatDate(quote.validUntil)}</TableCell>
            <TableCell className="text-right">{formatAmount(quote.total)}</TableCell>
            <TableCell>
              <QuoteStatusBadge status={quote.status} />
            </TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="icon"
                disabled={loadingId === quote.id}
                onClick={(e) => handleCopyLink(e, quote)}
                title="공유 링크 복사"
              >
                {loadingId === quote.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Link2 className="h-4 w-4" />
                )}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

- [ ] **Step 2: 타입 검사**

```bash
npx tsc --noEmit
```

예상: 오류 없음

- [ ] **Step 3: 커밋**

```bash
git add src/components/quotes/QuotesTable.tsx
git commit -m "feat: QuotesTable 컴포넌트 추가 (링크 복사 기능 포함)"
```

---

### Task 4: QuoteTableSkeleton 컴포넌트

**Files:**
- Create: `src/components/quotes/QuoteTableSkeleton.tsx`

**Interfaces:**
- Produces: `QuoteTableSkeleton(): JSX.Element`

- [ ] **Step 1: 파일 생성**

```tsx
// src/components/quotes/QuoteTableSkeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function QuoteTableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>견적서 번호</TableHead>
          <TableHead>클라이언트</TableHead>
          <TableHead>발행일</TableHead>
          <TableHead>유효기한</TableHead>
          <TableHead className="text-right">금액</TableHead>
          <TableHead>상태</TableHead>
          <TableHead className="w-12" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 8 }).map((_, i) => (
          <TableRow key={i}>
            <TableCell><Skeleton className="h-4 w-28" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
            <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
            <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
            <TableCell><Skeleton className="h-8 w-8 rounded" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/components/quotes/QuoteTableSkeleton.tsx
git commit -m "feat: QuoteTableSkeleton 컴포넌트 추가"
```

---

### Task 5: 견적서 전용 레이아웃 + 페이지 + loading

**Files:**
- Create: `src/app/(dashboard)/quotes/layout.tsx`
- Create: `src/app/(dashboard)/quotes/page.tsx`
- Create: `src/app/(dashboard)/quotes/loading.tsx`

**Interfaces:**
- Consumes: `QuoteStatusTabs` (Task 2), `QuotesTable` (Task 3), `QuoteTableSkeleton` (Task 4)
- Consumes: `GET /api/quotes?status=` — 반환값 `{ quotes: Invoice[], nextCursor: string | null, hasMore: boolean }`

- [ ] **Step 1: layout.tsx 생성**

```tsx
// src/app/(dashboard)/quotes/layout.tsx
import { Suspense } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { HeaderSkeleton } from "@/components/layout/HeaderSkeleton";
import { SidebarSkeleton } from "@/components/layout/SidebarSkeleton";
import { QuoteStatusTabs } from "@/components/quotes/QuoteStatusTabs";

export default function QuotesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-background">
      <Suspense fallback={<SidebarSkeleton />}>
        <Sidebar />
      </Suspense>
      <div className="flex flex-1 flex-col overflow-hidden">
        <Suspense fallback={<HeaderSkeleton />}>
          <Header />
        </Suspense>
        <QuoteStatusTabs />
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: page.tsx 생성**

Next.js 16에서 `searchParams`는 `Promise<{[key: string]: string | string[] | undefined}>` 타입.

```tsx
// src/app/(dashboard)/quotes/page.tsx
import { PageHeader } from "@/components/common/PageHeader";
import { QuotesTable } from "@/components/quotes/QuotesTable";
import type { Invoice } from "@/types/notion";

interface QuotesPageProps {
  searchParams: Promise<{ status?: string }>;
}

async function fetchQuotes(status?: string): Promise<Invoice[]> {
  const baseUrl = process.env.AUTH_URL ?? "http://localhost:3000";
  const url = status
    ? `${baseUrl}/api/quotes?status=${encodeURIComponent(status)}`
    : `${baseUrl}/api/quotes`;

  // 서버 컴포넌트에서 내부 API 호출 — 쿠키 전달 필요
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const res = await fetch(url, {
    headers: { Cookie: cookieHeader },
    cache: "no-store",
  });

  if (!res.ok) return [];
  const data: { quotes: Invoice[] } = await res.json();
  return data.quotes;
}

export default async function QuotesPage({ searchParams }: QuotesPageProps) {
  const { status } = await searchParams;
  const quotes = await fetchQuotes(status);

  return (
    <div className="space-y-4">
      <PageHeader
        title="견적서 목록"
        description="Notion 데이터베이스와 연동된 견적서를 관리합니다."
      />
      <div className="rounded-lg border bg-card">
        <QuotesTable quotes={quotes} />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: loading.tsx 생성**

```tsx
// src/app/(dashboard)/quotes/loading.tsx
import { QuoteTableSkeleton } from "@/components/quotes/QuoteTableSkeleton";

export default function QuotesLoading() {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="h-7 w-32 rounded bg-muted animate-pulse" />
        <div className="h-4 w-64 rounded bg-muted animate-pulse" />
      </div>
      <div className="rounded-lg border bg-card">
        <QuoteTableSkeleton />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 타입 검사**

```bash
npx tsc --noEmit
```

예상: 오류 없음

- [ ] **Step 5: 개발 서버 실행 후 수동 검증**

```bash
npm run dev
```

브라우저에서 확인:
1. `http://localhost:3000/dashboard/quotes` → 견적서 목록 테이블 렌더링 확인
2. 탭 클릭 (예: "승인") → URL `?status=승인` 변경 + 해당 상태 견적서만 표시 확인
3. "전체" 탭 → URL에 status 없음 + 전체 목록 표시 확인
4. 테이블 행 클릭 → `/dashboard/quotes/[id]` 이동 시도 (404 무방)
5. 링크 복사 버튼 클릭 → 공유 링크 생성/복사 + 토스트 표시 확인

- [ ] **Step 6: 커밋**

```bash
git add src/app/(dashboard)/quotes/layout.tsx \
        src/app/(dashboard)/quotes/page.tsx \
        src/app/(dashboard)/quotes/loading.tsx
git commit -m "feat: 견적서 전용 레이아웃 + 목록 페이지 + skeleton loading 구현"
```

---

### Task 6: ROADMAP 업데이트

**Files:**
- Modify: `docs/ROADMAP.md`

- [ ] **Step 1: ROADMAP.md V1.1 섹션을 완료 상태로 업데이트**

`docs/ROADMAP.md`의 현재 상태 표에 아래 행을 추가하고, V1.1 섹션에 완료 표시:

```markdown
| 견적서 관리 전용 레이아웃 (탭 필터 + 테이블) | 완료 |
| 목록에서 공유 링크 복사 | 완료 |
```

V1.1 섹션 상단에 추가:
```markdown
> **상태**: 완료 (2026-07-07)
```

- [ ] **Step 2: 커밋**

```bash
git add docs/ROADMAP.md
git commit -m "docs: V1.1 관리자 대시보드 고도화 완료 표시"
```
