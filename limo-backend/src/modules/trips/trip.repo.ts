// ================================================
// TRIP REPOSITORY - Database Operations
// ================================================

import db from '../../db/client';
import { Trip, TripKey } from '../../shared/types';
import { mapDbError } from '../../shared/errors/mapDbError';
import { calculateCompleteTime } from '../../shared/utils/datetime';

/**
 * Find a trip by its unique key
 */
export async function findByKey(key: TripKey): Promise<Trip | null> {
    try {
        const result = await db.query<Trip>(
            `SELECT * FROM trips 
             WHERE zone_from = $1 AND zone_to = $2 AND date = $3 AND start_time = $4`,
            [key.zone_from, key.zone_to, key.date, key.start_time]
        );
        return result.rows[0] || null;
    } catch (error) {
        throw mapDbError(error);
    }
}

/**
 * Find trip by ID
 */
export async function findById(id: string): Promise<Trip | null> {
    try {
        const result = await db.query<Trip>(
            'SELECT * FROM trips WHERE id = $1',
            [id]
        );
        return result.rows[0] || null;
    } catch (error) {
        throw mapDbError(error);
    }
}

/**
 * Create a new trip
 */
export async function create(key: TripKey): Promise<Trip> {
    try {
        const completeTime = calculateCompleteTime(key.start_time);

        const result = await db.query<Trip>(
            `INSERT INTO trips (zone_from, zone_to, date, start_time, complete_time, status)
             VALUES ($1, $2, $3, $4, $5, 'OPEN')
             RETURNING *`,
            [key.zone_from, key.zone_to, key.date, key.start_time, completeTime]
        );
        return result.rows[0];
    } catch (error) {
        throw mapDbError(error);
    }
}

/**
 * Find alternative trips on the same date with same zones
 */
export async function findAlternatives(
    zoneFrom: string,
    zoneTo: string,
    date: string,
    excludeTripId?: string
): Promise<Trip[]> {
    try {
        let query = `
            SELECT * FROM trips 
            WHERE zone_from = $1 AND zone_to = $2 AND date = $3 AND status = 'OPEN'
        `;
        const params: any[] = [zoneFrom, zoneTo, date];

        if (excludeTripId) {
            query += ` AND id != $4`;
            params.push(excludeTripId);
        }

        query += ` ORDER BY start_time`;

        const result = await db.query<Trip>(query, params);
        return result.rows;
    } catch (error) {
        throw mapDbError(error);
    }
}

/**
 * Update trip status
 */
export async function updateStatus(tripId: string, status: string): Promise<Trip | null> {
    try {
        const result = await db.query<Trip>(
            `UPDATE trips SET status = $1, updated_at = NOW() 
             WHERE id = $2 
             RETURNING *`,
            [status, tripId]
        );
        return result.rows[0] || null;
    } catch (error) {
        throw mapDbError(error);
    }
}

/**
 * Find trips that need pre-departure check (3 hours before start)
 */
export async function findTripsForPreCheck(): Promise<Trip[]> {
    try {
        const result = await db.query<Trip>(
            `SELECT * FROM trips 
             WHERE status = 'OPEN' 
             AND date = CURRENT_DATE 
             AND start_time <= (CURRENT_TIME + INTERVAL '3 hours')
             AND start_time > CURRENT_TIME`
        );
        return result.rows;
    } catch (error) {
        throw mapDbError(error);
    }
}

/**
 * Find open trips by search criteria
 */
export async function searchTrips(
    zoneFrom: string,
    zoneTo: string,
    date: string,
    startTime?: string
): Promise<Trip[]> {
    try {
        let query = `
            SELECT * FROM trips 
            WHERE zone_from = $1 AND zone_to = $2 AND date = $3 AND status = 'OPEN'
        `;
        const params: any[] = [zoneFrom, zoneTo, date];

        if (startTime) {
            query += ` AND start_time = $4`;
            params.push(startTime);
        }

        query += ` ORDER BY start_time`;

        const result = await db.query<Trip>(query, params);
        return result.rows;
    } catch (error) {
        throw mapDbError(error);
    }
}
