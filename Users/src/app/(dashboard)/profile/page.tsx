"use client";

import React, { useState, useEffect, useRef } from "react";
import { User, Mail, Phone, Save, Loader2, Camera, Edit2, X, Lock, Eye, EyeOff, ShieldCheck, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { updateProfileImage } from "./actions";



export default function ProfilePage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [showPasswords, setShowPasswords] = useState(false);
    const [userData, setUserData] = useState({
        firstName: "",
        lastName: "",
        username: "",
        email: "",
        phone: "",
        role: "",
        image: "" as string | null,
        id: "",
    });
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch("/api/user/profile", { cache: "no-store" });
                if (res.ok) {
                    const data = await res.json();
                    setUserData(data);
                } else {
                    toast.error("Failed to load profile data");
                }
            } catch (err) {
                toast.error("Network error while loading profile");
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        if (id in passwordData) {
            setPasswordData(prev => ({ ...prev, [id]: value }));
        } else {
            setUserData(prev => ({ ...prev, [id]: value }));
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setPasswordData({
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        });
        // Reload original data
        window.location.reload();
    };

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            return toast.error("Please upload an image file");
        }
        if (file.size > 2 * 1024 * 1024) {
            return toast.error("Image size should be less than 2MB");
        }

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = reader.result as string;
            setUserData(prev => ({ ...prev, image: base64String }));

            setIsSaving(true);
            try {
                const formData = new FormData();
                formData.append("userId", userData.id || "cmmcpao9e0002igvo38ss2suw");
                formData.append("image", base64String);

                const result = await updateProfileImage(formData);

                if (result.success) {
                    toast.success("Profile photo updated!");
                } else {
                    toast.error(`Error: ${result.error}`);
                }
            } catch (err: any) {
                toast.error("Error communicating with server");
            } finally {
                setIsSaving(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (passwordData.newPassword) {
            if (passwordData.newPassword !== passwordData.confirmPassword) {
                return toast.error("New passwords do not match");
            }
            if (passwordData.newPassword.length < 6) {
                return toast.error("New password must be at least 6 characters");
            }
        }

        setIsSaving(true);

        try {
            const res = await fetch("/api/user/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    username: userData.username,
                    phone: userData.phone,
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword,
                }),
            });

            if (res.ok) {
                const updated = await res.json();
                setUserData(updated);
                setIsEditing(false);
                setPasswordData({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                });
                toast.success("Profile updated successfully!");
            } else {
                const data = await res.json();
                toast.error(data.details || data.error || "Failed to update profile");
            }
        } catch (err) {
            toast.error("Network error while saving changes");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto pb-20 space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">

            {/* Top Profile Header / Avatar Island */}
            <div className="flex flex-col items-center">
                <div className="relative group p-1.5 bg-white shadow-samsung-lg rounded-[3rem] border border-white">
                    <div className="h-36 w-36 rounded-[2.75rem] bg-slate-100 overflow-hidden relative">
                        {userData.image ? (
                            <img
                                src={userData.image}
                                alt="Profile"
                                className="h-full w-full object-cover transition-transform group-hover:scale-105 duration-700"
                            />
                        ) : (
                            <div className="h-full w-full bg-primary-500 flex items-center justify-center text-white text-4xl font-bold">
                                {userData.firstName?.[0]}{userData.lastName?.[0]}
                            </div>
                        )}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                            <Camera className="text-white h-8 w-8" />
                        </button>
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        accept="image/*"
                        className="hidden"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute -bottom-1 -right-1 bg-primary-500 p-3 rounded-2xl shadow-samsung text-white hover:scale-110 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                        disabled={isSaving || userData.role === "Guest"}
                    >
                        {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
                    </button>
                </div>

                <h2 className="text-3xl font-bold text-black mt-6 tracking-tight">{userData.firstName} {userData.lastName}</h2>
                <div className="flex items-center gap-2 mt-2">
                    <span className="px-3 py-1 bg-white shadow-samsung border border-white rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none flex items-center h-6">
                        GA-MEMBER
                    </span>
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-widest leading-none flex items-center h-6">
                        Active
                    </span>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-5">
                {/* Left Column: Actions & Details */}
                <div className="md:col-span-2 space-y-6">
                    {/* Role Card */}
                    <div className="p-6 rounded-[2.25rem] bg-white shadow-samsung border border-white">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Account Type</p>
                            <ShieldCheck className="h-5 w-5 text-primary-500" />
                        </div>
                        <h3 className="text-xl font-bold text-black">{userData.role || "Member"}</h3>
                        <p className="text-sm font-semibold text-slate-400 mt-1">Full access to member portal features</p>
                    </div>

                    {userData.role === "Guest" ? (
                        <div className="p-6 rounded-[2.25rem] bg-amber-50 shadow-samsung border border-amber-100 flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <Lock className="h-4 w-4 text-amber-600" />
                                <p className="text-sm font-bold text-amber-800 tracking-tight">Guest Account</p>
                            </div>
                            <p className="text-xs font-semibold text-amber-700 leading-relaxed">Profile editing and modifications are disabled while logged in as a guest.</p>
                        </div>
                    ) : !isEditing ? (
                        <Button
                            onClick={() => setIsEditing(true)}
                            className="w-full h-16 rounded-[2rem] bg-white shadow-samsung border border-white text-black font-bold hover:bg-slate-50 transition-all flex items-center justify-between px-8 group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-500">
                                    <Edit2 className="h-5 w-5" />
                                </div>
                                <span>Edit Profile</span>
                            </div>
                            <ChevronRight className="h-5 w-5 text-slate-300 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    ) : (
                        <div className="p-6 rounded-[2.25rem] bg-slate-900 shadow-samsung text-white space-y-4">
                            <p className="text-sm font-bold text-slate-400">Editing Mode Active</p>
                            <p className="text-sm font-semibold text-slate-500">Review your changes carefully before saving to your profile.</p>
                            <Button
                                onClick={handleCancel}
                                variant="ghost"
                                className="w-full h-12 rounded-[2.5rem] text-slate-300 font-bold hover:text-white hover:bg-white/5"
                            >
                                Cancel Changes
                            </Button>
                        </div>
                    )}
                </div>

                {/* Right Column: Form */}
                <div className="md:col-span-3 space-y-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Information Island */}
                        <div className="p-8 rounded-[2.5rem] bg-white shadow-samsung border border-white space-y-8">
                            <div className="space-y-6">
                                <h3 className="text-xl font-bold text-black tracking-tight">Personal Details</h3>

                                <div className="grid gap-6 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName" className="text-sm font-bold text-slate-600 ml-1">First Name</Label>
                                        <div className="relative group/input">
                                            <Input
                                                id="firstName"
                                                value={userData.firstName}
                                                onChange={handleChange}
                                                className={cn(
                                                    "h-14 rounded-[1.5rem] bg-slate-50/50 border-slate-100 px-6 font-bold text-black focus-visible:ring-primary-500 transition-all",
                                                    !isEditing && "bg-slate-50 border-transparent opacity-70 pointer-events-none"
                                                )}
                                                readOnly={!isEditing}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastName" className="text-sm font-bold text-slate-600 ml-1">Last Name</Label>
                                        <Input
                                            id="lastName"
                                            value={userData.lastName}
                                            onChange={handleChange}
                                            className={cn(
                                                "h-14 rounded-[1.5rem] bg-slate-50/50 border-slate-100 px-6 font-bold text-black focus-visible:ring-primary-500 transition-all",
                                                !isEditing && "bg-slate-50 border-transparent opacity-70 pointer-events-none"
                                            )}
                                            readOnly={!isEditing}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="username" className="text-sm font-bold text-slate-600 ml-1">Username</Label>
                                    <div className="relative group/input">
                                        <Input
                                            id="username"
                                            value={userData.username || ""}
                                            onChange={handleChange}
                                            className={cn(
                                                "h-14 rounded-[1.5rem] bg-slate-50/50 border-slate-100 px-6 font-bold text-black focus-visible:ring-primary-500 transition-all",
                                                !isEditing && "bg-slate-50 border-transparent opacity-70 pointer-events-none"
                                            )}
                                            readOnly={!isEditing}
                                            placeholder="@username"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-sm font-bold text-slate-600 ml-1">Email Address</Label>
                                    <div className="relative">
                                        <Input
                                            id="email"
                                            type="email"
                                            value={userData.email}
                                            readOnly
                                            disabled
                                            className="h-14 rounded-[1.5rem] bg-slate-100/50 border-transparent text-slate-400 px-6 font-bold cursor-not-allowed"
                                        />
                                        <Lock className="absolute right-6 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="text-sm font-bold text-slate-600 ml-1">Phone Number</Label>
                                    <Input
                                        id="phone"
                                        value={userData.phone || ""}
                                        onChange={handleChange}
                                        className={cn(
                                            "h-14 rounded-[1.5rem] bg-slate-50/50 border-slate-100 px-6 font-bold text-black focus-visible:ring-primary-500 transition-all",
                                            !isEditing && "bg-slate-50 border-transparent opacity-70 pointer-events-none"
                                        )}
                                        readOnly={!isEditing}
                                        placeholder="+233 XX XXX XXXX"
                                    />
                                </div>
                            </div>

                            {/* Security Section within the same island or separate */}
                            <div className="pt-8 border-t border-slate-50 space-y-6">
                                <h3 className="text-xl font-bold text-black tracking-tight">Security</h3>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="currentPassword text-sm font-bold text-slate-600 ml-1">Current Password</Label>
                                        <div className="relative">
                                            <Input
                                                id="currentPassword"
                                                type={showPasswords ? "text" : "password"}
                                                value={passwordData.currentPassword}
                                                onChange={handleChange}
                                                placeholder="••••••••"
                                                className="h-14 rounded-[1.5rem] bg-slate-50/50 border-slate-100 px-6 font-bold focus-visible:ring-primary-500 transition-all"
                                                required={!!passwordData.newPassword}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPasswords(!showPasswords)}
                                                className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400"
                                            >
                                                {showPasswords ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid gap-6 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="newPassword" className="text-sm font-bold text-slate-600 ml-1">New Password</Label>
                                            <Input
                                                id="newPassword"
                                                type={showPasswords ? "text" : "password"}
                                                value={passwordData.newPassword}
                                                onChange={handleChange}
                                                placeholder="New password"
                                                className="h-14 rounded-[1.5rem] bg-slate-50/50 border-slate-100 px-6 font-bold focus-visible:ring-primary-500 transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="confirmPassword" className="text-sm font-bold text-slate-600 ml-1">Confirm New</Label>
                                            <Input
                                                id="confirmPassword"
                                                type={showPasswords ? "text" : "password"}
                                                value={passwordData.confirmPassword}
                                                onChange={handleChange}
                                                placeholder="Confirm new"
                                                className="h-14 rounded-[1.5rem] bg-slate-50/50 border-slate-100 px-6 font-bold focus-visible:ring-primary-500 transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {isEditing && (
                                <div className="pt-8">
                                    <Button
                                        type="submit"
                                        className="w-full h-16 rounded-[2rem] bg-primary-500 hover:bg-primary-600 text-white font-bold shadow-samsung-lg shadow-primary-500/20 active:scale-[0.98] transition-all"
                                        disabled={isSaving}
                                    >
                                        {isSaving ? (
                                            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Saving Changes</>
                                        ) : (
                                            <><Save className="mr-2 h-5 w-5" /> Save Profile</>
                                        )}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
