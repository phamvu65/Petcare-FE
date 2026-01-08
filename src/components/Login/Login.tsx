import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axiosInstance";
import "./Login.css";

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  userId: number;
  username: string;
  email: string;
}

interface LoginProps {
  onClose: () => void;
  onLoginSuccess: (username: string, role: string) => void;
}

// decode JWT (base64url safe)
function decodeJWT(token: string): any | null {
  try {
    const payload = token.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const json = atob(padded);
    return JSON.parse(json);
  } catch (e) {
    console.error("Cannot decode JWT:", e);
    return null;
  }
}

const Login: React.FC<LoginProps> = ({ onClose, onLoginSuccess }) => {
  // Đổi tên state thành loginInput cho đúng bản chất (có thể là user hoặc email)
  const [loginInput, setLoginInput] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");

  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      // Backend vẫn nhận key là "username", nhưng giá trị ta truyền vào có thể là email
      const res = await api.post<TokenResponse>("/auth/access-token", {
        username: loginInput, 
        password,
      });

      console.log("LOGIN RESPONSE >>>", res.data);

      const { accessToken, refreshToken, userId, username: u, email } = res.data;

      // lưu token + info cơ bản
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("userId", String(userId));
      localStorage.setItem("username", u);
      localStorage.setItem("email", email);

      // ===== GIẢI MÃ TOKEN LẤY ROLE =====
      const decoded = decodeJWT(accessToken);
      let roleFromToken = "";

      if (decoded) {
        if (Array.isArray(decoded.role) && decoded.role.length > 0) {
          const first = decoded.role[0];
          if (typeof first === "string") {
            roleFromToken = first.toUpperCase();
          } else if (first && typeof first.authority === "string") {
            roleFromToken = first.authority.toUpperCase();
          }
        } else if (
          Array.isArray(decoded.authorities) &&
          decoded.authorities.length > 0
        ) {
          const first = decoded.authorities[0];
          if (typeof first === "string") {
            roleFromToken = first.toUpperCase();
          } else if (first && typeof first.authority === "string") {
            roleFromToken = first.authority.toUpperCase();
          }
        }
      }

      setMessage("Đăng nhập thành công");
      onLoginSuccess(u, roleFromToken);

      // điều hướng theo role
      if (roleFromToken.includes("ADMIN")) {
        navigate("/admin");
      } else if (roleFromToken.includes("STAFF")) {
        navigate("/staff");
      } else {
        navigate("/customer");
      }
    } catch (err: any) {
      console.error(err);
      setMessage("Sai thông tin đăng nhập hoặc mật khẩu");
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = () => {
    onClose();
  };

  const handlePanelClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };

  return (
    <div className="login-overlay" onClick={handleOverlayClick}>
      <div className="login-panel" onClick={handlePanelClick}>
        <button className="login-close" onClick={onClose}>
          ✕
        </button>

        <h2>Đăng Nhập</h2>

        <form onSubmit={handleLogin} className="login-form">
          <label>
            {/* 🟢 Cập nhật Label */}
            Tên đăng nhập hoặc Email *
            <input
              type="text"
              value={loginInput}
              onChange={(e) => setLoginInput(e.target.value)}
              placeholder="Nhập username hoặc email..."
              required
            />
          </label>

          <label>
            Mật khẩu *
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
              required
            />
          </label>

          <div className="forgot-password-link">
            <span
              onClick={() => {
                onClose();
                navigate("/forgot-password");
              }}
            >
              Quên mật khẩu?
            </span>
          </div>

          {message && <p className="login-message">{message}</p>}

          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? "Đang đăng nhập..." : "Đăng Nhập"}
          </button>

          <button
            type="button"
            className="login-register"
            onClick={() => {
              onClose();
              navigate("/register");
            }}
          >
            Tạo Tài Khoản
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;