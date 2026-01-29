// ================================================
// BOOKING SERVICE - Business Logic
// ================================================

import * as bookingRepo from './booking.repo';
import * as customerRepo from '../customers/customer.repo';
import * as tripService from '../trips/trip.service';
import * as seatRepo from '../seats/seat.repo';
import * as vehicleRepo from '../vehicles/vehicle.repo';
import { validateCustomerData, validateSeatForBooking, validateTripOpen, validateOtpFormat } from './booking.rules';
import { lockSeat, unlockSeat } from '../../db/redis';
import { createOtp, verifyOtp } from '../../shared/utils/otp';
import { Booking, BookingWithDetails, CreateCustomerDto, InitiateBookingDto } from '../../shared/types';
import { NotFoundError, OtpError, SeatLockError } from '../../shared/errors/AppError';
import { SEAT_LOCK_TTL_SECONDS, OTP_TTL_SECONDS } from '../../shared/constants';
import db from '../../db/clients';
import * as notificationService from '../notifications/notification.service';

/**
 * Initiate a booking:
 * 1. Validate trip is open
 * 2. Validate seat is available
 * 3. Lock seat in Redis
 * 4. Create/find customer
 * 5. Create pending booking with OTP
 * 6. Send OTP to customer phone (TODO: integrate SMS)
 */
export async function initiateBooking(data: InitiateBookingDto): Promise<{ booking: Booking; otp_expires_in: number }> {
    // Validate customer data
    validateCustomerData(data.customer);

    // Get trip and validate
    const trip = await tripService.getTrip(data.trip_id);
    validateTripOpen(trip);

    // Validate seat
    const seat = await validateSeatForBooking(data.seat_id);

    // Get vehicle from seat
    const vehicle = await vehicleRepo.findById(seat.vehicle_id);
    if (!vehicle) {
        throw new NotFoundError('Vehicle');
    }

    // Generate OTP
    const otpCode = await createOtp(data.customer.phone);
    const otpExpiresAt = new Date(Date.now() + OTP_TTL_SECONDS * 1000);

    // Create booking in transaction
    const booking = await db.transaction(async (client) => {
        // Try to lock the seat
        const locked = await lockSeat(data.seat_id, 'pending', SEAT_LOCK_TTL_SECONDS);
        if (!locked) {
            throw new SeatLockError('Seat was just taken by another customer');
        }

        // Find or create customer
        const customer = await customerRepo.findOrCreate(data.customer, client);

        // Create booking
        return bookingRepo.create({
            trip_id: data.trip_id,
            vehicle_id: vehicle.id,
            seat_id: data.seat_id,
            customer_id: customer.id,
            otp_code: otpCode,
            otp_expires_at: otpExpiresAt
        }, client);
    });

    // TODO: Send OTP via SMS
    console.log(`📱 OTP for ${data.customer.phone}: ${otpCode}`);

    return {
        booking,
        otp_expires_in: OTP_TTL_SECONDS
    };
}

/**
 * Verify OTP and confirm booking
 */
export async function verifyAndConfirm(bookingId: string, otp: string): Promise<BookingWithDetails> {
    validateOtpFormat(otp);

    // Get booking
    const booking = await bookingRepo.findByIdWithDetails(bookingId);
    if (!booking) {
        throw new NotFoundError('Booking');
    }

    // Check if already confirmed
    if (booking.status === 'CONFIRMED') {
        return booking;
    }

    // Check if expired
    if (booking.status === 'EXPIRED' || booking.status === 'CANCELLED') {
        throw new OtpError('Booking has expired or was cancelled');
    }

    // Verify OTP
    const isValid = await verifyOtp(booking.customer.phone, otp);
    if (!isValid) {
        throw new OtpError('Invalid or expired OTP');
    }

    // Confirm booking
    const confirmedBooking = await bookingRepo.confirm(bookingId);
    if (!confirmedBooking) {
        throw new NotFoundError('Booking');
    }

    // Unlock seat (it's now permanently booked)
    await unlockSeat(booking.seat_id);

    // Get updated booking with details
    const result = await bookingRepo.findByIdWithDetails(bookingId);
    if (!result) {
        throw new NotFoundError('Booking');
    }

    // Send confirmation email
    await notificationService.sendBookingConfirmation(result);

    return result;
}

/**
 * Cancel a booking
 */
export async function cancelBooking(bookingId: string): Promise<Booking> {
    const booking = await bookingRepo.findById(bookingId);
    if (!booking) {
        throw new NotFoundError('Booking');
    }

    // Release seat lock
    await unlockSeat(booking.seat_id);

    // Cancel booking
    const cancelled = await bookingRepo.cancel(bookingId);
    if (!cancelled) {
        throw new NotFoundError('Booking');
    }

    return cancelled;
}

/**
 * Get booking with details
 */
export async function getBooking(bookingId: string): Promise<BookingWithDetails> {
    const booking = await bookingRepo.findByIdWithDetails(bookingId);
    if (!booking) {
        throw new NotFoundError('Booking');
    }
    return booking;
}

/**
 * Resend OTP for a pending booking
 */
export async function resendOtp(bookingId: string): Promise<{ otp_expires_in: number }> {
    const booking = await bookingRepo.findByIdWithDetails(bookingId);
    if (!booking) {
        throw new NotFoundError('Booking');
    }

    if (booking.status !== 'PENDING') {
        throw new OtpError('Cannot resend OTP for this booking');
    }

    // Generate new OTP
    const otp = await createOtp(booking.customer.phone);
    console.log(`📱 New OTP for ${booking.customer.phone}: ${otp}`);

    return { otp_expires_in: OTP_TTL_SECONDS };
}

/**
 * Expire pending bookings that have timed out
 */
export async function expirePendingBookings(): Promise<number> {
    const expired = await bookingRepo.findExpiredPending();

    for (const booking of expired) {
        await unlockSeat(booking.seat_id);
        await bookingRepo.expire(booking.id);
    }

    return expired.length;
}
