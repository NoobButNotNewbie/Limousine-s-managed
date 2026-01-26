// ================================================
// VEHICLE REPOSITORY - Database Operations
// ================================================

import db from '../../db/client';
import { Vehicle, Seat, VehicleWithSeats } from '../../shared/types';
import { mapDbError } from '../../shared/errors/mapDbError';
import { SEAT_COUNT, getSeatPosition, getSeatPrice } from '../../shared/constants';
import { PoolClient } from 'pg';

/**
 * Create a vehicle with 9 seats for a trip
 */
export async function createWithSeats(tripId: string, client?: PoolClient): Promise<Vehicle> {
    const queryFn = client ? client.query.bind(client) : db.query.bind(db);

    try {
        // Get next vehicle number for this trip
        const countResult = await queryFn(
            'SELECT COUNT(*) as count FROM vehicles WHERE trip_id = $1',
            [tripId]
        );
        const vehicleNumber = parseInt(countResult.rows[0].count, 10) + 1;

        // Create vehicle
        const vehicleResult = await queryFn(
            `INSERT INTO vehicles (trip_id, vehicle_number)
             VALUES ($1, $2)
             RETURNING *`,
            [tripId, vehicleNumber]
        );
        const vehicle = vehicleResult.rows[0] as Vehicle;

        // Create 9 seats for this vehicle
        for (let seatNum = 1; seatNum <= SEAT_COUNT; seatNum++) {
            const position = getSeatPosition(seatNum);
            const price = getSeatPrice(seatNum);

            await queryFn(
                `INSERT INTO seats (vehicle_id, seat_number, position, price)
                 VALUES ($1, $2, $3, $4)`,
                [vehicle.id, seatNum, position, price]
            );
        }

        return vehicle;
    } catch (error) {
        throw mapDbError(error);
    }
}

/**
 * Find all vehicles for a trip
 */
export async function findByTrip(tripId: string): Promise<Vehicle[]> {
    try {
        const result = await db.query<Vehicle>(
            'SELECT * FROM vehicles WHERE trip_id = $1 ORDER BY vehicle_number',
            [tripId]
        );
        return result.rows;
    } catch (error) {
        throw mapDbError(error);
    }
}

/**
 * Find vehicle by ID
 */
export async function findById(id: string): Promise<Vehicle | null> {
    try {
        const result = await db.query<Vehicle>(
            'SELECT * FROM vehicles WHERE id = $1',
            [id]
        );
        return result.rows[0] || null;
    } catch (error) {
        throw mapDbError(error);
    }
}

/**
 * Find vehicles with their seats
 */
export async function findByTripWithSeats(tripId: string): Promise<VehicleWithSeats[]> {
    try {
        // Get vehicles
        const vehicleResult = await db.query<Vehicle>(
            'SELECT * FROM vehicles WHERE trip_id = $1 ORDER BY vehicle_number',
            [tripId]
        );

        if (vehicleResult.rows.length === 0) {
            return [];
        }

        // Get seats for all vehicles
        const vehicleIds = vehicleResult.rows.map(v => v.id);
        const seatResult = await db.query<Seat>(
            `SELECT s.*, 
                    CASE WHEN b.id IS NOT NULL AND b.status = 'CONFIRMED' THEN true ELSE false END as is_booked
             FROM seats s
             LEFT JOIN bookings b ON b.seat_id = s.id
             WHERE s.vehicle_id = ANY($1)
             ORDER BY s.seat_number`,
            [vehicleIds]
        );

        // Group seats by vehicle
        const seatsByVehicle = new Map<string, Seat[]>();
        for (const seat of seatResult.rows) {
            const seats = seatsByVehicle.get(seat.vehicle_id) || [];
            seats.push(seat);
            seatsByVehicle.set(seat.vehicle_id, seats);
        }

        // Combine vehicles with seats
        return vehicleResult.rows.map(vehicle => ({
            ...vehicle,
            seats: seatsByVehicle.get(vehicle.id) || []
        }));
    } catch (error) {
        throw mapDbError(error);
    }
}

/**
 * Find a vehicle with available seats
 */
export async function findWithAvailableSeats(tripId: string): Promise<VehicleWithSeats | null> {
    try {
        const vehicles = await findByTripWithSeats(tripId);

        // Find first vehicle with at least one unbooked seat
        for (const vehicle of vehicles) {
            const availableSeats = vehicle.seats.filter(s => !s.is_booked);
            if (availableSeats.length > 0) {
                return vehicle;
            }
        }

        return null; // All vehicles are full
    } catch (error) {
        throw mapDbError(error);
    }
}

/**
 * Count available seats for a trip
 */
export async function countAvailableSeats(tripId: string): Promise<number> {
    try {
        const result = await db.query<{ count: string }>(
            `SELECT COUNT(*) as count
             FROM seats s
             JOIN vehicles v ON v.id = s.vehicle_id
             LEFT JOIN bookings b ON b.seat_id = s.id AND b.status = 'CONFIRMED'
             WHERE v.trip_id = $1 AND b.id IS NULL`,
            [tripId]
        );
        return parseInt(result.rows[0].count, 10);
    } catch (error) {
        throw mapDbError(error);
    }
}
