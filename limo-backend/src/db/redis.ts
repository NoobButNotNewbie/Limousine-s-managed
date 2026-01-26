import Redis from 'ioredis';
import env from '../config/env';

// Create Redis client
const redis = new Redis(env.REDIS_URL);

redis.on('connect', () => {
    console.log('🔴 Redis connected');
});

redis.on('error', (err: Error) => {
    console.error('❌ Redis error:', err);
});

// Seat locking functions
export async function lockSeat(seatId: string, bookingId: string, ttlSeconds: number): Promise<boolean> {
    const key = `seat_lock:${seatId}`;
    // Use SET NX EX for atomic lock with TTL
    const result = await redis.set(key, bookingId, 'EX', ttlSeconds, 'NX');
    return result === 'OK';
}

export async function unlockSeat(seatId: string): Promise<void> {
    const key = `seat_lock:${seatId}`;
    await redis.del(key);
}

export async function getSeatLock(seatId: string): Promise<string | null> {
    const key = `seat_lock:${seatId}`;
    return redis.get(key);
}

export async function isSeatLocked(seatId: string): Promise<boolean> {
    const lock = await getSeatLock(seatId);
    return lock !== null;
}

// OTP functions
export async function storeOtp(phone: string, otp: string, ttlSeconds: number): Promise<void> {
    const key = `otp:${phone}`;
    await redis.set(key, otp, 'EX', ttlSeconds);
}

export async function getOtp(phone: string): Promise<string | null> {
    const key = `otp:${phone}`;
    return redis.get(key);
}

export async function deleteOtp(phone: string): Promise<void> {
    const key = `otp:${phone}`;
    await redis.del(key);
}

// Close Redis connection
export async function closeRedis(): Promise<void> {
    await redis.quit();
    console.log('🔴 Redis connection closed');
}

export default redis;
