import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Use start of day for comparison

        const activeEvents = await prisma.fundraisingEvent.findMany({
            where: {
                isActive: true,
                OR: [
                    { endDate: null },
                    { endDate: { gte: now } }
                ]
            },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json(activeEvents);
    } catch (error) {
        console.error("Failed to fetch active events:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
