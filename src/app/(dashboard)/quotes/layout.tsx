import { QuoteStatusTabs } from "@/components/quotes/QuoteStatusTabs";

export default function QuotesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <QuoteStatusTabs />
      <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
    </>
  );
}
