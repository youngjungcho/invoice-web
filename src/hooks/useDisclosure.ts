"use client";

import { useBoolean } from "usehooks-ts";

interface UseDisclosureReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

/**
 * 모달, 드로어, 팝오버 등 열림/닫힘 상태를 관리합니다.
 * @example
 * const { isOpen, open, close } = useDisclosure();
 * <Dialog open={isOpen} onOpenChange={close}>
 */
export function useDisclosure(initialState = false): UseDisclosureReturn {
  const { value: isOpen, setTrue: open, setFalse: close, toggle } = useBoolean(initialState);
  return { isOpen, open, close, toggle };
}
