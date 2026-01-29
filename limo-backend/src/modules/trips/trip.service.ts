// ================================================
// TRIP SERVICE - Business Logic
// ================================================

import * as tripRepo from './trip.repo';
import * as vehicleService from '../vehicles/vehicle.service';
import * as vehicleRepo from '../vehicles/vehicle.repo';
import { validateTripKey, normalizeTripKey, validateTripForBooking } from './trip.rules';
import { Trip, TripKey, TripWithVehicles, AvailableTrip } from '../../shared/types';
import { NotFoundError } from '../../shared/errors/AppError';
import { TRIP_STATUS } from '../../shared/constants';
import db from '../../db/clients';

/**
 * Resolve or create a trip for the given key
 * - If trip exists and is OPEN, return it
 * - If trip doesn't exist, create it with one vehicle
 * - Trip persists even if no booking is completed
 */
export async function resolveOrCreateTrip(key: TripKey): Promise<Trip> {
    // Validate and normalize
    const normalizedKey = normalizeTripKey(key);
    validateTripKey(normalizedKey);

    // Check if trip exists
    let trip = await tripRepo.findByKey(normalizedKey);

    if (trip) {
        // Validate trip is open for booking
        validateTripForBooking(trip);

        // Check if we need to add a new vehicle
        const needsVehicle = await vehicleService.needsNewVehicle(trip.id);
        if (needsVehicle) {
            await vehicleService.addVehicleToTrip(trip.id);
        }

        return trip;
    }

    // Create new trip with one vehicle (in transaction)
    return db.transaction(async (client) => {
        // Create trip
        const newTrip = await tripRepo.create(normalizedKey);

        // Create first vehicle with seats
        await vehicleRepo.createWithSeats(newTrip.id, client);

        return newTrip;
    });
}

/**
 * Get trip by ID with validation
 */
export async function getTrip(tripId: string): Promise<Trip> {
    const trip = await tripRepo.findById(tripId);
    if (!trip) {
        throw new NotFoundError('Trip');
    }
    return trip;
}

/**
 * Get trip with all vehicles and seats
 */
export async function getTripWithVehicles(tripId: string): Promise<TripWithVehicles> {
    const trip = await getTrip(tripId);
    const vehicles = await vehicleService.getVehiclesWithSeats(tripId);

    return {
        ...trip,
        vehicles
    };
}

/**
 * Search available trips
 */
export async function searchTrips(
    zoneFrom: string,
    zoneTo: string,
    date: string,
    startTime?: string
): Promise<AvailableTrip[]> {
    const trips = await tripRepo.searchTrips(zoneFrom, zoneTo, date, startTime);

    const result: AvailableTrip[] = [];

    for (const trip of trips) {
        const vehicles = await vehicleService.getVehiclesWithSeats(trip.id);

        result.push({
            trip,
            vehicles: vehicles.map(v => ({
                id: v.id,
                vehicle_number: v.vehicle_number,
                available_seats: v.seats.filter(s => !s.is_booked).length,
                seats: v.seats
            }))
        });
    }

    return result;
}

/**
 * Get alternative trips for a cancelled trip
 */
export async function getAlternatives(tripId: string): Promise<Trip[]> {
    const trip = await getTrip(tripId);
    return tripRepo.findAlternatives(trip.zone_from, trip.zone_to, trip.date, tripId);
}

/**
 * Cancel a trip (mark as CANCELLED)
 */
export async function cancelTrip(tripId: string): Promise<Trip> {
    const trip = await tripRepo.updateStatus(tripId, TRIP_STATUS.CANCELLED);
    if (!trip) {
        throw new NotFoundError('Trip');
    }
    return trip;
}

/**
 * Mark trip as confirmed (enough passengers)
 */
export async function confirmTrip(tripId: string): Promise<Trip> {
    const trip = await tripRepo.updateStatus(tripId, TRIP_STATUS.CONFIRMED);
    if (!trip) {
        throw new NotFoundError('Trip');
    }
    return trip;
}

/**
 * Get trips that need pre-departure check
 */
export async function getTripsForPreCheck(): Promise<Trip[]> {
    return tripRepo.findTripsForPreCheck();
}
