// ================================================
// CUSTOM ERROR CLASSES
// ================================================

export class AppError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;
    public readonly code: string;

    constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        this.code = code;

        Error.captureStackTrace(this, this.constructor);
    }
}

export class NotFoundError extends AppError {
    constructor(resource: string) {
        super(`${resource} not found`, 404, 'NOT_FOUND');
    }
}

export class ValidationError extends AppError {
    constructor(message: string) {
        super(message, 400, 'VALIDATION_ERROR');
    }
}

export class ConflictError extends AppError {
    constructor(message: string) {
        super(message, 409, 'CONFLICT');
    }
}

export class SeatLockError extends AppError {
    constructor(message: string = 'Seat is currently locked') {
        super(message, 423, 'SEAT_LOCKED');
    }
}

export class OtpError extends AppError {
    constructor(message: string = 'Invalid or expired OTP') {
        super(message, 401, 'OTP_ERROR');
    }
}

export class TripUnavailableError extends AppError {
    constructor(message: string = 'Trip is not available for booking') {
        super(message, 400, 'TRIP_UNAVAILABLE');
    }
}
