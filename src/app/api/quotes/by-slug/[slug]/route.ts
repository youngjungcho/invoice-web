import { NextResponse } from "next/server";
import { findBySlug, parseQuotePage, withRateLimit } from "@/lib/notion";
import { cacheTag } from "next/cache";

interface Params {
  params: Promise<{ slug: string }>;
}

async function getCachedQuote(slug: string) {
  "use cache";
  cacheTag(`quote-${slug}`);

  const page = await withRateLimit(() => findBySlug(slug));
  if (!page) return null;
  return parseQuotePage(page);
}

export async function GET(_req: Request, { params }: Params): Promise<NextResponse> {
  const { slug } = await params;

  try {
    const quote = await getCachedQuote(slug);
    if (!quote) {
      return NextResponse.json({ error: "견적서를 찾을 수 없습니다." }, { status: 404 });
    }
    return NextResponse.json(quote);
  } catch (error) {
    console.error("[GET /api/quotes/by-slug/[slug]]", error);
    return NextResponse.json(
      { error: "견적서를 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}
