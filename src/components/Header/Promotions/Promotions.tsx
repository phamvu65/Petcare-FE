import React, { useEffect, useState } from "react";
import api from "../../../api/axiosInstance"; // Chỉnh lại đường dẫn import cho đúng
import "./Promotions.css";

// Cập nhật Interface khớp với DTO trả về từ Backend (thường Backend sẽ convert snake_case -> camelCase)
interface Coupon {
  id: number;
  code: string;
  type: 'percent' | 'fixed'; // Quan trọng: Loại giảm giá
  value: number;             // Giá trị giảm
  minOrderValue: number;     // Đơn tối thiểu
  startsAt: string;
  endsAt: string;            // Hạn sử dụng
  usageLimit: number;
}

const Promotions: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const res = await api.get("/coupons/public/valid");
        // Giả sử API trả về data chuẩn camelCase. Nếu API trả về snake_case (min_order_value), bạn cần sửa interface ở trên.
        setCoupons(res.data.data);
      } catch (error) {
        console.error("Lỗi load mã giảm giá", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCoupons();
  }, []);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    alert(`Đã sao chép mã: ${code}`);
  };

  // Hàm format tiền tệ
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  // Hàm tự tạo mô tả dựa trên logic DB
  const generateDescription = (coupon: Coupon) => {
    const condition = coupon.minOrderValue > 0 
      ? `cho đơn từ ${formatCurrency(coupon.minOrderValue)}` 
      : "cho mọi đơn hàng";

    if (coupon.type === 'percent') {
      return `Giảm ${coupon.value}% ${condition}`;
    } else {
      return `Giảm ${formatCurrency(coupon.value)} ${condition}`;
    }
  };

  if (loading) return <div style={{textAlign: "center", padding: "50px"}}>Đang tải khuyến mãi...</div>;

  return (
    <div className="promo-container">
      <div className="promo-banner">
        <h1>🎉 KHO KHUYẾN MÃI 🎉</h1>
        <p>Săn mã giảm giá ngay hôm nay!</p>
      </div>

      <div className="coupon-grid">
        {coupons.length === 0 ? (
           <div className="empty-coupon">
              <i className="fas fa-ticket-alt" style={{fontSize: "40px", marginBottom: "10px", color: "#ccc"}}></i>
              <p>Hiện chưa có mã giảm giá nào khả dụng.</p>
           </div>
        ) : (
           coupons.map((coupon) => (
            <div key={coupon.id} className="coupon-ticket">
               {/* Phần bên trái: Hiển thị số to */}
               <div className="coupon-left">
                  <div className="coupon-value">
                    {coupon.type === 'percent' ? `${coupon.value}%` : formatCurrency(coupon.value)}
                  </div>
                  <span className="coupon-label">OFF</span>
               </div>

               {/* Phần bên phải: Thông tin chi tiết */}
               <div className="coupon-right">
                  <div className="coupon-info">
                    <h3 className="coupon-code">{coupon.code}</h3>
                    <p className="coupon-desc">{generateDescription(coupon)}</p>
                    <p className="coupon-date">
                      HSD: {new Date(coupon.endsAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <button className="btn-copy" onClick={() => copyCode(coupon.code)}>
                    Sao chép
                  </button>
               </div>
               
               {/* Trang trí chấm tròn cắt giữa */}
               <div className="circle-top"></div>
               <div className="circle-bottom"></div>
            </div>
           ))
        )}
      </div>
    </div>
  );
};

export default Promotions;