"use client";

import { useDebounceValue } from "usehooks-ts";

/**
 * 값 변경을 지연시킵니다. 검색 입력, API 호출 최적화에 사용합니다.
 * @example
 * const [debouncedQuery] = useDebounce(searchQuery, 400);
 */
export function useDebounce<T>(value: T, delay: number = 400): [T] {
  const [debouncedValue] = useDebounceValue(value, delay);
  return [debouncedValue];
}
