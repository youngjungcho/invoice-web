import { NextResponse } from "next/server";
import { findBySlug, parseQuotePage, withRateLimit } from "@/lib/notion";
import { unstable_cache } from "next/cache";

interface Params {
  params: Promise<{ slug: string }>;
}

const getCachedQuote = unstable_cache(
  async (slug: string) => {
    const page = await withRateLimit(() => findBySlug(slug));
    if (!page) return null;
    return parseQuotePage(page);
  },
  ["quote-by-slug"],
  { revalidate: 60 } // 60초 캐시
);

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
