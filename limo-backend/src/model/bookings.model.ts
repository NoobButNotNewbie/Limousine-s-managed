export interface Booking {
    booking_id: number;
    trip_id: number;
    reservation_id: number;
    client_id: number;
    seat_number: number;
    price: number;
    pick_up: string;
    drop_off: string;
    cancelled_at: Date | null;
    created_at: Date;
}