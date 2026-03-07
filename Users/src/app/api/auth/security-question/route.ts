import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        if (!body.identifier) {
            return NextResponse.json(
                { error: "Username or Email is required" },
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

        if (!user.securityQuestion1 || !user.securityQuestion2) {
            return NextResponse.json(
                { error: "Account does not have security questions configured. Please contact an admin." },
                { status: 400 }
            );
        }

        // Randomly pick question 1 or 2
        const isFirst = Math.random() < 0.5;
        const selectedQuestion = isFirst ? user.securityQuestion1 : user.securityQuestion2;
        const questionNumber = isFirst ? 1 : 2;

        return NextResponse.json({
            question: selectedQuestion,
            questionNumber
        }, { status: 200 });

    } catch (error: any) {
        console.error("Security Question Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
