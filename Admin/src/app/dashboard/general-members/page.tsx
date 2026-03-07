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
    X,
    MessageSquare,
    CheckCircle2,
    UserCircle,
    Baby,
    UserCheck,
    Contact,
    Camera,
    Upload
} from "lucide-react";
import { getGeneralMembers, createGeneralMember, deleteGeneralMember } from "@/actions/general-members";
import { createMember } from "@/actions/members";
import { toast } from "sonner";
import Image from "next/image";

export default function GeneralMembersPage() {
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("All Members");
    const [selectedMember, setSelectedMember] = useState<any | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [newMember, setNewMember] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        category: "Men",
        image: "" // base64 string
    });

    const fetchMembersData = async (query?: string) => {
        setLoading(true);
        try {
            const data = await getGeneralMembers(query);
            setMembers(data);
        } catch (error) {
            toast.error("Failed to load church directory");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMembersData(searchQuery);
    }, [searchQuery]);

    const handleDelete = async (id: string, name: string, isAppUser: boolean) => {
        if (isAppUser) {
            toast.error("Cannot delete app users from here. Go to 'Members' page.");
            return;
        }

        if (confirm(`Remove ${name} from the church directory?`)) {
            try {
                const res = await deleteGeneralMember(id);
                if (res.success) {
                    toast.success("Member removed");
                    fetchMembersData(searchQuery);
                } else {
                    toast.error(res.error);
                }
            } catch (error) {
                toast.error("Failed to remove member");
            }
        }
    };

    const handleExport = () => {
        if (displayedMembers.length === 0) {
            toast.error("No data to export");
            return;
        }

        const headers = ["Name", "Category", "Email", "Phone", "Join Date"];
        const csvContent = [
            headers.join(","),
            ...displayedMembers.map(m => [
                `"${m.name}"`,
                m.category,
                m.email,
                m.phone,
                m.joinDate
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Church_Directory_${new Date().toISOString().split('T')[0]}.csv`);
        link.click();
        toast.success("Directory exported!");
    };

    const handleContactMember = (type: 'whatsapp' | 'email', member: any) => {
        if (!member || member.phone === 'N/A') {
            toast.error("Contact info missing");
            return;
        }

        if (type === 'whatsapp') {
            const phoneNumber = member.phone.replace(/\D/g, '');
            const formattedPhone = phoneNumber.startsWith('0') ? '233' + phoneNumber.substring(1) : phoneNumber;
            const message = encodeURIComponent(`Hello ${member.name}, this is Gethsemane Fellowship Admin.`);
            window.open(`https://wa.me/${formattedPhone}?text=${message}`, '_blank');
        } else {
            window.location.href = `mailto:${member.email}`;
        }
    };

    const displayedMembers = members.filter(member => {
        if (categoryFilter === "All Members") return true;
        return member.category === categoryFilter;
    });

    const categories = ["All Members", "Youth", "Men", "Women", "Children"];

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out pb-20 md:pb-0">
            {/* Samsung One UI Mobile Header */}
            <div className="md:hidden pt-8 pb-6 px-4">
                <div className="flex items-center gap-2 text-[11px] font-bold text-blue-500 uppercase tracking-[0.2em] mb-4 opacity-80">
                    <Contact className="w-3 h-3" />
                    Directory
                </div>
                <div className="flex items-end justify-between">
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tighter leading-none">
                        All Members
                    </h1>
                    <div className="flex gap-3">
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
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Church Directory</h1>
                    <p className="mt-1 text-base text-gray-500 max-w-2xl">
                        Comprehensive list of all members across Youth, Children, Men, and Women fellowships.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleExport}
                        className="flex items-center justify-center gap-2 px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all shadow-sm"
                    >
                        <Download className="w-4 h-4 text-gray-400" />
                        Export Directory
                    </button>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md shadow-blue-500/20 group"
                    >
                        <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                        Register New Member
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="mx-2 md:mx-0 flex flex-col md:flex-row items-stretch md:items-center justify-between bg-white/80 backdrop-blur-sm p-4 rounded-[2.2rem] shadow-samsung border border-white gap-4">
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 flex-1">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Find anyone in the church..."
                            className="w-full pl-11 pr-4 py-3 bg-gray-50/50 border border-gray-100 rounded-[1.2rem] text-sm text-gray-900 placeholder:text-gray-500 font-medium focus:ring-4 focus:ring-blue-500/5 focus:bg-white transition-all shadow-inner"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setCategoryFilter(cat)}
                                className={`px-5 py-2.5 rounded-full text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${categoryFilter === cat ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* List Table */}
            <div className="rounded-[2.2rem] md:rounded-[2.5rem] bg-white shadow-samsung border border-white overflow-hidden">
                <div className="border-b border-gray-50 px-8 py-6">
                    <h3 className="text-lg font-bold text-gray-900">Directory Records</h3>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mt-1">Total Found • {displayedMembers.length}</p>
                </div>

                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-4">
                        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-600 rounded-full animate-spin" />
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Gathering records...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-50">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="py-5 pl-8 pr-3 text-left text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Member</th>
                                    <th className="px-3 py-5 text-left text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Fellowship</th>
                                    <th className="px-3 py-5 text-left text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Contact</th>
                                    <th className="px-3 py-5 text-left text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Joined</th>
                                    <th className="relative py-5 pl-3 pr-8"><span className="sr-only">Actions</span></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {displayedMembers.map((member) => (
                                    <tr key={member.id} className="hover:bg-gray-50/50 transition-all group">
                                        <td className="py-5 pl-8 pr-3">
                                            <div className="flex items-center gap-4">
                                                <div className="w-11 h-11 rounded-2xl bg-gray-50 text-gray-500 flex items-center justify-center text-xs font-black border border-gray-100 overflow-hidden relative shadow-inner">
                                                    {member.image ? (
                                                        <Image src={member.image} alt={member.name} fill className="object-cover" />
                                                    ) : (
                                                        member.initials
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-gray-900">{member.name}</span>
                                                    {member.isAppUser && <span className="text-[9px] font-black text-blue-500 uppercase">App User (Youth)</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-5">
                                            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border
                                                ${member.category === 'Youth' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                    member.category === 'Men' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                                        member.category === 'Women' ? 'bg-pink-50 text-pink-600 border-pink-100' :
                                                            'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                                {member.category}
                                            </div>
                                        </td>
                                        <td className="px-3 py-5">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-xs font-bold text-gray-900">{member.phone}</span>
                                                <span className="text-[10px] font-medium text-gray-400 truncate max-w-[150px]">{member.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-5 text-[11px] font-bold text-gray-400 uppercase">
                                            {member.joinDate}
                                        </td>
                                        <td className="py-5 pl-3 pr-8 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => setSelectedMember(member)} className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all"><Eye className="w-4 h-4" /></button>
                                                {!member.isAppUser && <button onClick={() => handleDelete(member.id, member.name, false)} className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all"><Trash2 className="w-4 h-4" /></button>}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Details Modal */}
            {selectedMember && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-500">
                        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">Member Profile</h3>
                            <button onClick={() => setSelectedMember(null)} className="p-2.5 bg-gray-50 text-gray-400 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-8 space-y-8 flex-1 overflow-y-auto">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl font-black shadow-inner border border-blue-100 overflow-hidden relative shrink-0">
                                    {selectedMember.image ? <Image src={selectedMember.image} alt={selectedMember.name} fill className="object-cover" /> : selectedMember.initials}
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-2xl font-black text-gray-900 tracking-tighter">{selectedMember.name}</h4>
                                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest inline-block ${selectedMember.isAppUser ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                                        {selectedMember.category} Fellowshp
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 rounded-2xl border border-white">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Phone Number</p>
                                    <p className="text-sm font-bold text-gray-900">{selectedMember.phone}</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-2xl border border-white">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Email Address</p>
                                    <p className="text-sm font-bold text-gray-900 truncate">{selectedMember.email}</p>
                                </div>
                            </div>

                            <div className="p-6 bg-gradient-to-br from-blue-50/50 to-white rounded-3xl border border-blue-100 space-y-4">
                                <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Connect with Member</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => handleContactMember('whatsapp', selectedMember)} className="flex items-center justify-center gap-2 py-3 bg-emerald-500 text-white rounded-xl text-xs font-black uppercase shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">
                                        <MessageSquare className="w-4 h-4" /> WhatsApp
                                    </button>
                                    <button onClick={() => handleContactMember('email', selectedMember)} className="flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-black uppercase active:scale-95 transition-all">
                                        <Mail className="w-4 h-4 text-blue-500" /> Email
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl w-full max-w-lg flex flex-col animate-in slide-in-from-bottom-full md:slide-in-from-bottom-8 duration-500">
                        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">Directory Registration</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="p-2.5 bg-gray-50 text-gray-400 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            setIsSubmitting(true);

                            let res;
                            if (newMember.category === 'Youth') {
                                // If Youth, create a full User/Dues account
                                res = await createMember({
                                    firstName: newMember.firstName,
                                    lastName: newMember.lastName,
                                    email: newMember.email || `${newMember.firstName.toLowerCase()}.${Date.now()}@gethsemane.temp`,
                                    phone: newMember.phone,
                                    role: 'member',
                                    image: newMember.image
                                });
                            } else {
                                // Otherwise create a general directory record
                                res = await createGeneralMember(newMember);
                            }

                            setIsSubmitting(false);
                            if (res.success) {
                                toast.success(`${newMember.category} member added to directory`);
                                setIsAddModalOpen(false);
                                setNewMember({ firstName: "", lastName: "", email: "", phone: "", category: "Men", image: "" });
                                fetchMembersData(searchQuery);
                            } else {
                                toast.error(res.error);
                            }
                        }} className="p-8 space-y-5 overflow-y-auto max-h-[80vh] md:max-h-[600px]">
                            {/* Image Upload Area */}
                            <div className="flex flex-col items-center justify-center pt-2 pb-6">
                                <div className="relative group">
                                    <div className="w-24 h-24 rounded-full bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden shadow-inner transition-all group-hover:border-blue-500/50">
                                        {newMember.image ? (
                                            <img src={newMember.image} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex flex-col items-center text-gray-400 group-hover:text-blue-500 transition-colors">
                                                <Camera className="w-7 h-7 mb-1" />
                                                <span className="text-[8px] font-black uppercase tracking-widest">Photo</span>
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onloadend = () => {
                                                    setNewMember({ ...newMember, image: reader.result as string });
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                    />
                                    {newMember.image && (
                                        <button
                                            type="button"
                                            onClick={() => setNewMember({ ...newMember, image: "" })}
                                            className="absolute -top-1 -right-1 p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-3">Upload Profile Image</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">First Name</label>
                                    <input required value={newMember.firstName} onChange={e => setNewMember({ ...newMember, firstName: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Last Name</label>
                                    <input required value={newMember.lastName} onChange={e => setNewMember({ ...newMember, lastName: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Fellowship Category</label>
                                <select value={newMember.category} onChange={e => setNewMember({ ...newMember, category: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-black text-gray-900 uppercase tracking-tight focus:ring-4 focus:ring-blue-500/5 outline-none transition-all">
                                    <option value="Youth">Youth Fellowship (App User)</option>
                                    <option value="Men">Men Fellowshp</option>
                                    <option value="Women">Women Fellowship</option>
                                    <option value="Children">Children Fellowship</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Phone Number (Optional)</label>
                                <input value={newMember.phone} onChange={e => setNewMember({ ...newMember, phone: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all" />
                            </div>
                            <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50">
                                {isSubmitting ? "Registering..." : "Add to Church Directory"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
