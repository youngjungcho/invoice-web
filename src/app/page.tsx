import Link from "next/link";
import { FileText, Share2, Download, Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/layout/footer";
import { LandingNav } from "@/components/layout/LandingNav";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "견적서 — Notion 기반 견적서 공유 서비스",
  description: "Notion에서 작성한 견적서를 한 번의 클릭으로 고객에게 공유하세요.",
};

const features = [
  {
    icon: FileText,
    title: "Notion이 원천 데이터",
    description:
      "별도의 견적서 에디터 없이, 이미 익숙한 Notion DB에서 견적서를 작성하세요. 본 서비스는 데이터를 읽어 렌더링하는 역할만 합니다.",
  },
  {
    icon: Share2,
    title: "한 번의 클릭으로 공유",
    description:
      "견적서를 선택하고 '공유 링크 생성' 버튼을 누르면 고객 전용 URL이 생성됩니다. 고객은 로그인 없이 즉시 열람 가능합니다.",
  },
  {
    icon: Download,
    title: "브라우저에서 PDF 저장",
    description:
      "고객이 공유 페이지에서 'PDF 저장' 버튼을 클릭하면 브라우저 인쇄 다이얼로그로 PDF를 저장할 수 있습니다. 별도 서버 비용 없음.",
  },
  {
    icon: Shield,
    title: "보안 공유",
    description:
      "126비트 엔트로피의 nanoid 슬러그로 추측 불가한 공유 링크를 생성합니다. 언제든 공유를 해제하면 링크는 즉시 무효화됩니다.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <LandingNav />

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Notion API · NextAuth · Prisma + SQLite
        </div>
        <h1 className="max-w-3xl text-5xl font-bold leading-tight tracking-tight">
          Notion 견적서를
          <br />
          <span className="text-primary/80">고객과 바로 공유하세요.</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          Notion에서 작성한 견적서를 한 번의 클릭으로 고객 전용 URL로 공유하고,
          고객은 로그인 없이 열람 및 PDF 저장을 할 수 있습니다.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link href="/register">
            <Button size="lg" className="px-8">
              무료로 시작하기
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg" className="px-8">
              로그인
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-4 text-center text-3xl font-bold tracking-tight">
            간단한 워크플로우
          </h2>
          <p className="mb-12 text-center text-muted-foreground">
            복잡한 SaaS 대신, 이미 쓰고 있는 Notion에서 시작하세요.
          </p>
          <div className="grid gap-6 md:grid-cols-2">
            {features.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
              >
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-2 text-base font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 사용 흐름 */}
      <section className="border-t border-border bg-muted/30 px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-12 text-center text-3xl font-bold tracking-tight">사용 방법</h2>
          <div className="space-y-6">
            {[
              {
                step: "1",
                title: "Notion DB 설정",
                desc: "Notion 워크스페이스에 견적서 DB를 만들고, 통합(Integration)을 연결하세요.",
              },
              {
                step: "2",
                title: "환경변수 입력",
                desc: "NOTION_TOKEN과 NOTION_DATABASE_ID를 .env 파일에 입력하면 견적서 목록이 자동으로 불러와집니다.",
              },
              {
                step: "3",
                title: "공유 링크 생성",
                desc: "대시보드에서 견적서를 선택하고 '공유 링크 생성' 버튼을 클릭하세요. URL이 클립보드에 복사됩니다.",
              },
              {
                step: "4",
                title: "고객 열람 & PDF 저장",
                desc: "고객은 로그인 없이 링크에 접속해 견적서를 확인하고 PDF로 저장할 수 있습니다.",
              },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex gap-5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {step}
                </span>
                <div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border px-6 py-20 text-center">
        <div className="mx-auto max-w-xl">
          <h2 className="text-3xl font-bold tracking-tight">지금 바로 시작하세요</h2>
          <p className="mt-4 text-muted-foreground">
            Notion 통합 설정 후 5분이면 첫 견적서를 고객과 공유할 수 있습니다.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="px-8">
                무료로 시작하기 <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
