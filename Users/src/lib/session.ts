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
        return payload;
    } catch (error) {
        return null;
    }
}
