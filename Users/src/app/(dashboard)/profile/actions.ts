"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { decryptSession } from "@/lib/session";

export async function updateProfileImage(formData: FormData) {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("user_session")?.value;
    const session = sessionToken ? await decryptSession(sessionToken) : null;
    const userId = session?.id;

    if (!userId) return { success: false, error: "Unauthorized" };
    const imageBase64 = formData.get("image") as string;

    try {
        if (!imageBase64) throw new Error("No image data provided");

        const user = await (prisma.user as any).update({
            where: { id: userId },
            data: { image: imageBase64 },
            select: { id: true, image: true }
        });

        revalidatePath("/profile");
        revalidatePath("/dashboard");

        return { success: true, image: user.image };
    } catch (error: any) {
        console.error("SERVER ACTION ERROR:", error);
        return { success: false, error: error.message || "Unknown server error" };
    }
}
