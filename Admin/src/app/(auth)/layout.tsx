import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
    const cookieStore = await cookies();
    const session = cookieStore.get("admin_session");

    if (session) {
        redirect("/dashboard");
    }

    return <Suspense fallback={null}>{children}</Suspense>;
}
