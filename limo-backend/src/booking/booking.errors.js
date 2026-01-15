class BookingError extends Error {
  constructor(code, message, httpStatus = 400) {
    super(message);
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

module.exports = {
  BookingError,
  NO_VEHICLE: () =>
    new BookingError('NO_VEHICLE', 'Không còn xe khả dụng', 503),

  NO_SEAT: () =>
    new BookingError('NO_SEAT', 'Không còn ghế trống', 422),

  BOOKING_EXPIRED: () =>
    new BookingError('BOOKING_EXPIRED', 'Booking đã hết hạn', 410),

  BOOKING_NOT_FOUND: () =>
    new BookingError('BOOKING_NOT_FOUND', 'Không tìm thấy booking', 404),
};
