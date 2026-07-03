import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { notion, parseQuotePage, withRateLimit } from "@/lib/notion";
import type { PageObjectResponse, QueryDatabaseParameters } from "@notionhq/client/build/src/api-endpoints";

const PAGE_SIZE = 20;

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const cursor = searchParams.get("cursor") ?? undefined;
  const status = searchParams.get("status") ?? undefined;

  const databaseId = process.env.NOTION_DATABASE_ID;
  if (!databaseId) {
    return NextResponse.json({ error: "NOTION_DATABASE_ID가 설정되지 않았습니다." }, { status: 500 });
  }

  const filter: QueryDatabaseParameters["filter"] | undefined = status
    ? { property: "status", status: { equals: status } }
    : undefined;

  try {
    const response = await withRateLimit(() =>
      notion.databases.query({
        database_id: databaseId,
        filter,
        sorts: [{ timestamp: "created_time", direction: "descending" }],
        start_cursor: cursor,
        page_size: PAGE_SIZE,
      })
    );

    const quotes = response.results
      .filter((p) => p.object === "page" && "properties" in p)
      .map((p) => parseQuotePage(p as PageObjectResponse));

    return NextResponse.json({
      quotes,
      nextCursor: response.has_more ? response.next_cursor : null,
      hasMore: response.has_more,
    });
  } catch (error) {
    console.error("[GET /api/quotes]", error);
    return NextResponse.json(
      { error: "Notion에서 견적서 목록을 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}
