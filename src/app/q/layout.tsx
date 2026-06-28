// 공개 견적서 라우트는 대시보드 레이아웃(사이드바/헤더) 없이 독립적으로 렌더링됩니다.
export default function QuoteLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
