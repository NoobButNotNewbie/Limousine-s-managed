export interface Trips {
    trip_id: number;
    zone_from_id: number;
    zone_to_id: number;
    start_time: Date;
    cancelled_at: Date | null;
    completed_at: Date;
}