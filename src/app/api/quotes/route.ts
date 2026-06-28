import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { queryAll, parseQuotePage, withRateLimit } from "@/lib/notion";

export async function GET(): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  try {
    const pages = await withRateLimit(() =>
      queryAll(undefined, [{ timestamp: "created_time", direction: "descending" }])
    );
    const quotes = pages.map(parseQuotePage);
    return NextResponse.json(quotes);
  } catch (error) {
    console.error("[GET /api/quotes]", error);
    return NextResponse.json(
      { error: "Notion에서 견적서 목록을 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}
