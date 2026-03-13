import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { limiter } from "@/lib/rate-limit";

export async function GET(request: Request) {
    try {
        // Rate Limiting Check
        const ip = request.headers.get("x-forwarded-for") || "anonymous";
        const { success } = await limiter.check(ip);

        if (!success) {
            return NextResponse.json(
                { error: "Too many requests. Please try again later." },
                { status: 429 }
            );
        }

        // Middleware already validated the session and injected headers
        const targetUserId = request.headers.get("X-User-Id");

        if (!targetUserId) {
            return NextResponse.json({ error: "Unauthorized: Missing identity context" }, { status: 401 });
        }

        const userExists = await prisma.user.findUnique({ where: { id: targetUserId } });

        if (!userExists) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "0");
        const limit = parseInt(searchParams.get("limit") || "20");

        const payments = await prisma.payment.findMany({
            where: { userId: targetUserId },
            orderBy: { createdAt: "desc" },
            take: limit,
            skip: page * limit,
            select: {
                id: true,
                transactionId: true,
                createdAt: true,
                amount: true,
                status: true,
                type: true,
                eventId: true,
            }
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
                date: new Date(p.createdAt).toLocaleDateString("en-GB", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                }).split('/').reverse().join('-'), // Returns YYYY-MM-DD safely
                desc: description,
                amount: p.amount,
                status: p.status?.toLowerCase() || "unknown",
                type: p.type
            };
        });

        const totalPayments = await prisma.payment.count({ where: { userId: targetUserId } });

        return NextResponse.json({
            transactions,
            pagination: {
                total: totalPayments,
                page,
                limit,
                pages: Math.ceil(totalPayments / limit)
            }
        });

    } catch (error: unknown) {
        console.error("Payments GET Error:", error);
        return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
    }
}
