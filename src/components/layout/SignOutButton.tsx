"use client";

import { LogOut } from "lucide-react";
import { signOutAction } from "@/app/actions";

export function SignOutButton() {
  return (
    <form action={signOutAction} className="flex w-full items-center">
      <button type="submit" className="flex w-full items-center px-2 py-1.5">
        <LogOut className="mr-2 h-4 w-4" />
        로그아웃
      </button>
    </form>
  );
}
