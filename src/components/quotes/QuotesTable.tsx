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
