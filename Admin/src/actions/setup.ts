"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function completeSetup(formData: FormData) {
    const session = (await cookies()).get("admin_session")?.value;
    if (!session) redirect("/login");

    const password = formData.get("password") as string;
    const imageFile = formData.get("image") as File | null;

    if (!password) {
        throw new Error("Password is required");
    }

    const passwordHash = await bcrypt.hash(password, 10);

    let dbImagePath = null;

    if (imageFile && imageFile.size > 0) {
        try {
            const buffer = Buffer.from(await imageFile.arrayBuffer());
            const filename = `${Date.now()}-${imageFile.name.replace(/[^a-zA-Z0-9.]/g, '')}`;

            // Ensure uploads directory exists
            const uploadDir = path.join(process.cwd(), "public", "uploads");
            await mkdir(uploadDir, { recursive: true });

            // Save file
            const filepath = path.join(uploadDir, filename);
            await writeFile(filepath, buffer);

            // Store DB path referenced from public folder root
            dbImagePath = `/uploads/${filename}`;
        } catch (error) {
            console.error("Failed to upload image:", error);
            // Non-fatal, we'll continue with null image
        }
    }

    await prisma.admin.update({
        where: { id: session },
        data: {
            passwordHash,
            image: dbImagePath,
            isSetupComplete: true
        }
    });
    const cookieStore = await cookies();
    cookieStore.set("flash_setup_complete", "true", { httpOnly: false, maxAge: 5 });

    redirect("/");
}
