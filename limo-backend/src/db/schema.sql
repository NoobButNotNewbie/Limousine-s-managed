-- ================================================
-- LIMOUSINE BOOKING SYSTEM - DATABASE SCHEMA
-- ================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ================================================
-- TRIPS TABLE
-- ================================================
-- A trip represents a scheduled journey from zone A to zone B
-- Multiple vehicles can be attached to a single trip
CREATE TABLE trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_from VARCHAR(100) NOT NULL,
    zone_to VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    complete_time TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CONFIRMED', 'CANCELLED', 'COMPLETED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint for trip key
    CONSTRAINT unique_trip_key UNIQUE (zone_from, zone_to, date, start_time),
    
    -- Time must be between 04:00 and 22:00
    CONSTRAINT valid_start_time CHECK (start_time >= '04:00:00' AND start_time <= '22:00:00'),
    
    -- Time must be on the hour (HH:00:00)
    CONSTRAINT hourly_start_time CHECK (EXTRACT(MINUTE FROM start_time) = 0 AND EXTRACT(SECOND FROM start_time) = 0)
);

-- Index for searching trips
CREATE INDEX idx_trips_search ON trips(zone_from, zone_to, date, status);
CREATE INDEX idx_trips_date_status ON trips(date, status);

-- ================================================
-- VEHICLES TABLE
-- ================================================
-- Each vehicle belongs to a trip and has 9 seats
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    vehicle_number INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_vehicle_per_trip UNIQUE (trip_id, vehicle_number)
);

CREATE INDEX idx_vehicles_trip ON vehicles(trip_id);

-- ================================================
-- SEATS TABLE
-- ================================================
-- Each seat belongs to a vehicle with fixed pricing by position
-- Positions: front(1-4), middle(5-6), back(7-9)
CREATE TABLE seats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    seat_number INT NOT NULL CHECK (seat_number BETWEEN 1 AND 9),
    position VARCHAR(10) NOT NULL CHECK (position IN ('front', 'middle', 'back')),
    price DECIMAL(12, 0) NOT NULL,
    
    CONSTRAINT unique_seat_per_vehicle UNIQUE (vehicle_id, seat_number)
);

CREATE INDEX idx_seats_vehicle ON seats(vehicle_id);

-- ================================================
-- CUSTOMERS TABLE
-- ================================================
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(150) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_email ON customers(email);

-- ================================================
-- BOOKINGS TABLE
-- ================================================
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id),
    seat_id UUID NOT NULL REFERENCES seats(id),
    customer_id UUID NOT NULL REFERENCES customers(id),
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'EXPIRED')),
    otp_code VARCHAR(6),
    otp_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    
    -- One booking per seat
    CONSTRAINT unique_seat_booking UNIQUE (seat_id)
);

CREATE INDEX idx_bookings_trip ON bookings(trip_id);
CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_status ON bookings(status);

-- ================================================
-- FUNCTIONS
-- ================================================

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for trips updated_at
CREATE TRIGGER update_trips_updated_at
    BEFORE UPDATE ON trips
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- SEED DATA: Default seat prices (VND)
-- Front: 250,000 | Middle: 200,000 | Back: 150,000
-- ================================================
-- Prices are set when seats are created via the application
