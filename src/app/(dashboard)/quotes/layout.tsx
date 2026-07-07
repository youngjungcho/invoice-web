import { Suspense } from "react";
import { QuoteStatusTabs } from "@/components/quotes/QuoteStatusTabs";

export default function QuotesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={<div className="border-b border-border h-[49px]" />}>
        <QuoteStatusTabs />
      </Suspense>
      <div className="flex-1 overflow-auto p-4 md:p-6">{children}</div>
    </>
  );
}
