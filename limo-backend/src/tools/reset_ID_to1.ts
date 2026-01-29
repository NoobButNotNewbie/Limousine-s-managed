// tools/reset.ts
import { pool } from "../db";

async function reset() {
  await pool.query(`
    TRUNCATE
            bookings,
            vehicle_reservations,
            trips,
            vehicles,
            drivers,
            clients,
            zones,
            seat_tier_prices
        RESTART IDENTITY CASCADADE;
  `);

  console.log("Done reset IDs to 1.");
  process.exit(0);
}

reset().catch(err => {
  console.error(err);
  process.exit(1);
});