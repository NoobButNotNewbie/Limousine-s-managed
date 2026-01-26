// ================================================
// CUSTOMER REPOSITORY - Database Operations
// ================================================

import db from '../../db/client';
import { Customer, CreateCustomerDto } from '../../shared/types';
import { mapDbError } from '../../shared/errors/mapDbError';
import { PoolClient } from 'pg';

/**
 * Create a new customer
 */
export async function create(data: CreateCustomerDto, client?: PoolClient): Promise<Customer> {
    const queryFn = client ? client.query.bind(client) : db.query.bind(db);

    try {
        const result = await queryFn(
            `INSERT INTO customers (name, phone, email)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [data.name.trim(), data.phone.trim(), data.email.trim().toLowerCase()]
        );
        return result.rows[0] as Customer;
    } catch (error) {
        throw mapDbError(error);
    }
}

/**
 * Find customer by ID
 */
export async function findById(id: string): Promise<Customer | null> {
    try {
        const result = await db.query<Customer>(
            'SELECT * FROM customers WHERE id = $1',
            [id]
        );
        return result.rows[0] || null;
    } catch (error) {
        throw mapDbError(error);
    }
}

/**
 * Find customer by phone
 */
export async function findByPhone(phone: string): Promise<Customer | null> {
    try {
        const result = await db.query<Customer>(
            'SELECT * FROM customers WHERE phone = $1',
            [phone.trim()]
        );
        return result.rows[0] || null;
    } catch (error) {
        throw mapDbError(error);
    }
}

/**
 * Find or create customer
 */
export async function findOrCreate(data: CreateCustomerDto, client?: PoolClient): Promise<Customer> {
    // Try to find existing customer by phone
    const existing = await findByPhone(data.phone);
    if (existing) {
        return existing;
    }

    // Create new customer
    return create(data, client);
}
