import { PageHeader } from "@/components/common/PageHeader";
import { ComponentShowcase } from "./ComponentShowcase";

export default function ComponentsPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="컴포넌트"
        description="스타터킷에 포함된 UI 컴포넌트 쇼케이스입니다."
      />
      <ComponentShowcase />
    </div>
  );
}
