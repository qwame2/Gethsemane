import { SignJWT, jwtVerify } from "jose";

const secretKey = process.env.JWT_SECRET || "default_super_secret_key_change_me_in_prod";
const key = new TextEncoder().encode(secretKey);

export async function encryptSession(payload: any) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(key);
}

export async function decryptSession(input: string): Promise<any> {
    try {
        const { payload } = await jwtVerify(input, key, {
            algorithms: ["HS256"],
        });

        // Deep integrity and expiration checks
        if (!payload) {
            throw new Error("Empty session payload");
        }

        // Check if the payload has the required id field
        if (typeof payload.id !== "string") {
            throw new Error("Session payload missing required 'id' field");
        }

        // Explicitly check expiration (though jwtVerify does this, we add it for double safety as requested)
        if (payload.exp && typeof payload.exp === 'number') {
            const currentTime = Math.floor(Date.now() / 1000);
            if (payload.exp < currentTime) {
                throw new Error("Session has expired");
            }
        }

        return payload;
    } catch (error) {
        // Log the error for debugging but return null for unauthorized access
        console.warn("Session verification failed:", error instanceof Error ? error.message : "Invalid token");
        return null;
    }
}
