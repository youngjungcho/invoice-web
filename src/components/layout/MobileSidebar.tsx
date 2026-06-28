"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, LayoutDashboard, Settings, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "대시보드", icon: LayoutDashboard },
  { href: "/dashboard/quotes", label: "견적서", icon: FileText },
  { href: "/settings", label: "설정", icon: Settings },
];

export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 md:hidden"
        onClick={() => setOpen(true)}
      >
        <Menu className="h-4 w-4" />
        <span className="sr-only">메뉴 열기</span>
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-60 p-0">
          <SheetHeader className="px-6 py-5 border-b border-border">
            <SheetTitle className="text-left">견적서</SheetTitle>
          </SheetHeader>
          <nav className="flex-1 space-y-1 p-3 pt-4">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  pathname === href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}
