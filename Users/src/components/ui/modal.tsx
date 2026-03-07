"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, description, children, footer }: ModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Dialog */}
            <div
                className={cn(
                    "relative z-50 flex flex-col w-full max-w-lg bg-white p-6 shadow-floating rounded-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto no-scrollbar"
                )}
            >

                <div className="flex flex-col space-y-1.5 text-center sm:text-left">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold leading-none tracking-tight text-slate-900">
                            {title}
                        </h2>
                        <button
                            onClick={onClose}
                            className="rounded-full p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Close</span>
                        </button>
                    </div>

                    {description && (
                        <p className="text-sm text-slate-500">
                            {description}
                        </p>
                    )}

                </div>

                <div className="py-2">
                    {children}
                </div>

                {footer && (
                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
