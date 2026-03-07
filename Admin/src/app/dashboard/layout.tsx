import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardHeader from "@/components/DashboardHeader";
import MobileNav from "@/components/MobileNav";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const cookieStore = await cookies();
    const session = cookieStore.get("admin_session")?.value;

    if (!session) {
        redirect("/login?reason=session_expired");
    }

    const admin = await prisma.admin.findUnique({
        where: { id: session },
        select: {
            firstName: true,
            lastName: true,
            image: true,
        }
    });

    if (!admin) {
        redirect("/login?reason=invalid_session");
    }

    const adminName = `${admin.firstName} ${admin.lastName}`;
    const adminInitials = `${admin.firstName[0]}${admin.lastName[0]}`.toUpperCase();

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row pb-20 md:pb-0">
            {/* Sidebar (Desktop) */}
            <DashboardSidebar />

            <div className="flex-1 flex flex-col min-w-0">
                {/* Desktop/Tablet Header */}
                <div className="hidden md:block">
                    <DashboardHeader
                        adminName={adminName}
                        adminInitials={adminInitials}
                        adminImage={admin.image}
                    />
                </div>

                {/* Mobile Header (One UI Minimal Style) */}
                <header className="md:hidden flex items-center justify-between px-6 py-4 bg-gray-50 sticky top-0 z-40">
                    <div className="h-10 w-10 rounded-xl bg-white shadow-samsung border border-white flex items-center justify-center p-2">
                        <img src="/logo.png" alt="Logo" className="h-full w-full object-contain" />
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-white shadow-samsung border border-white overflow-hidden flex items-center justify-center p-0.5">
                        {admin.image ? (
                            <img src={admin.image} alt="Profile" className="h-full w-full rounded-lg object-cover" />
                        ) : (
                            <span className="text-blue-600 font-black text-xs">{adminInitials}</span>
                        )}
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto px-4 py-2 md:p-8">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>

                {/* Mobile Bottom Navigation */}
                <MobileNav />
            </div>
        </div>
    );
}
