import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcrypt";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        if (!body.identifier || !body.questionNumber || !body.securityAnswer || !body.newPassword) {
            return NextResponse.json(
                { error: "All fields are required" },
                { status: 400 }
            );
        }

        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: body.identifier },
                    { username: body.identifier }
                ]
            }
        });

        if (!user) {
            return NextResponse.json(
                { error: "No account found with that identifier." },
                { status: 404 }
            );
        }

        const hashedExpectedAnswer = body.questionNumber === 1 ? user.securityAnswer1 : user.securityAnswer2;

        if (!hashedExpectedAnswer) {
            return NextResponse.json(
                { error: "Security question not set. Please contact support." },
                { status: 400 }
            );
        }

        const isAnswerCorrect = await bcrypt.compare(body.securityAnswer.trim().toLowerCase(), hashedExpectedAnswer);

        if (!isAnswerCorrect) {
            return NextResponse.json(
                { error: "Incorrect security answer. Please try again." },
                { status: 400 }
            );
        }

        // Correct answer! Update password.
        const hashedPassword = await bcrypt.hash(body.newPassword, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash: hashedPassword
            }
        });

        return NextResponse.json(
            { message: "Password updated successfully." },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Password Reset Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
