import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { decryptSession } from "@/lib/session";

export async function GET() {
    try {
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get("user_session")?.value;
        const session = sessionToken ? await decryptSession(sessionToken) : null;
        const targetUserId = session?.id;

        if (!targetUserId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userExists = await prisma.user.findUnique({ where: { id: targetUserId } });

        if (!userExists) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const payments = await prisma.payment.findMany({
            where: { userId: targetUserId },
            orderBy: { createdAt: "desc" },
        });

        // Map database fields to UI fields
        const transactions = payments.map(p => {
            let description = "Monthly Dues Payment";

            if (p.eventId || p.type?.toLowerCase() === "fundraising") {
                description = "Fundraising Contribution";
            } else if (p.type === "arrears") {
                description = "Arrears Settlement";
            } else if (p.type === "full" || p.type === "yearly") {
                description = "Full Yearly Dues";
            } else if (p.type === "installment") {
                description = "Dues Installment";
            }

            return {
                id: p.transactionId || p.id,
                date: p.createdAt.toISOString().split('T')[0],
                desc: description,
                amount: p.amount,
                status: p.status.toLowerCase(),
                type: p.type
            };
        });

        return NextResponse.json(transactions);

    } catch (error: any) {
        console.error("Payments GET Error:", error);
        return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
    }
}
