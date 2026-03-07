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
    console.log("Checking Fundraising Events in User DB...");
    const events = await prisma.fundraisingEvent.findMany();
    console.log("Total Events:", events.length);
    events.forEach(e => {
        console.log(`- [${e.isActive ? 'ACTIVE' : 'INACTIVE'}] ID: ${e.id}, Title: ${e.title}, End: ${e.endDate}`);
    });
}

main();
