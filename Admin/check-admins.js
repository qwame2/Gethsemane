require('dotenv').config();
const { PrismaClient } = require("./prisma/generated/client");
const prisma = new PrismaClient();

async function main() {
    console.log("DATABASE_URL:", process.env.DATABASE_URL);
    console.log("Fetching Admins...");
    try {
        const admins = await prisma.admin.findMany({
            select: { id: true, username: true, email: true }
        });
        console.log("Admins count:", admins.length);
        console.log("Admins:", admins);
    } catch (e) {
        console.error("Error fetching admins:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
