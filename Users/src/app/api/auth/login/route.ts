import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import bcrypt from "bcrypt";
import { encryptSession } from "@/lib/session";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Simple mock validation
        if (!body.identifier || !body.password) {
            return NextResponse.json(
                { error: "Username/Email and password are required" },
                { status: 400 }
            );
        }

        // Find user in database by email or username
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: body.identifier },
                    { username: body.identifier }
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
        const passwordMatch = await bcrypt.compare(body.password, user.passwordHash);

        if (!passwordMatch) {
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 }
            );
        }

        // Generate JWT Token
        const token = await encryptSession({ id: user.id, role: user.role });

        // Store session in HTTP-Only cookie
        const cookieStore = await cookies();
        cookieStore.set("user_session", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: "/",
        });

        // Set a public cookie just to let frontend easily check if a session exists
        cookieStore.set("is_user_logged_in", "true", {
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
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
    } catch (error: any) {
        console.error(error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
