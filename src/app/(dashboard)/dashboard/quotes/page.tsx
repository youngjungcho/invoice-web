import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/common/PageHeader";
import { QuotesTable } from "./QuotesTable";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "견적서 목록",
};

export default async function QuotesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="space-y-6">
      <PageHeader
        title="견적서 목록"
        description="Notion에서 관리하는 견적서를 조회하고 고객과 공유하세요."
      />
      <QuotesTable />
    </div>
  );
}
