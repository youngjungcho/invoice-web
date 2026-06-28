import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { notion, parseQuotePage } from "@/lib/notion";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SharePanel } from "./SharePanel";
import type { Metadata } from "next";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

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

export default async function QuoteDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;

  let page: PageObjectResponse;
  try {
    page = await notion.pages.retrieve({ page_id: id }) as PageObjectResponse;
  } catch {
    notFound();
  }

  const quote = parseQuotePage(page);

  return (
    <div className="space-y-6">
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

        <div>
          <SharePanel
            quoteId={quote.id}
            slug={quote.shareSlug}
            isPublic={quote.isPublic ?? false}
            createdBy={session.user.id ?? ""}
          />
        </div>
      </div>
    </div>
  );
}
