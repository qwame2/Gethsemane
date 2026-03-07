import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import "dotenv/config";

const createPrismaClient = () => {
    const connectionString = process.env.DATABASE_URL
    const pool = new Pool({ connectionString })
    const adapter = new PrismaPg(pool)

    return new PrismaClient({ adapter });
};

const prisma = createPrismaClient();

async function main() {
    console.log("Dumping Recent Payments...");
    const payments = await prisma.payment.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, amount: true, type: true, eventId: true, status: true }
    });
    console.log(JSON.stringify(payments, null, 2));
}

main();
