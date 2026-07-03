import { Skeleton } from "@/components/ui/skeleton";

export function SidebarSkeleton() {
  return (
    <aside className="hidden md:flex h-full w-60 flex-col border-r border-border bg-sidebar px-3 py-6">
      <div className="mb-8 px-3">
        <Skeleton className="h-6 w-20" />
      </div>
      <nav className="flex-1 space-y-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full rounded-lg" />
        ))}
      </nav>
    </aside>
  );
}
