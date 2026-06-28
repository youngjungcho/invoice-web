"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Printer, AlertTriangle } from "lucide-react";
import type { QuoteData } from "@/lib/notion";

interface Props {
  quote: QuoteData;
  isExpired: boolean;
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

export function QuoteView({ quote, isExpired }: Props) {
  function handlePrint() {
    window.print();
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 인쇄 시 숨겨지는 헤더 */}
      <header className="border-b border-border bg-card px-6 py-4 print:hidden">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div>
            <span className="text-lg font-bold text-foreground">견적서</span>
          </div>
          <div className="flex items-center gap-3">
            {isExpired && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                만료됨
              </Badge>
            )}
            <Button onClick={handlePrint} className="print:hidden">
              <Printer className="mr-2 h-4 w-4" />
              PDF 저장
            </Button>
          </div>
        </div>
      </header>

      {/* 만료 안내 */}
      {isExpired && (
        <div className="mx-auto max-w-4xl px-6 pt-6 print:hidden">
          <div className="flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-destructive">
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
      <main className="mx-auto max-w-4xl px-6 py-8 print:py-0 print:px-0">
        <div className="rounded-xl border border-border bg-card p-8 shadow-sm print:border-0 print:shadow-none print:rounded-none">
          {/* 상단: 제목 + 메타 */}
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">견적서</h1>
              <p className="mt-1 text-muted-foreground">
                {quote.quoteNumber ?? "-"}
              </p>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <p>발행일: {formatDate(quote.issuedDate)}</p>
              <p>유효기한: {formatDate(quote.validUntil)}</p>
            </div>
          </div>

          <Separator className="mb-8" />

          {/* 클라이언트 정보 */}
          <div className="mb-8 grid grid-cols-2 gap-8">
            <div>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                수신
              </h2>
              <p className="font-semibold text-foreground">{quote.clientCompany ?? "-"}</p>
              {quote.clientContactName && (
                <p className="text-sm text-muted-foreground">{quote.clientContactName} 귀중</p>
              )}
              {quote.clientEmail && (
                <p className="text-sm text-muted-foreground">{quote.clientEmail}</p>
              )}
            </div>
            <div>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                프로젝트
              </h2>
              <p className="font-semibold text-foreground">{quote.projectName ?? "-"}</p>
            </div>
          </div>

          {/* 금액 요약 */}
          <div className="mb-8 rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">항목</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">금액</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-border">
                  <td className="px-4 py-3 text-muted-foreground">공급가액</td>
                  <td className="px-4 py-3 text-right">{formatKRW(quote.subtotal)}</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="px-4 py-3 text-muted-foreground">부가세 (VAT 10%)</td>
                  <td className="px-4 py-3 text-right">{formatKRW(quote.vat)}</td>
                </tr>
                <tr className="border-t border-border bg-primary/5">
                  <td className="px-4 py-3 font-semibold text-foreground">합계</td>
                  <td className="px-4 py-3 text-right text-lg font-bold text-primary">
                    {formatKRW(quote.total)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 결제 조건 */}
          {quote.paymentTerms && (
            <div className="mb-6">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                결제 조건
              </h2>
              <p className="text-sm text-foreground">{quote.paymentTerms}</p>
            </div>
          )}

          {/* 비고 */}
          {quote.notes && (
            <div className="mb-6">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                비고
              </h2>
              <p className="text-sm text-foreground">{quote.notes}</p>
            </div>
          )}

          <Separator className="my-6" />

          {/* 푸터 */}
          <footer className="text-xs text-muted-foreground">
            <p>
              본 견적서는 발행일로부터 {formatDate(quote.validUntil)}까지 유효합니다.
              문의사항은 담당자에게 연락하세요.
            </p>
          </footer>
        </div>

        {/* 인쇄 안내 (화면에만 표시) */}
        <div className="mt-6 text-center text-sm text-muted-foreground print:hidden">
          <p>
            &quot;PDF 저장&quot; 버튼을 클릭한 후 인쇄 다이얼로그에서{" "}
            <strong>PDF로 저장</strong>을 선택하세요.
          </p>
        </div>
      </main>
    </div>
  );
}
