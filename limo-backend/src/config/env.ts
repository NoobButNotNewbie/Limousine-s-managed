import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

interface EnvConfig {
    NODE_ENV: string;
    PORT: number;

    // Database
    DATABASE_URL: string;

    // Redis
    REDIS_URL: string;

    // Email (using nodemailer)
    SMTP_HOST: string;
    SMTP_PORT: number;
    SMTP_USER: string;
    SMTP_PASS: string;
    EMAIL_FROM: string;
}

function getEnvVar(key: string, defaultValue?: string): string {
    const value = process.env[key] || defaultValue;
    if (value === undefined) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
}

function getEnvNumber(key: string, defaultValue?: number): number {
    const value = process.env[key];
    if (value === undefined) {
        if (defaultValue !== undefined) return defaultValue;
        throw new Error(`Missing required environment variable: ${key}`);
    }
    const num = parseInt(value, 10);
    if (isNaN(num)) {
        throw new Error(`Environment variable ${key} must be a number`);
    }
    return num;
}

export const env: EnvConfig = {
    NODE_ENV: getEnvVar('NODE_ENV', 'development'),
    PORT: getEnvNumber('PORT', 3000),

    DATABASE_URL: getEnvVar('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/limousine'),
    REDIS_URL: getEnvVar('REDIS_URL', 'redis://localhost:6379'),

    SMTP_HOST: getEnvVar('SMTP_HOST', 'smtp.gmail.com'),
    SMTP_PORT: getEnvNumber('SMTP_PORT', 587),
    SMTP_USER: getEnvVar('SMTP_USER', ''),
    SMTP_PASS: getEnvVar('SMTP_PASS', ''),
    EMAIL_FROM: getEnvVar('EMAIL_FROM', 'noreply@limousine.vn'),
};

export default env;
