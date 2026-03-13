import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// 1. Initialize Redis if environment variables are present
const redis = (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    : null;

// 2. In-memory fallback for local development or if Redis is not configured
const memoryMap = new Map<string, { count: number; lastReset: number }>();

export type RateLimitConfig = {
    interval: number; // in milliseconds
    uniqueTokenPerInterval: number; // limit per interval
    prefix?: string;
};

export function rateLimit(config: RateLimitConfig) {
    // If Redis is available, use Upstash Ratelimit (Distributed & Persistent)
    if (redis) {
        const ratelimit = new Ratelimit({
            redis: redis,
            limiter: Ratelimit.slidingWindow(config.uniqueTokenPerInterval, `${Math.floor(config.interval / 1000)} s`),
            analytics: true,
            prefix: config.prefix || "@upstash/ratelimit",
        });

        return {
            check: async (token: string) => {
                const { success, remaining } = await ratelimit.limit(token);
                return { success, remaining };
            }
        };
    }

    // Fallback: Local In-Memory Map (Limited to current process/cold start)
    return {
        check: async (token: string) => {
            const now = Date.now();
            const entry = memoryMap.get(`${config.prefix}:${token}`);

            if (!entry || (now - entry.lastReset) > config.interval) {
                memoryMap.set(`${config.prefix}:${token}`, { count: 1, lastReset: now });
                return { success: true, remaining: config.uniqueTokenPerInterval - 1 };
            }

            if (entry.count >= config.uniqueTokenPerInterval) {
                return { success: false, remaining: 0 };
            }

            entry.count += 1;
            return { success: true, remaining: config.uniqueTokenPerInterval - entry.count };
        },
    };
}

// Global instance for general API use
// Limit: 50 requests per 10 seconds per IP
export const limiter = rateLimit({
    interval: 10 * 1000,
    uniqueTokenPerInterval: 50,
    prefix: "api_general",
});

// Stricter limiter for Auth (Login/Register)
// Limit: 5 attempts per minute per IP
export const authLimiter = rateLimit({
    interval: 60 * 1000,
    uniqueTokenPerInterval: 5,
    prefix: "auth_limit",
});
