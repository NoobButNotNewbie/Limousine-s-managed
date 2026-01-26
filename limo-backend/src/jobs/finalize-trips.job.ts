// ================================================
// FINALIZE TRIPS JOB - Pre-departure check
// ================================================

import * as tripService from '../modules/trips/trip.service';
import * as bookingRepo from '../modules/bookings/booking.repo';
import * as notificationService from '../modules/notifications/notification.service';
import { MIN_PASSENGERS, PRE_TRIP_NOTICE_HOURS } from '../shared/constants';

/**
 * Check trips that are 3 hours before departure
 * - If >= 4 confirmed passengers: send reminders
 * - If < 4 confirmed passengers: cancel trip and notify
 */
export async function runFinalizeTripsJob(): Promise<void> {
    console.log('🔄 Running finalize trips job...');

    try {
        const trips = await tripService.getTripsForPreCheck();

        for (const trip of trips) {
            const confirmedCount = await bookingRepo.countConfirmedByTrip(trip.id);
            const bookings = await bookingRepo.findConfirmedByTrip(trip.id);

            if (confirmedCount >= MIN_PASSENGERS) {
                // Trip is confirmed - send reminders
                console.log(`✅ Trip ${trip.id} has ${confirmedCount} passengers - sending reminders`);

                await tripService.confirmTrip(trip.id);

                for (const booking of bookings) {
                    await notificationService.sendTripReminder(booking);
                    await notificationService.callCustomer(
                        booking.customer.phone,
                        `Nhắc nhở: Chuyến xe ${trip.zone_from} - ${trip.zone_to} sẽ khởi hành lúc ${trip.start_time}`
                    );
                }
            } else {
                // Not enough passengers - cancel trip
                console.log(`❌ Trip ${trip.id} has only ${confirmedCount} passengers - cancelling`);

                await tripService.cancelTrip(trip.id);

                // Get alternatives
                const alternatives = await tripService.getAlternatives(trip.id);

                // Notify all booked customers
                for (const booking of bookings) {
                    await notificationService.sendCancellationNotice(booking, alternatives);
                    await notificationService.callCustomer(
                        booking.customer.phone,
                        `Thông báo: Chuyến xe ${trip.zone_from} - ${trip.zone_to} đã bị hủy do không đủ hành khách`
                    );
                }
            }
        }

        console.log(`🔄 Finalize trips job completed - processed ${trips.length} trips`);
    } catch (error) {
        console.error('❌ Finalize trips job error:', error);
    }
}
