import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  notion,
  parseQuotePage,
  parseQuoteItemPage,
  queryItemsByQuoteId,
  withRateLimit,
} from "@/lib/notion";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: Params): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const [page, itemPages] = await Promise.all([
      withRateLimit(() => notion.pages.retrieve({ page_id: id })),
      withRateLimit(() => queryItemsByQuoteId(id)),
    ]);

    const quote = parseQuotePage(page as PageObjectResponse);
    quote.items = itemPages.map(parseQuoteItemPage);

    return NextResponse.json(quote);
  } catch (error) {
    console.error("[GET /api/quotes/[id]]", error);
    return NextResponse.json(
      { error: "견적서를 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}
