"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Printer, AlertTriangle } from "lucide-react";
import type { QuoteData, QuoteItemData } from "@/lib/notion";

interface Props {
  quote: QuoteData;
  isExpired: boolean;
  autoPrint?: boolean;
}

function formatKRW(value: number | null): string {
  if (value === null) return "-";
  return new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW" }).format(value);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function QuoteView({ quote, isExpired, autoPrint }: Props) {
  useEffect(() => {
    if (autoPrint) {
      const timer = setTimeout(() => window.print(), 500);
      return () => clearTimeout(timer);
    }
  }, [autoPrint]);

  function handlePrint() {
    window.print();
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* 인쇄 시 숨겨지는 헤더 */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm px-6 py-4 print:hidden sticky top-0 z-10">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-foreground tracking-tight">견적서</span>
            {isExpired && (
              <Badge variant="destructive" className="flex items-center gap-1 text-xs">
                <AlertTriangle className="h-3 w-3" />
                만료됨
              </Badge>
            )}
          </div>
          <Button onClick={handlePrint} size="sm" className="print:hidden gap-2">
            <Printer className="h-4 w-4" />
            PDF 저장
          </Button>
        </div>
      </header>

      {/* 만료 안내 */}
      {isExpired && (
        <div className="mx-auto max-w-3xl px-6 pt-6 print:hidden">
          <div className="flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-destructive">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">견적서 유효기한이 만료되었습니다.</p>
              <p className="text-sm opacity-80">
                유효기한: {formatDate(quote.validUntil)} — 최신 견적서를 담당자에게 요청하세요.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 견적서 본문 */}
      <main className="mx-auto max-w-3xl px-6 py-8 print:py-0 print:px-0">
        <div className="rounded-2xl border border-border bg-card p-10 shadow-md print:border-0 print:shadow-none print:rounded-none print:p-0">

          {/* 상단: 제목 + 메타 */}
          <div className="mb-10 flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground">견적서</h1>
              <p className="mt-2 text-base text-muted-foreground font-medium">
                {quote.quoteNumber ?? "-"}
              </p>
            </div>
            <div className="text-right text-sm text-muted-foreground space-y-1">
              <p><span className="font-medium text-foreground">발행일</span> {formatDate(quote.issuedDate)}</p>
              <p><span className="font-medium text-foreground">유효기한</span> {formatDate(quote.validUntil)}</p>
            </div>
          </div>

          <Separator className="mb-10" />

          {/* 클라이언트 정보 */}
          <div className="mb-10 grid grid-cols-2 gap-10">
            <div>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                수신
              </h2>
              <p className="text-lg font-semibold text-foreground">{quote.clientCompany ?? "-"}</p>
              {quote.clientContactName && (
                <p className="mt-1 text-sm text-muted-foreground">{quote.clientContactName} 귀중</p>
              )}
              {quote.clientEmail && (
                <p className="text-sm text-muted-foreground">{quote.clientEmail}</p>
              )}
            </div>
            <div>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                프로젝트
              </h2>
              <p className="text-lg font-semibold text-foreground">{quote.projectName ?? "-"}</p>
            </div>
          </div>

          {/* 견적 항목 */}
          {quote.items && quote.items.length > 0 && (
            <div className="mb-10 rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/60">
                    <th className="px-5 py-4 text-left font-semibold text-muted-foreground">항목명</th>
                    <th className="px-5 py-4 text-left font-semibold text-muted-foreground">설명</th>
                    <th className="px-5 py-4 text-right font-semibold text-muted-foreground">수량</th>
                    <th className="px-5 py-4 text-right font-semibold text-muted-foreground">단가</th>
                    <th className="px-5 py-4 text-right font-semibold text-muted-foreground">금액</th>
                  </tr>
                </thead>
                <tbody>
                  {quote.items.map((item: QuoteItemData) => (
                    <tr key={item.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-4 font-medium">{item.name ?? "-"}</td>
                      <td className="px-5 py-4 text-muted-foreground">{item.description ?? "-"}</td>
                      <td className="px-5 py-4 text-right tabular-nums">{item.quantity ?? "-"}</td>
                      <td className="px-5 py-4 text-right tabular-nums">{formatKRW(item.unitPrice)}</td>
                      <td className="px-5 py-4 text-right font-semibold tabular-nums">{formatKRW(item.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 금액 요약 */}
          <div className="mb-10 rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-border">
                  <td className="px-5 py-4 text-muted-foreground">공급가액</td>
                  <td className="px-5 py-4 text-right tabular-nums">{formatKRW(quote.subtotal)}</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-5 py-4 text-muted-foreground">부가세 (VAT 10%)</td>
                  <td className="px-5 py-4 text-right tabular-nums">{formatKRW(quote.vat)}</td>
                </tr>
                <tr className="bg-primary/8">
                  <td className="px-5 py-5 font-bold text-foreground text-base">합계</td>
                  <td className="px-5 py-5 text-right text-xl font-bold text-primary tabular-nums">
                    {formatKRW(quote.total)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 결제 조건 */}
          {quote.paymentTerms && (
            <div className="mb-6">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                결제 조건
              </h2>
              <p className="text-sm text-foreground leading-relaxed">{quote.paymentTerms}</p>
            </div>
          )}

          {/* 비고 */}
          {quote.notes && (
            <div className="mb-6">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                비고
              </h2>
              <p className="text-sm text-foreground leading-relaxed">{quote.notes}</p>
            </div>
          )}

          <Separator className="my-8" />

          {/* 푸터 */}
          <footer className="text-xs text-muted-foreground text-center leading-relaxed">
            <p>
              본 견적서는 발행일로부터 {formatDate(quote.validUntil)}까지 유효합니다.
              문의사항은 담당자에게 연락하세요.
            </p>
          </footer>
        </div>

        {/* 인쇄 안내 (화면에만 표시) */}
        <div className="mt-8 text-center text-sm text-muted-foreground print:hidden">
          <p>
            &quot;PDF 저장&quot; 버튼을 클릭한 후 인쇄 다이얼로그에서{" "}
            <strong>PDF로 저장</strong>을 선택하세요.
          </p>
        </div>
      </main>
    </div>
  );
}
