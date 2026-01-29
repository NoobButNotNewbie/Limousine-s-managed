import {SeatTier} from "./enum/seat_tier.enum";

export interface SeatTierModel {
    tier: SeatTier;
    price: number;
}