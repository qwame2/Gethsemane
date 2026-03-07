"use server";

import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export interface UnifiedMember {
    id: string;
    name: string;
    email: string;
    phone: string;
    category: string;
    image: string | null;
    joinDate: string;
    initials: string;
    isAppUser: boolean;
    rawDate?: Date;
}

export async function getGeneralMembers(search?: string) {
    try {
        console.log("Fetching directory members, search:", search);
        // 1. Fetch Dues-Paying Users (Automatically "Youth")
        const users = await prisma.user.findMany({
            where: search ? {
                OR: [
                    { firstName: { contains: search, mode: 'insensitive' } },
                    { lastName: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                    { phone: { contains: search, mode: 'insensitive' } },
                ]
            } as any : {},
            orderBy: { createdAt: 'desc' }
        });

        console.log(`Found ${users.length} users (Youth)`);

        // 2. Fetch General Church Members (Children, Women, Men)
        let churchMembers = [];
        try {
            churchMembers = await (prisma as any).churchMember.findMany({
                where: search ? {
                    OR: [
                        { firstName: { contains: search, mode: 'insensitive' } },
                        { lastName: { contains: search, mode: 'insensitive' } },
                        { email: { contains: search, mode: 'insensitive' } },
                        { phone: { contains: search, mode: 'insensitive' } },
                    ]
                } : {},
                orderBy: { createdAt: 'desc' }
            });
            console.log(`Found ${churchMembers.length} church members`);
        } catch (cmError) {
            console.error("Error fetching churchMembers:", cmError);
        }

        // 3. Unify the data for the directory with raw dates for sorting
        const unifiedYouth = users.map(u => ({
            id: u.id,
            name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || "Unknown Member",
            email: u.email || "N/A",
            phone: u.phone || "N/A",
            category: "Youth",
            image: u.image,
            rawDate: u.createdAt,
            initials: `${(u.firstName || '?')[0]}${(u.lastName || '?')[0]}`.toUpperCase(),
            isAppUser: true
        }));

        const unifiedOthers = churchMembers.map((m: any) => ({
            id: m.id,
            name: `${m.firstName || ''} ${m.lastName || ''}`.trim() || "Unknown Member",
            email: m.email || "N/A",
            phone: m.phone || "N/A",
            category: m.category,
            image: m.image,
            rawDate: m.createdAt,
            initials: `${(m.firstName || '?')[0]}${(m.lastName || '?')[0]}`.toUpperCase(),
            isAppUser: false
        }));

        const result: UnifiedMember[] = [...unifiedYouth, ...unifiedOthers]
            .sort((a, b) => {
                const dateA = a.rawDate ? new Date(a.rawDate).getTime() : 0;
                const dateB = b.rawDate ? new Date(b.rawDate).getTime() : 0;
                return dateB - dateA;
            })
            .map(m => ({
                ...m,
                joinDate: m.rawDate ? new Date(m.rawDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                }) : "N/A"
            }));

        console.log(`Returning ${result.length} unified members`);
        return result;

    } catch (error) {
        console.error("Critical failure in getGeneralMembers:", error);
        return [];
    }
}

export async function createGeneralMember(data: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    category: string;
    image?: string; // base64 string from UI
}) {
    try {
        if (!(prisma as any).churchMember) {
            return { success: false, error: "System configuration error: Church directory service is unavailable." };
        }

        let dbImagePath = null;
        if (data.image && data.image.startsWith('data:image')) {
            try {
                const base64Data = data.image.split(',')[1];
                const buffer = Buffer.from(base64Data, 'base64');
                const filename = `member-${Date.now()}.jpg`;
                const uploadDir = path.join(process.cwd(), "public", "uploads", "members");
                await mkdir(uploadDir, { recursive: true });
                const filepath = path.join(uploadDir, filename);
                await writeFile(filepath, buffer);
                dbImagePath = `/uploads/members/${filename}`;
            } catch (uploadError) {
                console.error("Image upload failed:", uploadError);
            }
        }

        const member = await (prisma as any).churchMember.create({
            data: {
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phone: data.phone,
                category: data.category,
                image: dbImagePath
            }
        });
        return { success: true, member };
    } catch (error: any) {
        console.error("Failed to create general member:", error);
        return { success: false, error: error.message || "Failed to add member to directory. Please try again." };
    }
}

export async function deleteGeneralMember(id: string) {
    try {
        // First try to delete from ChurchMember
        try {
            await (prisma as any).churchMember.delete({ where: { id } });
            return { success: true };
        } catch (e) {
            // If not found in ChurchMember, we don't delete from User table 
            // from this page as it might be destructive to the dues system.
            return { success: false, error: "Only general members can be removed from this view. To remove Youth members, use the 'Members' dues management page." };
        }
    } catch (error) {
        console.error("Failed to delete member:", error);
        return { success: false, error: "Failed to remove member." };
    }
}
