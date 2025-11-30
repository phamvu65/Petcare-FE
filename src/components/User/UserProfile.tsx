import React, { useEffect, useState } from "react";
import api from "../../api/axiosInstance";
import "./UserProfile.css";

// --- INTERFACES ---
interface UserDetail {
  id: number;
  fistName: string; // Backend trả về 'fistName'
  lastName: string;
  userName: string;
  email: string;
  phone: string;
}

interface UpdateInfoForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface ChangePasswordForm {
  oldPassword: string;
  password: string;
  confirmPassword: string;
}

// Interface cho Đơn hàng
interface OrderDetailItem {
  id: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  image?: string;
}

interface Order {
  id: number;
  createdAt: string;
  status: string; // PENDING, PAID, SHIPPING, DELIVERED, CANCELLED...
  totalAmount: number;
  paymentMethod: string;
  address: string;
  items: OrderDetailItem[]; // Danh sách sản phẩm trong đơn
}

const UserProfile: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'info' | 'orders'>('info');
  
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // State Đơn hàng
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  
  // 🟢 STATE MỚI: Trạng thái lọc hiện tại
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // State Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);

  // State Form Data
  const [editForm, setEditForm] = useState<UpdateInfoForm>({
    firstName: "", lastName: "", email: "", phone: ""
  });

  const [passForm, setPassForm] = useState<ChangePasswordForm>({
    oldPassword: "", password: "", confirmPassword: ""
  });

  // --- 1. LẤY THÔNG TIN USER ---
  const fetchUser = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      setError("Bạn chưa đăng nhập.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await api.get(`/user/${userId}`);
      if (res.data && res.data.data) {
        setUser(res.data.data);
      }
    } catch (err) {
      console.error(err);
      setError("Không thể tải thông tin người dùng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  // --- 2. LẤY DANH SÁCH ĐƠN HÀNG (Khi chuyển tab) ---
  useEffect(() => {
    if (activeTab === 'orders') {
      fetchMyOrders();
    }
  }, [activeTab]);

  const fetchMyOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await api.get("/orders/my");
      // Giả sử API trả về mảng đơn hàng trong data.data
      setOrders(res.data.data || []);
    } catch (err) {
      console.error("Lỗi lấy đơn hàng:", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  // 🟢 LOGIC LỌC ĐƠN HÀNG
  const getFilteredOrders = () => {
    if (filterStatus === 'ALL') return orders;
    return orders.filter(order => order.status === filterStatus);
  };

  const filteredOrders = getFilteredOrders();

  // --- 3. XỬ LÝ HỦY ĐƠN ---
  const handleCancelOrder = async (orderId: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này?")) return;

    try {
      await api.patch(`/orders/${orderId}/cancel`);
      alert("Đã hủy đơn hàng thành công!");
      fetchMyOrders(); // Load lại danh sách sau khi hủy
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Không thể hủy đơn hàng.");
    }
  };

  // --- 4. XỬ LÝ CẬP NHẬT THÔNG TIN ---
  const handleOpenEdit = () => {
    if (user) {
      setEditForm({
        firstName: user.fistName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone
      });
      setShowEditModal(true);
    }
  };

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const payload = {
        id: user.id,
        userName: user.userName,
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        email: editForm.email,
        phone: editForm.phone
      };

      await api.put("/user/upd", payload);
      alert("Cập nhật thông tin thành công!");
      setShowEditModal(false);
      fetchUser();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Lỗi cập nhật thông tin.");
    }
  };

  // --- 5. XỬ LÝ ĐỔI MẬT KHẨU ---
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passForm.password !== passForm.confirmPassword) {
      alert("Mật khẩu mới và xác nhận mật khẩu không khớp!");
      return;
    }

    try {
      await api.patch("/user/change-pwd", {
        oldPassword: passForm.oldPassword,
        password: passForm.password,
        confirmPassword: passForm.confirmPassword
      });
      alert("Đổi mật khẩu thành công!");
      setShowPassModal(false);
      setPassForm({ oldPassword: "", password: "", confirmPassword: "" });
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Lỗi đổi mật khẩu.");
    }
  };

  // --- HELPER: FORMAT TIỀN & STATUS ---
  const formatCurrency = (amount: number) => amount.toLocaleString() + 'đ';
  
  const getStatusBadge = (status: string) => {
    const s = status.toUpperCase();
    let label = s;
    let className = "badge-default";

    switch(s) {
      case 'PENDING': label = 'Chờ xác nhận'; className = 'badge-warning'; break;
      case 'PAID': label = 'Đã thanh toán'; className = 'badge-success'; break;
      case 'SHIPPING': label = 'Đang giao'; className = 'badge-info'; break;
      case 'DELIVERED': label = 'Đã giao'; className = 'badge-success'; break;
      case 'CANCELLED': label = 'Đã hủy'; className = 'badge-danger'; break;
      case 'COMPLETED': label = 'Hoàn thành'; className = 'badge-success'; break;
    }
    return <span className={`status-badge ${className}`}>{label}</span>;
  };

  // Danh sách các tab lọc
  const filterTabs = [
    { key: 'ALL', label: 'Tất cả' },
    { key: 'PENDING', label: 'Chờ xác nhận' },
    { key: 'SHIPPING', label: 'Đang giao' },
    { key: 'COMPLETED', label: 'Hoàn thành' },
    { key: 'CANCELLED', label: 'Đã hủy' },
  ];

  // --- RENDER ---
  if (loading && !user) return <div className="profile-loading">Đang tải...</div>;
  if (error) return <div className="profile-error">{error}</div>;
  if (!user) return null;

  return (
    <div className="profile-container">
      {/* SIDEBAR / TABS */}
      <div className="profile-sidebar">
        <div className="user-brief">
            <div className="avatar-circle">
                {user.lastName.charAt(0).toUpperCase()}
            </div>
            <div className="brief-info">
                <h3>{user.fistName} {user.lastName}</h3>
                <p>@{user.userName}</p>
            </div>
        </div>
        <div className="profile-menu">
            <button 
                className={activeTab === 'info' ? 'active' : ''} 
                onClick={() => setActiveTab('info')}
            >
                <i className="far fa-user"></i> Thông tin cá nhân
            </button>
            <button 
                className={activeTab === 'orders' ? 'active' : ''} 
                onClick={() => setActiveTab('orders')}
            >
                <i className="fas fa-shopping-bag"></i> Lịch sử đơn hàng
            </button>
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="profile-content">
        
        {/* TAB 1: THÔNG TIN CÁ NHÂN */}
        {activeTab === 'info' && (
            <div className="info-tab">
                <h2 className="tab-title">Hồ Sơ Của Tôi</h2>
                <div className="info-card">
                    <div className="info-row">
                        <label>Họ và tên:</label>
                        <span>{user.fistName} {user.lastName}</span>
                    </div>
                    <div className="info-row">
                        <label>Email:</label>
                        <span>{user.email}</span>
                    </div>
                    <div className="info-row">
                        <label>Số điện thoại:</label>
                        <span>{user.phone || "Chưa cập nhật"}</span>
                    </div>
                    {/* Đã ẩn ID thành viên theo yêu cầu */}
                </div>
                <div className="action-buttons">
                    <button className="btn-primary" onClick={handleOpenEdit}>Cập nhật thông tin</button>
                    <button className="btn-secondary" onClick={() => setShowPassModal(true)}>Đổi mật khẩu</button>
                </div>
            </div>
        )}

        {/* TAB 2: LỊCH SỬ ĐƠN HÀNG */}
        {activeTab === 'orders' && (
            <div className="orders-tab">
                <h2 className="tab-title">Đơn Hàng Của Tôi</h2>
                
                {/* 🟢 KHU VỰC LỌC ĐƠN HÀNG */}
                <div className="order-filters">
                    {filterTabs.map(tab => (
                        <button 
                            key={tab.key}
                            className={`filter-btn ${filterStatus === tab.key ? 'active' : ''}`}
                            onClick={() => setFilterStatus(tab.key)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {loadingOrders ? (
                    <p>Đang tải đơn hàng...</p>
                ) : filteredOrders.length === 0 ? (
                    <div className="empty-orders">
                        <p>Không có đơn hàng nào ({filterTabs.find(t => t.key === filterStatus)?.label})</p>
                    </div>
                ) : (
                    <div className="order-list">
                        {filteredOrders.map(order => (
                            <div key={order.id} className="order-card">
                                <div className="order-header">
                                    <div className="order-id">Đơn hàng #{order.id}</div>
                                    <div className="order-date">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</div>
                                    <div className="order-status">{getStatusBadge(order.status)}</div>
                                </div>
                                
                                <div className="order-body">
                                    {/* Hiển thị tóm tắt các món hàng */}
                                    {order.items && order.items.map((item, idx) => (
                                        <div key={idx} className="order-item-row">
                                            <span>{item.productName} (x{item.quantity})</span>
                                            {/* <span>{formatCurrency(item.unitPrice)}</span> */}
                                        </div>
                                    ))}
                                    {!order.items && <p style={{fontStyle:'italic', color:'#888'}}>Chi tiết đang cập nhật...</p>}
                                </div>

                                <div className="order-footer">
                                    <div className="order-total">
                                        Tổng tiền: <strong>{formatCurrency(order.totalAmount)}</strong>
                                    </div>
                                    
                                    {/* Chỉ cho phép hủy khi đang PENDING */}
                                    {order.status === 'PENDING' && (
                                        <button 
                                            className="btn-cancel-order"
                                            onClick={() => handleCancelOrder(order.id)}
                                        >
                                            Hủy Đơn
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

      </div>

      {/* --- MODAL CHỈNH SỬA THÔNG TIN --- */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Cập nhật thông tin</h3>
            <form onSubmit={handleUpdateInfo}>
              <div className="form-group">
                <label>Họ (First Name)</label>
                <input required value={editForm.firstName} onChange={e => setEditForm({...editForm, firstName: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Tên (Last Name)</label>
                <input required value={editForm.lastName} onChange={e => setEditForm({...editForm, lastName: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" required value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Số điện thoại</label>
                <input value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowEditModal(false)}>Hủy</button>
                <button type="submit" className="btn-save">Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL ĐỔI MẬT KHẨU --- */}
      {showPassModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Đổi mật khẩu</h3>
            <form onSubmit={handleChangePassword}>
              <div className="form-group">
                <label>Mật khẩu cũ</label>
                <input type="password" required value={passForm.oldPassword} onChange={e => setPassForm({...passForm, oldPassword: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Mật khẩu mới</label>
                <input type="password" required value={passForm.password} onChange={e => setPassForm({...passForm, password: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Xác nhận mật khẩu mới</label>
                <input type="password" required value={passForm.confirmPassword} onChange={e => setPassForm({...passForm, confirmPassword: e.target.value})} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowPassModal(false)}>Hủy</button>
                <button type="submit" className="btn-save">Xác nhận</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;