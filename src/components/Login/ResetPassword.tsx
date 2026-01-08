import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../api/axiosInstance";
import "./Login.css"; 

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Lấy token từ URL
  const token = searchParams.get("token");

  // State
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Kiểm tra token khi vừa vào trang
  useEffect(() => {
    if (!token) {
      setMessage({ type: "error", text: "Đường dẫn không hợp lệ hoặc thiếu Token xác thực." });
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate client
    if (!token) {
      setMessage({ type: "error", text: "Token không hợp lệ." });
      return;
    }
    if (password.length < 6) {
      setMessage({ type: "error", text: "Mật khẩu phải có ít nhất 6 ký tự." });
      return;
    }
    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "Mật khẩu xác nhận không khớp!" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // Gọi API Backend
      const res = await api.post("/auth/reset-password", {
        token: token,
        newPassword: password
      });

      if (res.status === 200) {
        setMessage({ type: "success", text: "Đổi mật khẩu thành công! Đang chuyển hướng..." });
        
        // Đợi 2 giây rồi chuyển về trang chủ
        setTimeout(() => {
          navigate("/"); 
        }, 2000);
      }
    } catch (error: any) {
      console.error(error);
      const errorMsg = error.response?.data?.message || "Đường dẫn đã hết hạn hoặc có lỗi xảy ra.";
      setMessage({ type: "error", text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    // Overlay: Dùng inline style để ghi đè Login.css (căn giữa thay vì lệch phải)
    <div className="login-overlay" style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f2f5' }}>
      
      {/* Panel: Ghi đè chiều rộng và bỏ animation slideIn */}
      <div className="login-panel" style={{ width: '400px', height: 'auto', borderRadius: '8px', animation: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        
        <h2 style={{ textAlign: 'center', color: '#333' }}>Đặt Lại Mật Khẩu</h2>
        
        {/* Thông báo */}
        {message && (
          <div className={`login-message ${message.type}`} style={{ textAlign: 'center', padding: '10px', backgroundColor: message.type === 'success' ? '#dcfce7' : '#fee2e2', borderRadius: '6px' }}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <label>
            Mật khẩu mới *
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Nhập mật khẩu mới"
            />
          </label>

          <label>
            Xác nhận mật khẩu *
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Nhập lại mật khẩu mới"
            />
          </label>

          <button 
            type="submit" 
            className="login-submit" 
            disabled={loading || !token}
            style={{ opacity: (loading || !token) ? 0.7 : 1, cursor: (loading || !token) ? 'not-allowed' : 'pointer' }}
          >
            {loading ? "Đang xử lý..." : "Đổi mật khẩu"}
          </button>
        </form>

        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <span 
            onClick={() => navigate("/")}
            style={{ color: "#204ecf", cursor: "pointer", fontSize: "14px", fontWeight: 500 }}
          >
            ← Quay lại trang chủ
          </span>
        </div>

      </div>
    </div>
  );
};

export default ResetPassword;