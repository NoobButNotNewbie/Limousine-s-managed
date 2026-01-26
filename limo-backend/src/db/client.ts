import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import env from '../config/env';

// Create connection pool
const pool = new Pool({
    connectionString: env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Log connection status
pool.on('connect', () => {
    console.log('📦 Database connected');
});

pool.on('error', (err: Error) => {
    console.error('❌ Database pool error:', err);
});

// Query helper
export async function query<T extends QueryResultRow = any>(
    text: string,
    params?: any[]
): Promise<QueryResult<T>> {
    const start = Date.now();
    const result = await pool.query<T>(text, params);
    const duration = Date.now() - start;

    if (env.NODE_ENV === 'development') {
        console.log('🔍 Query:', { text: text.substring(0, 100), duration: `${duration}ms`, rows: result.rowCount });
    }

    return result;
}

// Get a client from the pool for transactions
export async function getClient(): Promise<PoolClient> {
    return pool.connect();
}

// Transaction helper
export async function transaction<T>(
    callback: (client: PoolClient) => Promise<T>
): Promise<T> {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

// Close pool (for graceful shutdown)
export async function closePool(): Promise<void> {
    await pool.end();
    console.log('📦 Database pool closed');
}

export default {
    query,
    getClient,
    transaction,
    closePool,
    pool
};
