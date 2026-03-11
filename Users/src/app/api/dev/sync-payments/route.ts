import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
    try {
        const pmts = await prisma.payment.findMany({
            where: { eventId: null, type: 'payment' },
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        let updated = 0;

        for (const p of pmts) {
            if (p.transactionId) {
                // Fetch direct from Paystack
                let psRes = null;
                try {
                    const req = await fetch(`https://api.paystack.co/transaction/verify/${p.transactionId}`, {
                        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
                    });
                    psRes = await req.json();
                } catch (e) {
                }

                if (psRes && psRes.data && psRes.data.metadata) {
                    let md = psRes.data.metadata;
                    if (typeof md === "string") {
                        try { md = JSON.parse(md); } catch (e) { }
                    }

                    const intentId = md.intentId;
                    const metaEventId = md.eventId;
                    const metaType = md.paymentType || md.type;

                    let finalEventId = metaEventId;
                    let finalType = metaType;

                    if (intentId) {
                        const intent = await (prisma as any).paymentIntent.findUnique({ where: { id: intentId } });
                        if (intent) {
                            finalEventId = finalEventId || intent.eventId;
                            if (!finalType || finalType === 'payment') finalType = intent.type;
                        }
                    }

                    if (finalEventId || (finalType && finalType !== 'payment')) {
                        await prisma.payment.update({
                            where: { id: p.id },
                            data: {
                                eventId: finalEventId || null,
                                type: finalType || 'payment'
                            }
                        });
                        updated++;
                    }
                }
            }
        }

        return NextResponse.json({ success: true, message: `Synced ${updated} payments` });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
