-- ============================================================================
-- LIMOUSINE BOOKING SYSTEM — CLEAN FINAL SCHEMA
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ============================================================================
-- ENUMS
-- ============================================================================
CREATE TYPE zone_name_enum AS ENUM (
    'Thanh Hoa', 'Ha Noi', 'Hai Phong', 'Quang Ninh',
    'Lao Cai', 'Lang Son', 'Son La', 'Thai Nguyen', 'Ninh Binh'
);

CREATE TYPE seat_tier_enum AS ENUM ('front', 'middle', 'back');

-- ============================================================================
-- MASTER DATA
-- ============================================================================
CREATE TABLE zones (
    zone_id   SERIAL PRIMARY KEY,
    zone_name zone_name_enum NOT NULL UNIQUE
);

CREATE TABLE clients (
    client_id  SERIAL PRIMARY KEY,
    name       TEXT NOT NULL,
    phone      TEXT NOT NULL UNIQUE,
    email      TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE drivers (
    driver_id SERIAL PRIMARY KEY,
    name      TEXT NOT NULL,
    phone     TEXT NOT NULL UNIQUE
);

CREATE TABLE vehicles (
    vehicle_id   SERIAL PRIMARY KEY,
    plate_number TEXT NOT NULL UNIQUE,
    seat_count   INT NOT NULL CHECK (seat_count = 9)
);

-- ============================================================================
-- SEAT PRICING
-- ============================================================================
CREATE TABLE seat_tier_prices (
    tier  seat_tier_enum PRIMARY KEY,
    price INT NOT NULL CHECK (price > 0)
);

INSERT INTO seat_tier_prices VALUES
('front', 300000),
('middle', 250000),
('back', 200000);

CREATE OR REPLACE FUNCTION get_seat_tier(seat_num INT)
RETURNS seat_tier_enum IMMUTABLE AS $$
BEGIN
    IF seat_num BETWEEN 1 AND 4 THEN RETURN 'front';
    ELSIF seat_num BETWEEN 5 AND 6 THEN RETURN 'middle';
    ELSIF seat_num BETWEEN 7 AND 9 THEN RETURN 'back';
    ELSE RAISE EXCEPTION 'Invalid seat number %', seat_num;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIPS
-- ============================================================================
CREATE TABLE trips (
    trip_id SERIAL PRIMARY KEY,

    zone_from_id INT NOT NULL REFERENCES zones(zone_id),
    zone_to_id   INT NOT NULL REFERENCES zones(zone_id),

    start_time   TIMESTAMP NOT NULL,
    cancelled_at TIMESTAMP,

    completed_at TIMESTAMP GENERATED ALWAYS AS
        (start_time + INTERVAL '5 hours') STORED,

    CHECK (zone_from_id <> zone_to_id),
    CHECK (EXTRACT(MINUTE FROM start_time) = 0),
    CHECK (EXTRACT(HOUR FROM start_time) BETWEEN 4 AND 22)
);

CREATE UNIQUE INDEX uq_trip_slot
ON trips(zone_from_id, zone_to_id, start_time);

-- ============================================================================
-- VEHICLE RESERVATIONS (1 trip → many vehicles)
-- ============================================================================
CREATE TABLE vehicle_reservations (
    reservation_id SERIAL PRIMARY KEY,
    trip_id    INT NOT NULL REFERENCES trips(trip_id),
    vehicle_id INT NOT NULL REFERENCES vehicles(vehicle_id),
    driver_id  INT REFERENCES drivers(driver_id),

    reserved_from TIMESTAMP NOT NULL,
    reserved_to   TIMESTAMP NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT now(),
    CHECK (reserved_to = reserved_from + INTERVAL '5 hours')
);

CREATE OR REPLACE FUNCTION fill_reservation_time()
RETURNS TRIGGER AS $$
BEGIN
    SELECT start_time,
           start_time + INTERVAL '5 hours'
    INTO NEW.reserved_from, NEW.reserved_to
    FROM trips WHERE trip_id = NEW.trip_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_fill_reservation_time
BEFORE INSERT ON vehicle_reservations
FOR EACH ROW EXECUTE FUNCTION fill_reservation_time();

ALTER TABLE vehicle_reservations
ADD CONSTRAINT no_vehicle_overlap
EXCLUDE USING gist (
    vehicle_id WITH =,
    tsrange(reserved_from, reserved_to, '[)') WITH &&
);

CREATE INDEX idx_bookings_reservation
ON bookings(reservation_id)
WHERE cancelled_at IS NULL;

CREATE INDEX idx_reservations_trip
ON vehicle_reservations(trip_id);

-- ============================================================================
-- BOOKINGS (created ONLY after OTP)
-- ============================================================================
CREATE TABLE bookings (
    booking_id SERIAL PRIMARY KEY,
    trip_id    INT NOT NULL REFERENCES trips(trip_id),

    reservation_id INT NOT NULL REFERENCES vehicle_reservations(reservation_id),
    client_id      INT NOT NULL REFERENCES clients(client_id),

    seat_number INT NOT NULL CHECK (seat_number BETWEEN 1 AND 9),
    price       INT NOT NULL CHECK (price > 0),


    cancelled_at TIMESTAMP   
        CHECK (
            cancelled_at IS NULL
            OR cancelled_at <= start_time
        ),

    created_at   TIMESTAMP NOT NULL DEFAULT now()
);

COMMENT ON TABLE bookings IS 'Booking is created ONLY after OTP verified';
COMMENT ON COLUMN bookings.cancelled_at IS 'Set by backend or trip cancellation';

-- ============================================================================
-- BOOKING SAFETY
-- ============================================================================
CREATE OR REPLACE FUNCTION fill_booking_trip_id()
RETURNS TRIGGER AS $$
DECLARE
    actual_trip_id INT;
BEGIN
    SELECT trip_id INTO actual_trip_id
    FROM vehicle_reservations
    WHERE reservation_id = NEW.reservation_id;

    IF actual_trip_id IS NULL THEN
        RAISE EXCEPTION 'Invalid reservation_id %', NEW.reservation_id;
    END IF;

    IF NEW.trip_id IS NOT NULL AND NEW.trip_id <> actual_trip_id THEN
        RAISE EXCEPTION 'trip_id mismatch';
    END IF;

    NEW.trip_id := actual_trip_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_fill_booking_trip
BEFORE INSERT ON bookings
FOR EACH ROW EXECUTE FUNCTION fill_booking_trip_id();

CREATE OR REPLACE FUNCTION prevent_booking_on_cancelled_trip()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM trips
        WHERE trip_id = NEW.trip_id
          AND cancelled_at IS NOT NULL
    ) THEN
        RAISE EXCEPTION 'Cannot book cancelled trip';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_booking_cancelled_trip
BEFORE INSERT ON bookings
FOR EACH ROW EXECUTE FUNCTION prevent_booking_on_cancelled_trip();

CREATE OR REPLACE FUNCTION cancel_bookings_on_trip_cancel()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.cancelled_at IS NOT NULL AND OLD.cancelled_at IS NULL THEN
        UPDATE bookings
        SET cancelled_at = NEW.cancelled_at
        WHERE trip_id = NEW.trip_id
          AND cancelled_at IS NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cancel_bookings_on_trip_cancel
AFTER UPDATE ON trips
FOR EACH ROW EXECUTE FUNCTION cancel_bookings_on_trip_cancel();

-- ============================================================================
-- PRICE + SEAT LOCK
-- ============================================================================
CREATE OR REPLACE FUNCTION fill_booking_price()
RETURNS TRIGGER AS $$
BEGIN
    SELECT price INTO NEW.price
    FROM seat_tier_prices
    WHERE tier = get_seat_tier(NEW.seat_number);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_fill_booking_price
BEFORE INSERT ON bookings
FOR EACH ROW WHEN (NEW.price IS NULL)
EXECUTE FUNCTION fill_booking_price();

CREATE UNIQUE INDEX uq_seat_lock
ON bookings(reservation_id, seat_number)
WHERE cancelled_at IS NULL;