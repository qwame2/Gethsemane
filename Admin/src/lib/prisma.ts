import "dotenv/config";
import { PrismaClient } from "../../prisma/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

declare global {
    // eslint-disable-next-line no-var
    var prismaGlobal: PrismaClient | undefined;
}

function createPrismaClient() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
}

const getClient = () => {
    if (process.env.NODE_ENV === "production") {
        return createPrismaClient();
    }

    if (!global.prismaGlobal || !(global.prismaGlobal as any).churchMember || !(global.prismaGlobal as any).fundraisingEvent || !(global.prismaGlobal as any).systemSettings) {
        global.prismaGlobal = createPrismaClient();
    }
    return global.prismaGlobal;
};

export const prisma = getClient();
