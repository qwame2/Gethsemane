import { prisma } from "./src/lib/prisma";
import bcrypt from "bcrypt";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

async function main() {
    console.log("Creating user...");
    const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || "gethsemane@";
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    try {
        const admin = await prisma.admin.create({
            data: {
                email: "test@example.com",
                username: "testuser",
                firstName: "Test",
                lastName: "User",
                phone: "123456789",
                passwordHash: passwordHash,
                isSetupComplete: false
            }
        });
        console.log("Admin created:", admin);
    } catch (e) {
        console.error("Failed", e);
    }
}

main().catch(console.error);
