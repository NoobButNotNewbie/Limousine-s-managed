// ================================================
// BOOKING CONTROLLER - API Routes
// ================================================

import { Router, Request, Response, NextFunction } from 'express';
import * as bookingService from './booking.service';
import { InitiateBookingDto } from '../../shared/types';

const router = Router();

/**
 * POST /api/bookings
 * Initiate a new booking (lock seat, create pending booking, send OTP)
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = req.body as InitiateBookingDto;

        const result = await bookingService.initiateBooking(data);

        res.status(201).json({
            success: true,
            data: {
                booking_id: result.booking.id,
                status: result.booking.status,
                otp_expires_in: result.otp_expires_in,
                message: 'OTP sent to your phone. Please verify within 5 minutes.'
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/bookings/:id/verify
 * Verify OTP and confirm booking
 */
router.post('/:id/verify', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { otp } = req.body;

        const booking = await bookingService.verifyAndConfirm(req.params.id as string, otp);

        res.json({
            success: true,
            data: booking,
            message: 'Booking confirmed! Check your email for details.'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/bookings/:id/resend-otp
 * Resend OTP for a pending booking
 */
router.post('/:id/resend-otp', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await bookingService.resendOtp(req.params.id as string);

        res.json({
            success: true,
            data: result,
            message: 'New OTP sent to your phone.'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/bookings/:id
 * Get booking details
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const booking = await bookingService.getBooking(req.params.id as string);

        res.json({
            success: true,
            data: booking
        });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/bookings/:id
 * Cancel a booking
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const booking = await bookingService.cancelBooking(req.params.id as string);

        res.json({
            success: true,
            data: booking,
            message: 'Booking cancelled successfully.'
        });
    } catch (error) {
        next(error);
    }
});

export default router;
