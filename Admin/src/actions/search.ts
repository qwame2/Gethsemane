"use server";

import { prisma } from "@/lib/prisma";

export async function globalSearch(query: string) {
    if (!query || query.trim().length === 0) {
        return { success: true, results: [] };
    }

    const q = query.trim();
    const qLower = q.toLowerCase();

    try {
        // Search Users (Platform Members)
        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { firstName: { contains: qLower, mode: "insensitive" } },
                    { lastName: { contains: qLower, mode: "insensitive" } },
                    { email: { contains: qLower, mode: "insensitive" } },
                    { phone: { contains: qLower, mode: "insensitive" } },
                    { username: { contains: qLower, mode: "insensitive" } },
                    { id: { contains: qLower, mode: "insensitive" } }
                ]
            },
            take: 5
        });

        // Search Church Members (General Directory)
        const churchMembers = await prisma.churchMember.findMany({
            where: {
                OR: [
                    { firstName: { contains: qLower, mode: "insensitive" } },
                    { lastName: { contains: qLower, mode: "insensitive" } },
                    { email: { contains: qLower, mode: "insensitive" } },
                    { phone: { contains: qLower, mode: "insensitive" } }
                ]
            },
            take: 5
        });

        // Search Payments/Transactions
        const payments = await prisma.payment.findMany({
            where: {
                OR: [
                    { transactionId: { contains: qLower, mode: "insensitive" } },
                    { type: { contains: qLower, mode: "insensitive" } },
                    { id: { contains: qLower, mode: "insensitive" } }
                ]
            },
            include: {
                user: {
                    select: { firstName: true, lastName: true }
                }
            },
            take: 5
        });

        // Search Payments by Amount (if query is a number)
        let amountPayments: any[] = [];
        if (!isNaN(parseFloat(q))) {
            amountPayments = await prisma.payment.findMany({
                where: {
                    amount: { equals: parseFloat(q) }
                },
                include: {
                    user: {
                        select: { firstName: true, lastName: true }
                    }
                },
                take: 3
            });
        }

        // Search Fundraising Events
        const events = await prisma.fundraisingEvent.findMany({
            where: {
                OR: [
                    { title: { contains: qLower, mode: "insensitive" } },
                    { description: { contains: qLower, mode: "insensitive" } }
                ]
            },
            take: 3
        });

        const mergedPayments = [...payments, ...amountPayments].filter(
            (v, i, a) => a.findIndex(t => (t.id === v.id)) === i
        ).slice(0, 5);

        return {
            success: true,
            results: {
                users,
                churchMembers,
                payments: mergedPayments,
                events
            }
        };

    } catch (error) {
        console.error("Global search error:", error);
        return { success: false, error: "Failed to perform search" };
    }
}
