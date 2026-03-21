"use server"

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { logAuditAction, getAdminActor } from "./superadmin";

export async function createFundraisingEvent(data: {
    title: string;
    description: string;
    goalAmount?: number;
    endDate?: Date;
}) {
    try {
        const event = await prisma.fundraisingEvent.create({
            data: {
                title: data.title,
                description: data.description,
                goalAmount: data.goalAmount,
                endDate: data.endDate,
                isActive: false, // Default to inactive until admin activates
            }
        });
        
        const actor = await getAdminActor();
        await logAuditAction(actor, "Admin", "CREATED", "Fundraising Event", `Created a new event: ${data.title}`);

        revalidatePath("/dashboard/events");
        return { success: true, event };
    } catch (error: any) {
        console.error("Failed to create fundraising event:", error);
        return { success: false, error: error.message || "Failed to create event" };
    }
}

export async function getFundraisingEvents() {
    try {
        return await prisma.fundraisingEvent.findMany({
            orderBy: { createdAt: "desc" }
        });
    } catch (error) {
        console.error("Failed to fetch fundraising events:", error);
        return [];
    }
}

export async function toggleEventStatus(id: string, isActive: boolean) {
    try {
        await prisma.fundraisingEvent.update({
            where: { id },
            data: { isActive }
        });
        
        const actor = await getAdminActor();
        await logAuditAction(actor, "Admin", "UPDATED", "Fundraising Event", `Toggled status. Event is now ${isActive ? 'Active' : 'Inactive'}.`);

        revalidatePath("/dashboard/events");
        revalidatePath("/dashboard/payments"); // Users see this
        return { success: true };
    } catch (error) {
        console.error("Failed to toggle event status:", error);
        return { success: false };
    }
}

export async function deleteEvent(id: string) {
    try {
        const ev = await prisma.fundraisingEvent.findUnique({ where: { id } });
        await prisma.fundraisingEvent.delete({ where: { id } });
        
        const actor = await getAdminActor();
        if (ev) {
            await logAuditAction(actor, "Admin", "DELETED", "Fundraising Event", `Deleted event: ${ev.title}`);
        }

        revalidatePath("/dashboard/events");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete event:", error);
        return { success: false };
    }
}
