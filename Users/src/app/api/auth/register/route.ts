import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcrypt";
import { authLimiter } from "@/lib/rate-limit";
import { registerSchema } from "@/lib/validations";

export async function POST(request: Request) {
    try {
        // Rate Limiting Check
        const ip = request.headers.get("x-forwarded-for") || "anonymous";
        const { success } = await authLimiter.check(ip);

        if (!success) {
            return NextResponse.json(
                { error: "Too many registration attempts. Please try again later." },
                { status: 429 }
            );
        }

        const body = await request.json();

        // 1. Validate Input Schema
        const validatedData = registerSchema.safeParse(body);
        if (!validatedData.success) {
            return NextResponse.json(
                { error: validatedData.error.issues[0].message },
                { status: 400 }
            );
        }

        const data = validatedData.data;

        // Check if user already exists
        const existingEmail = await prisma.user.findUnique({
            where: { email: data.email }
        });

        if (existingEmail) {
            return NextResponse.json(
                { error: "User with this email already exists" },
                { status: 409 }
            );
        }

        const existingUsername = await prisma.user.findUnique({
            where: { username: data.username }
        });

        if (existingUsername) {
            return NextResponse.json(
                { error: "User with this username already exists" },
                { status: 409 }
            );
        }

        // Hash password and security answers
        const hashedPassword = await bcrypt.hash(data.password, 10);
        const hashedAnswer1 = await bcrypt.hash(data.securityAnswer1.trim().toLowerCase(), 10);
        const hashedAnswer2 = await bcrypt.hash(data.securityAnswer2.trim().toLowerCase(), 10);

        // Create User and default DuesProfile in database
        const newUser = await prisma.user.create({
            data: {
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                username: data.username,
                phone: data.phone || null,
                passwordHash: hashedPassword,
                securityQuestion1: data.securityQuestion1,
                securityAnswer1: hashedAnswer1,
                securityQuestion2: data.securityQuestion2,
                securityAnswer2: hashedAnswer2,
                duesProfile: {
                    create: {
                        totalArrears: 0.0,
                        currentMonthDue: 100.0,
                        status: "Unpaid"
                    }
                }
            }
        });

        return NextResponse.json(
            {
                message: "User registered successfully",
                user: {
                    id: newUser.id,
                    name: `${newUser.firstName} ${newUser.lastName}`,
                    email: newUser.email,
                    username: newUser.username
                }
            },
            { status: 201 }
        );
    } catch (error: unknown) {
        console.error(error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
