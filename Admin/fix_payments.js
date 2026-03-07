require('dotenv').config({ path: '../Users/.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const pmts = await prisma.payment.findMany({
        where: { eventId: null, type: 'payment' },
        orderBy: { createdAt: 'desc' },
        take: 10
    });

    console.log("Found blank payments:", pmts.length);

    const firstEvent = await prisma.fundraisingEvent.findFirst();
    if (!firstEvent) {
        console.log("No fundraising events found");
        return;
    }

    let updatedCount = 0;
    for (const p of pmts) {
        if (p.amount === 20 || p.amount === 56 || p.amount === 50 || p.amount === 70) {
            console.log("Fixing payment", p.id);
            await prisma.payment.update({
                where: { id: p.id },
                data: {
                    type: 'fundraising',
                    eventId: firstEvent.id
                }
            });
            await prisma.fundraisingEvent.update({
                where: { id: firstEvent.id },
                data: { raisedAmount: { increment: p.amount } }
            });
            updatedCount++;
        }
    }

    console.log(`Updated ${updatedCount} old missed transactions to fundraising.`);

    // Check profiles to fix the mistakingly deducted Monthly dues.
    const userProfile = await prisma.duesProfile.findFirst({
        where: { userId: 'cmmeyoes20000wovoqqkx6ro3' }
    });

    if (userProfile) {
        await prisma.duesProfile.update({
            where: { id: userProfile.id },
            data: {
                currentMonthDue: 25,
                totalPaid: 0,
                status: 'Owed'
            }
        });
        console.log("Reset user DuesProfile");
    }
}

main().finally(() => prisma.$disconnect());
