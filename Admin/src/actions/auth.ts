"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function registerAdmin(formData: FormData) {
    const email = formData.get("email") as string;
    const username = formData.get("username") as string;
    const phone = formData.get("phone") as string;
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;

    if (!email || !username || !phone || !firstName || !lastName) {
        throw new Error("Missing required fields");
    }

    const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || "gethsemane@";
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    try {
        console.log("Attempting to create admin in DB...", { email, username, firstName, lastName });
        const newAdmin = await prisma.admin.create({
            data: {
                email,
                username,
                firstName,
                lastName,
                phone,
                passwordHash,
                isSetupComplete: false,
            },
        });
        console.log("Admin created successfully:", newAdmin.id);
    } catch (error: any) {
        console.error("Registration error:", error);
        // Handle Prisma unique constraint violations
        if (error.code === "P2002") {
            const field = error.meta?.target?.[0];
            if (field === "username") throw new Error("This username is already taken. Please choose another.");
            if (field === "email") throw new Error("An account with this email already exists.");
            throw new Error("An account with these details already exists.");
        }
        throw new Error("Failed to register. Please try again.");
    }

    (await cookies()).set("flash_registered", "true", { httpOnly: false, maxAge: 5 });
    redirect("/login");
}
