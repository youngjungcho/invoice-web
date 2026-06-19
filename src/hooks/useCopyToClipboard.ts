"use client";

import { useCopyToClipboard as useCopyBase } from "usehooks-ts";
import { toast } from "sonner";

/**
 * 텍스트를 클립보드에 복사합니다. 복사 성공 시 toast 알림을 표시합니다.
 * @example
 * const { copy } = useCopyToClipboard();
 * <button onClick={() => copy(apiKey)}>복사</button>
 */
export function useCopyToClipboard() {
  const [copiedText, copy] = useCopyBase();

  async function copyWithToast(text: string) {
    const ok = await copy(text);
    if (ok) {
      toast.success("클립보드에 복사되었습니다.");
    } else {
      toast.error("복사에 실패했습니다.");
    }
    return ok;
  }

  return { copiedText, copy: copyWithToast };
}
