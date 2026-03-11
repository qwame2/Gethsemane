import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import crypto from "crypto";
import { decryptSession } from "@/lib/session";

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get("user_session")?.value;
        const session = sessionToken ? await decryptSession(sessionToken) : null;
        const targetUserId = session?.id;

        if (!targetUserId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({ where: { id: targetUserId } });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const bodyParts = await request.json().catch(() => ({}));
        const { type, eventId } = bodyParts;
        let amountToPay = Number(bodyParts.amount);


        const settings = await prisma.systemSettings.findUnique({ where: { id: "singleton" } });

        // Validation of amounts based on type 
        if (type === "yearly" || type === "full") {
            // Get definitive stats to determine true remaining balance
            const duesProfile = await (prisma as any).duesProfile.findUnique({ where: { userId: targetUserId } });
            const yearlyTotal = settings?.yearlyDues || 240;
            amountToPay = Math.max(0, yearlyTotal - ((duesProfile as any)?.totalPaid || 0));
        } else if (type === "monthly") {
            amountToPay = settings?.monthlyDues || 20;
        } else if (type === "installment") {
            const minInst = settings?.minInstallment || 70;
            if (amountToPay < minInst) {
                return NextResponse.json({ error: `Installment payment must be at least GHS ${minInst}` }, { status: 400 });
            }
        }

        if (!amountToPay || isNaN(amountToPay) || amountToPay <= 0) {
            return NextResponse.json({ error: "Invalid payment amount" }, { status: 400 });
        }

        const reference = `REF_${crypto.randomBytes(8).toString('hex')}_${Date.now()}`;

        // Create Payment Intent inside the Database BEFORE triggering Paystack
        const intent = await (prisma as any).paymentIntent.create({
            data: {
                userId: user.id,
                amount: amountToPay,
                reference: reference,
                status: "Pending",
                type: type || "payment",
                eventId: eventId || null
            }
        });

        // Calculate final amount including the Gethsemane fee logic (3.55%)
        const feeRate = 0.032;
        const transactionFee = amountToPay * feeRate;
        const totalCharge = amountToPay + transactionFee;

        // Initialize transaction via Server-to-Server API
        const paystackAmountKobo = Math.round(totalCharge * 100);

        const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: user.email,
                amount: paystackAmountKobo,
                reference: reference,
                currency: "GHS",
                metadata: {
                    userId: user.id,
                    paymentType: type,
                    eventId: eventId,
                    intentId: intent.id
                }
            })
        });

        const paystackData = await paystackResponse.json();

        if (!paystackData.status) {
            return NextResponse.json({ error: "Failed to initialize Paystack transaction", details: paystackData.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            authorization_url: paystackData.data.authorization_url,
            access_code: paystackData.data.access_code,
            reference: reference
        });

    } catch (error: any) {
        console.error("Payment Initialization Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
