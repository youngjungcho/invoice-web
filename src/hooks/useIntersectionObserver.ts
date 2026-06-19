"use client";

import { useIntersectionObserver as useIOBase } from "usehooks-ts";
interface UseIntersectionObserverOptions {
  threshold?: number;
  rootMargin?: string;
  freezeOnceVisible?: boolean;
}

/**
 * 요소가 뷰포트에 진입했는지 감지합니다. 무한 스크롤, 지연 로딩에 사용합니다.
 * @example
 * const { ref, isIntersecting } = useIntersectionObserver({ threshold: 0.1 });
 * <div ref={ref}>{isIntersecting && <HeavyComponent />}</div>
 */
export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
) {
  const { threshold = 0, rootMargin = "0px", freezeOnceVisible = false } = options;
  const { ref, isIntersecting, entry } = useIOBase({
    threshold,
    rootMargin,
    freezeOnceVisible,
  });

  return { ref, isIntersecting, entry };
}
