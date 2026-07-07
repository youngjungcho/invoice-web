"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const STATUSES = ["전체", "작성중", "발송완료", "승인", "반려", "만료"] as const;

export function QuoteStatusTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("status") ?? "전체";

  function handleChange(value: string) {
    if (value === "전체") {
      router.push("/dashboard/quotes");
    } else {
      router.push(`/dashboard/quotes?status=${encodeURIComponent(value)}`);
    }
  }

  return (
    <div className="border-b border-border bg-background px-6">
      <Tabs value={current} onValueChange={handleChange}>
        <TabsList className="h-auto rounded-none bg-transparent p-0 gap-0">
          {STATUSES.map((s) => (
            <TabsTrigger
              key={s}
              value={s}
              className="rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              {s}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
