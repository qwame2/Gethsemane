"use server";

import { prisma } from "@/lib/prisma";

export async function getTotalMembers() {
    try {
        const total = await prisma.user.count();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const previousTotal = await prisma.user.count({
            where: {
                createdAt: {
                    lt: thirtyDaysAgo
                }
            }
        });

        const change = previousTotal === 0 ? 0 : ((total - previousTotal) / previousTotal) * 100;

        return {
            value: total,
            change: `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`,
            changeType: change >= 0 ? 'positive' : 'negative'
        };
    } catch (error) {
        console.error("Failed to fetch total members:", error);
        return { value: 0, change: '+0%', changeType: 'positive' };
    }
}

export async function getMonthlyDuesCollected() {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

        const [currentResult, previousResult] = await Promise.all([
            prisma.payment.aggregate({
                where: {
                    status: "Completed",
                    eventId: null,
                    NOT: { type: { contains: "fundraising" } },
                    createdAt: { gte: startOfMonth }
                },
                _sum: { amount: true }
            }),
            prisma.payment.aggregate({
                where: {
                    status: "Completed",
                    eventId: null,
                    NOT: { type: { contains: "fundraising" } },
                    createdAt: {
                        gte: lastMonthStart,
                        lte: lastMonthEnd
                    }
                },
                _sum: { amount: true }
            })
        ]);

        const current = currentResult._sum.amount || 0;
        const previous = previousResult._sum.amount || 0;
        const change = previous === 0 ? (current > 0 ? 100 : 0) : ((current - previous) / previous) * 100;

        return {
            value: current,
            change: `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`,
            changeType: change >= 0 ? 'positive' : 'negative'
        };
    } catch (error) {
        console.error("Failed to fetch monthly dues:", error);
        return { value: 0, change: '+0%', changeType: 'positive' };
    }
}

export async function getTotalOutstandingArrears() {
    try {
        const result = await prisma.duesProfile.aggregate({
            _sum: {
                totalArrears: true
            }
        });

        const current = result._sum.totalArrears || 0;
        // Arrears is harder to track historical change without snapshotting, so we'll keep it static for now
        return {
            value: current,
            change: "+0%",
            changeType: 'positive'
        };
    } catch (error) {
        console.error("Failed to fetch outstanding arrears:", error);
        return { value: 0, change: '+0%', changeType: 'positive' };
    }
}

export async function getActiveRegistrations() {
    try {
        const now = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

        const [current, previous] = await Promise.all([
            prisma.user.count({
                where: {
                    createdAt: { gte: thirtyDaysAgo }
                }
            }),
            prisma.user.count({
                where: {
                    createdAt: {
                        gte: sixtyDaysAgo,
                        lt: thirtyDaysAgo
                    }
                }
            })
        ]);

        const change = previous === 0 ? (current > 0 ? 100 : 0) : ((current - previous) / previous) * 100;

        return {
            value: current,
            change: `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`,
            changeType: change >= 0 ? 'positive' : 'negative'
        };
    } catch (error) {
        console.error("Failed to fetch active registrations:", error);
        return { value: 0, change: '+0%', changeType: 'positive' };
    }
}

export async function getRecentPayments(): Promise<any[]> {
    try {
        const payments = await prisma.payment.findMany({
            take: 50,
            orderBy: {
                createdAt: "desc"
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        image: true
                    }
                }
            }
        });

        return payments.map(p => ({
            id: p.transactionId || `TRX-${p.id.slice(-4).toUpperCase()}`,
            userId: p.userId,
            member: `${p.user.firstName} ${p.user.lastName}`,
            amount: `GHS ${p.amount.toFixed(2)}`,
            rawAmount: Number(p.amount),
            status: p.status,
            type: (p.eventId || p.type === "fundraising") ? "Fundraising Contribution" : (p.type === "arrears" ? "Arrears Settlement" : "Monthly Dues"),
            date: new Date(p.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }),
            rawDate: p.createdAt,
            avatar: `${p.user.firstName[0]}${p.user.lastName[0]}`.toUpperCase(),
            image: p.user.image
        }));
    } catch (error) {
        console.error("Failed to fetch recent payments:", error);
        return [];
    }
}

export async function getYearlyRevenue() {
    try {
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);

        const payments = await prisma.payment.findMany({
            where: {
                status: "Completed",
                eventId: null,
                NOT: { type: { contains: "fundraising" } },
                createdAt: {
                    gte: startOfYear
                }
            },
            select: {
                amount: true,
                createdAt: true
            }
        });

        // Initialize monthly data
        const monthlyData = Array(12).fill(0);

        payments.forEach(payment => {
            const month = new Date(payment.createdAt).getMonth();
            monthlyData[month] += Number(payment.amount);
        });

        // Find max for scaling (minimum 100 to avoid division by zero issues)
        const maxVal = Math.max(...monthlyData, 100);

        return monthlyData.map((val, i) => ({
            month: i,
            amount: val,
            percentage: (val / maxVal) * 100
        }));
    } catch (error) {
        console.error("Failed to fetch yearly revenue:", error);
        return Array(12).fill(0).map((_, i) => ({ month: i, amount: 0, percentage: 0 }));
    }
}

export async function getAllMembers() {
    try {
        const members = await prisma.user.findMany({
            select: {
                id: true,
                firstName: true,
                lastName: true,
                image: true
            },
            orderBy: {
                firstName: 'asc'
            }
        });
        return members;
    } catch (error) {
        console.error("Failed to fetch members for transaction:", error);
        return [];
    }
}

export async function createTransaction(data: {
    userId: string;
    amount: number;
    type: string;
    status: string;
    eventId?: string;
}) {
    try {
        const transactionId = `TRX-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

        const result = await prisma.$transaction(async (tx) => {
            const payment = await tx.payment.create({
                data: {
                    userId: data.userId,
                    amount: data.amount,
                    type: data.type,
                    status: data.status,
                    transactionId: transactionId,
                    eventId: data.eventId
                }
            });

            // Update respective profiles based on payment type
            if (data.status === "Completed") {
                if (data.type === "monthly") {
                    await tx.duesProfile.upsert({
                        where: { userId: data.userId },
                        update: { status: "Paid", totalPaid: { increment: data.amount } },
                        create: { userId: data.userId, status: "Paid", totalPaid: data.amount }
                    });
                } else if (data.type === "arrears") {
                    await tx.duesProfile.update({
                        where: { userId: data.userId },
                        data: {
                            totalArrears: { decrement: data.amount },
                            totalPaid: { increment: data.amount }
                        }
                    });
                } else if (data.type === "fundraising" && data.eventId) {
                    await tx.fundraisingEvent.update({
                        where: { id: data.eventId },
                        data: { raisedAmount: { increment: data.amount } }
                    });
                }
            }

            return payment;
        });

        return { success: true, transactionId: result.transactionId };
    } catch (error) {
        console.error("Failed to create transaction:", error);
        return { success: false, error: "Failed to record transaction" };
    }
}

export async function getActiveFundraising() {
    try {
        const activeEvent = await prisma.fundraisingEvent.findFirst({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' }
        });

        if (!activeEvent) return null;

        // Optionally, recalculate raisedAmount from payments to ensure real-time accuracy
        const raisedFromPayments = await prisma.payment.aggregate({
            where: {
                eventId: activeEvent.id,
                status: "Completed"
            },
            _sum: { amount: true }
        });

        const totalRaised = raisedFromPayments._sum.amount || 0;
        const goal = activeEvent.goalAmount || 0;
        const percentage = goal > 0 ? (totalRaised / goal) * 100 : 0;

        return {
            id: activeEvent.id,
            title: activeEvent.title,
            description: activeEvent.description,
            raisedAmount: totalRaised,
            goalAmount: goal,
            percentage: Math.min(percentage, 100)
        };
    } catch (error) {
        console.error("Failed to fetch active fundraising:", error);
        return null;
    }
}
