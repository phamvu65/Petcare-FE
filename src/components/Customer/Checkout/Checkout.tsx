import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../../api/axiosInstance";
import "./Checkout.css";

// --- 1. CẬP NHẬT INTERFACE: Thêm trường images ---
interface CheckoutItem {
  id?: number;
  productId: number;
  quantity: number;
  productName?: string;
  name?: string;
  price?: number;
  unitPrice?: number;
  image?: string;
  productImage?: string;
  images?: { id: number; imageUrl: string }[]; // <--- Đã thêm dòng này để hứng dữ liệu ảnh từ trang Customer
}

interface Address {
  id: number;
  recipientName: string;
  recipientPhone: string;
  city: string;
  ward: string;
  addressDetail: string;
  isDefault?: boolean;
}

interface Coupon {
  id: number;
  code: string;
  type: string;
  value: number;
  minOrderValue: number;
  usageLimit?: number;
}

const Checkout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const stateData = location.state as { buyNowItems?: CheckoutItem[], items?: CheckoutItem[] } | null;
  const buyNowItems = stateData?.buyNowItems || stateData?.items;

  const isBuyNowMode = buyNowItems && buyNowItems.length > 0;

  const [items, setItems] = useState<CheckoutItem[]>([]);
  const [merchandiseSubtotal, setMerchandiseSubtotal] = useState(0);
  const [shippingFee] = useState(30000);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [totalPayment, setTotalPayment] = useState(0);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [note, setNote] = useState("");

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  const [loading, setLoading] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [newAddress, setNewAddress] = useState({
    recipientName: "", recipientPhone: "", city: "", ward: "", addressDetail: ""
  });

  // --- LOGIC LOAD DỮ LIỆU ---
  useEffect(() => {
    if (isBuyNowMode && buyNowItems) {
      setItems(buyNowItems);
    } else {
      fetchMyCart();
    }
    fetchAddresses();
  }, [isBuyNowMode]);

  useEffect(() => {
    const subtotal = items.reduce((sum, item) => {
      const price = item.price || item.unitPrice || 0;
      return sum + price * item.quantity;
    }, 0);
    setMerchandiseSubtotal(subtotal);

    let discount = 0;
    if (appliedCoupon) {
      if (subtotal < appliedCoupon.minOrderValue) {
        setAppliedCoupon(null);
        setCouponCode("");
        alert(`Mã giảm giá đã hủy vì đơn hàng dưới ${appliedCoupon.minOrderValue.toLocaleString()}đ`);
      } else if (appliedCoupon.usageLimit !== undefined && appliedCoupon.usageLimit <= 0) {
        setAppliedCoupon(null);
        setCouponCode("");
        alert("Mã giảm giá này đã hết lượt sử dụng.");
      } else {
        const type = appliedCoupon.type.toLowerCase();
        if (type.includes('percent')) {
          discount = (subtotal * appliedCoupon.value) / 100;
        } else {
          discount = appliedCoupon.value;
        }
      }
    }

    if (discount > subtotal) discount = subtotal;
    setDiscountAmount(discount);
    setTotalPayment(subtotal + shippingFee - discount);
  }, [items, appliedCoupon, shippingFee]);

  const fetchMyCart = async () => {
    try {
      const res = await api.get("/cart");
      if (res.data.data && res.data.data.items) {
        setItems(res.data.data.items);
      }
    } catch (error) {
      console.error("Lỗi lấy giỏ hàng:", error);
    }
  };

  const fetchAddresses = async () => {
    try {
      const res = await api.get("/addresses/list");
      const rawList = res.data.data || [];
      const list: Address[] = rawList.map((addr: any) => ({
        id: addr.id || addr.addressId,
        recipientName: addr.recipientName,
        recipientPhone: addr.recipientPhone,
        city: addr.city,
        ward: addr.ward,
        addressDetail: addr.addressDetail,
        isDefault: addr.isDefault
      }));
      setAddresses(list);

      if (list.length > 0 && !selectedAddressId) {
        const defaultAddr = list.find((a) => a.isDefault);
        setSelectedAddressId(defaultAddr ? defaultAddr.id : list[0].id);
      }
    } catch (error) {
      console.error("Lỗi lấy địa chỉ:", error);
    }
  };

  // --- LOGIC COUPON ---
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const res = await api.get(`/coupons/check/${couponCode}`);
      const rawCoupon = res.data.data;
      if (!rawCoupon) { alert("Mã giảm giá không tồn tại!"); return; }

      const coupon: Coupon = {
        id: rawCoupon.id,
        code: rawCoupon.code,
        type: rawCoupon.type,
        value: rawCoupon.value,
        minOrderValue: rawCoupon.minOrderValue ?? rawCoupon.min_order_value ?? 0,
        usageLimit: rawCoupon.usageLimit ?? rawCoupon.usage_limit
      };

      if (merchandiseSubtotal < coupon.minOrderValue) {
        alert(`Mã này chỉ áp dụng cho đơn từ ${coupon.minOrderValue.toLocaleString()}đ`);
        setAppliedCoupon(null);
        return;
      }
      if (coupon.usageLimit !== undefined && coupon.usageLimit <= 0) {
        alert("Mã giảm giá đã hết lượt.");
        setAppliedCoupon(null);
        return;
      }
      setAppliedCoupon(coupon);
      alert("Áp dụng mã giảm giá thành công!");
    } catch (error: any) {
      alert(error.response?.data?.message || "Mã giảm giá không hợp lệ!");
      setAppliedCoupon(null);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponCode("");
  };

  // --- LOGIC SỐ LƯỢNG ---
  const handleQuantityChange = async (index: number, change: number) => {
    const currentItem = items[index];
    const newQuantity = currentItem.quantity + change;
    if (newQuantity < 1) return;

    const newItems = [...items];
    newItems[index].quantity = newQuantity;
    setItems(newItems);

    if (!isBuyNowMode && currentItem.id) {
      try {
        await api.put(`/cart/upd/${currentItem.id}`, null, { params: { quantity: newQuantity } });
      } catch (e) { }
    }
  };

  // --- LOGIC ĐỊA CHỈ ---
  const handleAddAddress = async () => {
    const { recipientName, recipientPhone, city, ward, addressDetail } = newAddress;
    if (!recipientName || !recipientPhone || !city || !ward || !addressDetail) {
      alert("Vui lòng điền đầy đủ thông tin địa chỉ!");
      return;
    }
    try {
      await api.post("/addresses/add", { ...newAddress, isDefault: addresses.length === 0 });
      alert("Thêm địa chỉ thành công!");
      setShowAddressModal(false);
      setNewAddress({ recipientName: "", recipientPhone: "", city: "", ward: "", addressDetail: "" });
      fetchAddresses();
    } catch (error: any) {
      alert("Thêm thất bại: " + (error.response?.data?.message || "Lỗi hệ thống"));
    }
  };

  // --- XỬ LÝ ĐẶT HÀNG ---
  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      alert("Vui lòng chọn địa chỉ nhận hàng!");
      return;
    }

    // Kiểm tra ID sản phẩm
    for (const item of items) {
      if (!item.productId && !item.id) {
        alert(`Lỗi: Sản phẩm "${item.productName}" bị thiếu ID. Vui lòng thử lại.`);
        return;
      }
    }

    setLoading(true);
    try {
      // 1. Tạo đơn hàng
      const payload = {
        addressId: selectedAddressId,
        paymentMethod: paymentMethod,
        couponCode: appliedCoupon ? appliedCoupon.code : null,
        note: note,
        items: isBuyNowMode
          ? items.map(item => ({
            productId: item.productId || item.id,
            quantity: item.quantity
          }))
          : null
      };

      const res = await api.post("/orders", payload);
      const newOrder = res.data.data;

      // 2. Nếu chọn VNPay -> Gọi tiếp API lấy link thanh toán
      if (paymentMethod === "E_WALLET") {
        try {
          const paymentRes = await api.post("/payments/create", {
            orderId: newOrder.id,
            amount: totalPayment,
            method: "E_WALLET",
            note: note || "Thanh toán VNPay"
          });

          const paymentUrl = paymentRes.data.data.paymentUrl;
          if (paymentUrl) {
            // Chuyển hướng sang trang VNPay
            window.location.href = paymentUrl;
            return;
          } else {
             alert("Tạo đơn thành công nhưng không lấy được link thanh toán. Vui lòng kiểm tra lại đơn hàng.");
             navigate(`/account/orders/${newOrder.id}`);
          }
        } catch (payError) {
          console.error("Lỗi VNPay:", payError);
          alert("Lỗi kết nối cổng thanh toán. Đơn hàng đã được tạo, vui lòng thanh toán lại sau.");
          navigate("/profile"); 
        }
      } else {
        // 3. Nếu là COD -> Chuyển về TRANG CHỦ
        alert(`🎉 Đặt hàng thành công! Mã đơn: ${newOrder.id}`);
        navigate("/"); 
      }
    } catch (error: any) {
      console.error("Order error:", error);
      const msg = error.response?.data?.message || "Đặt hàng thất bại.";
      alert("Lỗi: " + msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-container">
      <h2 className="checkout-title">Thanh Toán</h2>
      <div className="checkout-layout">
        <div className="checkout-left">
          <div className="checkout-section">
            <h3><i className="fas fa-map-marker-alt"></i> Địa chỉ nhận hàng</h3>
            {addresses.length === 0 ? (
              <p className="empty-text">Bạn chưa có địa chỉ nào.</p>
            ) : (
              <div className="address-list">
                {addresses.map(addr => (
                  <label key={addr.id} className={`address-card ${Number(selectedAddressId) === Number(addr.id) ? 'selected' : ''}`} onClick={() => setSelectedAddressId(addr.id)}>
                    <input type="radio" name="address" value={addr.id} checked={Number(selectedAddressId) === Number(addr.id)} onChange={() => setSelectedAddressId(addr.id)} />
                    <div className="address-info">
                      <p className="addr-name">{addr.recipientName} | {addr.recipientPhone}</p>
                      <p className="addr-detail">{addr.addressDetail}, {addr.ward}, {addr.city}</p>
                      {addr.isDefault && <span className="default-badge">Mặc định</span>}
                    </div>
                  </label>
                ))}
              </div>
            )}
            <button className="btn-add-address" onClick={() => setShowAddressModal(true)}>+ Thêm địa chỉ mới</button>
          </div>
          <div className="checkout-section">
            <h3><i className="fas fa-box"></i> Sản phẩm ({items.length})</h3>
            <div className="checkout-items">
              {items.map((item, idx) => {
                // --- 2. LOGIC LẤY ẢNH ĐƯỢC CẬP NHẬT ---
                const imageUrl = item.image 
                  || item.productImage 
                  || (item.images && item.images.length > 0 ? item.images[0].imageUrl : null)
                  || "https://placehold.co/60";

                return (
                  <div key={idx} className="checkout-item">
                     {/* Sử dụng biến imageUrl vừa tạo */}
                    <img src={imageUrl} alt="img" style={{objectFit: 'cover'}} />
                    <div className="item-details">
                      <h4>{item.productName || item.name || "Sản phẩm"}</h4>
                      <span className="item-price">{(item.price || item.unitPrice || 0).toLocaleString()}đ</span>
                    </div>
                    <div className="quantity-control">
                      <button onClick={() => handleQuantityChange(idx, -1)}>-</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => handleQuantityChange(idx, 1)}>+</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="checkout-right">
          <div className="order-summary">
            <h3>Tổng kết đơn hàng</h3>
            <div className="summary-row"><span>Tạm tính:</span><span>{merchandiseSubtotal.toLocaleString()}đ</span></div>
            <div className="summary-row"><span>Phí vận chuyển:</span><span>{shippingFee.toLocaleString()}đ</span></div>
            <div className="coupon-section">
              {appliedCoupon ? (
                <div className="applied-coupon">
                  <span>Mã: <strong>{appliedCoupon.code}</strong> (-{discountAmount.toLocaleString()}đ)</span>
                  <button onClick={handleRemoveCoupon} className="btn-remove-coupon">✕</button>
                </div>
              ) : (
                <div className="coupon-input">
                  <input type="text" placeholder="Nhập mã giảm giá" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} />
                  <button onClick={handleApplyCoupon}>Áp dụng</button>
                </div>
              )}
            </div>
            <div className="summary-total"><span>Tổng thanh toán:</span><span className="total-price">{totalPayment.toLocaleString()}đ</span></div>
            <div className="payment-methods">
              <p className="section-label">Phương thức thanh toán:</p>
              <label><input type="radio" name="payment" value="COD" checked={paymentMethod === "COD"} onChange={(e) => setPaymentMethod(e.target.value)} /> Thanh toán khi nhận hàng (COD)</label>
              <label><input type="radio" name="payment" value="E_WALLET" checked={paymentMethod === "E_WALLET"} onChange={(e) => setPaymentMethod(e.target.value)} /> Ví điện tử (VNPay/Momo)</label>
            </div>
            <div className="order-note"><textarea placeholder="Ghi chú cho người bán..." value={note} onChange={(e) => setNote(e.target.value)} /></div>
            <button className="btn-place-order" onClick={handlePlaceOrder} disabled={loading}>{loading ? "Đang xử lý..." : "ĐẶT HÀNG"}</button>
          </div>
        </div>
      </div>
      {showAddressModal && (
        <div className="modal-overlay">
          <div className="modal-content address-modal">
            <h3>Thêm địa chỉ mới</h3>
            <div className="form-group"><label>Họ tên người nhận *</label><input type="text" value={newAddress.recipientName} onChange={e => setNewAddress({ ...newAddress, recipientName: e.target.value })} placeholder="Nguyễn Văn A" /></div>
            <div className="form-group"><label>Số điện thoại *</label><input type="text" value={newAddress.recipientPhone} onChange={e => setNewAddress({ ...newAddress, recipientPhone: e.target.value })} placeholder="09xx..." /></div>
            <div className="form-row">
              <div className="form-group"><label>Tỉnh / Thành phố *</label><input type="text" value={newAddress.city} onChange={e => setNewAddress({ ...newAddress, city: e.target.value })} placeholder="Hà Nội" /></div>
              <div className="form-group"><label>Quận / Huyện / Xã *</label><input type="text" value={newAddress.ward} onChange={e => setNewAddress({ ...newAddress, ward: e.target.value })} placeholder="Cầu Giấy" /></div>
            </div>
            <div className="form-group"><label>Địa chỉ chi tiết *</label><input type="text" value={newAddress.addressDetail} onChange={e => setNewAddress({ ...newAddress, addressDetail: e.target.value })} placeholder="Số nhà, tên đường..." /></div>
            <div className="modal-actions"><button className="btn-cancel" onClick={() => setShowAddressModal(false)}>Hủy</button><button className="btn-submit" onClick={handleAddAddress}>Lưu Địa Chỉ</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;