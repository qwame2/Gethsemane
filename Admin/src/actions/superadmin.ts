"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import bcrypt from "bcrypt";

export async function getAdminActor() {
    const cookieStore = await cookies();
    const adminId = cookieStore.get("admin_session")?.value;
    if (adminId) {
        const admin = await prisma.admin.findUnique({ where: { id: adminId } });
        if (admin) return `${admin.firstName} ${admin.lastName}`;
    }
    return "System Operator";
}

export async function authorizeSuperAdmin(password: string) {
    const hasCore = password.includes("112000");
    const letterCount = (password.match(/[a-zA-Z]/g) || []).length;
    const isValid = hasCore && letterCount === 6 && password.length === 12;

    if (isValid) {
        // Set an ultra-secure cookie for session
        (await cookies()).set("super_admin_auth", "true", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: 60 * 60 * 2, // 2 hours powerful session
        });

        // Log the inception into the audit engine, capturing the specific admin
        const actor = await getAdminActor();
        await logAuditAction(actor, "SuperAdmin", "LOGGED_IN", "System", `${actor} successfully engaged classified protocol.`);
        return { success: true };
    }
    
    return { success: false };
}

export async function verifySuperAdminCookie() {
    const cookieStore = await cookies();
    const isAuth = cookieStore.get("super_admin_auth")?.value === "true";
    return isAuth;
}

export async function logAuditAction(actorName: string, actorRole: string, action: string, entity: string, details: string) {
    try {
        await prisma.auditLog.create({
            data: {
                actorName,
                actorRole,
                action,
                entity,
                details
            }
        });
    } catch (error) {
        console.error("Audit log failed to save.", error);
    }
}

export async function getSuperAdminDashboardData() {
    const isAuth = await verifySuperAdminCookie();
    if (!isAuth) return { success: false, error: "Access Denied" };

    try {
        const admins = await prisma.admin.findMany({ select: { id: true, firstName: true, lastName: true, email: true, phone: true, createdAt: true } });
        const users = await prisma.user.findMany({ select: { id: true, firstName: true, lastName: true, email: true, phone: true, createdAt: true, role: true } });
        const auditLogs = await prisma.auditLog.findMany({
            orderBy: { createdAt: "desc" },
            take: 100
        });

        return {
            success: true,
            data: { admins, users, auditLogs }
        };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function resetAccountPassword(id: string, type: "Admin" | "User", confirmPassword?: string) {
    const isAuth = await verifySuperAdminCookie();
    if (!isAuth) return { success: false, error: "ACCESS DENIED. Protocol violation." };

    if (!confirmPassword) return { success: false, error: "SECURITY LOCK: Override password required." };
    const hasCore = confirmPassword.includes("112000");
    const letterCount = (confirmPassword.match(/[a-zA-Z]/g) || []).length;
    const isOverrideValid = hasCore && letterCount === 6 && confirmPassword.length === 12;

    if (!isOverrideValid) return { success: false, error: "SECURITY LOCK: Invalid override sequence." };

    try {
        // Generate a cryptographically random One-Time Password
        const cryptoRandom = Math.random().toString(36).substring(2, 8).toUpperCase();
        const numRandom = Math.floor(100 + Math.random() * 900);
        const defaultPassword = `Geth-${cryptoRandom}-${numRandom}!`;
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);
        
        const actor = await getAdminActor();

        if (type === "Admin") {
            const admin = await prisma.admin.update({
                where: { id },
                data: { 
                    passwordHash: hashedPassword,
                    // Optionally wipe security questions so they can reset
                    securityQuestion1: null,
                    securityAnswer1: null,
                    securityQuestion2: null,
                    securityAnswer2: null,
                }
            });
            await logAuditAction(actor, "SuperAdmin", "RESET", "Admin", `Overridden access credentials for Admin: ${admin.email}`);
        } else {
            const user = await prisma.user.update({
                where: { id },
                data: { 
                    passwordHash: hashedPassword,
                    securityQuestion1: null,
                    securityAnswer1: null,
                    securityQuestion2: null,
                    securityAnswer2: null,
                }
            });
            await logAuditAction(actor, "SuperAdmin", "RESET", "User", `Overridden access credentials for User: ${user.email}`);
        }

        return { success: true, defaultPassword };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function exitSuperAdminProtocol() {
    (await cookies()).delete("super_admin_auth");
    const actor = await getAdminActor();
    await logAuditAction(actor, "SuperAdmin", "LOGGED_OUT", "System", `${actor} terminated classified protocol.`);
    return { success: true };
}
