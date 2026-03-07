"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcrypt";
import { cookies } from "next/headers";

export async function getSystemSettings() {
    try {
        let settings = await prisma.systemSettings.findUnique({
            where: { id: "singleton" }
        });

        if (!settings) {
            settings = await prisma.systemSettings.create({
                data: {
                    id: "singleton",
                    churchName: "Gethsemane Assemble",
                    churchEmail: "support@gethsemane.com",
                    churchPhone: "+233 24 000 0000",
                    churchAddress: "Accra, Ghana",
                    yearlyDues: 240.0,
                    monthlyDues: 20.0,
                    latePenalty: 20.0,
                    currency: "GHS"
                }
            });
        }

        return settings;
    } catch (error) {
        console.error("Failed to fetch settings:", error);
        throw new Error("Could not load system settings");
    }
}

export async function updateSystemSettings(formData: FormData) {
    try {
        const updateData: any = {};

        const fields = ["churchName", "churchEmail", "churchPhone", "churchAddress", "currency"];
        const numericFields = ["yearlyDues", "monthlyDues", "latePenalty"];

        fields.forEach(field => {
            const value = formData.get(field);
            if (value !== null) updateData[field] = value as string;
        });

        numericFields.forEach(field => {
            const value = formData.get(field);
            if (value !== null) {
                const parsed = parseFloat(value as string);
                if (!isNaN(parsed)) updateData[field] = parsed;
            }
        });

        if (Object.keys(updateData).length === 0) {
            return { success: false, error: "No changes to save" };
        }

        const updated = await prisma.systemSettings.upsert({
            where: { id: "singleton" },
            update: updateData,
            create: { id: "singleton", ...updateData }
        });

        revalidatePath("/dashboard/settings");
        return { success: true, settings: updated };
    } catch (error: any) {
        console.error("Failed to update settings:", error);
        return {
            success: false,
            error: error.message || "An unexpected database error occurred while saving."
        };
    }
}

export async function updateAdminSecurity(formData: FormData) {
    try {
        const cookieStore = await cookies();
        const adminId = cookieStore.get("admin_session")?.value;
        if (!adminId) return { success: false, error: "Unauthorized" };

        const currentPassword = formData.get("currentPassword") as string;
        const newPassword = formData.get("newPassword") as string;

        if (!currentPassword || !newPassword) {
            return { success: false, error: "Both current and new passwords are required." };
        }
        if (newPassword.length < 8) {
            return { success: false, error: "New password must be at least 8 characters long." };
        }

        const admin = await prisma.admin.findUnique({ where: { id: adminId } });
        if (!admin) return { success: false, error: "Admin profile not found." };

        const passwordMatch = await bcrypt.compare(currentPassword, admin.passwordHash);
        if (!passwordMatch) {
            return { success: false, error: "Incorrect current password." };
        }

        const newHash = await bcrypt.hash(newPassword, 10);
        await prisma.admin.update({
            where: { id: adminId },
            data: { passwordHash: newHash }
        });

        return { success: true, message: "Password updated successfully!" };
    } catch (error: any) {
        console.error("Failed to update security:", error);
        return { success: false, error: "Failed to update security settings." };
    }
}