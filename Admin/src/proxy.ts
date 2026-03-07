import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
    const session = request.cookies.get("admin_session");
    const { pathname } = request.nextUrl;

    // If logged in and trying to access auth pages, redirect to dashboard
    if (session && (pathname === "/login" || pathname === "/register" || pathname === "/")) {
        // We can't query DB here to know if they need setup, 
        // so we redirect to dashboard and let the dashboard handle it,
        // or check for setup cookie if we had one. For now, redirect to /dashboard.
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // You could also protect other routes here:
    // if (!session && (pathname.startsWith("/dashboard") || pathname.startsWith("/setup"))) {
    //     return NextResponse.redirect(new URL("/login", request.url));
    // }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico|logo.png|.*\\.png$).*)"],
};
