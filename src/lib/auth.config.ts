import type { NextAuthConfig } from "next-auth"

export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [], // middleware에서는 provider 불필요 (Edge Runtime 호환)
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isProtected =
        nextUrl.pathname.startsWith("/dashboard") ||
        nextUrl.pathname.startsWith("/settings") ||
        nextUrl.pathname.startsWith("/quotes")
      const isAuthPage =
        nextUrl.pathname.startsWith("/login") ||
        nextUrl.pathname.startsWith("/register")

      if (isProtected && !isLoggedIn) {
        return Response.redirect(new URL("/login", nextUrl))
      }
      if (isAuthPage && isLoggedIn) {
        return Response.redirect(new URL("/dashboard", nextUrl))
      }
      return true
    },
  },
}
