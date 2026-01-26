// ================================================
// OTP UTILITIES
// ================================================

import { storeOtp, getOtp, deleteOtp } from '../../db/redis';
import { OTP_TTL_SECONDS } from '../constants';

/**
 * Generate a 6-digit OTP
 */
export function generateOtpCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Create and store OTP for phone number
 */
export async function createOtp(phone: string): Promise<string> {
    const otp = generateOtpCode();
    await storeOtp(phone, otp, OTP_TTL_SECONDS);
    return otp;
}

/**
 * Verify OTP for phone number
 * Returns true if valid, false otherwise
 */
export async function verifyOtp(phone: string, inputOtp: string): Promise<boolean> {
    const storedOtp = await getOtp(phone);

    if (!storedOtp) {
        return false; // OTP expired or not found
    }

    if (storedOtp !== inputOtp) {
        return false; // Invalid OTP
    }

    // OTP matched - delete it to prevent reuse
    await deleteOtp(phone);
    return true;
}

/**
 * Invalidate OTP for phone number
 */
export async function invalidateOtp(phone: string): Promise<void> {
    await deleteOtp(phone);
}
