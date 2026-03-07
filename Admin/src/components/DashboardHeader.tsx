"use client";

import { Bell, Search } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface DashboardHeaderProps {
    adminName: string;
    adminInitials: string;
    adminImage: string | null;
}

export default function DashboardHeader({ adminName, adminInitials, adminImage }: DashboardHeaderProps) {
    const [searchTerm, setSearchTerm] = useState("");

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        // Logic for search can be added here or via a context/event
        if (typeof window !== 'undefined') {
            const event = new CustomEvent('dashboardSearch', { detail: searchTerm });
            window.dispatchEvent(event);
        }
    };

    return (
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white/70 backdrop-blur-md px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
            <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
                <form className="relative flex flex-1" onSubmit={handleSearch}>
                    <label htmlFor="search-field" className="sr-only">
                        Search
                    </label>
                    <Search
                        className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400"
                        aria-hidden="true"
                    />
                    <input
                        id="search-field"
                        className="block h-full w-full border-0 py-0 pl-8 pr-0 text-gray-900 placeholder:text-gray-500 focus:ring-0 sm:text-sm bg-transparent font-medium"
                        placeholder="Search members, activities..."
                        type="search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </form>
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
