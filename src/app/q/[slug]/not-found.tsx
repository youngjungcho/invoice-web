import Link from "next/link";
import { FileX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function QuoteNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <FileX className="h-8 w-8 text-muted-foreground" />
      </div>
      <h1 className="mb-2 text-2xl font-bold text-foreground">견적서를 찾을 수 없습니다</h1>
      <p className="mb-8 max-w-sm text-muted-foreground">
        링크가 잘못되었거나, 비공개 처리되었거나, 만료된 견적서입니다.
        올바른 링크를 담당자에게 다시 요청하세요.
      </p>
      <Link href="/">
        <Button variant="outline">홈으로 돌아가기</Button>
      </Link>
    </div>
  );
}
