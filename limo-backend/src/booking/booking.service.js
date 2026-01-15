const db = require('../db');
const repo = require('./booking.repo');
const tripLogic = require('./trip.logic');
const vehicleLogic = require('./vehicle.logic');
const {
  MAX_SEATS,
  HOLD_MINUTES,
  RESERVE_HOURS,
  MAX_RETRY,
} = require('./booking.constants');
const errors = require('./booking.errors');

function pickSeat(occupied, preference) {
  const all = Array.from({ length: MAX_SEATS }, (_, i) => i + 1);
  const available = all.filter(s => !occupied.includes(s));

  if (!available.length) return null;

  let prefer = available;
  if (preference === 'front') prefer = [1,2,3,4];
  else if (preference === 'middle') prefer = [5,6];
  else if (preference === 'back') prefer = [7,8,9];

  return prefer.find(s => available.includes(s)) || available[0];
}

async function createBooking(input) {
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    const clientId = await repo.upsertClient(input.client, client);

    const tripId = await tripLogic.getOrCreateTrip({
      zoneFrom: input.zone_from_id,
      zoneTo: input.zone_to_id,
      startTime: input.start_time,
    }, client);

    for (let i = 0; i < MAX_RETRY; i++) {
      let reservationId =
        await repo.findReservationWithSeat(tripId, client);

      if (!reservationId) {
        const vehicleId = await vehicleLogic.findFreeVehicle(
          input.start_time,
          RESERVE_HOURS,
          client
        );
        if (!vehicleId) throw errors.NO_VEHICLE();

        reservationId = await vehicleLogic.createReservation(
          tripId,
          vehicleId,
          input.start_time,
          RESERVE_HOURS,
          client
        );
      }

      const occupied = await repo.findOccupiedSeats(reservationId, client);
      const seat = pickSeat(occupied, input.seat_preference);
      if (!seat) continue;

      try {
        const expiresAt = new Date(
          Date.now() + HOLD_MINUTES * 60 * 1000
        );

        const booking = await repo.insertPendingBooking(
          {
            clientId,
            reservationId,
            seat,
            price: input.price, // giả sử frontend gửi
            pickup: input.pickup,
            dropoff: input.dropoff,
            expiresAt,
          },
          client
        );

        await client.query('COMMIT');
        return booking;
      } catch (e) {
        if (e.code === '23505') continue; // seat race
        throw e;
      }
    }

    throw errors.NO_SEAT();
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

module.exports = { createBooking };