// ================================================
// NOTIFICATION SERVICE - Email & Phone Notifications
// ================================================

import nodemailer from 'nodemailer';
import env from '../../config/env';
import { BookingWithDetails, Trip } from '../../shared/types';
import { formatDate, formatTime } from '../../shared/utils/datetime';

// Create email transporter
const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS
    }
});

/**
 * Send booking confirmation email
 */
export async function sendBookingConfirmation(booking: BookingWithDetails): Promise<void> {
    const { trip, seat, customer, vehicle } = booking;

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">🚐 Xác Nhận Đặt Vé Thành Công</h1>
            
            <p>Xin chào <strong>${customer.name}</strong>,</p>
            
            <p>Cảm ơn bạn đã đặt vé xe limousine. Dưới đây là thông tin chuyến đi của bạn:</p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h2 style="margin-top: 0; color: #1f2937;">📍 Chi Tiết Chuyến Đi</h2>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; color: #6b7280;">Điểm đi:</td>
                        <td style="padding: 8px 0; font-weight: bold;">${trip.zone_from}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #6b7280;">Điểm đến:</td>
                        <td style="padding: 8px 0; font-weight: bold;">${trip.zone_to}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #6b7280;">Ngày:</td>
                        <td style="padding: 8px 0; font-weight: bold;">${formatDate(trip.date)}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #6b7280;">Giờ khởi hành:</td>
                        <td style="padding: 8px 0; font-weight: bold;">${formatTime(trip.start_time)}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #6b7280;">Xe số:</td>
                        <td style="padding: 8px 0; font-weight: bold;">${vehicle.vehicle_number}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #6b7280;">Ghế:</td>
                        <td style="padding: 8px 0; font-weight: bold;">Số ${seat.seat_number} (${seat.position})</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #6b7280;">Giá vé:</td>
                        <td style="padding: 8px 0; font-weight: bold; color: #059669;">${Number(seat.price).toLocaleString('vi-VN')} VNĐ</td>
                    </tr>
                </table>
            </div>
            
            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #92400e;">
                    ⏰ <strong>Lưu ý:</strong> Vui lòng có mặt tại điểm đón trước giờ khởi hành 15 phút.
                </p>
            </div>
            
            <p>Mã đặt vé: <strong>${booking.id}</strong></p>
            
            <p>Nếu có thắc mắc, vui lòng liên hệ hotline: <strong>1900-xxxx</strong></p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
            <p style="color: #9ca3af; font-size: 12px;">
                Email này được gửi tự động, vui lòng không trả lời.
            </p>
        </div>
    `;

    try {
        await transporter.sendMail({
            from: env.EMAIL_FROM,
            to: customer.email,
            subject: `Xác nhận đặt vé - ${trip.zone_from} → ${trip.zone_to} - ${formatDate(trip.date)}`,
            html
        });
        console.log(`📧 Confirmation email sent to ${customer.email}`);
    } catch (error) {
        console.error('Failed to send confirmation email:', error);
        // Don't throw - email failure shouldn't fail the booking
    }
}

/**
 * Send trip reminder (3h before departure)
 */
export async function sendTripReminder(booking: BookingWithDetails): Promise<void> {
    const { trip, seat, customer, vehicle } = booking;

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">🔔 Nhắc Nhở Chuyến Đi</h1>
            
            <p>Xin chào <strong>${customer.name}</strong>,</p>
            
            <p>Chuyến xe của bạn sẽ khởi hành sau <strong>3 tiếng</strong> nữa!</p>
            
            <div style="background: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0;"><strong>🚐 ${trip.zone_from} → ${trip.zone_to}</strong></p>
                <p style="margin: 10px 0 0;">🕐 ${formatTime(trip.start_time)} | Xe ${vehicle.vehicle_number} | Ghế ${seat.seat_number}</p>
            </div>
            
            <p>Vui lòng chuẩn bị và có mặt đúng giờ.</p>
            
            <p>Chúc bạn có chuyến đi vui vẻ! 🎉</p>
        </div>
    `;

    try {
        await transporter.sendMail({
            from: env.EMAIL_FROM,
            to: customer.email,
            subject: `⏰ Nhắc nhở: Chuyến xe lúc ${formatTime(trip.start_time)} hôm nay`,
            html
        });
        console.log(`📧 Reminder email sent to ${customer.email}`);
    } catch (error) {
        console.error('Failed to send reminder email:', error);
    }
}

/**
 * Send cancellation notice with alternatives
 */
export async function sendCancellationNotice(
    booking: BookingWithDetails,
    alternatives: Trip[]
): Promise<void> {
    const { trip, customer } = booking;

    let alternativesHtml = '';
    if (alternatives.length > 0) {
        alternativesHtml = `
            <p>Các chuyến xe thay thế trong ngày:</p>
            <ul>
                ${alternatives.map(alt => `
                    <li><strong>${formatTime(alt.start_time)}</strong> - ${alt.zone_from} → ${alt.zone_to}</li>
                `).join('')}
            </ul>
            <p>Vui lòng truy cập website hoặc gọi hotline để đặt lại vé.</p>
        `;
    }

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #dc2626;">❌ Thông Báo Hủy Chuyến</h1>
            
            <p>Xin chào <strong>${customer.name}</strong>,</p>
            
            <p>Rất tiếc, chuyến xe của bạn đã bị <strong>hủy</strong> do không đủ số lượng hành khách tối thiểu.</p>
            
            <div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0;"><strong>Chuyến đã hủy:</strong></p>
                <p style="margin: 10px 0 0;">${trip.zone_from} → ${trip.zone_to}</p>
                <p style="margin: 5px 0 0;">${formatDate(trip.date)} - ${formatTime(trip.start_time)}</p>
            </div>
            
            ${alternativesHtml}
            
            <p>Chúng tôi xin lỗi vì sự bất tiện này.</p>
            
            <p>Hotline: <strong>1900-xxxx</strong></p>
        </div>
    `;

    try {
        await transporter.sendMail({
            from: env.EMAIL_FROM,
            to: customer.email,
            subject: `Thông báo hủy chuyến - ${trip.zone_from} → ${trip.zone_to}`,
            html
        });
        console.log(`📧 Cancellation email sent to ${customer.email}`);
    } catch (error) {
        console.error('Failed to send cancellation email:', error);
    }
}

/**
 * Make phone call notification (placeholder - integrate with Twilio or similar)
 */
export async function callCustomer(phone: string, message: string): Promise<void> {
    // TODO: Integrate with Twilio or similar service
    console.log(`📞 [PHONE CALL PLACEHOLDER] To: ${phone}, Message: ${message}`);
}
