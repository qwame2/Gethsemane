import { getSuperAdminDashboardData, resetAccountPassword, exitSuperAdminProtocol } from "@/actions/superadmin";
import { redirect } from "next/navigation";
import { ShieldAlert, MonitorPlay } from "lucide-react";
import SuperAdminClientView from "./client-view";

export default async function SuperAdminPage() {
    const res = await getSuperAdminDashboardData();
    if (!res.success) {
        redirect("/dashboard");
    }

    const { admins, users, auditLogs } = res.data!;

    return (
        <div className="w-full bg-white min-h-[calc(100vh-8rem)] space-y-8 text-gray-800 rounded-3xl overflow-hidden ring-1 ring-gray-100 shadow-sm relative p-4 sm:p-6 lg:p-8">
            <header className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-50 rounded-2xl ring-1 ring-red-100 shadow-sm">
                        <ShieldAlert className="w-8 h-8 text-red-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                            Classified Access <span className="text-red-500">Protocol</span>
                        </h1>
                        <p className="text-xs font-mono text-red-600/80 mt-1 flex items-center gap-2 font-medium">
                            <MonitorPlay className="w-3 h-3" /> SYSTEM OVERRIDE ACTIVE - ALL ACTIONS LOGGED
                        </p>
                    </div>
                </div>
            </header>

            <div className="relative">
                <SuperAdminClientView admins={admins} users={users} auditLogs={auditLogs} />
            </div>
        </div>
    );
}
