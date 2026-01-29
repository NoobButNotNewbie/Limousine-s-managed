export interface VehicleReservations {
    reservation_id: number;
    trip_id: number;
    vehicle_id: number;
    driver_id: number;
    reserved_from: Date;
    reserved_to: Date;
    created_at: Date;
}