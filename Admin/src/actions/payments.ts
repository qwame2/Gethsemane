"use server";

import { prisma } from "@/lib/prisma";

export async function getPaymentsStats() {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);

        const [monthlyDues, monthlyFund, yearlyDues, yearlyFund, totalDues, totalFund] = await Promise.all([
            // Monthly
            prisma.payment.aggregate({
                where: { status: "Completed", createdAt: { gte: startOfMonth }, eventId: null, NOT: { type: { contains: "fundraising", mode: "insensitive" } } },
                _sum: { amount: true }
            }),
            prisma.payment.aggregate({
                where: { status: "Completed", createdAt: { gte: startOfMonth }, OR: [{ eventId: { not: null } }, { type: { contains: "fundraising", mode: "insensitive" } }] },
                _sum: { amount: true }
            }),
            // Yearly
            prisma.payment.aggregate({
                where: { status: "Completed", createdAt: { gte: startOfYear }, eventId: null, NOT: { type: { contains: "fundraising", mode: "insensitive" } } },
                _sum: { amount: true }
            }),
            prisma.payment.aggregate({
                where: { status: "Completed", createdAt: { gte: startOfYear }, OR: [{ eventId: { not: null } }, { type: { contains: "fundraising", mode: "insensitive" } }] },
                _sum: { amount: true }
            }),
            // Total
            prisma.payment.aggregate({
                where: { status: "Completed", eventId: null, NOT: { type: { contains: "fundraising", mode: "insensitive" } } },
                _sum: { amount: true }
            }),
            prisma.payment.aggregate({
                where: { status: "Completed", OR: [{ eventId: { not: null } }, { type: { contains: "fundraising", mode: "insensitive" } }] },
                _sum: { amount: true }
            })
        ]);

        return {
            monthlyDues: monthlyDues._sum.amount || 0,
            monthlyFund: monthlyFund._sum.amount || 0,
            yearlyDues: yearlyDues._sum.amount || 0,
            yearlyFund: yearlyFund._sum.amount || 0,
            totalDues: totalDues._sum.amount || 0,
            totalFund: totalFund._sum.amount || 0,
            // Keep legacy fields for backward compatibility if needed, but we'll update the component
            monthly: (monthlyDues._sum.amount || 0) + (monthlyFund._sum.amount || 0),
            yearly: (yearlyDues._sum.amount || 0) + (yearlyFund._sum.amount || 0),
            total: (totalDues._sum.amount || 0) + (totalFund._sum.amount || 0)
        };
    } catch (error) {
        console.error("Failed to fetch payment stats:", error);
        return {
            monthlyDues: 0, monthlyFund: 0,
            yearlyDues: 0, yearlyFund: 0,
            totalDues: 0, totalFund: 0,
            monthly: 0, yearly: 0, total: 0
        };
    }
}

export async function getAllPayments(search?: string) {
    try {
        const users = await prisma.user.findMany({
            where: {
                payments: {
                    some: { status: "Completed" }
                },
                ...(search ? {
                    OR: [
                        { firstName: { contains: search, mode: 'insensitive' } },
                        { lastName: { contains: search, mode: 'insensitive' } },
                        { email: { contains: search, mode: 'insensitive' } }
                    ]
                } : {})
            },
            include: {
                payments: {
                    where: { status: "Completed" },
                    orderBy: { createdAt: "desc" }
                }
            }
        });

        const settings = await prisma.systemSettings.findUnique({ where: { id: "singleton" } });
        const MONTHLY_RATE = settings?.monthlyDues || 20;

        return users.map(u => {
            const duesPayments = u.payments.filter(p => !p.eventId && !p.type?.toLowerCase().includes("fundraising"));
            const totalContributed = duesPayments.reduce((sum, p) => sum + p.amount, 0);
            const latest = u.payments[0];

            // Generate cumulative yearly calendar (Cumulative logic to match User page)
            const currentMonthIndex = new Date().getMonth();
            const yearlyCalendar = Array.from({ length: 12 }).map((_, i) => {
                const requiredToCover = (i + 1) * MONTHLY_RATE;
                let status = "Upcoming";
                if (totalContributed >= requiredToCover) {
                    status = "Paid";
                } else if (i <= currentMonthIndex) {
                    status = "Owing";
                }
                return {
                    monthIndex: i,
                    monthName: new Date(new Date().getFullYear(), i, 1).toLocaleString('default', { month: 'short' }),
                    status
                };
            });

            return {
                id: latest.transactionId || `TRX-${latest.id.slice(-4).toUpperCase()}`,
                rawId: latest.id,
                userId: u.id,
                member: `${u.firstName} ${u.lastName}`,
                email: u.email,
                totalAmount: totalContributed,
                latestAmount: latest.amount,
                status: latest.status,
                type: latest.eventId || latest.type?.toLowerCase().includes("fundraising")
                    ? "Fundraising"
                    : (latest.type === "arrears" ? "Arrears Settlement" : "Monthly Dues"),
                date: new Date(latest.createdAt).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                }),
                rawDate: latest.createdAt,
                image: u.image,
                paymentCount: u.payments.length,
                yearlyCalendar: yearlyCalendar,
                history: u.payments
            };
        });
    } catch (error) {
        console.error("Failed to fetch payment summaries:", error);
        return [];
    }
}

export async function getDetailedFinancialReport(mode: 'monthly' | 'yearly' = 'monthly') {
    try {
        const now = new Date();
        const currentYear = now.getFullYear();

        let startDate, endDate, prevStartDate, prevEndDate, displayPeriod;

        if (mode === 'monthly') {
            startDate = new Date(currentYear, now.getMonth(), 1);
            endDate = new Date(currentYear, now.getMonth() + 1, 0);
            prevStartDate = new Date(currentYear, now.getMonth() - 1, 1);
            prevEndDate = new Date(currentYear, now.getMonth(), 0);
            displayPeriod = now.toLocaleString('default', { month: 'long' });
        } else {
            startDate = new Date(currentYear, 0, 1);
            endDate = new Date(currentYear, 11, 31);
            prevStartDate = new Date(currentYear - 1, 0, 1);
            prevEndDate = new Date(currentYear - 1, 11, 31);
            displayPeriod = `the Full Year ${currentYear}`;
        }

        const [currentStats, prevStats, countCurrent, typeBreakdown] = await Promise.all([
            prisma.payment.aggregate({
                where: { status: "Completed", createdAt: { gte: startDate, lte: endDate } },
                _sum: { amount: true }
            }),
            prisma.payment.aggregate({
                where: { status: "Completed", createdAt: { gte: prevStartDate, lte: prevEndDate } },
                _sum: { amount: true }
            }),
            prisma.payment.count({
                where: { status: "Completed", createdAt: { gte: startDate, lte: endDate } }
            }),
            prisma.payment.groupBy({
                by: ['type'],
                where: { status: "Completed", createdAt: { gte: startDate, lte: endDate } },
                _sum: { amount: true }
            })
        ]);

        const yearToDate = await prisma.payment.aggregate({
            where: { status: "Completed", createdAt: { gte: new Date(currentYear, 0, 1) } },
            _sum: { amount: true }
        });

        return {
            mode,
            currentTotal: currentStats._sum.amount || 0,
            prevTotal: prevStats._sum.amount || 0,
            yearToDateTotal: yearToDate._sum.amount || 0,
            contributorsCount: countCurrent,
            typeBreakdown: typeBreakdown.map(t => ({
                type: (t.type.toLowerCase().includes("fundraising") || t.type.startsWith("Fundraising:"))
                    ? "Fundraising & Donations"
                    : (t.type === "arrears" ? "Arrears Settlement" : "Monthly Dues"),
                amount: t._sum.amount || 0
            })),
            periodName: displayPeriod,
            year: currentYear
        };
    } catch (error) {
        console.error("Failed to fetch detailed report data:", error);
        return null;
    }
}
