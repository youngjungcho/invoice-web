import { Suspense } from "react";
import { notFound } from "next/navigation";
import {
  findBySlug,
  parseQuotePage,
  parseQuoteItemPage,
  queryItemsByQuoteId,
  withRateLimit,
} from "@/lib/notion";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { createHash } from "node:crypto";
import { cacheTag } from "next/cache";
import { QuoteView } from "./QuoteView";
import type { Metadata } from "next";
import type { QuoteData } from "@/lib/notion";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ print?: string }>;
}

const SALT = process.env.IP_HASH_SALT ?? "default-salt-change-in-production";

function hashIp(ip: string): string {
  return createHash("sha256").update(`${SALT}:${ip}`).digest("hex");
}

async function getCachedQuote(slug: string): Promise<QuoteData | null> {
  "use cache";
  cacheTag(`quote-${slug}`);

  const page = await withRateLimit(() => findBySlug(slug));
  if (!page) return null;
  const quote = parseQuotePage(page);
  const itemPages = await withRateLimit(() => queryItemsByQuoteId(page.id));
  quote.items = itemPages.map(parseQuoteItemPage);
  return quote;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const quote = await getCachedQuote(slug);

  if (!quote) {
    return { title: "견적서를 찾을 수 없습니다" };
  }

  return {
    title: `${quote.quoteNumber ?? "견적서"} — ${quote.clientCompany ?? ""}`,
    robots: { index: false, follow: false },
  };
}

// 조회 로그 기록 컴포넌트 — 동적 데이터(headers)를 Suspense 안에서 처리
async function ViewLogger({ slug }: { slug: string }) {
  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headersList.get("x-real-ip") ??
    "unknown";
  const userAgent = headersList.get("user-agent") ?? "";

  db.quoteViewLog
    .create({
      data: {
        slug,
        ipHash: hashIp(ip),
        userAgent,
      },
    })
    .catch((err: unknown) => console.error("[QuoteViewLog]", err));

  return null;
}

export default async function PublicQuotePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { print } = await searchParams;

  const quote = await getCachedQuote(slug);

  if (!quote) {
    notFound();
  }

  // 만료 확인
  const isExpired =
    quote.validUntil !== null && new Date(quote.validUntil) < new Date();

  return (
    <>
      {/* 조회 로그는 Suspense로 감싸 동적 처리 */}
      <Suspense fallback={null}>
        <ViewLogger slug={slug} />
      </Suspense>
      <QuoteView quote={quote} isExpired={isExpired} autoPrint={print === "1"} />
    </>
  );
}
