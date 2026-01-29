    // ================================================
    // TRIP CONTROLLER - API Routes
    // ================================================

    import { Router, Request, Response, NextFunction } from 'express';
    import * as tripService from './trip.service';
    import { TripKey } from '../../shared/types';

    const router = Router();

    /**
     * POST /api/trips/search
     * Search for or create a trip
     */
    router.post('/search', async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { zone_from, zone_to, date, start_time } = req.body as TripKey;

            // Resolve or create trip
            const trip = await tripService.resolveOrCreateTrip({
                zone_from,
                zone_to,
                date,
                start_time
            });

            // Get trip with vehicles and seats
            const tripWithVehicles = await tripService.getTripWithVehicles(trip.id);

            res.json({
                success: true,
                data: tripWithVehicles
            });
        } catch (error) {
            next(error);
        }
    });

    /**
     * GET /api/trips/:id
     * Get trip details with vehicles and seats
     */
    router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
        try {
            const tripWithVehicles = await tripService.getTripWithVehicles(req.params.id);

            res.json({
                success: true,
                data: tripWithVehicles
            });
        } catch (error) {
            next(error);
        }
    });

    /**
     * GET /api/trips/:id/alternatives
     * Get alternative trips on the same day
     */
    router.get('/:id/alternatives', async (req: Request, res: Response, next: NextFunction) => {
        try {
            const alternatives = await tripService.getAlternatives(req.params.id);

            res.json({
                success: true,
                data: alternatives
            });
        } catch (error) {
            next(error);
        }
    });

    /**
     * GET /api/trips/available
     * List available trips by criteria
     */
    router.get('/', async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { zone_from, zone_to, date, start_time } = req.query;

            if (!zone_from || !zone_to || !date) {
                return res.status(400).json({
                    success: false,
                    error: 'zone_from, zone_to, and date are required'
                });
            }

            const trips = await tripService.searchTrips(
                zone_from as string,
                zone_to as string,
                date as string,
                start_time as string | undefined
            );

            res.json({
                success: true,
                data: trips
            });
        } catch (error) {
            next(error);
        }
    });

    export default router;
