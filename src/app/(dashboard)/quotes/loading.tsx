import { QuoteTableSkeleton } from "@/components/quotes/QuoteTableSkeleton";

export default function QuotesLoading() {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="h-7 w-32 rounded bg-muted animate-pulse" />
        <div className="h-4 w-64 rounded bg-muted animate-pulse" />
      </div>
      <div className="rounded-lg border bg-card">
        <QuoteTableSkeleton />
      </div>
    </div>
  );
}
