import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import {
  notion,
  parseQuotePage,
  parseQuoteItemPage,
  queryItemsByQuoteId,
  withRateLimit,
} from "@/lib/notion";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/common/StatCard";
import { SharePanel } from "./SharePanel";
import { Eye } from "lucide-react";
import type { Metadata } from "next";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import type { QuoteData } from "@/lib/notion";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const page = await notion.pages.retrieve({ page_id: id }) as PageObjectResponse;
    const quote = parseQuotePage(page);
    return { title: `${quote.quoteNumber ?? "견적서"} 상세` };
  } catch {
    return { title: "견적서 상세" };
  }
}

function formatKRW(value: number | null): string {
  if (value === null) return "-";
  return new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW" }).format(value);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("ko-KR");
}

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  발송완료: "default",
  승인: "default",
  작성중: "secondary",
  반려: "destructive",
  만료: "outline",
};

async function QuoteDetailContent({ id }: { id: string }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  let page: PageObjectResponse;
  try {
    page = await notion.pages.retrieve({ page_id: id }) as PageObjectResponse;
  } catch {
    notFound();
  }

  const quote = parseQuotePage(page);
  const [itemPages, viewCount] = await Promise.all([
    withRateLimit(() => queryItemsByQuoteId(id)).catch(() => []),
    quote.shareSlug
      ? db.quoteViewLog.count({ where: { slug: quote.shareSlug } })
      : Promise.resolve(0),
  ]);
  quote.items = itemPages.map(parseQuoteItemPage);

  return <QuoteDetailView quote={quote} userId={session.user.id ?? ""} viewCount={viewCount} />;
}

function QuoteDetailView({ quote, userId, viewCount }: { quote: QuoteData; userId: string; viewCount: number }) {
  return (
    <>
      <PageHeader
        title={quote.quoteNumber ?? "견적서 상세"}
        description={`${quote.clientCompany ?? quote.clientContactName ?? "클라이언트"} · 발행일 ${formatDate(quote.issuedDate)}`}
      >
        {quote.status && (
          <Badge variant={STATUS_VARIANTS[quote.status] ?? "secondary"} className="text-sm px-3 py-1">
            {quote.status}
          </Badge>
        )}
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>견적서 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                <div>
                  <dt className="text-muted-foreground">프로젝트명</dt>
                  <dd className="mt-1 font-medium">{quote.projectName ?? "-"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">클라이언트 회사</dt>
                  <dd className="mt-1 font-medium">{quote.clientCompany ?? "-"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">담당자</dt>
                  <dd className="mt-1 font-medium">{quote.clientContactName ?? "-"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">이메일</dt>
                  <dd className="mt-1 font-medium">{quote.clientEmail ?? "-"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">발행일</dt>
                  <dd className="mt-1 font-medium">{formatDate(quote.issuedDate)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">유효기한</dt>
                  <dd className="mt-1 font-medium">{formatDate(quote.validUntil)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {quote.items && quote.items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>견적 항목</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">항목명</th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">설명</th>
                        <th className="px-4 py-3 text-right font-medium text-muted-foreground">수량</th>
                        <th className="px-4 py-3 text-right font-medium text-muted-foreground">단가</th>
                        <th className="px-4 py-3 text-right font-medium text-muted-foreground">금액</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quote.items.map((item) => (
                        <tr key={item.id} className="border-b border-border last:border-0">
                          <td className="px-4 py-3 font-medium">{item.name ?? "-"}</td>
                          <td className="px-4 py-3 text-muted-foreground">{item.description ?? "-"}</td>
                          <td className="px-4 py-3 text-right">{item.quantity ?? "-"}</td>
                          <td className="px-4 py-3 text-right">{formatKRW(item.unitPrice)}</td>
                          <td className="px-4 py-3 text-right font-medium">{formatKRW(item.lineTotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>금액 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">공급가액</dt>
                  <dd className="font-medium">{formatKRW(quote.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">부가세 (VAT 10%)</dt>
                  <dd className="font-medium">{formatKRW(quote.vat)}</dd>
                </div>
                <div className="flex justify-between border-t border-border pt-3">
                  <dt className="font-semibold">합계</dt>
                  <dd className="text-lg font-bold text-primary">{formatKRW(quote.total)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {(quote.paymentTerms || quote.notes) && (
            <Card>
              <CardHeader>
                <CardTitle>결제 조건 및 비고</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {quote.paymentTerms && (
                  <div>
                    <CardDescription className="mb-1">결제 조건</CardDescription>
                    <p className="text-foreground">{quote.paymentTerms}</p>
                  </div>
                )}
                {quote.notes && (
                  <div>
                    <CardDescription className="mb-1">비고</CardDescription>
                    <p className="text-foreground">{quote.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <StatCard
            title="조회 수"
            value={viewCount.toLocaleString("ko-KR")}
            icon={Eye}
          />
          <SharePanel
            quoteId={quote.id}
            slug={quote.shareSlug}
            isPublic={quote.isPublic ?? false}
            createdBy={userId}
          />
        </div>
      </div>
    </>
  );
}

function QuoteDetailSkeleton() {
  return (
    <>
      <div className="space-y-1">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3 mt-6">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    </>
  );
}

export default async function QuoteDetailPage({ params }: Props) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <Suspense fallback={<QuoteDetailSkeleton />}>
        <QuoteDetailContent id={id} />
      </Suspense>
    </div>
  );
}
