import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../../api/axiosInstance";
import "./Cart.css";

interface CartItem {
  id: number;
  productId: number;
  productName: string;
  name?: string; // Fallback
  productImage?: string;
  image?: string; // Fallback
  quantity: number;
  unitPrice: number;
  price?: number; // Fallback
  totalPrice: number;
}

const Cart: React.FC = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);
  const navigate = useNavigate();

  // --- 1. Load Giỏ hàng ---
  const fetchCart = async () => {
    try {
      const res = await api.get("/cart");
      console.log("Cart Data:", res.data); // 🟢 Debug log xem cấu trúc trả về

      if (res.data.data && Array.isArray(res.data.data.items)) {
        setCartItems(res.data.data.items);
      } else {
        setCartItems([]);
      }
    } catch (error) {
      console.error("Lỗi tải giỏ hàng", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  // --- 2. Xử lý Chọn sản phẩm ---
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedItemIds(cartItems.map(item => item.id));
    } else {
      setSelectedItemIds([]);
    }
  };

  const handleSelectItem = (id: number) => {
    if (selectedItemIds.includes(id)) {
      setSelectedItemIds(selectedItemIds.filter(itemId => itemId !== id));
    } else {
      setSelectedItemIds([...selectedItemIds, id]);
    }
  };

  // --- 3. Xử lý Số lượng ---
  const handleQuantityChange = async (item: CartItem, change: number) => {
    const newQty = (item.quantity || 0) + change;
    if (newQty < 1) return;

    // Optimistic update
    const updatedItems = cartItems.map(i => 
      i.id === item.id ? { ...i, quantity: newQty } : i
    );
    setCartItems(updatedItems);

    try {
      await api.put(`/cart/upd/${item.id}`, null, { params: { quantity: newQty } });
      // 🟢 Dispatch event để Header cập nhật
      window.dispatchEvent(new Event("cartChange"));
    } catch (error) {
      console.error("Lỗi cập nhật số lượng:", error);
      fetchCart(); // Revert
    }
  };

  // --- 4. Xử lý Xóa ---
  const handleDeleteItem = async (id: number) => {
    if (!window.confirm("Bạn muốn xóa sản phẩm này khỏi giỏ?")) return;
    try {
      await api.delete(`/cart/del/${id}`);
      setSelectedItemIds(prev => prev.filter(itemId => itemId !== id));
      fetchCart();
      // 🟢 Dispatch event để Header cập nhật
      window.dispatchEvent(new Event("cartChange"));
    } catch (error) {
      console.error("Lỗi xóa sản phẩm:", error);
    }
  };

  // --- 5. Tính toán Tổng tiền ---
  // Sử dụng (item.unitPrice || item.price || 0) để tránh lỗi crash nếu field null
  const selectedItems = cartItems.filter(item => selectedItemIds.includes(item.id));
  const totalAmount = selectedItems.reduce((sum, item) => {
    const price = item.unitPrice || item.price || 0;
    return sum + (price * (item.quantity || 1));
  }, 0);

  // --- 6. Chuyển sang Checkout ---
  const handleCheckout = () => {
    if (selectedItems.length === 0) {
      alert("Vui lòng chọn ít nhất một sản phẩm để thanh toán!");
      return;
    }

    const checkoutData = selectedItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        productName: item.productName || item.name || "Sản phẩm",
        price: item.unitPrice || item.price || 0,
        image: item.productImage || item.image
    }));

    navigate("/checkout", { state: { buyNowItems: checkoutData } });
  };

  if (loading) return <div style={{padding: 50, textAlign: 'center'}}>Đang tải giỏ hàng...</div>;

  if (!cartItems || cartItems.length === 0) {
    return (
        <div className="cart-page">
            <div className="empty-cart">
                <img src="https://cdn-icons-png.flaticon.com/512/11329/11329060.png" alt="Empty Cart" />
                <h3>Giỏ hàng của bạn đang trống</h3>
                <p>Hãy thêm vài người bạn nhỏ hoặc đồ dùng vào đây nhé!</p>
                <Link to="/customer" className="btn-continue">Tiếp tục mua sắm</Link>
            </div>
        </div>
    );
  }

  return (
    <div className="cart-page">
      <h2 className="cart-title">Giỏ Hàng Của Bạn</h2>
      
      <div className="cart-container">
        {/* LIST ITEMS */}
        <div className="cart-items-section">
            <div className="cart-header-row">
                <div className="col-checkbox">
                    <input 
                        type="checkbox" 
                        checked={cartItems.length > 0 && selectedItemIds.length === cartItems.length}
                        onChange={handleSelectAll}
                    />
                </div>
                <div>Sản phẩm</div>
                <div>Đơn giá</div>
                <div>Số lượng</div>
                <div>Thành tiền</div>
                <div></div>
            </div>

            {cartItems.map(item => {
                // Tính toán an toàn từng dòng để tránh crash
                const displayPrice = item.unitPrice || item.price || 0;
                const displayTotal = displayPrice * (item.quantity || 1);
                const displayName = item.productName || item.name || "Sản phẩm";
                const displayImage = item.productImage || item.image || "https://placehold.co/80";

                return (
                    <div key={item.id} className="cart-item-row">
                        <div className="col-checkbox">
                            <input 
                                type="checkbox" 
                                checked={selectedItemIds.includes(item.id)}
                                onChange={() => handleSelectItem(item.id)}
                            />
                        </div>
                        <div className="col-info">
                            <img src={displayImage} alt={displayName} className="cart-img" />
                            <div>
                                <div className="item-name">{displayName}</div>
                            </div>
                        </div>
                        <div className="col-price">{displayPrice.toLocaleString()}đ</div>
                        <div className="col-qty">
                            <div className="qty-control">
                                <button className="qty-btn" onClick={() => handleQuantityChange(item, -1)}>-</button>
                                <input className="qty-input" value={item.quantity || 1} readOnly />
                                <button className="qty-btn" onClick={() => handleQuantityChange(item, 1)}>+</button>
                            </div>
                        </div>
                        <div className="col-total">{displayTotal.toLocaleString()}đ</div>
                        <div className="col-action">
                            <button className="btn-delete-item" onClick={() => handleDeleteItem(item.id)}>
                                <i className="far fa-trash-alt"></i>
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>

        {/* SUMMARY */}
        <div className="cart-summary-section">
            <h3 className="summary-title">Tổng Cộng</h3>
            <div className="summary-row">
                <span>Đã chọn:</span>
                <span>{selectedItemIds.length} sản phẩm</span>
            </div>
            <div className="summary-row">
                <span>Tạm tính:</span>
                <span>{totalAmount.toLocaleString()}đ</span>
            </div>
            <div className="summary-total">
                <span>Tổng tiền:</span>
                <span className="total-val">{totalAmount.toLocaleString()}đ</span>
            </div>
            
            <button 
                className="btn-checkout" 
                onClick={handleCheckout}
                disabled={selectedItemIds.length === 0}
            >
                Mua Hàng ({selectedItemIds.length})
            </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;