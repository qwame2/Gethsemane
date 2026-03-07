import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

async function main() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    console.log("Connected. Trying to fetch Admins...");
    const admins = await prisma.admin.findMany();
    console.log("Admins:", admins);
}

main().catch(console.error);
