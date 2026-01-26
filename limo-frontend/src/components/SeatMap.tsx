import React from 'react';
import type { Seat } from '../services/api';

interface SeatMapProps {
    seats: Seat[];
    selectedSeatId: string | null;
    onSelectSeat: (seatId: string) => void;
    priceMap: { [key: string]: number };
}

const SeatMap: React.FC<SeatMapProps> = ({ seats, selectedSeatId, onSelectSeat }) => {
    // Helper to get seat by number
    const getSeat = (num: number) => seats.find(s => s.seat_number === num);

    // Render a single seat
    const renderSeat = (seatNum: number) => {
        const seat = getSeat(seatNum);
        if (!seat) return <div className="seat-placeholder" />;

        const isBooked = seat.is_booked || (seat.is_locked && seat.id !== selectedSeatId);
        const isSelected = seat.id === selectedSeatId;

        // Determine class based on position (logic kept but variable removed if unused or used directly)
        // Logic for position-specific styling if needed later:
        // if (seat.position === 'front') ...

        return (
            <button
                key={seat.id}
                onClick={() => !isBooked && onSelectSeat(seat.id)}
                disabled={isBooked}
                className={`seat-item ${isBooked ? 'booked' : ''} ${isSelected ? 'selected' : ''}`}
                title={`Ghế ${seatNum} - ${seat.price.toLocaleString()}đ`}
            >
                <span className="seat-icon">💺</span>
                <span className="seat-number">{seatNum}</span>
            </button>
        );
    };

    return (
        <div className="seat-map-container glass-panel">
            <div className="driver-row">
                <div className="steering-wheel">🎡 Tài xế</div>
                <div className="empty-space"></div>
            </div>

            <div className="seats-grid">
                {/* Row 1: Front seats (next to driver usually, strictly following 1-4 front spec) */}
                {/* Based on common limousine layout (Ford Transit/Solati): 
            Driver + 1 passenger (front)
            Row 1: 2 seats
            Row 2: 2 seats
            Row 3: 3 seats
            
            But spec says: front(1-4), middle(5-6), back(7-9).
            Let's arrange them logically.
        */}

                {/* Front Row (1-4) - Maybe 2 rows of 2? or 1 row of 3? 
            Let's assume a VIP layout. 4 seats in "front" section.
        */}
                <div className="seat-row">
                    <div className="seat-group">
                        {renderSeat(1)}
                        {renderSeat(2)}
                    </div>
                    <div className="aisle">Front</div>
                    <div className="seat-group">
                        {renderSeat(3)}
                        {renderSeat(4)}
                    </div>
                </div>

                {/* Middle Row (5-6) - VIP seats usually */}
                <div className="seat-row">
                    <div className="seat-group">
                        {renderSeat(5)}
                    </div>
                    <div className="aisle">Middle</div>
                    <div className="seat-group">
                        {renderSeat(6)}
                    </div>
                </div>

                {/* Back Row (7-9) - 3 seats usually */}
                <div className="seat-row" style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                    {renderSeat(7)}
                    {renderSeat(8)}
                    {renderSeat(9)}
                </div>
            </div>

            <div className="seat-legend">
                <div className="legend-item"><span className="dot available"></span> Trống</div>
                <div className="legend-item"><span className="dot selected"></span> Đang chọn</div>
                <div className="legend-item"><span className="dot booked"></span> Đã đặt</div>
            </div>

            <style>{`
        .seat-map-container {
          padding: 2rem;
          max-width: 400px;
          margin: 0 auto;
        }
        .driver-row {
          display: flex;
          justify-content: flex-start;
          margin-bottom: 2rem;
          opacity: 0.5;
        }
        .steering-wheel {
          border: 2px solid #ccc;
          padding: 5px 10px;
          border-radius: 20px;
        }
        .seat-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1.5rem;
          align-items: center;
        }
        .seat-item {
          width: 50px;
          height: 50px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.2);
          background: rgba(255,255,255,0.1);
          color: white;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .seat-item:hover:not(:disabled) {
          background: rgba(255,255,255,0.3);
          transform: scale(1.05);
        }
        .seat-item.selected {
          background: var(--primary);
          border-color: var(--primary);
          box-shadow: 0 0 10px var(--primary);
        }
        .seat-item.booked {
          background: rgba(239, 68, 68, 0.2);
          border-color: rgba(239, 68, 68, 0.5);
          color: rgba(255,255,255,0.3);
          cursor: not-allowed;
        }
        .seat-icon { font-size: 1.2rem; }
        .seat-number { font-size: 0.7rem; margin-top: -2px; }
        .aisle { font-size: 0.8rem; color: #94a3b8; letter-spacing: 1px; }
        
        .seat-legend {
          display: flex;
          justify-content: space-around;
          margin-top: 2rem;
          border-top: 1px solid rgba(255,255,255,0.1);
          padding-top: 1rem;
        }
        .legend-item { display: flex; align-items: center; gap: 8px; font-size: 0.9rem; color: #94a3b8; }
        .dot { width: 10px; height: 10px; border-radius: 50%; }
        .dot.available { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); }
        .dot.selected { background: var(--primary); }
        .dot.booked { background: rgba(239, 68, 68, 0.5); }
      `}</style>
        </div>
    );
}

export default SeatMap;
