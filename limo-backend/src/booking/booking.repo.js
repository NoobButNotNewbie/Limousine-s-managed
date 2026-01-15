async function upsertClient(client, db) {
  const { name, phone, email } = client;
  const res = await db.query(
    `
    INSERT INTO clients (name, phone, email)
    VALUES ($1, $2, $3)
    ON CONFLICT (phone)
    DO UPDATE SET
      name = EXCLUDED.name,
      email = COALESCE(EXCLUDED.email, clients.email)
    RETURNING client_id
    `,
    [name, phone, email]
  );
  return res.rows[0].client_id;
}

async function upsertTrip({ zoneFrom, zoneTo, startTime }, db) {
  const res = await db.query(
    `
    WITH upsert AS (
      INSERT INTO trips (zone_from_id, zone_to_id, start_time)
      VALUES ($1, $2, $3)
      ON CONFLICT (zone_from_id, zone_to_id, start_time)
      DO UPDATE SET start_time = EXCLUDED.start_time
      RETURNING trip_id
    )
    SELECT trip_id FROM upsert
    `,
    [zoneFrom, zoneTo, startTime]
  );
  return res.rows[0].trip_id;
}

async function findReservationWithSeat(tripId, db) {
  const res = await db.query(
    `
    SELECT vr.reservation_id
    FROM vehicle_reservations vr
    LEFT JOIN bookings b
      ON b.reservation_id = vr.reservation_id
      AND b.status IN ('pending', 'booked')
    WHERE vr.trip_id = $1
      AND vr.is_active = TRUE
    GROUP BY vr.reservation_id
    HAVING COUNT(b.booking_id) < 9
    ORDER BY COUNT(b.booking_id) ASC
    LIMIT 1
    `,
    [tripId]
  );
  return res.rows[0]?.reservation_id || null;
}

async function findOccupiedSeats(reservationId, db) {
  const res = await db.query(
    `
    SELECT seat_number
    FROM bookings
    WHERE reservation_id = $1
      AND status IN ('pending', 'booked')
    `,
    [reservationId]
  );
  return res.rows.map(r => r.seat_number);
}

async function insertPendingBooking(data, db) {
  const {
    clientId,
    reservationId,
    seat,
    price,
    pickup,
    dropoff,
    expiresAt,
  } = data;

  const res = await db.query(
    `
    INSERT INTO bookings
      (client_id, reservation_id, seat_number, price,
       pickup, dropoff, status, expires_at)
    VALUES ($1,$2,$3,$4,$5,$6,'pending',$7)
    RETURNING booking_id, expires_at
    `,
    [clientId, reservationId, seat, price, pickup, dropoff, expiresAt]
  );

  return res.rows[0];
}

module.exports = {
  upsertClient,
  upsertTrip,
  findReservationWithSeat,
  findOccupiedSeats,
  insertPendingBooking,
};