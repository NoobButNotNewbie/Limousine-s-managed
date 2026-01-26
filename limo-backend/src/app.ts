// ================================================
// EXPRESS APP - Main Application Bootstrap
// ================================================

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cron from 'node-cron';

import env from './config/env';
import { AppError } from './shared/errors/AppError';

// Import routes
import tripRouter from './modules/trips/trip.controller';
import bookingRouter from './modules/bookings/booking.controller';

// Import jobs
import { runFinalizeTripsJob } from './jobs/finalize-trips.job';
import { runExpireBookingsJob } from './jobs/expire-bookings.job';

// Create Express app
const app = express();

// ================================================
// MIDDLEWARE
// ================================================

// Security
app.use(helmet());

// CORS - allow all origins in development
app.use(cors({
    origin: env.NODE_ENV === 'production'
        ? ['https://your-domain.com']
        : true,
    credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Request logging in development
if (env.NODE_ENV === 'development') {
    app.use((req: Request, res: Response, next: NextFunction) => {
        console.log(`📨 ${req.method} ${req.path}`);
        next();
    });
}

// ================================================
// ROUTES
// ================================================

// Health check
app.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        env: env.NODE_ENV
    });
});

// API routes
app.use('/api/trips', tripRouter);
app.use('/api/bookings', bookingRouter);

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`
    });
});

// ================================================
// ERROR HANDLER
// ================================================

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('❌ Error:', err);

    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            error: err.code,
            message: err.message
        });
    }

    // Unknown error
    res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: env.NODE_ENV === 'production'
            ? 'An unexpected error occurred'
            : err.message
    });
});

// ================================================
// BACKGROUND JOBS (CRON)
// ================================================

// Run finalize trips job every 15 minutes
cron.schedule('*/15 * * * *', () => {
    runFinalizeTripsJob();
});

// Run expire bookings job every minute
cron.schedule('* * * * *', () => {
    runExpireBookingsJob();
});

// ================================================
// START SERVER
// ================================================

const PORT = env.PORT;

app.listen(PORT, () => {
    console.log(`
🚐 ======================================
   LIMOUSINE BOOKING SYSTEM
   Server running on port ${PORT}
   Environment: ${env.NODE_ENV}
🚐 ======================================
    `);
});

export default app;
