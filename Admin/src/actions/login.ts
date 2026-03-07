"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export async function loginAdmin(formData: FormData) {
    const identifier = formData.get("identifier") as string; // email or username
    const password = formData.get("password") as string;

    if (!identifier || !password) {
        throw new Error("Missing required fields");
    }

    const user = await prisma.admin.findFirst({
        where: {
            OR: [
                { email: identifier },
                { username: identifier }
            ]
        }
    });

    if (!user) {
        throw new Error("Invalid credentials");
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
        throw new Error("Invalid credentials");
    }

    // Simple session logic for demonstration (replace with NextAuth in production)
    const isSetup = user.isSetupComplete;
    const cookieStore = await cookies();
    cookieStore.set("admin_session", user.id, { httpOnly: true, secure: process.env.NODE_ENV === "production" });
    cookieStore.set("is_logged_in", "true", { httpOnly: false, secure: process.env.NODE_ENV === "production", path: "/" });

    if (!isSetup) {
        cookieStore.set("flash_login", "true", { httpOnly: false, maxAge: 5 });
        redirect("/setup");
    }

    cookieStore.set("flash_login", "dashboard", { httpOnly: false, maxAge: 5 });
    redirect("/dashboard");
}
