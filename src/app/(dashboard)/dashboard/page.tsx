import { auth } from "@/lib/auth";
import { FileText, Send, Eye, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/common/StatCard";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "대시보드",
};

const stats = [
  { title: "전체 견적서", value: "-", icon: FileText },
  { title: "발송 완료", value: "-", icon: Send },
  { title: "이번 달 조회", value: "-", icon: Eye },
  { title: "만료 예정", value: "-", icon: Clock },
];

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="space-y-6">
      <PageHeader
        title="대시보드"
        description={`안녕하세요, ${session?.user?.name ?? "사용자"}님! Notion에서 견적서를 관리하고 고객과 공유하세요.`}
      >
        <Link href="/dashboard/quotes">
          <Button>
            <FileText className="mr-2 h-4 w-4" />
            견적서 목록
          </Button>
        </Link>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>시작하기</CardTitle>
            <CardDescription>견적서 공유 서비스를 설정하는 방법</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                1
              </span>
              <span>
                Notion 워크스페이스에서 견적서 데이터베이스를 생성하고 통합 연결을 설정하세요.
              </span>
            </div>
            <div className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                2
              </span>
              <span>
                환경변수 <code className="rounded bg-muted px-1">NOTION_TOKEN</code>과{" "}
                <code className="rounded bg-muted px-1">NOTION_DATABASE_ID</code>를 설정하세요.
              </span>
            </div>
            <div className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                3
              </span>
              <span>
                견적서 목록에서 견적서를 선택하고 &quot;공유 링크 생성&quot; 버튼을 클릭하세요.
              </span>
            </div>
            <div className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                4
              </span>
              <span>
                생성된 링크를 고객에게 전달하면, 고객은 로그인 없이 견적서를 열람하고 PDF로 저장할 수 있습니다.
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notion DB 스키마</CardTitle>
            <CardDescription>Notion 데이터베이스에 필요한 속성 목록</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {[
                { key: "quote_number", type: "title", label: "견적서 번호" },
                { key: "project_name", type: "rich_text", label: "프로젝트명" },
                { key: "client_company", type: "rich_text", label: "클라이언트 회사명" },
                { key: "client_email", type: "email", label: "클라이언트 이메일" },
                { key: "issued_date", type: "date", label: "발행일" },
                { key: "valid_until", type: "date", label: "유효기한" },
                { key: "status", type: "status", label: "상태" },
                { key: "subtotal", type: "number", label: "공급가액" },
                { key: "share_slug", type: "rich_text", label: "공유 슬러그 (자동)" },
                { key: "is_public", type: "checkbox", label: "공개 여부 (자동)" },
              ].map(({ key, type, label }) => (
                <div key={key} className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-1.5">
                  <span className="text-foreground">{label}</span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <code className="rounded bg-muted px-1">{key}</code>
                    <span className="rounded border border-border px-1">{type}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
