const repo = require('./booking.repo');

async function getOrCreateTrip(input, db) {
  return repo.upsertTrip(input, db);
}

module.exports = { getOrCreateTrip };
