"use client";

import { Badge } from "@/components/ui/badge";
import type { QuoteStatus } from "@/types/notion";

const STATUS_STYLES: Record<string, string> = {
  "작성중": "bg-gray-100 text-gray-700 hover:bg-gray-100",
  "발송완료": "bg-blue-100 text-blue-700 hover:bg-blue-100",
  "승인": "bg-green-100 text-green-700 hover:bg-green-100",
  "반려": "bg-red-100 text-red-700 hover:bg-red-100",
  "만료": "bg-orange-100 text-orange-700 hover:bg-orange-100",
};

export function QuoteStatusBadge({ status }: { status: QuoteStatus | string | null }) {
  if (!status) return <Badge variant="outline">-</Badge>;
  const style = STATUS_STYLES[status] ?? "bg-gray-100 text-gray-700 hover:bg-gray-100";
  return <Badge className={style}>{status}</Badge>;
}
