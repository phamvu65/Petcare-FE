import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axiosInstance";
import "./Login.css"; 

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await api.post("/auth/forgot-password", { email });
      
      if (res.status === 200) {
        setMessage({ type: "success", text: "Link đặt lại mật khẩu đã được gửi vào email của bạn!" });
      }
    } catch (error: any) {
      console.error(error);
      const errorMsg = error.response?.data?.message || "Email không tồn tại hoặc có lỗi xảy ra.";
      setMessage({ type: "error", text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    // Overlay: Căn giữa
    <div className="login-overlay" style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f2f5' }}>
      
      {/* Panel: Căn chỉnh kích thước box */}
      <div className="login-panel" style={{ width: '400px', height: 'auto', borderRadius: '8px', animation: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        
        <h2 style={{ textAlign: 'center', color: '#333' }}>Quên Mật Khẩu</h2>
        
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px', textAlign: 'center' }}>
          Nhập email đăng ký của bạn, chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu.
        </p>

        {/* Thông báo */}
        {message && (
          <div className={`login-message ${message.type}`} style={{ textAlign: 'center', padding: '10px', backgroundColor: message.type === 'success' ? '#dcfce7' : '#fee2e2', borderRadius: '6px' }}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <label>
            Email *
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="vidu@gmail.com"
            />
          </label>

          <button 
            type="submit" 
            className="login-submit" 
            disabled={loading}
            style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? "Đang gửi..." : "Gửi yêu cầu"}
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

export default ForgotPassword;