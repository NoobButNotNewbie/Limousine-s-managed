import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import env from "../config/pool";

// Create connection pool
export const pool = new Pool({
    connectionString: env.DATABASE_URL,
    application_name: 'limousine-backend',
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
    let result: QueryResult<T>; // Declare result outside the try block

    try {
        result = await pool.query<T>(text, params); // Assign result inside the try block
    } catch (err) {
        console.error('❌ Database query error:', err);
        throw err;
    }

    const duration = Date.now() - start;

    if (env.NODE_ENV === 'development') {
        console.log('🔍 Query:', { text: text.substring(0, 100), duration: `${duration}ms`, rows: result.rowCount });
    }

    return result; // Return result here
}

// Transaction helper
export async function transaction<T>(
    callback: (client: PoolClient) => Promise<T>
): Promise<T> {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Safety guards
        await client.query('SET LOCAL statement_timeout = 5000');
        await client.query('SET LOCAL lock_timeout = 3000');

        const result = await callback(client);

        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Transaction failed:', error);
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
    transaction,
    closePool,
    pool
};
