// ================================================
// DATE/TIME UTILITIES
// ================================================

import { TIME_RANGE, TRIP_DURATION_HOURS } from '../constants';

/**
 * Validate time is within allowed range (04:00 - 22:00)
 */
export function isValidTimeRange(time: string): boolean {
    const hour = parseInt(time.split(':')[0], 10);
    return hour >= TIME_RANGE.start && hour <= TIME_RANGE.end;
}

/**
 * Validate time is on the hour (HH:00:00)
 */
export function isHourlyTime(time: string): boolean {
    const parts = time.split(':');
    if (parts.length < 2) return false;
    return parts[1] === '00' && (parts[2] === undefined || parts[2] === '00');
}

/**
 * Calculate complete time by adding TRIP_DURATION_HOURS to start time
 */
export function calculateCompleteTime(startTime: string): string {
    const [hours] = startTime.split(':').map(Number);
    const completeHour = hours + TRIP_DURATION_HOURS;
    return `${completeHour.toString().padStart(2, '0')}:00:00`;
}

/**
 * Get current date in YYYY-MM-DD format
 */
export function getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
}

/**
 * Get current time in HH:MM:SS format
 */
export function getCurrentTime(): string {
    return new Date().toTimeString().split(' ')[0];
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Format time for display (remove seconds)
 */
export function formatTime(time: string): string {
    return time.substring(0, 5);
}

/**
 * Check if a trip is starting within N hours
 */
export function isWithinHours(tripDate: string, tripTime: string, hours: number): boolean {
    const tripDateTime = new Date(`${tripDate}T${tripTime}`);
    const now = new Date();
    const diffMs = tripDateTime.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return diffHours > 0 && diffHours <= hours;
}

/**
 * Get all valid booking times
 */
export function getValidBookingTimes(): string[] {
    const times: string[] = [];
    for (let h = TIME_RANGE.start; h <= TIME_RANGE.end; h++) {
        times.push(`${h.toString().padStart(2, '0')}:00:00`);
    }
    return times;
}
