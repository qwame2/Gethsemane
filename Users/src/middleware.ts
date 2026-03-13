import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decryptSession } from "@/lib/session";

// Define paths that don't require authentication
const publicPaths = [
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/reset-password",
    "/api/health",
    "/login",
    "/register",
    "/forgot-password",
];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Skip middleware for static files and standard public assets
    if (
        pathname.startsWith("/_next") ||
        pathname.startsWith("/static") ||
        pathname.includes(".") ||
        pathname === "/"
    ) {
        return NextResponse.next();
    }

    // 2. Check if the path is explicitly public
    const isPublicPath = publicPaths.some(path => pathname.startsWith(path));
    if (isPublicPath) {
        return NextResponse.next();
    }

    // 3. Get session token from cookies
    const sessionToken = request.cookies.get("user_session")?.value;

    // 4. Handle Unauthorized Access
    if (!sessionToken) {
        // For API routes, return 401
        if (pathname.startsWith("/api/")) {
            return NextResponse.json(
                { error: "Unauthorized: Access denied. Please log in." },
                { status: 401 }
            );
        }
        // For Page routes, redirect to login
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // 5. Verify and Decrypt Session
    const session = await decryptSession(sessionToken);

    if (!session || !session.id) {
        // Clean up invalid session cookie
        const response = pathname.startsWith("/api/")
            ? NextResponse.json({ error: "Unauthorized: Invalid or expired session." }, { status: 401 })
            : NextResponse.redirect(new URL("/login", request.url));
            
        response.cookies.delete("user_session");
        response.cookies.delete("is_user_logged_in");
        return response;
    }

    // 6. Securely forward user ID in headers (X-User-Id)
    // This allows route handlers to trust the header instead of re-decrypting the session
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("X-User-Id", session.id);
    requestHeaders.set("X-User-Role", session.role || "user");

    return NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });
}

// Configure the paths where the middleware should run
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api/auth (handled individually or skipped)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        "/((?!_next/static|_next/image|favicon.ico).*)",
    ],
};
