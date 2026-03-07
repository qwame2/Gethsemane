import { PrismaClient } from './prisma/generated/client/index.js';
import "dotenv/config";

const prisma = new PrismaClient();

async function main() {
    console.log("--- LATEST PAYMENTS ---");
    const payments = await prisma.payment.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { user: true }
    });
    console.log(JSON.stringify(payments.map((p) => ({
        id: p.id,
        user: `${p.user.firstName} ${p.user.lastName}`,
        amount: p.amount,
        type: p.type,
        eventId: p.eventId,
        createdAt: p.createdAt
    })), null, 2));

    console.log("\n--- LATEST INTENTS ---");
    const intents = await prisma.paymentIntent.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
    });
    console.log(JSON.stringify(intents, null, 2));

    console.log("\n--- FUNDRAISING EVENTS ---");
    const events = await prisma.fundraisingEvent.findMany();
    console.log(JSON.stringify(events, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
