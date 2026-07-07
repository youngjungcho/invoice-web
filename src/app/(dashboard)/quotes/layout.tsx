import { Suspense } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { HeaderSkeleton } from "@/components/layout/HeaderSkeleton";
import { SidebarSkeleton } from "@/components/layout/SidebarSkeleton";
import { QuoteStatusTabs } from "@/components/quotes/QuoteStatusTabs";

export default function QuotesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-background">
      <Suspense fallback={<SidebarSkeleton />}>
        <Sidebar />
      </Suspense>
      <div className="flex flex-1 flex-col overflow-hidden">
        <Suspense fallback={<HeaderSkeleton />}>
          <Header />
        </Suspense>
        <QuoteStatusTabs />
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
