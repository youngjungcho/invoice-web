import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateAndAttachSlug, withRateLimit } from "@/lib/notion";

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
    // 이미 슬러그가 있는 경우 기존 레코드 재사용
    const existing = await db.quoteShare.findUnique({ where: { notionPageId: pageId } });

    let slug: string;

    if (existing && !existing.revokedAt) {
      // 이미 활성 공유 링크가 있음 — 슬러그만 반환
      slug = existing.slug;
    } else if (existing && existing.revokedAt) {
      // 회수된 링크 재활성화 — Notion도 다시 공개로 설정
      slug = await withRateLimit(() => generateAndAttachSlug(pageId));
      await db.quoteShare.update({
        where: { id: existing.id },
        data: { slug, revokedAt: null },
      });
    } else {
      // 신규 슬러그 생성
      slug = await withRateLimit(() => generateAndAttachSlug(pageId));
      await db.quoteShare.create({
        data: {
          notionPageId: pageId,
          slug,
          createdBy: session.user!.id!,
        },
      });
    }

    const origin = process.env.AUTH_URL ?? "http://localhost:3000";
    return NextResponse.json({ slug, url: `${origin}/q/${slug}` });
  } catch (error) {
    console.error("[POST /api/quotes/[id]/share]", error);
    return NextResponse.json(
      { error: "공유 링크 생성에 실패했습니다." },
      { status: 500 }
    );
  }
}
