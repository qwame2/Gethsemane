"use client";

import { useEffect, useState } from "react";
import {
    Users,
    Search,
    Filter,
    MoreVertical,
    Download,
    Plus,
    Mail,
    Phone,
    Calendar,
    ChevronRight,
    Trash2,
    Eye,
    Edit3,
    CheckCircle2,
    AlertCircle,
    X,
    MessageSquare
} from "lucide-react";
import { getMembers, deleteMember, createMember, updateMemberContact, updateMemberDues } from "@/actions/members";
import { toast } from "sonner";
import Image from "next/image";

export default function MembersPage() {
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All Members");
    const [selectedMember, setSelectedMember] = useState<any | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newMember, setNewMember] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        role: "member"
    });

    const [isEditingContact, setIsEditingContact] = useState(false);
    const [isEditingDues, setIsEditingDues] = useState(false);
    const [editContactData, setEditContactData] = useState({ email: "", phone: "" });
    const [editDuesData, setEditDuesData] = useState({ status: "", totalArrears: 0 });

    const handleContactMember = (type: 'whatsapp' | 'email', member: any) => {
        if (!member) return;

        if (type === 'whatsapp') {
            const phoneNumber = member.phone.replace(/\D/g, ''); // Remove non-numeric characters
            // Format for Ghana (233) if it starts with 0
            const formattedPhone = phoneNumber.startsWith('0') ? '233' + phoneNumber.substring(1) : phoneNumber;
            const message = encodeURIComponent(`Hello ${member.name}, this is Gethsemane Fellowship Admin. We are reaching out regarding your member profile status.`);
            window.open(`https://wa.me/${formattedPhone}?text=${message}`, '_blank');
        } else {
            const subject = encodeURIComponent("Gethsemane Fellowship: Member Profile Update");
            const body = encodeURIComponent(`Hello ${member.name},\n\nWe are reaching out from the Gethsemane Fellowship Administration regarding your account standing and profile records.\n\nBest regards,\nAdministration Team`);
            window.location.href = `mailto:${member.email}?subject=${subject}&body=${body}`;
        }
    };

    useEffect(() => {
        const handleSearch = (e: any) => {
            setSearchQuery(e.detail || "");
        };
        window.addEventListener('dashboardSearch', handleSearch as EventListener);
        return () => window.removeEventListener('dashboardSearch', handleSearch as EventListener);
    }, []);

    const fetchMembersData = async (query?: string) => {
        setLoading(true);
        try {
            const data = await getMembers(query);
            setMembers(data);
        } catch (error) {
            toast.error("Failed to load members");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMembersData(searchQuery);
    }, [searchQuery]);

    const handleDelete = async (id: string, name: string) => {
        if (confirm(`Are you sure you want to remove ${name}? This action cannot be undone.`)) {
            try {
                await deleteMember(id);
                toast.success("Member removed successfully");
                fetchMembersData(searchQuery);
            } catch (error) {
                toast.error("Failed to remove member");
            }
        }
    };

    const handleExport = () => {
        if (displayedMembers.length === 0) {
            toast.error("No members to export");
            return;
        }

        const headers = ["Name", "Email", "Phone", "Join Date", "Role", "Dues Status"];
        const csvContent = [
            headers.join(","),
            ...displayedMembers.map(m => [
                `"${m.name}"`,
                m.email,
                m.phone,
                m.joinDate,
                m.role,
                m.duesStatus
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Gethsemane_Members_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("List exported successfully!");
    };

    const displayedMembers = members.filter(member => {
        if (statusFilter === "All Members") return true;
        if (statusFilter === "Paid Only") return ["Paid", "Fully Paid"].includes(member.duesStatus);
        if (statusFilter === "Unpaid / Overdue") return member.duesStatus === "Unpaid" || member.duesStatus === "Partially Paid";
        if (statusFilter === "Active Admins") return member.role === "admin";
        return true;
    });

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out pb-20 md:pb-0">
            {/* Samsung One UI Mobile Header - Reachability Optimized */}
            <div className="md:hidden pt-8 pb-6 px-4">
                <div className="flex items-center gap-2 text-[11px] font-bold text-blue-500 uppercase tracking-[0.2em] mb-4 opacity-80">
                    <Users className="w-3 h-3" />
                    Directory
                </div>
                <div className="flex items-end justify-between">
                    <h1 className="text-5xl font-extrabold text-gray-900 tracking-tighter leading-none">
                        Members
                    </h1>
                    <div className="flex gap-3">
                        <button
                            onClick={handleExport}
                            className="p-3.5 bg-white border border-gray-100 text-gray-400 rounded-2xl shadow-sm active:scale-95 transition-transform"
                        >
                            <Download className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="p-3.5 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl shadow-lg shadow-blue-500/20 active:scale-95 transition-transform"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Desktop Header */}
            <div className="hidden md:flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Member Directory</h1>
                    <p className="mt-1 text-base text-gray-500 max-w-2xl">
                        Manage your fellowship members, track their status, and maintain contact information.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={handleExport}
                        className="flex items-center justify-center gap-2 px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all shadow-sm group"
                    >
                        <Download className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                        Export List
                    </button>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md shadow-blue-500/20 group"
                    >
                        <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                        Add Member
                    </button>
                </div>
            </div>

            {/* Enhanced Filter Bar - Fully Responsive */}
            <div className="mx-2 md:mx-0 flex flex-col md:flex-row items-stretch md:items-center justify-between bg-white/80 backdrop-blur-sm p-4 rounded-[2.2rem] shadow-samsung border border-white gap-4">
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 flex-1">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Find by name, email or phone..."
                            className="w-full pl-11 pr-4 py-3 bg-gray-50/50 border border-gray-100 rounded-[1.2rem] text-sm text-gray-900 placeholder:text-gray-500 font-medium focus:ring-4 focus:ring-blue-500/5 focus:bg-white transition-all shadow-inner"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="hidden sm:inline text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] pl-2 md:pl-4">Filter:</span>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="flex-1 md:flex-none bg-gray-50/50 border border-gray-100 rounded-[1.2rem] text-xs font-bold py-3 px-5 focus:ring-4 focus:ring-blue-500/5 focus:bg-white transition-all shadow-inner text-gray-700 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_1rem_center] bg-no-repeat pr-12"
                        >
                            <option>All Members</option>
                            <option>Paid Only</option>
                            <option>Unpaid / Overdue</option>
                            <option>Active Admins</option>
                        </select>
                    </div>
                </div>
                <div className="flex items-center justify-between md:justify-end px-2 md:px-0">
                    <div className="md:hidden text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100 shadow-sm">
                        Directory • {displayedMembers.length} Total
                    </div>
                    <div className="hidden md:block text-[11px] font-black text-gray-500 uppercase tracking-widest bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
                        {displayedMembers.length} Members Total
                    </div>
                </div>
            </div>

            {/* Members List Container */}
            <div className="rounded-[2.2rem] md:rounded-[2.5rem] bg-white shadow-samsung border border-white overflow-hidden">
                <div className="border-b border-gray-50 px-6 py-4 flex items-center justify-between bg-white sm:px-8 md:py-6">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Member List</h3>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mt-1">Confirmed fellowship records</p>
                    </div>
                </div>

                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-4">
                        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-600 rounded-full animate-spin" />
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Loading directory...</p>
                    </div>
                ) : displayedMembers.length === 0 ? (
                    <div className="py-20 text-center">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Users className="w-10 h-10 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">No members found</h3>
                        <p className="text-sm text-gray-500 mt-1">Try adjusting your search or filters.</p>
                    </div>
                ) : (
                    <>
                        {/* Mobile View */}
                        <div className="md:hidden divide-y divide-gray-50">
                            {displayedMembers.map((member) => (
                                <div key={member.id} className="p-4 flex items-center gap-4 active:bg-gray-50 transition-colors" onClick={() => setSelectedMember(member)}>
                                    <div className="w-14 h-14 rounded-[1.4rem] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center shadow-inner border border-white overflow-hidden relative">
                                        {member.image ? (
                                            <Image src={member.image} alt={member.name} fill className="object-cover" />
                                        ) : (
                                            <span className="text-gray-500 font-black text-sm">{member.initials}</span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-0.5">
                                            <p className="text-sm font-bold text-gray-900 truncate">{member.name}</p>
                                            <ChevronRight className="w-4 h-4 text-gray-300" />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-1.5 h-1.5 rounded-full ${['Paid', 'Fully Paid'].includes(member.duesStatus) ? 'bg-green-500' : 'bg-red-500'}`} />
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{member.duesStatus} • Arrears: GHS {member.totalArrears.toFixed(2)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-50">
                                <thead className="bg-gray-50/50">
                                    <tr>
                                        <th className="py-5 pl-8 pr-3 text-left text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Member</th>
                                        <th className="px-3 py-5 text-left text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Contact</th>
                                        <th className="px-3 py-5 text-left text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Status</th>
                                        <th className="px-3 py-5 text-left text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Total Arrears</th>
                                        <th className="px-3 py-5 text-left text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Joined</th>
                                        <th className="relative py-5 pl-3 pr-8"><span className="sr-only">Actions</span></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {displayedMembers.map((member) => (
                                        <tr key={member.id} className="hover:bg-blue-50/30 transition-all group">
                                            <td className="py-5 pl-8 pr-3">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-11 h-11 rounded-2xl bg-gray-50 text-gray-500 flex items-center justify-center text-xs font-black shadow-inner border border-gray-100 overflow-hidden relative">
                                                        {member.image ? (
                                                            <Image src={member.image} alt={member.name} fill className="object-cover" />
                                                        ) : (
                                                            member.initials
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{member.name}</span>
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase">Member ID: {member.id.slice(-6).toUpperCase()}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-5">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                                                        <Mail className="w-3 h-3 text-gray-400" /> {member.email}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                                                        <Phone className="w-3 h-3 text-gray-400" /> {member.phone}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-5">
                                                <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-widest
                                                    ${['Paid', 'Fully Paid'].includes(member.duesStatus) ? 'bg-green-50 text-green-700 border border-green-100' :
                                                        'bg-red-50 text-red-700 border border-red-100'
                                                    }`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${['Paid', 'Fully Paid'].includes(member.duesStatus) ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                                                    {member.duesStatus}
                                                </div>
                                            </td>
                                            <td className="px-3 py-5 text-sm font-black text-gray-900">
                                                GHS {member.totalArrears.toFixed(2)}
                                            </td>
                                            <td className="px-3 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-tighter">
                                                {member.joinDate}
                                            </td>
                                            <td className="py-5 pl-3 pr-8 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => setSelectedMember(member)}
                                                        className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(member.id, member.name)}
                                                        className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>

            {/* Member Details Modal */}
            {selectedMember && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 ease-out">
                        {/* Modal Header - Improved Responsiveness for Mobile */}
                        <div className="px-4 md:px-8 py-4 md:py-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-20">
                            <div className="flex items-center gap-3 md:gap-5 min-w-0">
                                <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg md:text-xl font-black shadow-inner border border-blue-100 overflow-hidden relative shrink-0">
                                    {selectedMember.image ? (
                                        <Image src={selectedMember.image} alt={selectedMember.name} fill className="object-cover" />
                                    ) : (
                                        selectedMember.initials
                                    )}
                                </div>
                                <div className="space-y-0.5 md:space-y-1 min-w-0">
                                    <h3 className="text-lg md:text-2xl font-black text-gray-900 leading-tight truncate">{selectedMember.name}</h3>
                                    <div className="flex items-center gap-2 md:gap-3">
                                        <span className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">ID: {selectedMember.id.slice(-8).toUpperCase()}</span>
                                        <span className={`text-[8px] md:text-[9px] font-black px-1.5 md:px-2 py-0.5 rounded-lg uppercase shrink-0 ${selectedMember.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'}`}>
                                            {selectedMember.role}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedMember(null)}
                                className="p-2 md:p-3 bg-gray-50 text-gray-400 rounded-[1.2rem] hover:bg-red-50 hover:text-red-500 transition-all group shrink-0 ml-2"
                            >
                                <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-8">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-blue-50/50 rounded-3xl p-5 border border-blue-100">
                                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.15em] mb-2">Total Arrears</p>
                                    <p className="text-2xl font-black text-gray-900 tracking-tighter">GHS {selectedMember.totalArrears.toFixed(2)}</p>
                                </div>
                                <div className="bg-emerald-50/50 rounded-3xl p-5 border border-emerald-100">
                                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.15em] mb-2">Status</p>
                                    <p className="text-lg font-black text-emerald-700 tracking-tight uppercase">{selectedMember.duesStatus}</p>
                                </div>
                                <div className="bg-amber-50/50 rounded-3xl p-5 border border-amber-100">
                                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.15em] mb-2">Payments</p>
                                    <p className="text-2xl font-black text-gray-900 tracking-tighter">{selectedMember.paymentCount}</p>
                                </div>
                            </div>

                            {/* Contact Info */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Contact Details</h4>
                                    {(selectedMember.role !== 'admin' && !isEditingContact) && (
                                        <button
                                            onClick={() => {
                                                setEditContactData({ email: selectedMember.email, phone: selectedMember.phone });
                                                setIsEditingContact(true);
                                            }}
                                            className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                                        >
                                            Update Info
                                        </button>
                                    )}
                                    {isEditingContact && (
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => setIsEditingContact(false)}
                                                className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:underline"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    setIsSubmitting(true);
                                                    const res = await updateMemberContact(selectedMember.id, editContactData);
                                                    setIsSubmitting(false);
                                                    if (res.success) {
                                                        toast.success("Contact updated successfully!");
                                                        setIsEditingContact(false);
                                                        setSelectedMember({ ...selectedMember, email: editContactData.email, phone: editContactData.phone });
                                                        fetchMembersData(searchQuery);
                                                    } else {
                                                        toast.error(res.error || "Failed to update contact");
                                                    }
                                                }}
                                                className="text-[10px] font-black text-green-600 uppercase tracking-widest hover:underline"
                                            >
                                                Save
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className={`flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border ${isEditingContact ? 'border-blue-200' : 'border-white'} transition-all`}>
                                        <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-blue-500 shrink-0">
                                            <Mail className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[9px] font-bold text-gray-400 uppercase">Email Address</p>
                                            {isEditingContact ? (
                                                <input
                                                    type="email"
                                                    value={editContactData.email}
                                                    onChange={(e) => setEditContactData({ ...editContactData, email: e.target.value })}
                                                    className="w-full bg-transparent border-none p-0 text-sm font-bold text-gray-900 focus:ring-0 outline-none"
                                                />
                                            ) : (
                                                <p className="text-sm font-bold text-gray-900 truncate">{selectedMember.email}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className={`flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border ${isEditingContact ? 'border-blue-200' : 'border-white'} transition-all`}>
                                        <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-blue-500 shrink-0">
                                            <Phone className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[9px] font-bold text-gray-400 uppercase">Phone Number</p>
                                            {isEditingContact ? (
                                                <input
                                                    type="tel"
                                                    value={editContactData.phone}
                                                    onChange={(e) => setEditContactData({ ...editContactData, phone: e.target.value })}
                                                    className="w-full bg-transparent border-none p-0 text-sm font-bold text-gray-900 focus:ring-0 outline-none"
                                                />
                                            ) : (
                                                <p className="text-sm font-bold text-gray-900 truncate">{selectedMember.phone}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Activity/Status Section */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">System Status</h4>
                                    {(selectedMember.role !== 'admin' && !isEditingDues) && (
                                        <button
                                            onClick={() => {
                                                setEditDuesData({ status: selectedMember.duesStatus, totalArrears: selectedMember.totalArrears });
                                                setIsEditingDues(true);
                                            }}
                                            className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                                        >
                                            Modify Dues
                                        </button>
                                    )}
                                    {isEditingDues && (
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => setIsEditingDues(false)}
                                                className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:underline"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    setIsSubmitting(true);
                                                    const res = await updateMemberDues(selectedMember.id, editDuesData);
                                                    setIsSubmitting(false);
                                                    if (res.success) {
                                                        toast.success("Dues updated successfully!");
                                                        setIsEditingDues(false);
                                                        setSelectedMember({ ...selectedMember, duesStatus: editDuesData.status, totalArrears: editDuesData.totalArrears });
                                                        fetchMembersData(searchQuery);
                                                    } else {
                                                        toast.error(res.error || "Failed to update dues");
                                                    }
                                                }}
                                                className="text-[10px] font-black text-green-600 uppercase tracking-widest hover:underline"
                                            >
                                                Save
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className={`flex items-start gap-4 p-5 bg-gradient-to-br from-gray-50 to-white rounded-3xl border ${isEditingDues ? 'border-blue-200 ring-4 ring-blue-500/5' : 'border-gray-100'} shadow-sm transition-all`}>
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${['Paid', 'Fully Paid'].includes(selectedMember.duesStatus) ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                        {['Paid', 'Fully Paid'].includes(selectedMember.duesStatus) ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                                    </div>
                                    <div className="flex-1 min-w-0 pt-1">
                                        {isEditingDues ? (
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-1">
                                                        <label className="text-[9px] font-black text-gray-400 uppercase">Payment Status</label>
                                                        <select
                                                            value={editDuesData.status}
                                                            onChange={(e) => setEditDuesData({ ...editDuesData, status: e.target.value })}
                                                            className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 outline-none focus:border-blue-500"
                                                        >
                                                            <option value="Fully Paid" className="text-gray-900">Fully Paid</option>
                                                            <option value="Paid" className="text-gray-900">Paid</option>
                                                            <option value="Partially Paid" className="text-gray-900">Partially Paid</option>
                                                            <option value="Unpaid" className="text-gray-900">Unpaid</option>
                                                        </select>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[9px] font-black text-gray-400 uppercase">Arrears (GHS)</label>
                                                        <input
                                                            type="number"
                                                            value={editDuesData.totalArrears}
                                                            onChange={(e) => setEditDuesData({ ...editDuesData, totalArrears: parseFloat(e.target.value) || 0 })}
                                                            className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 outline-none focus:border-blue-500"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <p className="text-sm font-bold text-gray-900">Account Standing</p>
                                                <p className="text-xs text-gray-500 font-medium">{['Paid', 'Fully Paid'].includes(selectedMember.duesStatus) ? 'This member is currently up to date with all contributions.' : 'This member has outstanding arrears that require attention.'}</p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-1 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                <Calendar className="w-3.5 h-3.5" />
                                Registered {selectedMember.joinDate}
                            </div>
                            <div className="flex gap-2.5">
                                <button
                                    onClick={() => handleContactMember('email', selectedMember)}
                                    className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-2xl text-[11px] font-black uppercase tracking-wider hover:bg-gray-100 active:scale-95 transition-all shadow-sm"
                                >
                                    <Mail className="w-4 h-4 text-blue-500" />
                                    Email
                                </button>
                                <button
                                    onClick={() => handleContactMember('whatsapp', selectedMember)}
                                    className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-wider shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
                                >
                                    <MessageSquare className="w-4 h-4" />
                                    WhatsApp
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Add Member Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl w-full max-w-lg flex flex-col animate-in slide-in-from-bottom-full md:slide-in-from-bottom-8 md:zoom-in-95 duration-500 shrink-0">
                        <div className="px-6 md:px-8 py-5 md:py-6 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">Add New Member</h3>
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="p-2.5 bg-gray-50 text-gray-400 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            setIsSubmitting(true);
                            const result = await createMember(newMember);
                            setIsSubmitting(false);

                            if (result.success) {
                                toast.success("Member added successfully!");
                                setIsAddModalOpen(false);
                                setNewMember({ firstName: "", lastName: "", email: "", phone: "", role: "member" });
                                fetchMembersData(searchQuery);
                            } else {
                                toast.error(result.error || "Failed to add member.");
                            }
                        }} className="p-6 md:p-8 space-y-5 overflow-y-auto max-h-[80vh] md:max-h-none pb-12 md:pb-8">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">First Name</label>
                                    <input
                                        type="text"
                                        value={newMember.firstName}
                                        onChange={(e) => setNewMember({ ...newMember, firstName: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                                        placeholder="John"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Last Name</label>
                                    <input
                                        type="text"
                                        value={newMember.lastName}
                                        onChange={(e) => setNewMember({ ...newMember, lastName: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                                        placeholder="Doe"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Email Address</label>
                                <input
                                    type="email"
                                    value={newMember.email}
                                    onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                                    placeholder="john.doe@example.com"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Phone Number</label>
                                <input
                                    type="tel"
                                    value={newMember.phone}
                                    onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                                    placeholder="024 XXX XXXX"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Member Role</label>
                                <select
                                    value={newMember.role}
                                    onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                                >
                                    <option value="member">Regular Member</option>
                                    <option value="admin">Administrator</option>
                                </select>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Plus className="w-5 h-5" />
                                            Register Member
                                        </>
                                    )}
                                </button>
                                <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-4">
                                    A default password will be generated: <span className="text-blue-500">welcome@gethsemane</span>
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
