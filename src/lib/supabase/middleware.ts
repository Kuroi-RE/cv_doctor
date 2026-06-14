import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Protected user routes — redirect to login if not authenticated
  const userRoutePrefixes = ["/dashboard", "/upload", "/history", "/analysis"];
  const isUserRoute = userRoutePrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  );
  const isAdminRoute = pathname.startsWith("/admin");
  const isProtectedRoute = isUserRoute || isAdminRoute;

  // Check ban status for authenticated users on protected routes.
  // Only enforce ban on user/admin routes so banned users on /login
  // do not get stuck in an infinite redirect loop.
  if (user && isProtectedRoute) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_banned")
      .eq("auth_user_id", user.id)
      .single();

    if (profile?.is_banned) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("banned", "1");
      return NextResponse.redirect(loginUrl);
    }
  }

  if (isUserRoute && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Protected admin routes — redirect to login if not authenticated
  if (isAdminRoute) {
    if (!user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check if user has admin role from profiles table
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile || profile.role !== "superadmin") {
      // Non-admin users get redirected to their dashboard
      const dashboardUrl = request.nextUrl.clone();
      dashboardUrl.pathname = "/dashboard";
      return NextResponse.redirect(dashboardUrl);
    }
  }

  // Redirect logged-in users away from login/register pages
  if (user && (pathname === "/login" || pathname === "/register")) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    return NextResponse.redirect(dashboardUrl);
  }

  return supabaseResponse;
}
