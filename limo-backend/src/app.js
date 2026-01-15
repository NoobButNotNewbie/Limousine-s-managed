require('dotenv').config();
const express = require('express');

const bookingController = require('./booking/booking.controller');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(express.json());

/**
 * ROUTES
 */
app.post('/bookings', bookingController.create);

/**
 * HEALTH CHECK
 */
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

/**
 * ERROR HANDLER (luôn cuối)
 */
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;