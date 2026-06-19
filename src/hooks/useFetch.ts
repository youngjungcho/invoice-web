"use client";

import { useEffect, useState } from "react";

interface UseFetchState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

/**
 * 간단한 데이터 페칭 훅. 외부 의존성 없이 fetch API를 래핑합니다.
 * 복잡한 서버 상태 관리가 필요하면 TanStack Query 도입을 권장합니다.
 * @example
 * const { data, loading, error } = useFetch<User[]>("/api/users");
 */
export function useFetch<T>(url: string | null): UseFetchState<T> {
  const [state, setState] = useState<UseFetchState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!url) return;

    const controller = new AbortController();
    setState({ data: null, loading: true, error: null });

    fetch(url, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<T>;
      })
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((err) => {
        if (err.name === "AbortError") return;
        setState({ data: null, loading: false, error: err });
      });

    return () => controller.abort();
  }, [url]);

  return state;
}
