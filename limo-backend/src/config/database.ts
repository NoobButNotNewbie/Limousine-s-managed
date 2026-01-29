import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

export const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

//test connection
pool
  .query('select 1')
  .then(() => {
    console.log('DB connected');
  })
  .catch((err) => {
    console.error('DB connection failed');
    console.error(err);
    process.exit(1);
  });

export default pool;