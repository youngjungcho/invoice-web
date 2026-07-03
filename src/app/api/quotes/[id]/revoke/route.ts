import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revokeQuote, withRateLimit } from "@/lib/notion";
import { revalidateTag } from "next/cache";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(_req: Request, { params }: Params): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const { id: pageId } = await params;

  try {
    const share = await db.quoteShare.findUnique({ where: { notionPageId: pageId } });
    if (!share) {
      return NextResponse.json({ error: "공유 링크가 존재하지 않습니다." }, { status: 404 });
    }

    // Notion에서 is_public=false 처리
    await withRateLimit(() => revokeQuote(pageId));

    // DB에 회수 시각 기록
    await db.quoteShare.update({
      where: { id: share.id },
      data: { revokedAt: new Date() },
    });

    // 공개 페이지 캐시 즉시 무효화
    revalidateTag(`quote-${share.slug}`, { expire: 0 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/quotes/[id]/revoke]", error);
    return NextResponse.json(
      { error: "공유 해제에 실패했습니다." },
      { status: 500 }
    );
  }
}
