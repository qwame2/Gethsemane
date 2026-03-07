import { PrismaClient } from './prisma/generated/client/index.js';
import "dotenv/config";

const prisma = new PrismaClient();

async function main() {
    console.log("Reconciling Payments with Intents...");

    // Find all payments that are generic "payment" type or have no eventId
    const fixablePayments = await prisma.payment.findMany({
        where: {
            OR: [
                { type: "payment" },
                { eventId: null }
            ],
            transactionId: { not: null }
        }
    });

    console.log(`Checking ${fixablePayments.length} potentially misclassified payments...`);

    let fixedCount = 0;
    for (const payment of fixablePayments) {
        if (!payment.transactionId) continue;

        // Try to find the intent by reference (transactionId)
        const intent = await prisma.paymentIntent.findUnique({
            where: { reference: payment.transactionId }
        });

        if (intent && (intent.type !== payment.type || intent.eventId !== payment.eventId)) {
            console.log(`Fixing Payment ${payment.id}: Switching ${payment.type} -> ${intent.type}, Event: ${payment.eventId} -> ${intent.eventId}`);

            await prisma.payment.update({
                where: { id: payment.id },
                data: {
                    type: intent.type,
                    eventId: intent.eventId
                }
            });

            // If it was fundraising, update the raisedAmount too if we missed it
            if (intent.type === "fundraising" && intent.eventId) {
                await prisma.fundraisingEvent.update({
                    where: { id: intent.eventId },
                    data: {
                        raisedAmount: { increment: payment.amount }
                    }
                });
            }
            fixedCount++;
        }
    }

    console.log(`Successfully reconciled ${fixedCount} payments!`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
