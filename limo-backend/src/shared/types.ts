// ================================================
// TYPE DEFINITIONS - Limousine Booking System
// ================================================

import { TRIP_STATUS, BOOKING_STATUS } from './constants';

// Trip Types
export interface Trip {
    id: string;
    zone_from: string;
    zone_to: string;
    date: string; // YYYY-MM-DD
    start_time: string; // HH:00:00
    complete_time: string;
    status: keyof typeof TRIP_STATUS;
    created_at: Date;
    updated_at: Date;
}

export interface TripKey {
    zone_from: string;
    zone_to: string;
    date: string;
    start_time: string;
}

export interface TripWithVehicles extends Trip {
    vehicles: VehicleWithSeats[];
}

// Vehicle Types
export interface Vehicle {
    id: string;
    trip_id: string;
    vehicle_number: number;
    created_at: Date;
}

export interface VehicleWithSeats extends Vehicle {
    seats: Seat[];
}

// Seat Types
export interface Seat {
    id: string;
    vehicle_id: string;
    seat_number: number;
    position: 'front' | 'middle' | 'back';
    price: number;
    is_locked?: boolean;
    is_booked?: boolean;
}

// Customer Types
export interface Customer {
    id: string;
    name: string;
    phone: string;
    email: string;
    created_at: Date;
}

export interface CreateCustomerDto {
    name: string;
    phone: string;
    email: string;
}

// Booking Types
export interface Booking {
    id: string;
    trip_id: string;
    vehicle_id: string;
    seat_id: string;
    customer_id: string;
    status: keyof typeof BOOKING_STATUS;
    otp_code?: string;
    otp_expires_at?: Date;
    created_at: Date;
    confirmed_at?: Date;
}

export interface BookingWithDetails extends Booking {
    trip: Trip;
    vehicle: Vehicle;
    seat: Seat;
    customer: Customer;
}

export interface InitiateBookingDto {
    trip_id: string;
    seat_id: string;
    customer: CreateCustomerDto;
}

// API Response Types
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    total: number;
    page: number;
    limit: number;
}

// Search Types
export interface TripSearchParams {
    zone_from: string;
    zone_to: string;
    date: string;
    start_time?: string;
}

export interface AvailableTrip {
    trip: Trip;
    vehicles: {
        id: string;
        vehicle_number: number;
        available_seats: number;
        seats: Seat[];
    }[];
}
