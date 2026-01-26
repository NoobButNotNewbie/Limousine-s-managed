// ================================================
// VEHICLE SERVICE - Business Logic
// ================================================

import * as vehicleRepo from './vehicle.repo';
import db from '../../db/client';
import { Vehicle, VehicleWithSeats } from '../../shared/types';
import { NotFoundError } from '../../shared/errors/AppError';

/**
 * Add a new vehicle to a trip (with 9 seats)
 */
export async function addVehicleToTrip(tripId: string): Promise<Vehicle> {
    return db.transaction(async (client) => {
        return vehicleRepo.createWithSeats(tripId, client);
    });
}

/**
 * Get all vehicles for a trip with seat availability
 */
export async function getVehiclesWithSeats(tripId: string): Promise<VehicleWithSeats[]> {
    return vehicleRepo.findByTripWithSeats(tripId);
}

/**
 * Get vehicle by ID
 */
export async function getVehicle(vehicleId: string): Promise<Vehicle> {
    const vehicle = await vehicleRepo.findById(vehicleId);
    if (!vehicle) {
        throw new NotFoundError('Vehicle');
    }
    return vehicle;
}

/**
 * Get a vehicle with available seats, or null if all are full
 */
export async function findAvailableVehicle(tripId: string): Promise<VehicleWithSeats | null> {
    return vehicleRepo.findWithAvailableSeats(tripId);
}

/**
 * Check if trip needs a new vehicle (all current vehicles are full)
 */
export async function needsNewVehicle(tripId: string): Promise<boolean> {
    const availableVehicle = await vehicleRepo.findWithAvailableSeats(tripId);
    return availableVehicle === null;
}
