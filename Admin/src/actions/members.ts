"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { logAuditAction, getAdminActor } from "./superadmin";

export async function getMembers(search?: string) {
    try {
        const now = new Date();
        const currentYear = now.getFullYear();
        const yearStartDate = new Date(currentYear, 0, 1);

        const members = await prisma.user.findMany({
            where: search ? {
                OR: [
                    { firstName: { contains: search, mode: 'insensitive' } },
                    { lastName: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                    { phone: { contains: search, mode: 'insensitive' } },
                ]
            } : {},
            include: {
                duesProfile: true,
                payments: {
                    where: {
                        status: "Completed",
                        createdAt: { gte: yearStartDate }
                    }
                },
                _count: {
                    select: { payments: true }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return members.map(m => {
            const profile = m.duesProfile;
            const duesPayments = m.payments.filter(p => !p.eventId && !p.type?.toLowerCase().includes("fundraising"));
            const totalPaidThisYear = duesPayments.reduce((sum, p) => sum + p.amount, 0);

            const yearlyGoal = profile?.yearlyAmount || 240;
            const monthlyGoal = profile?.currentMonthDue || 20;

            let status = profile?.status || "Unpaid";

            // Recalculate status based on true payment history
            if (totalPaidThisYear >= yearlyGoal && yearlyGoal > 0) {
                status = "Fully Paid";
            } else if (totalPaidThisYear > 0) {
                // If they've paid something, check if it covers through the current month
                const monthsElapsed = now.getMonth() + 1;
                const expectedByNow = monthsElapsed * (yearlyGoal / 12);

                if (totalPaidThisYear >= expectedByNow) {
                    status = "Paid";
                } else {
                    status = "Partially Paid";
                }
            }

            return {
                id: m.id,
                name: `${m.firstName} ${m.lastName}`,
                email: m.email,
                phone: m.phone || "N/A",
                role: m.role,
                joinDate: new Date(m.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                }),
                image: m.image,
                duesStatus: status,
                totalArrears: profile?.totalArrears || 0,
                paymentCount: m._count.payments,
                initials: `${m.firstName[0]}${m.lastName[0]}`.toUpperCase()
            };
        });
    } catch (error) {
        console.error("Failed to fetch members:", error);
        return [];
    }
}

export async function deleteMember(id: string) {
    try {
        const member = await prisma.user.findUnique({ where: { id }});
        await prisma.user.delete({
            where: { id }
        });

        if (member) {
            const actor = await getAdminActor();
            await logAuditAction(actor, "Admin", "DELETED", "Member", `Erased member profile: ${member.firstName} ${member.lastName} (${member.email})`);
        }

        return { success: true };
    } catch (error) {
        console.error("Failed to delete member:", error);
        throw new Error("Failed to delete member");
    }
}

import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function createMember(data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: string;
    image?: string; // base64 string
}) {
    try {
        const defaultPassword = "welcome@gethsemane";
        const passwordHash = await bcrypt.hash(defaultPassword, 10);

        let dbImagePath = null;
        if (data.image && data.image.startsWith('data:image')) {
            try {
                const base64Data = data.image.split(',')[1];
                const buffer = Buffer.from(base64Data, 'base64');
                const filename = `youth-${Date.now()}.jpg`;
                const uploadDir = path.join(process.cwd(), "public", "uploads", "members");
                await mkdir(uploadDir, { recursive: true });
                const filepath = path.join(uploadDir, filename);
                await writeFile(filepath, buffer);
                dbImagePath = `/uploads/members/${filename}`;
            } catch (uploadError) {
                console.error("Youth image upload failed:", uploadError);
            }
        }

        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    firstName: data.firstName,
                    lastName: data.lastName,
                    email: data.email,
                    phone: data.phone,
                    role: data.role,
                    passwordHash: passwordHash,
                    image: dbImagePath
                }
            });

            const settings = await tx.systemSettings.findUnique({ where: { id: "singleton" } });

            await tx.duesProfile.create({
                data: {
                    userId: user.id,
                    status: "Unpaid",
                    totalArrears: 0,
                    currentMonthDue: settings?.monthlyDues || 20.0
                }
            });

            return user;
        });

        const actor = await getAdminActor();
        await logAuditAction(actor, "Admin", "CREATED", "Member", `Registered new member: ${data.firstName} ${data.lastName} (${data.email})`);

        return { success: true, user: result };
    } catch (error: any) {
        console.error("Failed to create member:", error);
        if (error.code === "P2002") {
            return { success: false, error: "A member with this email already exists." };
        }
        return { success: false, error: "Failed to create member. Please try again." };
    }
}

export async function updateMemberContact(id: string, data: { email: string; phone: string }) {
    try {
        await prisma.user.update({
            where: { id },
            data: {
                email: data.email,
                phone: data.phone
            }
        });
        return { success: true };
    } catch (error: any) {
        console.error("Failed to update contact:", error);
        return { success: false, error: "Failed to update contact details." };
    }
}

export async function updateMemberDues(id: string, data: { status: string; totalArrears: number }) {
    try {
        const profile = await prisma.duesProfile.findUnique({ where: { userId: id }, include: { user: true }});
        
        await prisma.duesProfile.update({
            where: { userId: id },
            data: {
                status: data.status,
                totalArrears: data.totalArrears
            }
        });

        if (profile?.user) {
            const actor = await getAdminActor();
            const actionType = (data.totalArrears > profile.totalArrears) ? "Increased" : (data.totalArrears < profile.totalArrears ? "Decreased" : "Modified");
            await logAuditAction(actor, "Admin", "UPDATED", "Dues Profile", `${actionType} total arrears to ${data.totalArrears} for ${profile.user.firstName} ${profile.user.lastName}`);
        }

        return { success: true };
    } catch (error: any) {
        console.error("Failed to update dues:", error);
        return { success: false, error: "Failed to update dues status." };
    }
}
