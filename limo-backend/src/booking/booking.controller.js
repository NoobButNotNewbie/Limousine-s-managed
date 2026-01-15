const service = require('./booking.service');

async function create(req, res, next) {
  try {
    const result = await service.createBooking(req.body);
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
}

module.exports = { create };