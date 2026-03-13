import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import bcrypt from "bcrypt";
import { encryptSession } from "@/lib/session";
import { authLimiter } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validations";

export async function POST(request: Request) {
    try {
        // Rate Limiting Check
        const ip = request.headers.get("x-forwarded-for") || "anonymous";
        const { success } = await authLimiter.check(ip);

        if (!success) {
            return NextResponse.json(
                { error: "Too many login attempts. Please try again in a minute." },
                { status: 429 }
            );
        }

        const body = await request.json();

        // 1. Validate Input Schema
        const validatedData = loginSchema.safeParse(body);
        if (!validatedData.success) {
            return NextResponse.json(
                { error: validatedData.error.issues[0].message },
                { status: 400 }
            );
        }

        const { identifier, password } = validatedData.data;

        // Find user in database by email or username
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: identifier },
                    { username: identifier }
                ]
            }
        });

        if (!user) {
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 }
            );
        }

        // Verify password
        const passwordMatch = await bcrypt.compare(password, user.passwordHash);

        if (!passwordMatch) {
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 }
            );
        }

        // Generate JWT Token
        const token = await encryptSession({ id: user.id, role: user.role });

        // Store session in HTTP-Only cookie with strict security
        const cookieStore = await cookies();
        cookieStore.set("user_session", token, {
            httpOnly: true,
            secure: true, // Enforce HTTPS for cookie transmission
            sameSite: "strict", // MITM and CSRF protection
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: "/",
        });

        // Set a public cookie just to let frontend easily check if a session exists
        cookieStore.set("is_user_logged_in", "true", {
            secure: true,
            sameSite: "strict",
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: "/",
        });

        // Return success
        return NextResponse.json(
            {
                user: {
                    id: user.id,
                    name: `${user.firstName} ${user.lastName}`,
                    email: user.email,
                    username: user.username,
                    role: user.role
                }
            },
            { status: 200 }
        );
    } catch (error: unknown) {
        console.error(error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
