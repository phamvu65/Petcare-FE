import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../api/axiosInstance";
import "./Header.css";
import Login from "../Login/Login";
import logo from "../../img/Anh web.png";
interface Category {
  id: number;
  name: string;
}

const Header: React.FC = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [currentUserName, setCurrentUserName] = useState<string | null>(localStorage.getItem("username"));
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  
  const [categories, setCategories] = useState<Category[]>([]);
  
  // 🟢 State lưu số lượng giỏ hàng
  const [cartCount, setCartCount] = useState(0);

  const navigate = useNavigate();

  // Load danh mục
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get("/categories/list");
        setCategories(res.data.data.categories || []);
      } catch (err) {
        console.error("Lỗi load menu category", err);
      }
    };
    fetchCategories();
  }, []);

  // 🟢 HÀM LẤY SỐ LƯỢNG GIỎ HÀNG TỪ API
  const fetchCartCount = async () => {
    // Nếu chưa đăng nhập thì không gọi API
    if (!localStorage.getItem("accessToken")) {
        setCartCount(0);
        return;
    }

    try {
      const res = await api.get("/cart");
      // Cộng tổng số lượng (quantity) của các item
      if (res.data.data && Array.isArray(res.data.data.items)) {
        const total = res.data.data.items.reduce((acc: number, item: any) => acc + item.quantity, 0);
        setCartCount(total);
      } else {
        setCartCount(0);
      }
    } catch (error) {
      console.error("Lỗi lấy số lượng giỏ hàng", error);
    }
  };

  // 🟢 Gọi khi load trang, khi login xong, hoặc khi có sự kiện 'cartChange'
  useEffect(() => {
    fetchCartCount();

    // Lắng nghe sự kiện custom "cartChange" để cập nhật realtime
    const handleCartChange = () => fetchCartCount();
    window.addEventListener("cartChange", handleCartChange);

    return () => {
        window.removeEventListener("cartChange", handleCartChange);
    };
  }, [currentUserName]); // Chạy lại khi user thay đổi (login/logout)

  const handleUserButtonClick = () => {
    if (!currentUserName) {
      setShowLogin(true);
    } else {
      setUserMenuOpen((prev) => !prev);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setCurrentUserName(null);
    setUserMenuOpen(false);
    setCartCount(0); // Reset số lượng về 0
    navigate("/");
  };

  const handleSearch = () => {
    if (keyword.trim()) {
      navigate(`/customer?search=${encodeURIComponent(keyword)}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // 🟢 LOGIC MỚI: Chuyển đến trang Giỏ Hàng (/cart)
  const handleGoToCart = () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
        alert("Vui lòng đăng nhập để xem giỏ hàng!");
        setShowLogin(true);
        return;
    }
    navigate("/cart"); // Chuyển sang trang Cart
  };

  return (
    <>
      <header className="header">
        <div className="header-top">
          <div className="container header-top-inner">
            <Link to="/" className="logo">
              <img src={logo} alt="PetCare" />
            </Link>

            <div className="search-box">
              <input 
                type="text" 
                placeholder="Tìm thú cưng, đồ ăn, phụ kiện..." 
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button className="search-btn" onClick={handleSearch}>
                <i className="fas fa-search" />
              </button>
            </div>

            <div className="header-right">
              <div className="hotline">
                <span className="hotline-title">Hotline </span>
                <span className="hotline-number">0832234628</span>
              </div>

              <div className="header-icons">
                <div className="user-menu-wrapper">
                  <button className="icon-item login-btn" onClick={handleUserButtonClick}>
                    <i className="far fa-user" />
                    <span>{currentUserName || "Đăng Nhập"}</span>
                  </button>

                  {currentUserName && userMenuOpen && (
                    <div className="user-dropdown">
                      <button onClick={() => { navigate("/profile"); setUserMenuOpen(false); }}>
                        <i className="fas fa-id-card"></i> Hồ sơ cá nhân
                      </button>
                      <button onClick={() => { navigate("/my-pets"); setUserMenuOpen(false); }}>
                        <i className="fas fa-paw"></i> Thú cưng của tôi
                      </button>
                      <button onClick={handleLogout} className="logout-btn">
                        <i className="fas fa-sign-out-alt"></i> Đăng xuất
                      </button>
                    </div>
                  )}
                </div>

                <div className="icon-item cart" onClick={handleGoToCart}>
                  <i className="fas fa-shopping-cart" />
                  <span>Giỏ Hàng</span>
                  {/* 🟢 Hiển thị biến cartCount thay vì số 0 cứng */}
                  <div className="cart-badge">{cartCount}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <nav className="header-nav">
          <div className="container">
            <ul className="nav-menu">
              <li><Link to="/">Trang Chủ</Link></li>
              <li className="has-sub-menu">
                <Link to="/customer">Sản phẩm <i className="fas fa-chevron-down"></i></Link>
                <ul className="sub-menu">
                  {categories.map((cat) => (
                    <li key={cat.id}>
                      <Link to={`/customer?categoryId=${cat.id}`}>{cat.name}</Link>
                    </li>
                  ))}
                </ul>
              </li>
              <li><Link to="/customer?type=food">Thức ăn</Link></li>
              <li><Link to="/customer?type=clothes">Quần áo</Link></li>
              <li><Link to="/customer?type=toys">Đồ chơi</Link></li>
              <li><Link to="/booking">Đặt lịch Spa</Link></li>
              <li className="promo-item">
                <Link to="/promotions">
                  <i className="fas fa-gift"></i> Khuyến Mãi
                </Link>
              </li>
            </ul>
          </div>
        </nav>
      </header>

      {showLogin && (
        <Login
          onClose={() => setShowLogin(false)}
          onLoginSuccess={(name, role) => {
            setCurrentUserName(name);
            localStorage.setItem("role", role);
            setShowLogin(false);
          }}
        />
      )}
    </>
  );
};

export default Header;