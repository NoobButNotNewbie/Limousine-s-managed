import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { tripApi, bookingApi } from '../services/api';
import type { TripWithVehicles } from '../services/api';
import SeatMap from '../components/SeatMap';
import { format } from 'date-fns';
import { User, Phone, Mail, ChevronRight, Smartphone } from 'lucide-react';

const BookingFlow = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const searchParams = new URLSearchParams(location.search);

    const [step, setStep] = useState(1); // 1: Select Trip/Vehicle, 2: Select Seat, 3: Info, 4: OTP
    const [loading, setLoading] = useState(true);
    const [trip, setTrip] = useState<TripWithVehicles | null>(null);

    const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
    const [selectedSeatDetails, setSelectedSeatDetails] = useState<any>(null);
    const selectedVehicle = trip?.vehicles[0]; // Auto-select first vehicle for now in this flow

    const [customer, setCustomer] = useState({ name: '', phone: '', email: '' });
    const [bookingId, setBookingId] = useState<string | null>(null);
    const [otp, setOtp] = useState('');
    const [countdown, setCountdown] = useState(0);

    // Fetch Trip Data on Mount
    useEffect(() => {
        const fetchTrip = async () => {
            try {
                const zone_from = searchParams.get('zone_from');
                const zone_to = searchParams.get('zone_to');
                const date = searchParams.get('date');
                const start_time = searchParams.get('start_time') + ':00'; // Append seconds

                if (zone_from && zone_to && date && start_time) {
                    const result = await tripApi.search({ zone_from, zone_to, date, start_time });

                    if (result && 'vehicles' in result) {
                        setTrip(result as TripWithVehicles);
                    }
                }
            } catch (error) {
                console.error("Failed to find trip", error);
                alert("Không tìm thấy chuyến hoặc lỗi kết nối");
            } finally {
                setLoading(false);
            }
        };
        fetchTrip();
    }, [location.search]);

    // Handle Seat Selection
    const handleSeatSelect = (seatId: string) => {
        setSelectedSeat(seatId);
        // Find seat details
        if (selectedVehicle) {
            const s = selectedVehicle.seats.find(x => x.id === seatId);
            setSelectedSeatDetails(s);
        }
    };

    // Submit Customer Info -> Initiate Booking
    const handleInitiateBooking = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!trip || !selectedSeat) return;

        try {
            setLoading(true);
            const res = await bookingApi.initiate({
                trip_id: trip.id,
                seat_id: selectedSeat,
                customer
            });

            if (res.success) {
                setBookingId(res.data.booking_id);
                setStep(4); // OTP Step
                setCountdown(res.data.otp_expires_in);
            }
        } catch (error: any) {
            alert(error.response?.data?.message || 'Đặt vé thất bại');
        } finally {
            setLoading(false);
        }
    };

    // Verify OTP
    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!bookingId) return;

        try {
            setLoading(true);
            const res = await bookingApi.verifyOtp(bookingId, otp);
            if (res.success) {
                navigate(`/confirmation/${bookingId}`);
            }
        } catch (error: any) {
            alert(error.response?.data?.message || 'OTP không đúng');
        } finally {
            setLoading(false);
        }
    };

    // Render Steps
    if (loading && !trip) return <div className="flex-center" style={{ height: '60vh' }}>Đang tải dữ liệu chuyến đi...</div>;
    if (!trip) return <div className="container" style={{ marginTop: '2rem' }}>Không tìm thấy chuyến đi phù hợp.</div>;

    return (
        <div className="booking-page container">
            {/* Progress Bar */}
            <div className="progress-bar glass-panel flex-between">
                <div className={`step ${step >= 1 ? 'active' : ''}`}>1. Chọn ghế</div>
                <div className="line"></div>
                <div className={`step ${step >= 2 ? 'active' : ''}`}>2. Thông tin</div>
                <div className="line"></div>
                <div className={`step ${step >= 3 ? 'active' : ''}`}>3. Xác thực</div>
            </div>

            <div className="grid-cols-2" style={{ marginTop: '2rem', alignItems: 'start' }}>

                {/* LEFT COLUMN: Main Interaction */}
                <div className="main-content">

                    {/* STEP 1 & 2 combined logic basically: Select Seat -> Show Info Form */}
                    {step <= 3 && (
                        <div className="glass-panel" style={{ padding: '2rem' }}>
                            {step === 4 ? (
                                // OTP FORM
                                <div className="otp-form animate-fade-in">
                                    <h2 className="section-title" style={{ fontSize: '1.5rem', textAlign: 'center' }}>Xác thực Số điện thoại</h2>
                                    <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Mã OTP đã được gửi đến {customer.phone}</p>

                                    <form onSubmit={handleVerifyOtp} style={{ maxWidth: '300px', margin: '2rem auto' }}>
                                        <div className="input-group">
                                            <label className="label"><Smartphone size={16} /> Nhập OTP (6 số)</label>
                                            <input
                                                type="text"
                                                maxLength={6}
                                                className="input-field"
                                                style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '5px' }}
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value)}
                                                placeholder="000000"
                                                required
                                            />
                                        </div>
                                        <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
                                            {loading ? 'Đang xử lý...' : 'Xác nhận Đặt vé'}
                                        </button>
                                        {countdown > 0 && <p style={{ textAlign: 'center', marginTop: '1rem', color: 'var(--warning)' }}>Hết hạn sau: {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}</p>}
                                    </form>
                                </div>
                            ) : (
                                // SEAT SELECTION & INFO FORM
                                <>
                                    <h2 className="section-title" style={{ fontSize: '1.5rem' }}>Sơ đồ ghế - Xe {selectedVehicle?.vehicle_number}</h2>
                                    {selectedVehicle && (
                                        <SeatMap
                                            seats={selectedVehicle.seats}
                                            selectedSeatId={selectedSeat}
                                            onSelectSeat={handleSeatSelect}
                                            priceMap={{}}
                                        />
                                    )}

                                    {selectedSeat && (
                                        <div className="info-form animate-fade-in" style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                            <h3 style={{ marginBottom: '1.5rem' }}>Thông tin hành khách</h3>
                                            <form onSubmit={handleInitiateBooking}>
                                                <div className="form-group" style={{ marginBottom: '1rem' }}>
                                                    <label className="label"><User size={16} /> Họ và tên</label>
                                                    <input type="text" className="input-field" required
                                                        value={customer.name} onChange={e => setCustomer({ ...customer, name: e.target.value })} />
                                                </div>
                                                <div className="form-group" style={{ marginBottom: '1rem' }}>
                                                    <label className="label"><Phone size={16} /> Số điện thoại</label>
                                                    <input type="tel" className="input-field" required
                                                        value={customer.phone} onChange={e => setCustomer({ ...customer, phone: e.target.value })} />
                                                </div>
                                                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                                    <label className="label"><Mail size={16} /> Email</label>
                                                    <input type="email" className="input-field" required
                                                        value={customer.email} onChange={e => setCustomer({ ...customer, email: e.target.value })} />
                                                </div>
                                                <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
                                                    Tiếp tục <ChevronRight size={16} />
                                                </button>
                                            </form>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* RIGHT COLUMN: Trip Summary */}
                <div className="trip-summary glass-panel" style={{ padding: '2rem', position: 'sticky', top: '100px' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>Chi tiết chuyến đi</h3>

                    <div className="summary-row">
                        <span className="label">Điểm đón</span>
                        <strong>{trip.zone_from}</strong>
                    </div>
                    <div className="summary-row">
                        <span className="label">Điểm đến</span>
                        <strong>{trip.zone_to}</strong>
                    </div>
                    <div className="summary-row">
                        <span className="label">Thời gian</span>
                        <strong>{trip.start_time.substring(0, 5)} - {format(new Date(trip.date), 'dd/MM/yyyy')}</strong>
                    </div>

                    {selectedSeatDetails && (
                        <div className="selected-seat-info animate-fade-in" style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '1rem', borderRadius: '8px', marginTop: '1rem' }}>
                            <div className="flex-between">
                                <span>Ghế số {selectedSeatDetails.seat_number} ({selectedSeatDetails.position})</span>
                                <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>{selectedSeatDetails.price.toLocaleString()}đ</span>
                            </div>
                        </div>
                    )}

                    <div style={{ marginTop: '2rem', fontSize: '1.2rem', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                        <span>Tổng cộng</span>
                        <span style={{ color: 'var(--primary)' }}>{selectedSeatDetails ? selectedSeatDetails.price.toLocaleString() : 0}đ</span>
                    </div>
                </div>

            </div>

            <style>{`
        .progress-bar {
          padding: 1rem 3rem;
        }
        .step {
          color: var(--text-muted);
          font-weight: 600;
        }
        .step.active {
          color: var(--primary);
        }
        .line {
          height: 2px;
          background: rgba(255,255,255,0.1);
          flex: 1;
          margin: 0 1rem;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1rem;
        }
        @media (max-width: 768px) {
          .grid-cols-2 { grid-template-columns: 1fr; }
        }
      `}</style>
        </div>
    );
};

export default BookingFlow;
