import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: {
    default: "견적서 — Notion 기반 견적서 공유 서비스",
    template: "%s | 견적서",
  },
  description: "Notion에서 작성한 견적서를 한 번의 클릭으로 고객에게 공유하세요.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ThemeProvider>
          <SessionProvider>
            <TooltipProvider>
              {children}
              <Toaster richColors position="top-right" />
            </TooltipProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
