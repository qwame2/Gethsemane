import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcrypt";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        if (!body.email || !body.password || !body.firstName || !body.lastName || !body.username || !body.securityQuestion1 || !body.securityAnswer1 || !body.securityQuestion2 || !body.securityAnswer2) {
            return NextResponse.json(
                { error: "All profile fields and two distinct security questions are required" },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingEmail = await prisma.user.findUnique({
            where: { email: body.email }
        });

        if (existingEmail) {
            return NextResponse.json(
                { error: "User with this email already exists" },
                { status: 409 }
            );
        }

        const existingUsername = await prisma.user.findUnique({
            where: { username: body.username }
        });

        if (existingUsername) {
            return NextResponse.json(
                { error: "User with this username already exists" },
                { status: 409 }
            );
        }

        // Hash password and security answers
        const hashedPassword = await bcrypt.hash(body.password, 10);
        const hashedAnswer1 = await bcrypt.hash(body.securityAnswer1.trim().toLowerCase(), 10);
        const hashedAnswer2 = await bcrypt.hash(body.securityAnswer2.trim().toLowerCase(), 10);

        // Create User and default DuesProfile in database
        const newUser = await prisma.user.create({
            data: {
                firstName: body.firstName,
                lastName: body.lastName,
                email: body.email,
                username: body.username,
                phone: body.phone || null,
                passwordHash: hashedPassword,
                securityQuestion1: body.securityQuestion1,
                securityAnswer1: hashedAnswer1,
                securityQuestion2: body.securityQuestion2,
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
    } catch (error: any) {
        console.error(error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
