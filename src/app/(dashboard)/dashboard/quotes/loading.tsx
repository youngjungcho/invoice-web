import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

/**
 * 견적서 목록 페이지 로딩 스켈레톤 UI
 * — QuotesTable의 실제 레이아웃을 그대로 반영:
 *   1) PageHeader 영역 (제목 + 설명)
 *   2) 카드 헤더: 제목 배지 + 필터 드롭다운 + 새로고침 버튼
 *   3) 테이블 헤더 행 7개 컬럼
 *   4) 데이터 행 6개 (실제 평균 목록 길이 기준)
 */
export default function QuotesLoading() {
  return (
    <div className="space-y-6">
      {/* PageHeader 스켈레톤 */}
      <div className="space-y-1.5">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-4 w-80" />
      </div>

      <Card>
        {/* CardHeader: 제목 배지 + 필터/새로고침 버튼 영역 */}
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* 좌측: 제목 + 건수 배지 */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-10 rounded-full" />
          </div>

          {/* 우측: 필터 아이콘 + 드롭다운 + 새로고침 버튼 */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-3.5 w-3.5 rounded-sm" />
            <Skeleton className="h-8 w-32 rounded-md" />
            <Skeleton className="h-8 w-24 rounded-md" />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-busy="true" aria-label="견적서 목록 로딩 중">
              {/* 테이블 헤더 행 스켈레톤 */}
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {/* 7개 컬럼 헤더 — 각 너비는 실제 컬럼 비율 반영 */}
                  {[
                    "w-24", // 견적서 번호
                    "w-28", // 클라이언트
                    "w-20", // 발행일
                    "w-20", // 유효기한
                    "w-24", // 총액 (우측 정렬)
                    "w-16", // 상태
                    "w-16", // 액션 (우측 정렬)
                  ].map((width, i) => (
                    <th key={i} className="px-4 py-3">
                      <Skeleton className={`h-4 ${width}`} />
                    </th>
                  ))}
                </tr>
              </thead>

              {/* 데이터 행 스켈레톤 6개 */}
              <tbody>
                {Array.from({ length: 6 }).map((_, rowIdx) => (
                  <tr
                    key={rowIdx}
                    className="border-b border-border last:border-0"
                  >
                    {/* 견적서 번호 — 링크처럼 보이도록 약간 짧게 */}
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-20" />
                    </td>
                    {/* 클라이언트 */}
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    {/* 발행일 */}
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-16" />
                    </td>
                    {/* 유효기한 */}
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-16" />
                    </td>
                    {/* 총액 — 우측 정렬 */}
                    <td className="px-4 py-3 text-right">
                      <Skeleton className="ml-auto h-4 w-20" />
                    </td>
                    {/* 상태 배지 */}
                    <td className="px-4 py-3">
                      <Skeleton className="h-5 w-14 rounded-full" />
                    </td>
                    {/* 액션 버튼 2개 */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Skeleton className="h-7 w-7 rounded-md" />
                        <Skeleton className="h-7 w-7 rounded-md" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
