"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCopyToClipboard } from "@/hooks";
import { Link2, Link2Off, Copy, ExternalLink } from "lucide-react";

interface Props {
  quoteId: string;
  slug: string | null;
  isPublic: boolean;
  createdBy: string;
}

export function SharePanel({ quoteId, slug: initialSlug, isPublic: initialIsPublic }: Props) {
  const [slug, setSlug] = useState(initialSlug);
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [loading, setLoading] = useState(false);
  const { copy } = useCopyToClipboard();

  const shareUrl = slug
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/q/${slug}`
    : null;

  async function handleGenerateLink() {
    setLoading(true);
    try {
      const res = await fetch(`/api/quotes/${quoteId}/share`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "공유 링크 생성에 실패했습니다.");
      }
      const data: { slug: string; url: string } = await res.json();
      setSlug(data.slug);
      setIsPublic(true);
      await copy(data.url);
      toast.success("공유 링크가 클립보드에 복사되었습니다.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRevoke() {
    setLoading(true);
    try {
      const res = await fetch(`/api/quotes/${quoteId}/revoke`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "공유 해제에 실패했습니다.");
      }
      setIsPublic(false);
      toast.success("견적서 공유가 해제되었습니다.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!shareUrl) return;
    await copy(shareUrl);
    toast.success("공유 링크가 클립보드에 복사되었습니다.");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-4 w-4" />
          공유 링크
        </CardTitle>
        <CardDescription>
          고객이 로그인 없이 견적서를 열람할 수 있는 링크입니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant={isPublic ? "default" : "secondary"}>
            {isPublic ? "공개" : "비공개"}
          </Badge>
          {slug && (
            <code className="text-xs text-muted-foreground truncate max-w-[160px]">
              /q/{slug}
            </code>
          )}
        </div>

        {shareUrl && isPublic ? (
          <div className="rounded-md border border-border bg-muted/50 p-3 text-xs text-muted-foreground break-all">
            {shareUrl}
          </div>
        ) : null}

        <div className="space-y-2">
          {!isPublic ? (
            <Button
              className="w-full"
              onClick={handleGenerateLink}
              disabled={loading}
            >
              <Link2 className="mr-2 h-4 w-4" />
              {slug ? "공유 다시 활성화" : "공유 링크 생성"}
            </Button>
          ) : (
            <>
              <Button
                className="w-full"
                variant="outline"
                onClick={handleCopy}
                disabled={loading}
              >
                <Copy className="mr-2 h-4 w-4" />
                링크 복사
              </Button>
              {shareUrl && (
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => window.open(shareUrl, "_blank")}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  미리보기
                </Button>
              )}
              <Button
                className="w-full"
                variant="destructive"
                onClick={handleRevoke}
                disabled={loading}
              >
                <Link2Off className="mr-2 h-4 w-4" />
                공유 해제
              </Button>
            </>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          공유 링크를 통해 접근하는 고객은 로그인 없이 견적서를 열람하고 PDF로 저장할 수 있습니다.
          공유 해제 시 링크는 즉시 무효화됩니다.
        </p>
      </CardContent>
    </Card>
  );
}
