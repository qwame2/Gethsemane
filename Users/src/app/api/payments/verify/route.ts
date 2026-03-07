import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { decryptSession } from "@/lib/session";

/**
 * Shared verification logic usable by both GET and POST
 */
async function verifyTransaction(reference: string, type?: string, eventId?: string, sessionUserId?: string) {
    if (!reference) {
        return { error: "Reference is required", status: 400 };
    }

    // 1. Prevent Double Spending / Replay Attacks
    const existingTx = await prisma.payment.findUnique({
        where: { transactionId: reference }
    });

    if (existingTx) {
        return {
            success: true,
            payment: existingTx,
            alreadyProcessed: true,
            message: "This transaction has already been processed."
        };
    }

    // 2. Verify transaction with Paystack
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
    });

    const paystackData = await response.json();

    if (!paystackData.status || paystackData.data.status !== "success") {
        return { error: "Transaction verification failed", status: 400 };
    }

    // 3. Robustly resolve necessary fields (UserId, Type, EventId)
    // We check Paystack metadata first, then database intent records
    let metadata = paystackData.data.metadata || {};

    // Sometimes Paystack returns metadata as a string instead of an object
    if (typeof metadata === "string") {
        try {
            metadata = JSON.parse(metadata);
        } catch (e) {
            metadata = {};
        }
    }

    let finalUserId = sessionUserId || metadata.userId;
    let finalType = type || metadata.paymentType;
    let finalEventId = eventId || metadata.eventId;

    console.log(`[VERIFY-DEBUG] Initial - userId: ${finalUserId}, type: ${finalType}, eventId: ${finalEventId}`);

    // Source of Truth: Look up PaymentIntent (Always check this as it's our own record)
    let intent = await (prisma as any).paymentIntent.findUnique({
        where: { reference }
    });

    // Paystack might return a completely different generated reference string.
    // So if the intent fails by reference, aggressively match via securely passed intentId
    if (!intent && metadata.intentId) {
        intent = await (prisma as any).paymentIntent.findUnique({
            where: { id: metadata.intentId }
        });
    }

    if (intent) {
        console.log(`[VERIFY-DEBUG] Intent found:`, intent);
        finalUserId = finalUserId || intent.userId;

        // Prioritize specific intent type over metadata fallback
        if (!finalType || finalType === "payment" || finalType === "undefined") {
            finalType = intent.type;
        }

        // CRITICAL BUG FIX: If intent has an eventId, force it.
        // This stops Paystack from dropping the ID via metadata stringification issues.
        if (intent.eventId) {
            finalEventId = intent.eventId;
        } else {
            finalEventId = finalEventId || intent.eventId;
        }
    }

    console.log(`[VERIFY-DEBUG] Resolved - userId: ${finalUserId}, type: ${finalType}, eventId: ${finalEventId}`);

    if (!finalUserId) {
        return { error: "Could not identify user for this transaction", status: 401 };
    }

    const rawPaystackAmount = paystackData.data.amount / 100; // Paystack returns in kobo
    const actualAmount = Math.round((rawPaystackAmount / 1.0355) * 100) / 100;

    // 4. Create transaction record in database
    const payment = await prisma.payment.create({
        data: {
            userId: finalUserId,
            amount: actualAmount,
            type: finalType || "payment",
            eventId: finalEventId,
            status: "Completed",
            transactionId: reference
        }
    });

    // 5. Update related business entities
    const isFundraising = finalEventId || finalType?.toLowerCase().includes("fundraising");

    if (isFundraising) {
        // Handle Fundraising logic only
        if (finalEventId) {
            await prisma.fundraisingEvent.update({
                where: { id: finalEventId },
                data: {
                    raisedAmount: { increment: actualAmount }
                }
            });
        }
        // If it's fundraising, we STOP here and don't touch DuesProfile
    } else {
        // Update Dues/Arrears only if NOT fundraising
        if (finalType === "arrears") {
            const duesProfile = await prisma.duesProfile.findUnique({
                where: { userId: finalUserId }
            });
            if (duesProfile) {
                await prisma.duesProfile.update({
                    where: { userId: finalUserId },
                    data: {
                        totalArrears: { decrement: actualAmount },
                        totalPaid: { increment: actualAmount }
                    }
                });
            }
        } else if (["dues", "monthly", "full", "yearly"].includes(finalType)) {
            const duesProfile = await prisma.duesProfile.findUnique({
                where: { userId: finalUserId }
            });

            if (duesProfile) {
                const settings = await prisma.systemSettings.findUnique({ where: { id: "singleton" } });
                const MONTHLY_RATE = settings?.monthlyDues || 20;
                const YEARLY_GOAL = settings?.yearlyDues || 240;

                const currentDue = duesProfile.currentMonthDue || MONTHLY_RATE;
                const newDue = Math.max(0, currentDue - actualAmount);
                const newTotalPaid = (duesProfile.totalPaid || 0) + actualAmount;

                let finalStatus = "Partially Paid";
                if (newTotalPaid >= YEARLY_GOAL) {
                    finalStatus = "Fully Paid";
                } else if (newDue <= 0) {
                    finalStatus = "Paid";
                }

                await prisma.duesProfile.update({
                    where: { userId: finalUserId },
                    data: {
                        currentMonthDue: newDue,
                        totalPaid: newTotalPaid,
                        status: finalStatus
                    }
                });
            }
        }
    }

    // Mark intent as completed if it exists
    try {
        await (prisma as any).paymentIntent.updateMany({
            where: { reference },
            data: { status: "Completed" }
        });
    } catch (e) {
        // Ignore if intent doesn't exist or model missing
    }

    return { success: true, payment };
}

/**
 * Handle verification via GET (Polling from frontend)
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const reference = searchParams.get("reference");

        if (!reference) {
            return NextResponse.json({ error: "Reference is required" }, { status: 400 });
        }

        const cookieStore = await cookies();
        const sessionToken = cookieStore.get("user_session")?.value;
        const session = sessionToken ? await decryptSession(sessionToken) : null;

        const result = await verifyTransaction(reference, undefined, undefined, session?.id);

        if (result.error) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }

        return NextResponse.json({
            success: true,
            payment: result.payment,
            message: "Transaction verified and recorded"
        });

    } catch (error: any) {
        console.error("Payment Verification Error (GET):", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/**
 * Handle verification via POST (Legacy or direct calls)
 */
export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => ({}));
        const { reference, type, eventId } = body;

        const cookieStore = await cookies();
        const sessionToken = cookieStore.get("user_session")?.value;
        const session = sessionToken ? await decryptSession(sessionToken) : null;

        const result = await verifyTransaction(reference, type, eventId, session?.id);

        if (result.error) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }

        return NextResponse.json({
            success: true,
            payment: result.payment,
            message: "Transaction verified and recorded"
        });

    } catch (error: any) {
        console.error("Payment Verification Error (POST):", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
