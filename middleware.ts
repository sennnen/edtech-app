import { withAuth } from "next-auth/middleware"

export default withAuth({
  callbacks: {
    authorized({ req, token }) {
      const path = req.nextUrl.pathname
      const role = token?.role as string | undefined

      if (path.startsWith("/login") || path.startsWith("/register") || path === "/") {
        return true
      }

      if (path.startsWith("/dashboard") && role !== "STUDENT") return false
      if (path.startsWith("/teacher") && role !== "TEACHER" && role !== "ADMIN") return false
      if (path.startsWith("/admin") && role !== "ADMIN") return false
      if (path.startsWith("/creator") && role !== "CREATOR" && role !== "ADMIN") return false

      if (path.startsWith("/uploads") && role !== "TEACHER" && role !== "ADMIN") return false

      return true
    },
  },
})

export const config = {
  matcher: ["/dashboard/:path*", "/teacher/:path*", "/admin/:path*", "/creator/:path*", "/uploads/:path*"],
}
