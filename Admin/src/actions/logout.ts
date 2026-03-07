"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function logoutAdmin() {
    const cookieStore = await cookies();

    // Delete session cookies
    cookieStore.delete("admin_session");
    cookieStore.delete("is_logged_in");

    // Delete any other state we might have set
    cookieStore.delete("flash_login");
    cookieStore.delete("flash_registered");

    redirect("/login");
}
