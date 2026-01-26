// ================================================
// BOOKING RULES - Validation Logic
// ================================================

import { ValidationError, SeatLockError, TripUnavailableError, NotFoundError } from '../../shared/errors/AppError';
import { Seat, Trip } from '../../shared/types';
import { TRIP_STATUS } from '../../shared/constants';
import { isSeatLocked } from '../../db/redis';
import * as seatRepo from '../seats/seat.repo';

/**
 * Validate customer data
 */
export function validateCustomerData(data: { name?: string; phone?: string; email?: string }): void {
    if (!data.name || data.name.trim().length < 2) {
        throw new ValidationError('Name must be at least 2 characters');
    }

    if (!data.phone || !/^[0-9]{10,11}$/.test(data.phone.replace(/\s/g, ''))) {
        throw new ValidationError('Phone must be 10-11 digits');
    }

    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        throw new ValidationError('Invalid email format');
    }
}

/**
 * Check if seat can be booked
 */
export async function validateSeatForBooking(seatId: string): Promise<Seat> {
    // Get seat
    const seat = await seatRepo.findById(seatId);
    if (!seat) {
        throw new NotFoundError('Seat');
    }

    // Check if already booked
    if (seat.is_booked) {
        throw new SeatLockError('This seat is already booked');
    }

    // Check if locked by another booking
    const locked = await isSeatLocked(seatId);
    if (locked) {
        throw new SeatLockError('This seat is currently being reserved by another customer');
    }

    return seat;
}

/**
 * Validate trip is open for booking
 */
export function validateTripOpen(trip: Trip): void {
    if (trip.status !== TRIP_STATUS.OPEN) {
        throw new TripUnavailableError(`Trip is ${trip.status.toLowerCase()} and cannot accept bookings`);
    }
}

/**
 * Validate OTP format
 */
export function validateOtpFormat(otp: string): void {
    if (!otp || !/^\d{6}$/.test(otp)) {
        throw new ValidationError('OTP must be 6 digits');
    }
}
