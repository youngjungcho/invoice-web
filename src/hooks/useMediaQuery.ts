"use client";

import { useMediaQuery as useMediaQueryBase } from "usehooks-ts";

// 사전 정의된 브레이크포인트 (Tailwind 기준)
export const breakpoints = {
  sm: "(min-width: 640px)",
  md: "(min-width: 768px)",
  lg: "(min-width: 1024px)",
  xl: "(min-width: 1280px)",
  "2xl": "(min-width: 1536px)",
  mobile: "(max-width: 767px)",
  tablet: "(min-width: 768px) and (max-width: 1023px)",
  desktop: "(min-width: 1024px)",
  dark: "(prefers-color-scheme: dark)",
  reducedMotion: "(prefers-reduced-motion: reduce)",
} as const;

export type Breakpoint = keyof typeof breakpoints;

/**
 * 미디어 쿼리 매칭 여부를 반환합니다.
 * @example
 * const isDesktop = useMediaQuery("desktop");
 * const isCustom = useMediaQuery("(min-width: 900px)");
 */
export function useMediaQuery(query: Breakpoint | (string & {})): boolean {
  const resolved = query in breakpoints
    ? breakpoints[query as Breakpoint]
    : query;
  return useMediaQueryBase(resolved, { initializeWithValue: false });
}
