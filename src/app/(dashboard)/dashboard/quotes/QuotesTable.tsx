"use client";

import { useEffect, useState, useRef, useReducer } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/common/EmptyState";
import { useCopyToClipboard } from "@/hooks";
import { FileText, Link2, ExternalLink, RefreshCw, Filter } from "lucide-react";
import type { QuoteData } from "@/lib/notion";

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  발송완료: "default",
  승인: "default",
  작성중: "secondary",
  반려: "destructive",
  만료: "outline",
};

const STATUS_FILTER_OPTIONS = ["전체", "작성중", "발송완료", "승인", "반려", "만료"] as const;

type StatusFilter = (typeof STATUS_FILTER_OPTIONS)[number];

function formatKRW(value: number | null): string {
  if (value === null) return "-";
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
  }).format(value);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("ko-KR");
}

type FetchState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "success"; data: QuoteData[]; nextCursor: string | null; hasMore: boolean };

function fetchReducer(_prev: FetchState, action: FetchState): FetchState {
  return action;
}

type QuotesResponse = { quotes: QuoteData[]; nextCursor: string | null; hasMore: boolean };

export function QuotesTable() {
  const [state, dispatch] = useReducer(fetchReducer, { status: "loading" });
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("전체");
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const { copy } = useCopyToClipboard();
  const toastRef = useRef(toast);

  function buildUrl(cursor?: string) {
    const params = new URLSearchParams();
    if (statusFilter !== "전체") params.set("status", statusFilter);
    if (cursor) params.set("cursor", cursor);
    const qs = params.toString();
    return `/api/quotes${qs ? `?${qs}` : ""}`;
  }

  useEffect(() => {
    const controller = new AbortController();
    dispatch({ status: "loading" });

    fetch(buildUrl(), { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error("견적서 목록을 불러오지 못했습니다.");
        return res.json() as Promise<QuotesResponse>;
      })
      .then(({ quotes, nextCursor, hasMore }) => {
        dispatch({ status: "success", data: quotes, nextCursor, hasMore });
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        toastRef.current.error("견적서 목록을 불러오지 못했습니다.");
        dispatch({ status: "error" });
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, statusFilter]);

  async function handleLoadMore() {
    if (state.status !== "success" || !state.nextCursor) return;
    setIsLoadingMore(true);
    try {
      const res = await fetch(buildUrl(state.nextCursor));
      if (!res.ok) throw new Error();
      const { quotes, nextCursor, hasMore } = await res.json() as QuotesResponse;
      dispatch({
        status: "success",
        data: [...state.data, ...quotes],
        nextCursor,
        hasMore,
      });
    } catch {
      toast.error("추가 견적서를 불러오지 못했습니다.");
    } finally {
      setIsLoadingMore(false);
    }
  }

  function handleRefresh() {
    setRefreshKey((k) => k + 1);
  }

  const loading = state.status === "loading";
  const quotes = state.status === "success" ? state.data : [];
  const hasMore = state.status === "success" ? state.hasMore : false;

  async function handleShareLink(quote: QuoteData) {
    setSharingId(quote.id);
    try {
      const res = await fetch(`/api/quotes/${quote.id}/share`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "공유 링크 생성에 실패했습니다.");
      }
      const data: { slug: string; url: string } = await res.json();
      await copy(data.url);
      toast.success("공유 링크가 클립보드에 복사되었습니다.");
      handleRefresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "오류가 발생했습니다.");
    } finally {
      setSharingId(null);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>견적서</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-md" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!loading && quotes.length === 0 && statusFilter === "전체") {
    return (
      <EmptyState
        icon={FileText}
        title="견적서가 없습니다"
        description="Notion 데이터베이스에 견적서를 추가하고 환경변수를 확인하세요."
      >
        <Button variant="outline" onClick={handleRefresh}>
          <RefreshCw className="mr-2 h-4 w-4" />
          새로고침
        </Button>
      </EmptyState>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* 좌측: 제목 + 건수 표시 */}
        <div className="flex items-center gap-2">
          <CardTitle>견적서</CardTitle>
          <Badge variant="secondary" className="tabular-nums">
            {quotes.length}건{hasMore && "+"}
          </Badge>
        </div>

        {/* 우측: 상태 필터 + 새로고침 */}
        <div className="flex items-center gap-2">
          {/* 상태 필터 드롭다운 */}
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            <Select
              value={statusFilter}
              onValueChange={(val) => setStatusFilter(val as StatusFilter)}
            >
              <SelectTrigger
                className="h-8 w-28 text-sm"
                aria-label="견적서 상태 필터"
              >
                <SelectValue placeholder="전체" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTER_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" size="sm" onClick={handleRefresh} aria-label="목록 새로고침">
            <RefreshCw className="mr-2 h-3 w-3" />
            새로고침
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* 필터 결과가 없을 때 인라인 안내 */}
        {!loading && quotes.length === 0 && statusFilter !== "all" && (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <Filter className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">
              &ldquo;{statusFilter}&rdquo; 상태의 견적서가 없습니다.
            </p>
            <button
              onClick={() => setStatusFilter("전체")}
              className="text-xs text-primary underline-offset-4 hover:underline"
            >
              전체 보기
            </button>
          </div>
        )}

        {quotes.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">견적서 번호</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">클라이언트</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">발행일</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">유효기한</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">총액</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">상태</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">액션</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((quote) => (
                <tr
                  key={quote.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3 font-medium">
                    <Link
                      href={`/dashboard/quotes/${quote.id}`}
                      className="text-primary hover:underline"
                    >
                      {quote.quoteNumber ?? "-"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {quote.clientCompany ?? quote.clientContactName ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(quote.issuedDate)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(quote.validUntil)}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatKRW(quote.total)}</td>
                  <td className="px-4 py-3">
                    {quote.status ? (
                      <Badge variant={STATUS_VARIANTS[quote.status] ?? "secondary"}>
                        {quote.status}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/dashboard/quotes/${quote.id}`}>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleShareLink(quote)}
                        disabled={sharingId === quote.id}
                        title={quote.shareSlug ? "공유 링크 복사" : "공유 링크 생성"}
                      >
                        <Link2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}

        {/* 더 보기 버튼 */}
        {hasMore && (
          <div className="flex justify-center border-t border-border py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadMore}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? (
                <>
                  <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                  불러오는 중...
                </>
              ) : (
                "더 보기"
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
