const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'true'
    ? { rejectUnauthorized: false }
    : false,
});

pool
  .connect()
  .then(client => {
    console.log('✅ PostgreSQL connected');
    client.release();
  })
  .catch(err => {
    console.error('❌ PostgreSQL connection failed');
    console.error(err.message);
  });

async function query(text, params) {
  return pool.query(text, params);
}

async function getClient() {
  return pool.connect();
}

module.exports = {
  pool,
  query,
  getClient,
};