import axios from 'axios';

// Create axios instance
const api = axios.create({
    baseURL: 'http://localhost:3000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Types
export interface Trip {
    id: string;
    zone_from: string;
    zone_to: string;
    date: string;
    start_time: string;
    complete_time: string;
    status: string;
}

export interface Seat {
    id: string;
    vehicle_id: string;
    seat_number: number;
    position: 'front' | 'middle' | 'back';
    price: number;
    is_booked: boolean;
    is_locked?: boolean;
}

export interface Vehicle {
    id: string;
    vehicle_number: number;
    seats: Seat[];
}

export interface TripWithVehicles extends Trip {
    vehicles: Vehicle[];
}

export interface SearchTripParams {
    zone_from: string;
    zone_to: string;
    date: string;
    start_time?: string;
}

export interface BookingResponse {
    booking_id: string;
    status: string;
    otp_expires_in: number;
    message: string;
}

// API Methods
export const tripApi = {
    // Search for trips (find existing or create new logic handled by backend)
    search: async (params: SearchTripParams) => {
        // If start_time is provided, we use the resolving endpoint
        if (params.start_time) {
            const response = await api.post<TripWithVehicles>('/trips/search', params);
            return response.data;
        }
        // Otherwise list available trips
        else {
            const response = await api.get<Trip[]>('/trips', { params });
            return response.data;
        }
    },

    getById: async (id: string) => {
        const response = await api.get<TripWithVehicles>(`/trips/${id}`);
        return response.data;
    },

    getAlternatives: async (id: string) => {
        const response = await api.get<Trip[]>(`/trips/${id}/alternatives`);
        return response.data;
    }
};

export const bookingApi = {
    initiate: async (data: {
        trip_id: string;
        seat_id: string;
        customer: { name: string; phone: string; email: string };
    }) => {
        const response = await api.post<{ success: boolean; data: BookingResponse }>('/bookings', data);
        return response.data;
    },

    verifyOtp: async (bookingId: string, otp: string) => {
        const response = await api.post(`/bookings/${bookingId}/verify`, { otp });
        return response.data;
    },

    resendOtp: async (bookingId: string) => {
        const response = await api.post(`/bookings/${bookingId}/resend-otp`);
        return response.data;
    }
};

export default api;
