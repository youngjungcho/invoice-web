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
