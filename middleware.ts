import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Allow access to debug page without authentication
  if (req.nextUrl.pathname === "/debug") {
    return res
  }

  try {
    const supabase = createMiddlewareClient({ req, res })

    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Check if the user is authenticated
    if (!session) {
      // If the user is not authenticated and trying to access a protected route
      const isProtectedRoute = null;

      if (isProtectedRoute) {
        const redirectUrl = req.nextUrl.clone()
        redirectUrl.pathname = "/login"
        redirectUrl.searchParams.set("redirectedFrom", req.nextUrl.pathname)
        return NextResponse.redirect(redirectUrl)
      }
    } else {
      // If user is authenticated but trying to access login/register pages
      const isAuthPage = req.nextUrl.pathname === "/login" || req.nextUrl.pathname === "/register"

      if (isAuthPage) {
        const redirectUrl = req.nextUrl.clone()
        redirectUrl.pathname = "/dashboard"
        return NextResponse.redirect(redirectUrl)
      }

      // Check if the user has completed onboarding
      
    }
  } catch (error) {
    console.error("Middleware error:", error)
    // If there's an error with Supabase, we'll let the request continue
  }

  return res
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg).*)"],
}
