// ================================================
// TRIP RULES - Validation Logic
// ================================================

import { TIME_RANGE, TRIP_STATUS } from '../../shared/constants';
import { isValidTimeRange, isHourlyTime } from '../../shared/utils/datetime';
import { ValidationError, TripUnavailableError } from '../../shared/errors/AppError';
import { Trip, TripKey } from '../../shared/types';

/**
 * Validate trip key (zone_from, zone_to, date, start_time)
 */
export function validateTripKey(key: TripKey): void {
    // Validate zones
    if (!key.zone_from || key.zone_from.trim() === '') {
        throw new ValidationError('Departure zone is required');
    }
    if (!key.zone_to || key.zone_to.trim() === '') {
        throw new ValidationError('Destination zone is required');
    }
    if (key.zone_from.trim().toLowerCase() === key.zone_to.trim().toLowerCase()) {
        throw new ValidationError('Departure and destination must be different');
    }

    // Validate date
    if (!key.date || !/^\d{4}-\d{2}-\d{2}$/.test(key.date)) {
        throw new ValidationError('Invalid date format. Use YYYY-MM-DD');
    }

    const tripDate = new Date(key.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (tripDate < today) {
        throw new ValidationError('Cannot book trips in the past');
    }

    // Validate time
    if (!key.start_time) {
        throw new ValidationError('Start time is required');
    }

    if (!isHourlyTime(key.start_time)) {
        throw new ValidationError('Start time must be on the hour (e.g., 10:00:00)');
    }

    if (!isValidTimeRange(key.start_time)) {
        throw new ValidationError(`Start time must be between ${TIME_RANGE.start}:00 and ${TIME_RANGE.end}:00`);
    }
}

/**
 * Check if trip is open for booking
 */
export function validateTripForBooking(trip: Trip): void {
    if (trip.status !== TRIP_STATUS.OPEN) {
        throw new TripUnavailableError(`Trip is ${trip.status.toLowerCase()} and cannot accept bookings`);
    }
}

/**
 * Normalize time format to HH:00:00
 */
export function normalizeTime(time: string): string {
    const parts = time.split(':');
    const hour = parts[0].padStart(2, '0');
    return `${hour}:00:00`;
}

/**
 * Normalize trip key
 */
export function normalizeTripKey(key: TripKey): TripKey {
    return {
        zone_from: key.zone_from.trim(),
        zone_to: key.zone_to.trim(),
        date: key.date,
        start_time: normalizeTime(key.start_time)
    };
}
