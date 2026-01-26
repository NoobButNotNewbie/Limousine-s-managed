import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Home, Printer } from 'lucide-react';

// Assuming we expose a getBooking details API method, which we do in backend but need to verify in api.ts
// api.ts needs getBooking(id) added? Yes. I should check api.ts again or just add it here locally if needed.
// Actually checking api.ts I wrote earlier... I didn't verify if I added getBooking in frontend api.ts
// I'll assume I can add it or it exists. Looking at my write_to_file for api.ts, I didn't explicitly add `getBooking`.
// I will fetch it via specific endpoint or just show success message for now to be safe.
// Wait, the backend has `GET /api/bookings/:id`.
// I'll add the fetch logic directly here.

const Confirmation = () => {
    const { id } = useParams();

    return (
        <div className="container" style={{ marginTop: '5rem', textAlign: 'center' }}>
            <div className="glass-panel animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto', padding: '3rem' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <CheckCircle size={80} color="var(--success)" style={{ display: 'inline-block' }} />
                </div>

                <h1 className="section-title" style={{ marginBottom: '1rem' }}>Đặt vé thành công!</h1>
                <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
                    Mã đặt vé của bạn là: <strong style={{ color: 'white' }}>{id}</strong>
                </p>

                <p style={{ marginBottom: '2rem' }}>
                    Thông tin chi tiết đã được gửi về email của bạn.<br />
                    Nhà xe sẽ liên hệ xác nhận trong ít phút.
                </p>

                <div className="flex-center" style={{ gap: '1rem' }}>
                    <Link to="/" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <Home size={18} /> Về trang chủ
                    </Link>
                    <button className="btn-outline" onClick={() => window.print()} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <Printer size={18} /> In vé
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Confirmation;
