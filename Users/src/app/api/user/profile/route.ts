import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcrypt";
import { profileUpdateSchema } from "@/lib/validations";

export async function GET(request: Request) {
    try {
        const userId = request.headers.get("X-User-Id");

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                username: true,
                phone: true,
                role: true,
                image: true,
                createdAt: true,
            }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error: unknown) {
        console.error("Profile GET Error:", error);
        return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const userId = request.headers.get("X-User-Id");

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();

        // 1. Validate Input Schema
        const validatedData = profileUpdateSchema.safeParse(body);
        if (!validatedData.success) {
            return NextResponse.json(
                { error: validatedData.error.issues[0].message },
                { status: 400 }
            );
        }

        const data = validatedData.data;

        const targetUser = await prisma.user.findUnique({ where: { id: userId } });

        if (!targetUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const updateData: any = {};
        if (data.firstName !== undefined) updateData.firstName = data.firstName;
        if (data.lastName !== undefined) updateData.lastName = data.lastName;
        if (data.phone !== undefined) updateData.phone = data.phone;
        if (data.username !== undefined) updateData.username = data.username;
        if (data.image !== undefined) updateData.image = data.image;

        if (data.newPassword) {
            // Currect password check is handled by Zod's .refine(), 
            // but we still need to verify the hash match here.
            const isPasswordValid = await bcrypt.compare(data.currentPassword!, targetUser.passwordHash);
            if (!isPasswordValid) {
                return NextResponse.json({ error: "Invalid current password" }, { status: 401 });
            }

            const hashedNewPassword = await bcrypt.hash(data.newPassword, 10);
            updateData.passwordHash = hashedNewPassword;
        }

        const updatedUser = await prisma.user.update({
            where: { id: targetUser.id },
            data: updateData,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                username: true,
                phone: true,
                role: true,
                image: true,
            }
        });

        return NextResponse.json(updatedUser);
    } catch (error: unknown) {
        console.error("Profile PATCH Error Detail:", error);
        return NextResponse.json({
            error: "Failed to update profile",
            details: (error as Error).message || "Unknown error"
        }, { status: 500 });
    }
}
