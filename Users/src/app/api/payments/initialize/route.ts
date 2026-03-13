import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "node:crypto";
import { limiter } from "@/lib/rate-limit";
import { paymentInitSchema } from "@/lib/validations";

export async function POST(request: Request) {
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
        const targetUserId = request.headers.get("X-User-Id");

        if (!targetUserId) {
            return NextResponse.json({ error: "Unauthorized: Access denied" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({ where: { id: targetUserId } });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const body = await request.json().catch(() => ({}));

        // 1. Validate Input Schema
        const validatedData = paymentInitSchema.safeParse(body);
        if (!validatedData.success) {
            return NextResponse.json(
                { error: validatedData.error.issues[0].message },
                { status: 400 }
            );
        }

        const { type, eventId, amount: clientAmount } = validatedData.data;
        let amountToPay = clientAmount;

        const settings = await prisma.systemSettings.findUnique({ where: { id: "singleton" } });

        // Logic check: For certain types, we override with server-calculated amounts
        if (type === "yearly" || type === "full") {
            const duesProfile = await (prisma as any).duesProfile.findUnique({ where: { userId: targetUserId } });
            const yearlyTotal = settings?.yearlyDues || 240;
            amountToPay = Math.max(0, yearlyTotal - ((duesProfile as any)?.totalPaid || 0));
        } else if (type === "monthly") {
            amountToPay = settings?.monthlyDues || 20;
        } else if (type === "installment") {
            const minInst = settings?.minInstallment || 70;
            if (amountToPay < minInst) {
                return NextResponse.json({ error: `Installment payment must be at least GH₵${minInst}` }, { status: 400 });
            }
        }

        if (!amountToPay || isNaN(amountToPay) || amountToPay <= 0) {
            return NextResponse.json({ error: "Invalid payment amount calculated" }, { status: 400 });
        }

        const reference = `REF_${crypto.randomBytes(8).toString('hex')}_${Date.now()}`;

        // Create Payment Intent inside the Database BEFORE triggering Paystack
        const intent = await (prisma as any).paymentIntent.create({
            data: {
                userId: user.id,
                amount: amountToPay,
                reference: reference,
                status: "Pending",
                type: type,
                eventId: eventId || null
            }
        });

        // Paystack Transaction Fee logic (e.g. 3.2%)
        const feeRate = 0.032;
        const transactionFee = amountToPay * feeRate;
        const totalCharge = amountToPay + transactionFee;

        // Initialize transaction via Paystack API
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

    } catch (error: unknown) {
        console.error("Payment Initialization Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
