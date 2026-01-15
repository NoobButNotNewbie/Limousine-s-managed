async function findFreeVehicle(startTime, hours, db) {
  const res = await db.query(
    `
    WITH target AS (
      SELECT
        $1::timestamptz AS from_time,
        $1::timestamptz + ($2 || ' hours')::interval AS to_time
    )
    SELECT v.vehicle_id
    FROM vehicles v, target t
    WHERE v.status = 'active'
      AND NOT EXISTS (
        SELECT 1 FROM vehicle_reservations vr
        WHERE vr.vehicle_id = v.vehicle_id
          AND vr.is_active = TRUE
          AND tsrange(vr.reserved_from, vr.reserved_to, '[)')
              && tsrange(t.from_time, t.to_time, '[)')
      )
    LIMIT 1
    `,
    [startTime, hours]
  );
  return res.rows[0]?.vehicle_id || null;
}

async function createReservation(tripId, vehicleId, startTime, hours, db) {
  const res = await db.query(
    `
    INSERT INTO vehicle_reservations
      (trip_id, vehicle_id, reserved_from, reserved_to, is_active)
    VALUES (
      $1, $2,
      $3,
      $3 + ($4 || ' hours')::interval,
      TRUE
    )
    RETURNING reservation_id
    `,
    [tripId, vehicleId, startTime, hours]
  );
  return res.rows[0].reservation_id;
}

module.exports = {
  findFreeVehicle,
  createReservation,
};