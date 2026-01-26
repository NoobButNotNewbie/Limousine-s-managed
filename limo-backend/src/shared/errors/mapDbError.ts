// ================================================
// DATABASE ERROR MAPPER
// ================================================

import { AppError, ConflictError, ValidationError } from './AppError';

interface PostgresError {
    code?: string;
    constraint?: string;
    detail?: string;
}

/**
 * Map PostgreSQL errors to application errors
 */
export function mapDbError(error: unknown): AppError {
    const pgError = error as PostgresError;

    // Unique violation
    if (pgError.code === '23505') {
        const constraint = pgError.constraint || 'unknown';

        if (constraint.includes('trip')) {
            return new ConflictError('A trip with this schedule already exists');
        }
        if (constraint.includes('seat')) {
            return new ConflictError('This seat is already booked');
        }
        if (constraint.includes('vehicle')) {
            return new ConflictError('Vehicle number already exists for this trip');
        }

        return new ConflictError('Resource already exists');
    }

    // Foreign key violation
    if (pgError.code === '23503') {
        return new ValidationError('Referenced resource does not exist');
    }

    // Check violation
    if (pgError.code === '23514') {
        const detail = pgError.detail || pgError.constraint || '';

        if (detail.includes('start_time')) {
            return new ValidationError('Start time must be between 04:00 and 22:00');
        }
        if (detail.includes('seat_number')) {
            return new ValidationError('Seat number must be between 1 and 9');
        }
        if (detail.includes('status')) {
            return new ValidationError('Invalid status value');
        }

        return new ValidationError('Data validation failed');
    }

    // Not null violation
    if (pgError.code === '23502') {
        return new ValidationError('Required field is missing');
    }

    // Default: rethrow as internal error
    if (error instanceof AppError) {
        return error;
    }

    return new AppError(
        error instanceof Error ? error.message : 'Database error',
        500,
        'DATABASE_ERROR'
    );
}
