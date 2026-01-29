// ================================================
// BOOKING REPOSITORY - Database Operations
// ================================================

import db from '../../db/clients';
import { Booking, BookingWithDetails } from '../../shared/types';
import { mapDbError } from '../../shared/errors/mapDbError';
import { PoolClient } from 'pg';
import { BOOKING_STATUS } from '../../shared/constants';

interface CreateBookingData {
    trip_id: string;
    vehicle_id: string;
    seat_id: string;
    customer_id: string;
    otp_code: string;
    otp_expires_at: Date;
}

/**
 * Create a new booking
 */
export async function create(data: CreateBookingData, client?: PoolClient): Promise<Booking> {
    const queryFn = client ? client.query.bind(client) : db.query.bind(db);

    try {
        const result = await queryFn(
            `INSERT INTO bookings (trip_id, vehicle_id, seat_id, customer_id, otp_code, otp_expires_at, status)
             VALUES ($1, $2, $3, $4, $5, $6, 'PENDING')
             RETURNING *`,
            [data.trip_id, data.vehicle_id, data.seat_id, data.customer_id, data.otp_code, data.otp_expires_at]
        );
        return result.rows[0] as Booking;
    } catch (error) {
        throw mapDbError(error);
    }
}

/**
 * Find booking by ID
 */
export async function findById(id: string): Promise<Booking | null> {
    try {
        const result = await db.query<Booking>(
            'SELECT * FROM bookings WHERE id = $1',
            [id]
        );
        return result.rows[0] || null;
    } catch (error) {
        throw mapDbError(error);
    }
}

/**
 * Find booking by ID with all related data
 */
export async function findByIdWithDetails(id: string): Promise<BookingWithDetails | null> {
    try {
        const result = await db.query(
            `SELECT 
                b.*,
                row_to_json(t.*) as trip,
                row_to_json(v.*) as vehicle,
                row_to_json(s.*) as seat,
                row_to_json(c.*) as customer
             FROM bookings b
             JOIN trips t ON t.id = b.trip_id
             JOIN vehicles v ON v.id = b.vehicle_id
             JOIN seats s ON s.id = b.seat_id
             JOIN customers c ON c.id = b.customer_id
             WHERE b.id = $1`,
            [id]
        );
        return result.rows[0] || null;
    } catch (error) {
        throw mapDbError(error);
    }
}

/**
 * Confirm a booking
 */
export async function confirm(bookingId: string): Promise<Booking | null> {
    try {
        const result = await db.query<Booking>(
            `UPDATE bookings 
             SET status = 'CONFIRMED', confirmed_at = NOW(), otp_code = NULL
             WHERE id = $1
             RETURNING *`,
            [bookingId]
        );
        return result.rows[0] || null;
    } catch (error) {
        throw mapDbError(error);
    }
}

/**
 * Cancel a booking
 */
export async function cancel(bookingId: string): Promise<Booking | null> {
    try {
        const result = await db.query<Booking>(
            `UPDATE bookings 
             SET status = 'CANCELLED'
             WHERE id = $1
             RETURNING *`,
            [bookingId]
        );
        return result.rows[0] || null;
    } catch (error) {
        throw mapDbError(error);
    }
}

/**
 * Expire a booking (unverified after timeout)
 */
export async function expire(bookingId: string): Promise<Booking | null> {
    try {
        const result = await db.query<Booking>(
            `UPDATE bookings 
             SET status = 'EXPIRED', otp_code = NULL
             WHERE id = $1
             RETURNING *`,
            [bookingId]
        );
        return result.rows[0] || null;
    } catch (error) {
        throw mapDbError(error);
    }
}

/**
 * Count confirmed bookings for a trip
 */
export async function countConfirmedByTrip(tripId: string): Promise<number> {
    try {
        const result = await db.query<{ count: string }>(
            `SELECT COUNT(*) as count 
             FROM bookings 
             WHERE trip_id = $1 AND status = 'CONFIRMED'`,
            [tripId]
        );
        return parseInt(result.rows[0].count, 10);
    } catch (error) {
        throw mapDbError(error);
    }
}

/**
 * Find all confirmed bookings for a trip
 */
export async function findConfirmedByTrip(tripId: string): Promise<BookingWithDetails[]> {
    try {
        const result = await db.query(
            `SELECT 
                b.*,
                row_to_json(t.*) as trip,
                row_to_json(v.*) as vehicle,
                row_to_json(s.*) as seat,
                row_to_json(c.*) as customer
             FROM bookings b
             JOIN trips t ON t.id = b.trip_id
             JOIN vehicles v ON v.id = b.vehicle_id
             JOIN seats s ON s.id = b.seat_id
             JOIN customers c ON c.id = b.customer_id
             WHERE b.trip_id = $1 AND b.status = 'CONFIRMED'`,
            [tripId]
        );
        return result.rows;
    } catch (error) {
        throw mapDbError(error);
    }
}

/**
 * Find expired pending bookings
 */
export async function findExpiredPending(): Promise<Booking[]> {
    try {
        const result = await db.query<Booking>(
            `SELECT * FROM bookings 
             WHERE status = 'PENDING' AND otp_expires_at < NOW()`
        );
        return result.rows;
    } catch (error) {
        throw mapDbError(error);
    }
}

/**
 * Find booking by seat
 */
export async function findBySeat(seatId: string): Promise<Booking | null> {
    try {
        const result = await db.query<Booking>(
            `SELECT * FROM bookings 
             WHERE seat_id = $1 AND status IN ('PENDING', 'CONFIRMED')`,
            [seatId]
        );
        return result.rows[0] || null;
    } catch (error) {
        throw mapDbError(error);
    }
}
