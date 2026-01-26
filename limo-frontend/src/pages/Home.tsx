import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Clock, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

const Home = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        zone_from: 'Hà Nội',
        zone_to: 'Quảng Ninh',
        date: format(new Date(), 'yyyy-MM-dd'),
        start_time: '08:00',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Navigate to booking flow with params
        const searchParams = new URLSearchParams(formData);
        navigate(`/book?${searchParams.toString()}`);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    // Generate nice hourly slots from 04:00 to 22:00
    const timeSlots = Array.from({ length: 19 }, (_, i) => {
        const hour = i + 4;
        return `${hour.toString().padStart(2, '0')}:00`;
    });

    return (
        <div className="home-page container">
            <div className="hero-section flex-center flex-col animate-fade-in" style={{ minHeight: '80vh', textAlign: 'center' }}>
                <h1 className="hero-title">
                    Trải nghiệm đẳng cấp <br />
                    <span className="text-gradient">Limousine Thượng Hạng</span>
                </h1>
                <p className="hero-subtitle">Mỗi chuyến đi là một trải nghiệm 5 sao</p>

                <form onSubmit={handleSubmit} className="booking-widget glass-panel">
                    <div className="form-grid">
                        <div className="input-group">
                            <label className="label"><MapPin size={16} /> Điểm đi</label>
                            <input
                                type="text"
                                name="zone_from"
                                className="input-field"
                                value={formData.zone_from}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label className="label"><MapPin size={16} /> Điểm đến</label>
                            <input
                                type="text"
                                name="zone_to"
                                className="input-field"
                                value={formData.zone_to}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label className="label"><Calendar size={16} /> Ngày đi</label>
                            <input
                                type="date"
                                name="date"
                                className="input-field"
                                value={formData.date}
                                onChange={handleInputChange}
                                min={new Date().toISOString().split('T')[0]}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label className="label"><Clock size={16} /> Giờ đi (Dự kiến)</label>
                            <select
                                name="start_time"
                                className="input-field"
                                value={formData.start_time}
                                onChange={handleInputChange}
                            >
                                {timeSlots.map(time => (
                                    <option key={time} value={time}>{time}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '20px', fontSize: '1.2rem' }}>
                        Tìm Chuyến Xe <ArrowRight size={20} style={{ marginLeft: '10px', verticalAlign: 'middle' }} />
                    </button>
                </form>
            </div>

            <style>{`
        .hero-title {
          font-size: 3.5rem;
          font-weight: 800;
          line-height: 1.2;
          margin-bottom: 1rem;
        }
        .text-gradient {
          background: linear-gradient(135deg, var(--primary), var(--secondary));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .hero-subtitle {
          color: var(--text-muted);
          font-size: 1.2rem;
          margin-bottom: 3rem;
        }
        .booking-widget {
          padding: 2.5rem;
          width: 100%;
          max-width: 900px;
        }
        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
          text-align: left;
        }
        @media (max-width: 768px) {
          .hero-title { font-size: 2.5rem; }
          .form-grid { grid-template-columns: 1fr; }
        }
      `}</style>
        </div>
    );
};

export default Home;
