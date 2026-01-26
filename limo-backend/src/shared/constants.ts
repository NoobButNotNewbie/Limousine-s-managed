// ================================================
// CONSTANTS - Limousine Booking System
// ================================================

export const SEAT_COUNT = 9;

export const SEAT_POSITIONS = {
    front: [1, 2, 3, 4],
    middle: [5, 6],
    back: [7, 8, 9]
} as const;

// Prices in VND
export const SEAT_PRICES = {
    front: 250000,
    middle: 200000,
    back: 150000
} as const;

export const TIME_RANGE = {
    start: 4,  // 04:00
    end: 22    // 22:00
} as const;

export const TRIP_DURATION_HOURS = 5;
export const SEAT_LOCK_TTL_SECONDS = 300; // 5 minutes
export const OTP_TTL_SECONDS = 300; // 5 minutes
export const MIN_PASSENGERS = 4;
export const PRE_TRIP_NOTICE_HOURS = 3;

export const TRIP_STATUS = {
    OPEN: 'OPEN',
    CONFIRMED: 'CONFIRMED',
    CANCELLED: 'CANCELLED',
    COMPLETED: 'COMPLETED'
} as const;

export const BOOKING_STATUS = {
    PENDING: 'PENDING',
    CONFIRMED: 'CONFIRMED',
    CANCELLED: 'CANCELLED',
    EXPIRED: 'EXPIRED'
} as const;

// Get seat position from seat number
export function getSeatPosition(seatNumber: number): 'front' | 'middle' | 'back' {
    if (seatNumber >= 1 && seatNumber <= 4) return 'front';
    if (seatNumber >= 5 && seatNumber <= 6) return 'middle';
    return 'back';
}

// Get price for a seat number
export function getSeatPrice(seatNumber: number): number {
    const position = getSeatPosition(seatNumber);
    return SEAT_PRICES[position];
}
