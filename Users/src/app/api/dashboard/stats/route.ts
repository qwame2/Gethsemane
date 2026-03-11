import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { decryptSession } from "@/lib/session";

export const dynamic = "force-dynamic";


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

        const now = new Date();
        const currentYear = now.getFullYear();
        const prevYear = currentYear - 1;
        const yearStartDate = new Date(currentYear, 0, 1);
        const prevYearStartDate = new Date(prevYear, 0, 1);

        const duesProfile = await prisma.duesProfile.findUnique({
            where: { userId: targetUserId }
        });

        // Fetch all payments for current and previous year
        const allPayments = await prisma.payment.findMany({
            where: {
                userId: targetUserId,
                status: "Completed",
                createdAt: {
                    gte: prevYearStartDate
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const currentYearPayments = allPayments.filter(p => p.createdAt >= yearStartDate);
        const prevYearPayments = allPayments.filter(p => p.createdAt < yearStartDate);


        // 1. Current Year Stats
        const curDuesPayments = currentYearPayments.filter(p => !p.eventId && !p.type?.toLowerCase().includes("fundraising"));
        const totalAmountPaid = curDuesPayments.reduce((sum, p) => sum + p.amount, 0);

        // 2. Previous Year Stats
        const prevDuesPayments = prevYearPayments.filter(p => !p.eventId && !p.type?.toLowerCase().includes("fundraising"));
        const prevTotalAmountPaid = prevDuesPayments.reduce((sum, p) => sum + p.amount, 0);

        // 2. Fetch or Initialize System Settings for Financial Rates
        const settings = await prisma.systemSettings.upsert({
            where: { id: "singleton" },
            update: {},
            create: {
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

        const YEARLY_FEE = settings.yearlyDues;
        const MONTHLY_RATE = settings.monthlyDues;
        const LATE_PENALTY_RATE = settings.latePenalty;

        // 3. Calculate Carryover Arrears from Previous Year
        // (Only if user existed in previous year)
        const userJoinDate = userExists.createdAt;
        const joinedBeforeThisYear = userJoinDate < yearStartDate;

        let carryoverArrears = 0;
        if (joinedBeforeThisYear) {
            const prevYearTarget = YEARLY_FEE;
            carryoverArrears = Math.max(0, prevYearTarget - prevTotalAmountPaid);
        }

        // 4. Calculate Current Year Progress
        const memberCreatedAt = userExists.createdAt;
        const effectiveCalculationStart = memberCreatedAt > yearStartDate ? memberCreatedAt : yearStartDate;

        let monthsElapsed = (now.getFullYear() - effectiveCalculationStart.getFullYear()) * 12 + (now.getMonth() - effectiveCalculationStart.getMonth());
        if (monthsElapsed < 1) monthsElapsed = (now.getMonth() === effectiveCalculationStart.getMonth()) ? 1 : 0;
        if (monthsElapsed < 0) monthsElapsed = 0;

        const minimumExpectedThisYear = monthsElapsed * MONTHLY_RATE;

        // 5. Calculate Arrears and Penalties
        let curYearOutstanding = 0;
        let missedMonths = 0;
        let lateFees = 0;

        if (totalAmountPaid < minimumExpectedThisYear) {
            curYearOutstanding = minimumExpectedThisYear - totalAmountPaid;
            missedMonths = Math.floor(curYearOutstanding / MONTHLY_RATE);
            lateFees = missedMonths * LATE_PENALTY_RATE;
        }

        // Total Arrears = Previous Year Deficit + Current Year Outstanding + Penalties
        const totalArrears = carryoverArrears + curYearOutstanding + lateFees;

        // 6. Remaining Balance (Total Yearly + All Arrears)
        const remainingBalance = Math.max(0, YEARLY_FEE - totalAmountPaid);

        // 7. Calculate Next Due Date
        const nextDueDate = new Date(now.getFullYear(), now.getMonth() + 1, 1).toLocaleDateString();

        // 8. Progress Percentage (Based on current year focus)
        const progressPercentage = Math.min(100, Math.round((totalAmountPaid / YEARLY_FEE) * 100));

        // 8.5 Format recent payment history
        const paymentHistory = allPayments.map(p => {
            const type = p.type?.toLowerCase() || "";
            let method = "Monthly Dues";

            if (p.eventId || type === "fundraising") {
                method = "Fundraising Contribution";
            } else if (type === "full" || type === "yearly") {
                method = "Full Payment";
            } else if (type === "installment") {
                method = "Installment";
            } else if (type === "arrears") {
                method = "Arrears Settlement";
            }

            return {
                id: p.id,
                date: p.createdAt.toLocaleDateString(),
                amount: Math.round(p.amount),
                method,
                purpose: method // Use the friendly method name as purpose
            };
        });

        // 9. Generate Monthly Calendars
        const currentMonthIndex = now.getMonth();

        // Current Year Calendar
        const yearlyCalendar = Array.from({ length: 12 }).map((_, i) => {
            const minRequiredToCoverThisMonth = (i + 1) * MONTHLY_RATE;
            let status = "Upcoming";

            if (totalAmountPaid >= minRequiredToCoverThisMonth) {
                status = "Paid";
            } else if (i <= currentMonthIndex) {
                status = "Owing";
            }

            return {
                monthIndex: i,
                monthName: new Date(currentYear, i, 1).toLocaleString('default', { month: 'short' }),
                status
            };
        });

        // Previous Year Calendar (Only if they were members)
        const previousYearCalendar = joinedBeforeThisYear ? Array.from({ length: 12 }).map((_, i) => {
            const minRequiredToCoverThisMonth = (i + 1) * MONTHLY_RATE;
            let status = "Owing";

            if (prevTotalAmountPaid >= minRequiredToCoverThisMonth) {
                status = "Paid";
            }

            return {
                monthIndex: i,
                monthName: new Date(prevYear, i, 1).toLocaleString('default', { month: 'short' }),
                status
            };
        }) : [];

        return NextResponse.json({
            yearlyFee: YEARLY_FEE,
            totalAmountPaid,
            remainingBalance,
            carryoverArrears,
            outstandingBalance: curYearOutstanding + carryoverArrears,
            lateFees,
            totalArrears,
            totalBalanceToPay: remainingBalance + carryoverArrears + lateFees,
            progressPercentage,
            nextDueDate,
            yearlyCalendar,
            previousYearCalendar,
            paymentHistory,
            currentMonthDue: totalArrears > 0 ? totalArrears : (remainingBalance > 0 ? MONTHLY_RATE : 0),
            status: totalArrears > 0 ? "Arrears" : (remainingBalance <= 0 ? "Fully Paid" : "Paid"),
            currentYear,
            prevYear
        });

    } catch (error: any) {
        console.error("Dashboard Stats GET Error:", error);
        // Fallback for UI so it doesn't stay in "Loading..."
        return NextResponse.json({
            error: "Failed to fetch stats",
            status: "Error",
            yearlyCalendar: [],
            paymentHistory: [],
            totalAmountPaid: 0,
            remainingBalance: 240,
            progressPercentage: 0
        }, { status: 500 });
    }
}
