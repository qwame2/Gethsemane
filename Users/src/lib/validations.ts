import { z } from "zod";

export const loginSchema = z.object({
    identifier: z.string().min(3, "Username or email is too short").max(255),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
    firstName: z.string().min(2, "First name is too short").max(50),
    lastName: z.string().min(2, "Last name is too short").max(50),
    email: z.string().email("Invalid email address"),
    username: z.string().min(3, "Username must be at least 3 characters").max(30).regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    phone: z.string().optional().nullable(),
    securityQuestion1: z.string().min(5, "Security question 1 is required"),
    securityAnswer1: z.string().min(1, "Answer 1 is required"),
    securityQuestion2: z.string().min(5, "Security question 2 is required"),
    securityAnswer2: z.string().min(1, "Answer 2 is required"),
});

export const paymentInitSchema = z.object({
    amount: z.coerce.number().positive("Amount must be greater than zero"),
    type: z.enum(["monthly", "yearly", "full", "installment", "arrears", "fundraising"]),
    eventId: z.string().optional().nullable(),
});

export const profileUpdateSchema = z.object({
    firstName: z.string().min(2).max(50).optional(),
    lastName: z.string().min(2).max(50).optional(),
    username: z.string().min(3).max(30).optional(),
    phone: z.string().optional().nullable(),
    image: z.string().url().optional().nullable(),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(8).optional(),
}).refine((data) => {
    if (data.newPassword && !data.currentPassword) {
        return false;
    }
    return true;
}, {
    message: "Current password is required to set a new password",
    path: ["currentPassword"],
});
