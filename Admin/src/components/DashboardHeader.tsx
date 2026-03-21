"use client";

import { Bell, Search, Users, Wallet, Calendar, ChevronRight, Loader2, X, Activity } from "lucide-react";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { globalSearch } from "@/actions/search";

interface DashboardHeaderProps {
    adminName: string;
    adminInitials: string;
    adminImage: string | null;
}

export default function DashboardHeader({ adminName, adminInitials, adminImage }: DashboardHeaderProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<any>(null);
    const [showResults, setShowResults] = useState(false);
    const router = useRouter();
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) && !(event.target as Element).closest('#search-form')) {
                setShowResults(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const handler = setTimeout(async () => {
            if (searchTerm.trim().length > 1) {
                setIsSearching(true);
                setShowResults(true);
                try {
                    const res = await globalSearch(searchTerm);
                    if (res.success) {
                        setSearchResults(res.results);
                    }
                } catch (error) {
                    console.error("Search failed", error);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults(null);
                setShowResults(false);
            }
        }, 350);

        return () => clearTimeout(handler);
    }, [searchTerm]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (typeof window !== 'undefined') {
            const event = new CustomEvent('dashboardSearch', { detail: searchTerm });
            window.dispatchEvent(event);
        }
    };

    const clearSearch = () => {
        setSearchTerm("");
        setSearchResults(null);
        setShowResults(false);
        if (typeof window !== 'undefined') {
            const event = new CustomEvent('dashboardSearch', { detail: "" });
            window.dispatchEvent(event);
        }
    };

    const handleNavigate = (path: string) => {
        router.push(path);
        // We do not clear searchTerm to allow the page's local search to pick it up if they want, 
        // but we hide the dropdown.
        setShowResults(false);
    };

    const hasResults = searchResults && (
        searchResults.users.length > 0 ||
        searchResults.churchMembers.length > 0 ||
        searchResults.payments.length > 0 ||
        searchResults.events.length > 0
    );

    return (
        <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white/70 backdrop-blur-md px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
            <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 relative">
                <form id="search-form" className="relative flex flex-1 items-center" onSubmit={handleSearch}>
                    <label htmlFor="search-field" className="sr-only">Search</label>
                    <Search className="pointer-events-none absolute left-0 h-5 w-5 text-gray-400" aria-hidden="true" />
                    <input
                        id="search-field"
                        className="block h-full w-full border-0 py-0 pl-8 pr-10 text-gray-900 placeholder:text-gray-500 focus:ring-0 sm:text-sm bg-transparent font-medium"
                        placeholder="Search members, activities, payments..."
                        type="text"
                        autoComplete="off"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onFocus={() => { if (searchTerm.trim().length > 1) setShowResults(true); }}
                    />
                    {searchTerm && (
                        <button 
                            type="button" 
                            onClick={clearSearch}
                            className="absolute right-0 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </form>

                {/* Search Results Dropdown */}
                {showResults && (
                    <div ref={dropdownRef} className="absolute top-[3.5rem] left-0 w-full md:w-[600px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-[100] max-h-[80vh] flex flex-col">
                        <div className="p-3 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between shrink-0">
                            <span className="text-xs font-black text-gray-400 uppercase tracking-widest pl-2">Global Search</span>
                            {isSearching && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
                        </div>
                        
                        <div className="overflow-y-auto flex-1 p-2 scrollbar-thin scrollbar-thumb-gray-200 hover:scrollbar-thumb-gray-300">
                            {!isSearching && !hasResults && searchTerm.length > 1 && (
                                <div className="py-12 flex flex-col items-center justify-center text-center">
                                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                                        <Search className="w-6 h-6 text-gray-300" />
                                    </div>
                                    <p className="text-sm font-bold text-gray-900">No results found</p>
                                    <p className="text-xs font-medium text-gray-500 mt-1">Try a different search term</p>
                                </div>
                            )}

                            {!isSearching && hasResults && (
                                <div className="space-y-4 p-2">
                                    {/* Users/Platform Members */}
                                    {searchResults.users.length > 0 && (
                                        <div className="space-y-1">
                                            <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest px-2 pb-1 flex items-center gap-1.5">
                                                <Users className="w-3 h-3" /> Core Members
                                            </h4>
                                            {searchResults.users.map((user: any) => (
                                                <button
                                                    key={user.id}
                                                    onClick={() => handleNavigate('/dashboard/members')}
                                                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left group"
                                                >
                                                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-black uppercase shrink-0">
                                                        {user.firstName[0]}{user.lastName?.[0] || ""}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">{user.firstName} {user.lastName}</p>
                                                        <p className="text-[10px] font-medium text-gray-500 truncate">{user.email || user.username || user.phone}</p>
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors shrink-0 opacity-0 group-hover:opacity-100" />
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Church Members (General) */}
                                    {searchResults.churchMembers.length > 0 && (
                                        <div className="space-y-1 pt-2 border-t border-gray-50">
                                            <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest px-2 pb-1 flex items-center gap-1.5">
                                                <Users className="w-3 h-3" /> General Directory
                                            </h4>
                                            {searchResults.churchMembers.map((member: any) => (
                                                <button
                                                    key={member.id}
                                                    onClick={() => handleNavigate('/dashboard/general-members')}
                                                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left group"
                                                >
                                                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-black uppercase shrink-0">
                                                        {member.firstName[0]}{member.lastName?.[0] || ""}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-bold text-gray-900 truncate group-hover:text-emerald-600 transition-colors">{member.firstName} {member.lastName}</p>
                                                        <p className="text-[10px] font-medium text-gray-500 truncate">{member.phone || "No phone provided"}</p>
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 transition-colors shrink-0 opacity-0 group-hover:opacity-100" />
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Payments */}
                                    {searchResults.payments.length > 0 && (
                                        <div className="space-y-1 pt-2 border-t border-gray-50">
                                            <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest px-2 pb-1 flex items-center gap-1.5">
                                                <Wallet className="w-3 h-3" /> Transactions
                                            </h4>
                                            {searchResults.payments.map((payment: any) => (
                                                <button
                                                    key={payment.id}
                                                    onClick={() => handleNavigate('/dashboard/payments')}
                                                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-amber-50/50 transition-colors text-left group"
                                                >
                                                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                                                        <Wallet className="w-4 h-4" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-sm font-bold text-gray-900 truncate group-hover:text-amber-700 transition-colors">{payment.user?.firstName} {payment.user?.lastName}</p>
                                                            <p className="text-sm font-black text-amber-600">GHS {payment.amount}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">{payment.type}</span>
                                                            <span className="w-1 h-1 rounded-full bg-gray-300" />
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">{payment.transactionId || payment.status}</span>
                                                        </div>
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-amber-500 transition-colors shrink-0 opacity-0 group-hover:opacity-100" />
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Events */}
                                    {searchResults.events.length > 0 && (
                                        <div className="space-y-1 pt-2 border-t border-gray-50">
                                            <h4 className="text-[10px] font-black text-purple-500 uppercase tracking-widest px-2 pb-1 flex items-center gap-1.5">
                                                <Calendar className="w-3 h-3" /> Activities & Fundraising
                                            </h4>
                                            {searchResults.events.map((evt: any) => (
                                                <button
                                                    key={evt.id}
                                                    onClick={() => handleNavigate('/dashboard/events')}
                                                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-purple-50/50 transition-colors text-left group"
                                                >
                                                    <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                                                        <Activity className="w-4 h-4" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-bold text-gray-900 truncate group-hover:text-purple-700 transition-colors">{evt.title}</p>
                                                        <p className="text-[10px] font-medium text-gray-500 truncate mt-0.5">{evt.description}</p>
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-purple-500 transition-colors shrink-0 opacity-0 group-hover:opacity-100" />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        
                        {hasResults && (
                            <div className="p-3 bg-gray-50/80 border-t border-gray-100 text-center shrink-0">
                                <button 
                                    onClick={(e) => handleSearch(e as any)}
                                    className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1"
                                >
                                    Press Enter to filter on current page <Search className="w-3 h-3" />
                                </button>
                            </div>
                        )}
                    </div>
                )}
                
                <div className="flex items-center gap-x-4 lg:gap-x-6">
                    <button type="button" className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500">
                        <span className="sr-only">View notifications</span>
                        <div className="relative">
                            <Bell className="h-6 w-6" aria-hidden="true" />
                            {/* <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white" /> */}
                        </div>
                    </button>

                    {/* Separator */}
                    <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" aria-hidden="true" />

                    {/* Profile dropdown */}
                    <div className="relative">
                        <button
                            type="button"
                            className="-m-1.5 flex items-center p-1.5 focus:outline-none"
                            id="user-menu-button"
                            aria-expanded="false"
                            aria-haspopup="true"
                        >
                            <span className="sr-only">Open user menu</span>
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs ring-2 ring-white shadow-sm overflow-hidden relative">
                                {adminImage ? (
                                    <Image src={adminImage} alt="Profile" fill className="object-cover" />
                                ) : (
                                    adminInitials
                                )}
                            </div>
                            <div className="hidden lg:flex lg:items-center">
                                <span className="ml-3 text-sm font-semibold leading-6 text-gray-900" aria-hidden="true">
                                    {adminName}
                                </span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}
