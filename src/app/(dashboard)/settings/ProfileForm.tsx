"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ProfileFormProps {
  name: string;
  email: string;
}

export function ProfileForm({ name, email }: ProfileFormProps) {
  const [value, setValue] = useState(name);
  const [loading, setLoading] = useState(false);
  const { update } = useSession();

  async function handleSave() {
    if (!value.trim()) {
      toast.error("이름을 입력해주세요.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: value }),
      });
      if (!res.ok) throw new Error();
      await update({ name: value });
      toast.success("프로필이 저장되었습니다.");
    } catch {
      toast.error("저장에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>프로필 정보</CardTitle>
        <CardDescription>이름과 이메일 정보를 관리합니다.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">이름</Label>
          <Input
            id="name"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="이름을 입력하세요"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">이메일</Label>
          <div className="flex items-center gap-2">
            <Input id="email" defaultValue={email} readOnly className="text-muted-foreground" />
            <Badge variant="secondary">인증됨</Badge>
          </div>
        </div>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? "저장 중..." : "저장하기"}
        </Button>
      </CardContent>
    </Card>
  );
}
