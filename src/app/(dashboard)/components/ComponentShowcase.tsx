"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Trash2, Copy, Download, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCopyToClipboard } from "@/hooks";

export function ComponentShowcase() {
  const [progress, setProgress] = useState(60);
  const [notifications, setNotifications] = useState(true);
  const { copy } = useCopyToClipboard();

  return (
    <div className="space-y-6">
      {/* Toast */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Toast (sonner)</CardTitle>
          <CardDescription>다양한 유형의 알림 토스트</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => toast.success("저장되었습니다.")}>
            성공
          </Button>
          <Button variant="outline" size="sm" onClick={() => toast.error("오류가 발생했습니다.")}>
            오류
          </Button>
          <Button variant="outline" size="sm" onClick={() => toast.warning("주의가 필요합니다.")}>
            경고
          </Button>
          <Button variant="outline" size="sm" onClick={() => toast.info("새 업데이트가 있습니다.")}>
            정보
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              toast.promise(new Promise((r) => setTimeout(r, 1500)), {
                loading: "처리 중...",
                success: "완료되었습니다.",
                error: "실패했습니다.",
              })
            }
          >
            Promise
          </Button>
        </CardContent>
      </Card>

      {/* Dialog */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dialog / AlertDialog</CardTitle>
          <CardDescription>모달 및 확인 다이얼로그</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Dialog>
            <DialogTrigger className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium shadow-xs hover:bg-accent hover:text-accent-foreground transition-colors h-8">
              <Download className="h-4 w-4" />
              내보내기
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>데이터 내보내기</DialogTitle>
                <DialogDescription>
                  내보낼 형식을 선택하세요. 파일이 즉시 다운로드됩니다.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <Select defaultValue="csv">
                  <SelectTrigger>
                    <SelectValue placeholder="형식 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                  </SelectContent>
                </Select>
                <Textarea placeholder="메모를 추가하세요 (선택)" rows={3} />
              </div>
              <DialogFooter>
                <Button onClick={() => toast.success("내보내기 완료!")}>내보내기</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <AlertDialog>
            <AlertDialogTrigger className="inline-flex items-center justify-center gap-2 rounded-md bg-destructive px-3 py-1.5 text-sm font-medium text-destructive-foreground shadow-xs hover:bg-destructive/90 transition-colors h-8">
              <Trash2 className="h-4 w-4" />
              삭제
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>정말 삭제하시겠습니까?</AlertDialogTitle>
                <AlertDialogDescription>
                  이 작업은 되돌릴 수 없습니다. 데이터가 영구적으로 삭제됩니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction onClick={() => toast.success("삭제되었습니다.")}>
                  삭제
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {/* Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Progress</CardTitle>
          <CardDescription>작업 진행률 표시</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">업로드 진행률</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setProgress((p) => Math.max(0, p - 10))}>
              -10%
            </Button>
            <Button size="sm" variant="outline" onClick={() => setProgress((p) => Math.min(100, p + 10))}>
              +10%
            </Button>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">스토리지 사용량</span>
              <span className="font-medium">7.2GB / 10GB</span>
            </div>
            <Progress value={72} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Alert */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Alert</CardTitle>
          <CardDescription>인라인 피드백 메시지</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>안내</AlertTitle>
            <AlertDescription>
              새 버전이 출시되었습니다. 변경사항을 확인해보세요.
            </AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <Info className="h-4 w-4" />
            <AlertTitle>오류</AlertTitle>
            <AlertDescription>
              결제 정보가 만료되었습니다. 카드 정보를 업데이트해주세요.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Tooltip + Badge + Switch + Copy */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">기타 컴포넌트</CardTitle>
          <CardDescription>Tooltip · Badge · Switch · useCopyToClipboard</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Tooltip>
              <TooltipTrigger render={<Button variant="outline" size="sm"><Info className="mr-2 h-4 w-4" />툴팁 호버</Button>} />
              <TooltipContent>
                <p>이 기능은 Pro 플랜에서 사용 가능합니다.</p>
              </TooltipContent>
            </Tooltip>

            <Button
              variant="outline"
              size="sm"
              onClick={() => copy("npm install usehooks-ts")}
            >
              <Copy className="mr-2 h-4 w-4" />
              클립보드 복사
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {["기본", "성공", "경고", "위험"].map((label, i) => (
              <Badge key={label} variant={i === 3 ? "destructive" : i === 0 ? "default" : "secondary"}>
                {label}
              </Badge>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="notifications"
              checked={notifications}
              onCheckedChange={setNotifications}
            />
            <Label htmlFor="notifications" className="cursor-pointer">
              {notifications ? "알림 켜짐" : "알림 꺼짐"}
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Skeleton */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Skeleton</CardTitle>
          <CardDescription>로딩 중 플레이스홀더</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-60" />
            </div>
          </div>
          <Skeleton className="h-[120px] w-full rounded-xl" />
        </CardContent>
      </Card>
    </div>
  );
}
