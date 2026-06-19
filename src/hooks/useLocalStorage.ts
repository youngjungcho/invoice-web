"use client";

import { useLocalStorage as useLocalStorageBase } from "usehooks-ts";

/**
 * localStorage에 값을 저장하고 읽습니다. SSR 안전하며 탭 간 동기화됩니다.
 * @example
 * const [theme, setTheme, removeTheme] = useLocalStorage("theme", "dark");
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  return useLocalStorageBase<T>(key, initialValue);
}
