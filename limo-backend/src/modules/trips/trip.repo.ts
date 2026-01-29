// ================================================
// TRIP REPOSITORY - PURE DB ACCESS
// ================================================

import db from '../../db/clients';
import { mapDbError } from '../../shared/errors/mapDbError';
import { Trip } from '../../shared/types';

/**
 * TripKey = unique key of a trip
 * (matches DB unique index)
 */
export type TripKey = {
    zoneFromId: number;
    zoneToId: number;
    startTime: string; // ISO timestamp
};

/**
 * Find trip by unique key
 */
export async function findByKey(key: TripKey): Promise<Trip | null> {
    try {
        const result = await db.query<Trip>(
            `
            SELECT *
            FROM trips
            WHERE zone_from_id = $1
              AND zone_to_id   = $2
              AND start_time   = $3
              AND cancelled_at IS NULL
            LIMIT 1
            `,
            [key.zoneFromId, key.zoneToId, key.startTime]
        );

        return result.rows[0] ?? null;
    } catch (err) {
        throw mapDbError(err);
    }
}

/**
 * Find trip by ID
 */
export async function findById(tripId: number): Promise<Trip | null> {
    try {
        const result = await db.query<Trip>(
            `
            SELECT *
            FROM trips
            WHERE trip_id = $1
            `,
            [tripId]
        );

        return result.rows[0] ?? null;
    } catch (err) {
        throw mapDbError(err);
    }
}

/**
 * Create a new trip
 */
export async function create(key: TripKey): Promise<Trip> {
    try {
        const result = await db.query<Trip>(
            `
            INSERT INTO trips (zone_from_id, zone_to_id, start_time)
            VALUES ($1, $2, $3)
            RETURNING *
            `,
            [key.zoneFromId, key.zoneToId, key.startTime]
        );

        return result.rows[0];
    } catch (err) {
        throw mapDbError(err);
    }
}

/**
 * Find alternative trips on the same day & route
 */
export async function findAlternatives(
    zoneFromId: number,
    zoneToId: number,
    startTime: string,
    excludeTripId: number
): Promise<Trip[]> {
    try {
        const result = await db.query<Trip>(
            `
            SELECT *
            FROM trips
            WHERE zone_from_id = $1
              AND zone_to_id   = $2
              AND DATE(start_time) = DATE($3)
              AND trip_id <> $4
              AND cancelled_at IS NULL
            ORDER BY start_time
            `,
            [zoneFromId, zoneToId, startTime, excludeTripId]
        );

        return result.rows;
    } catch (err) {
        throw mapDbError(err);
    }
}
