import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import bcrypt from "bcrypt";
import { decryptSession } from "@/lib/session";

export async function GET() {
    try {
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get("user_session")?.value;
        const session = sessionToken ? await decryptSession(sessionToken) : null;
        const userId = session?.id;

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
    } catch (error: any) {
        console.error("Profile GET Error:", error);
        return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        console.log("Profile PATCH request received");
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get("user_session")?.value;
        const session = sessionToken ? await decryptSession(sessionToken) : null;
        const userId = session?.id;

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { firstName, lastName, phone, username, currentPassword, newPassword, image } = body;

        const targetUser = await prisma.user.findUnique({ where: { id: userId } });

        if (!targetUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const updateData: any = {};
        if (firstName !== undefined) updateData.firstName = firstName;
        if (lastName !== undefined) updateData.lastName = lastName;
        if (phone !== undefined) updateData.phone = phone;
        if (username !== undefined) updateData.username = username;

        if (image !== undefined) {
            updateData.image = image;
        }

        if (newPassword) {
            if (!currentPassword) {
                return NextResponse.json({ error: "Current password is required to set a new password" }, { status: 400 });
            }

            const isPasswordValid = await bcrypt.compare(currentPassword, targetUser.passwordHash);
            if (!isPasswordValid) {
                return NextResponse.json({ error: "Invalid current password" }, { status: 401 });
            }

            const hashedNewPassword = await bcrypt.hash(newPassword, 10);
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
    } catch (error: any) {
        console.error("Profile PATCH Error Detail:", error);
        return NextResponse.json({
            error: "Failed to update profile",
            details: error.message || "Unknown error"
        }, { status: 500 });
    }
}
