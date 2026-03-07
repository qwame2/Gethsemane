import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { decryptSession } from "@/lib/session";

export async function GET() {
    try {
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get("user_session")?.value;
        const session = sessionToken ? await decryptSession(sessionToken) : null;
        const userId = session?.id;

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                payments: {
                    orderBy: { createdAt: "desc" },
                    take: 10 // Get latest 10 payments
                },
                duesProfile: true
            }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const notifications = [];
        const dismissed = (user as any).dismissedNotifications || [];

        // 1. Arrears Alert
        if (user.duesProfile && user.duesProfile.totalArrears > 0) {
            const arrearsId = `arrears-${user.id}-${new Date().getMonth()}`;
            if (!dismissed.includes(arrearsId)) {
                notifications.push({
                    id: arrearsId,
                    category: "payment",
                    title: "Arrears Alert",
                    description: `You have an outstanding balance of GH₵${user.duesProfile.totalArrears.toFixed(2)}. Immediate settlement requested to stay in good standing.`,
                    time: "Current",
                    date: new Date().toLocaleDateString(),
                    iconName: "CreditCard",
                    color: "bg-red-50 text-red-600",
                    isRead: false,
                    action: { label: `Pay GH₵${user.duesProfile.totalArrears.toFixed(2)}`, href: "/arrears" }
                });
            }
        }

        // 2. Payments Success Notifications
        user.payments.forEach(payment => {
            const dateObj = new Date(payment.createdAt);
            const timeString = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const dateString = dateObj.toLocaleDateString();

            if (payment.status.toLowerCase() === "completed") {
                const isArrears = payment.type === "arrears";
                const isFundraising = payment.eventId || payment.type?.toLowerCase().includes("fundraising");
                const paymentId = `payment-${payment.id}`;
                if (!dismissed.includes(paymentId)) {
                    notifications.push({
                        id: paymentId,
                        category: "payment",
                        title: "Payment Successful",
                        description: `Your payment of GH₵${payment.amount.toFixed(2)} for ${isFundraising ? "Fundraising Donation" : (isArrears ? "Arrears Settlement" : "Monthly Dues")} has been confirmed and updated in your records.`,
                        time: timeString,
                        date: dateString,
                        iconName: "CreditCard",
                        color: "bg-emerald-50 text-emerald-600",
                        isRead: true,
                        action: { label: "View Receipt", href: "/transactions" }
                    });
                }
            } else if (payment.status.toLowerCase() === "pending") {
                const pendingId = `payment-pending-${payment.id}`;
                if (!dismissed.includes(pendingId)) {
                    notifications.push({
                        id: pendingId,
                        category: "payment",
                        title: "Payment Pending",
                        description: `Your payment of GH₵${payment.amount.toFixed(2)} is pending verification.`,
                        time: timeString,
                        date: dateString,
                        iconName: "CreditCard",
                        color: "bg-amber-50 text-amber-600",
                        isRead: false,
                        action: { label: "Check Status", href: "/transactions" }
                    });
                }
            }
        });

        // 3. Welcome / Account Update
        if (user.createdAt) {
            const dateObj = new Date(user.createdAt);
            const timeString = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const dateString = dateObj.toLocaleDateString();

            const welcomeId = `welcome-${user.id}`;
            if (!dismissed.includes(welcomeId)) {
                notifications.push({
                    id: welcomeId,
                    category: "system",
                    title: "Welcome to Gethsemane!",
                    description: "Your account has been successfully created and your member profile is active.",
                    time: timeString,
                    date: dateString,
                    iconName: "UserCircle",
                    color: "bg-blue-50 text-blue-600",
                    isRead: true
                });
            }
        }

        return NextResponse.json(notifications);

    } catch (error: any) {
        console.error("Notifications GET Error:", error);
        return NextResponse.json({ error: "Failed to load notifications" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get("user_session")?.value;
        const session = sessionToken ? await decryptSession(sessionToken) : null;
        const userId = session?.id;

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { ids } = body; // Array of IDs to dismiss

        if (!ids || !Array.isArray(ids)) {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
        }

        // Get current user to append the new dismissed IDs
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        try {
            await (prisma.user as any).update({
                where: { id: userId },
                data: { dismissedNotifications: { push: ids } }
            });
        } catch (error) {
            console.error("Notifications DELETE Error:", error);
            return NextResponse.json({ error: "Failed to delete notifications" }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Notifications DELETE Error:", error);
        return NextResponse.json({ error: "Failed to delete notifications" }, { status: 500 });
    }
}
