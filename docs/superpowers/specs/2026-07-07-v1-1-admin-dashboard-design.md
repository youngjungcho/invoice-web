# V1.1 관리자 대시보드 고도화 — 설계 문서

**날짜**: 2026-07-07  
**상태**: 승인됨

---

## 목표

견적서 관리 전용 레이아웃과 UX를 구현한다. 기존 대시보드 레이아웃을 공유하는 대신, 견적서 섹션에 특화된 레이아웃(사이드바 + 헤더 + 상단 탭 필터)을 분리한다.

---

## 아키텍처

```
src/app/(dashboard)/
  quotes/
    layout.tsx        ← 견적서 전용 레이아웃 (사이드바 + 헤더 + 탭 필터 바)
    page.tsx          ← 견적서 목록 서버 컴포넌트
    loading.tsx       ← Skeleton UI
    [id]/
      page.tsx        ← 견적서 상세 (추후)

src/components/quotes/
  QuotesTable.tsx     ← 클라이언트 컴포넌트 (테이블 + 링크 복사)
  QuoteStatusTabs.tsx ← 클라이언트 컴포넌트 (탭 필터, URL searchParam 기반)
  QuoteStatusBadge.tsx ← 상태 배지
```

---

## 데이터 흐름

```
URL: /dashboard/quotes?status=작성중
  → page.tsx (서버 컴포넌트)
  → GET /api/quotes?status=작성중
  → Notion DB 쿼리 (기존 API 재사용)
  → QuotesTable 렌더링
```

`status` searchParam이 없으면 전체 목록 조회.

---

## 컴포넌트 명세

### QuotesLayout (`quotes/layout.tsx`)
- 기존 DashboardLayout과 동일한 사이드바 + 헤더 구조
- 헤더 아래 `QuoteStatusTabs` 탭 바 삽입
- `children`은 탭 바 아래 콘텐츠 영역에 렌더링

### QuoteStatusTabs (`components/quotes/QuoteStatusTabs.tsx`)
- shadcn/ui `Tabs` 컴포넌트 사용
- 탭 목록: `전체 / 작성중 / 발송완료 / 승인 / 반려 / 만료`
- URL searchParam `?status=` 기반으로 현재 탭 결정
- 탭 클릭 시 `useRouter().push`로 URL 변경 (페이지 새로고침 없이)
- `useSearchParams()`로 현재 활성 탭 동기화

### QuotesTable (`components/quotes/QuotesTable.tsx`)
- 클라이언트 컴포넌트
- 컬럼: 견적서 번호 / 클라이언트 / 발행일 / 유효기한 / 금액 / 상태 / 액션
- 행 클릭 시 `/dashboard/quotes/[id]`로 이동
- 링크 복사 버튼 (Link2 아이콘):
  - `quote.shareSlug && quote.isPublic` → 즉시 클립보드 복사
  - 그 외 → `POST /api/quotes/[id]/share` 호출 후 복사
  - 로딩 중 버튼 비활성화
  - `useCopyToClipboard()` 훅 재사용
  - 복사 성공/실패 시 sonner 토스트

### QuoteStatusBadge (`components/quotes/QuoteStatusBadge.tsx`)
- 상태값에 따라 색상 다른 Badge 렌더링
- 상태 → 색상 매핑: 작성중(gray) / 발송완료(blue) / 승인(green) / 반려(red) / 만료(orange)

### QuotesPage (`quotes/page.tsx`)
- 서버 컴포넌트
- `searchParams.status`로 API 호출
- 결과를 `QuotesTable`에 props로 전달
- `Suspense` + `loading.tsx`로 skeleton 처리

---

## API

기존 `GET /api/quotes?status=` 재사용. 변경 없음.

링크 복사용 `POST /api/quotes/[id]/share` — 기존 구현 여부 확인 후 없으면 신규 구현.

---

## 인수 기준

1. `/dashboard/quotes` 접근 시 견적서 전용 레이아웃 렌더링
2. 탭 클릭 시 URL `?status=` 변경 + 해당 상태 견적서만 표시
3. 로딩 중 Skeleton UI 표시
4. 링크 복사 버튼: 공유 중이면 즉시 복사, 아니면 생성 후 복사
5. 복사 성공/실패 sonner 토스트 표시
6. 미인증 접근 시 `/login` 리다이렉트 (기존 미들웨어)
