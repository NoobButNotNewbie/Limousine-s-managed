// ================================================
// SEAT REPOSITORY - Database Operations
// ================================================

import db from '../../db/client';
import { Seat } from '../../shared/types';
import { mapDbError } from '../../shared/errors/mapDbError';

/**
 * Find seat by ID
 */
export async function findById(seatId: string): Promise<Seat | null> {
    try {
        const result = await db.query<Seat>(
            `SELECT s.*, 
                    CASE WHEN b.id IS NOT NULL AND b.status = 'CONFIRMED' THEN true ELSE false END as is_booked
             FROM seats s
             LEFT JOIN bookings b ON b.seat_id = s.id
             WHERE s.id = $1`,
            [seatId]
        );
        return result.rows[0] || null;
    } catch (error) {
        throw mapDbError(error);
    }
}

/**
 * Find all seats for a vehicle
 */
export async function findByVehicle(vehicleId: string): Promise<Seat[]> {
    try {
        const result = await db.query<Seat>(
            `SELECT s.*, 
                    CASE WHEN b.id IS NOT NULL AND b.status = 'CONFIRMED' THEN true ELSE false END as is_booked
             FROM seats s
             LEFT JOIN bookings b ON b.seat_id = s.id
             WHERE s.vehicle_id = $1
             ORDER BY s.seat_number`,
            [vehicleId]
        );
        return result.rows;
    } catch (error) {
        throw mapDbError(error);
    }
}

/**
 * Check if seat is currently booked
 */
export async function isBooked(seatId: string): Promise<boolean> {
    try {
        const result = await db.query<{ count: string }>(
            `SELECT COUNT(*) as count 
             FROM bookings 
             WHERE seat_id = $1 AND status = 'CONFIRMED'`,
            [seatId]
        );
        return parseInt(result.rows[0].count, 10) > 0;
    } catch (error) {
        throw mapDbError(error);
    }
}

/**
 * Get available seats for a trip
 */
export async function findAvailableByTrip(tripId: string): Promise<Seat[]> {
    try {
        const result = await db.query<Seat>(
            `SELECT s.*, v.vehicle_number, false as is_booked
             FROM seats s
             JOIN vehicles v ON v.id = s.vehicle_id
             LEFT JOIN bookings b ON b.seat_id = s.id AND b.status IN ('PENDING', 'CONFIRMED')
             WHERE v.trip_id = $1 AND b.id IS NULL
             ORDER BY v.vehicle_number, s.seat_number`,
            [tripId]
        );
        return result.rows;
    } catch (error) {
        throw mapDbError(error);
    }
}
