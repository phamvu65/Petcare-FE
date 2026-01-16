import React, { useState, useEffect } from "react"; // 1. Thêm import useState, useEffect
import { Outlet, NavLink, Link } from "react-router-dom";
import "./Staff.css";

const Staff: React.FC = () => {
  // 2. Tạo state để lưu tên nhân viên
  const [staffName, setStaffName] = useState("Nhân viên");

  // 3. Dùng useEffect để lấy tên từ localStorage khi component vừa chạy
  useEffect(() => {
    // Giả sử lúc Login bạn lưu dạng: localStorage.setItem("user", JSON.stringify(userData));
    // Bạn hãy kiểm tra lại code Login xem bạn lưu key tên là gì (ví dụ: "user", "account", "userInfo"...)
    const storedUser = localStorage.getItem("user"); 

    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        // Ưu tiên lấy fullName, nếu không có thì lấy username, không có nữa thì để mặc định
        const name = userData.fullName || userData.username || userData.name || "Nhân viên";
        setStaffName(name);
      } catch (error) {
        console.error("Lỗi khi đọc thông tin nhân viên:", error);
      }
    }
  }, []);

  return (
    <div className="staff-container">
      {/* --- SIDEBAR --- */}
      <aside className="staff-sidebar">
        <div className="sidebar-header">
          <h2 className="sidebar-title">PetCare</h2>
          <span className="sidebar-subtitle">Kênh Nhân Viên</span>
        </div>

        <nav className="staff-nav">
          <NavLink 
            to="/staff/orders" 
            className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
          >
            <span className="nav-icon">📦</span> Quản lý Đơn hàng
          </NavLink>

          <NavLink 
            to="/staff/calendar" 
            className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
          >
            <span className="nav-icon">📅</span> Lịch hẹn
          </NavLink>

          <NavLink 
            to="/staff/customers" 
            className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
          >
            <span className="nav-icon">👥</span> Khách hàng
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          {/* Khi đăng xuất nhớ clear localStorage */}
          <Link 
            to="/" 
            className="logout-link"
            onClick={() => {
                localStorage.removeItem("user"); // Xóa thông tin khi đăng xuất
                localStorage.removeItem("token");
            }}
          >
            ⬅ Đăng xuất
          </Link>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="staff-main">
        <header className="staff-header">
          <h3>Bảng làm việc</h3>
          <div className="staff-user-info">
             {/* 4. Hiển thị biến staffName tại đây */}
             Xin chào, <strong>{staffName}</strong>
          </div>
        </header>
        
        <div className="staff-content-area">
          <Outlet /> 
        </div>
      </main>
    </div>
  );
};

export default Staff;