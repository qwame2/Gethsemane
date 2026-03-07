const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- PAYMENTS ---');
    const pmts = await prisma.payment.findMany({ orderBy: { createdAt: 'desc' }, take: 5 });
    console.log(JSON.stringify(pmts, null, 2));

    console.log('--- INTENTS ---');
    const intents = await prisma.paymentIntent.findMany({ orderBy: { createdAt: 'desc' }, take: 5 });
    console.log(JSON.stringify(intents, null, 2));

    console.log('--- SYNCING NULL EVENT IDs ---');
    let updated = 0;
    for (const p of pmts) {
        if (!p.eventId && p.transactionId) {
            const intent = await prisma.paymentIntent.findUnique({ where: { reference: p.transactionId } });
            if (intent && intent.eventId) {
                await prisma.payment.update({
                    where: { id: p.id },
                    data: { eventId: intent.eventId, type: intent.type }
                });
                updated++;
                console.log(`Updated payment ${p.id} with eventId ${intent.eventId}`);
            }
        }
    }
    console.log(`Updated ${updated} payments.`);
}

main().finally(() => prisma.$disconnect());
