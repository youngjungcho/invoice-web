import { notFound } from "next/navigation";
import { findBySlug, parseQuotePage, withRateLimit } from "@/lib/notion";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { createHash } from "node:crypto";
import { unstable_cache } from "next/cache";
import { QuoteView } from "./QuoteView";
import type { Metadata } from "next";
import type { QuoteData } from "@/lib/notion";

interface Props {
  params: Promise<{ slug: string }>;
}

const SALT = process.env.IP_HASH_SALT ?? "default-salt-change-in-production";

function hashIp(ip: string): string {
  return createHash("sha256").update(`${SALT}:${ip}`).digest("hex");
}

function getCachedQuote(slug: string) {
  return unstable_cache(
    async (): Promise<QuoteData | null> => {
      const page = await withRateLimit(() => findBySlug(slug));
      if (!page) return null;
      return parseQuotePage(page);
    },
    [`public-quote-${slug}`],
    { revalidate: 60, tags: [`quote-${slug}`] }
  )();
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

export default async function PublicQuotePage({ params }: Props) {
  const { slug } = await params;

  const quote = await getCachedQuote(slug);

  if (!quote) {
    notFound();
  }

  // 만료 확인
  const isExpired =
    quote.validUntil !== null && new Date(quote.validUntil) < new Date();

  // 조회 로그 기록 (비동기, 실패해도 렌더링에 영향 없음)
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

  return <QuoteView quote={quote} isExpired={isExpired} />;
}
