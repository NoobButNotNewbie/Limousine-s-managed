// ================================================
// EXPIRE BOOKINGS JOB - Cleanup expired pending bookings
// ================================================

import * as bookingService from '../modules/bookings/booking.service';

/**
 * Expire pending bookings that have passed OTP timeout
 */
export async function runExpireBookingsJob(): Promise<void> {
    console.log('🔄 Running expire bookings job...');

    try {
        const expiredCount = await bookingService.expirePendingBookings();

        if (expiredCount > 0) {
            console.log(`🧹 Expired ${expiredCount} pending bookings`);
        }
    } catch (error) {
        console.error('❌ Expire bookings job error:', error);
    }
}
