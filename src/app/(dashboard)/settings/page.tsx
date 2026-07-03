import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/common/PageHeader";
import { ProfileForm } from "./ProfileForm";
import { SecurityCard } from "./SecurityCard";
import { NotificationsCard } from "./NotificationsCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

async function SettingsContent() {
  const session = await auth();
  const user = session?.user;

  return (
    <Tabs defaultValue="profile">
      <TabsList className="w-full justify-start">
        <TabsTrigger value="profile">프로필</TabsTrigger>
        <TabsTrigger value="security">보안</TabsTrigger>
        <TabsTrigger value="notifications">알림</TabsTrigger>
      </TabsList>
      <TabsContent value="profile" className="mt-6">
        <ProfileForm name={user?.name ?? ""} email={user?.email ?? ""} />
      </TabsContent>
      <TabsContent value="security" className="mt-6">
        <SecurityCard />
      </TabsContent>
      <TabsContent value="notifications" className="mt-6">
        <NotificationsCard />
      </TabsContent>
    </Tabs>
  );
}

function SettingsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="설정" description="계정과 알림 설정을 관리하세요." />
      <Suspense fallback={<SettingsSkeleton />}>
        <SettingsContent />
      </Suspense>
    </div>
  );
}
