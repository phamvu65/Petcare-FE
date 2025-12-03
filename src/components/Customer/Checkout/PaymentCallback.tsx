import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import "./Checkout.css"; // 👈 Nhớ import file CSS mới

const PaymentCallback: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const status = searchParams.get('status');
    const orderId = searchParams.get('orderId');
    const message = searchParams.get('message');

    useEffect(() => {
        // Nếu thành công, tự động về trang chủ sau 5s (tùy chọn)
        if (status === 'success') {
            const timer = setTimeout(() => {
                navigate("/");
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [navigate, status]);

    return (
        <div className="payment-callback-container">
            {status === 'success' ? (
                <div className="payment-content">
                    <i className="fas fa-check-circle payment-icon success-icon"></i>
                    <h2>Thanh toán thành công!</h2>
                    <p>Cảm ơn bạn đã mua hàng. Đơn hàng <strong>#{orderId}</strong> đã được xác nhận.</p>
                    <p className="sub-text">Bạn sẽ được chuyển về trang chủ trong vài giây...</p>
                    
                    {/* 👇 Nút đẹp ở đây */}
                    <button className="btn-home" onClick={() => navigate("/")}>
                        <i className="fas fa-home"></i> Về Trang Chủ Ngay
                    </button>
                </div>
            ) : (
                <div className="payment-content">
                    <i className="fas fa-times-circle payment-icon error-icon"></i>
                    <h2>Thanh toán thất bại</h2>
                    <p>{message || "Giao dịch bị hủy hoặc xảy ra lỗi trong quá trình xử lý."}</p>
                    <p className="sub-text">Vui lòng kiểm tra lại thông tin thanh toán.</p>
                    
                    {/* 👇 Nút thử lại */}
                    <button className="btn-retry" onClick={() => navigate('/checkout')}>
                        <i className="fas fa-redo"></i> Thử Lại
                    </button>
                </div>
            )}
        </div>
    );
};

export default PaymentCallback;

// test thanh toán qua VNPAY
// Ngân hàng: Chọn NCB

// Số thẻ: 9704198526191432198

// Tên chủ thẻ: NGUYEN VAN A

// Ngày phát hành: 07/15 (Tháng 07 / Năm 2015)

// Mật khẩu OTP: 123456 (Đây là OTP giả lập, nhập số này là qua).