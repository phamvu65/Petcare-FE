import React, { useEffect, useState } from "react";
import api from "../../api/axiosInstance";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./Customer.css";
import ReviewSection from "../../components/ReviewSection/ReviewSection"; 

const PAGE_SIZE = 30;

interface Category {
  id: number;
  name: string;
}

interface ProductImage {
  id: number;
  imageUrl: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  description?: string;
  categoryId?: number;
  categoryName?: string;
  stock?: number;
  images?: ProductImage[];
}

const Customer: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [sort, setSort] = useState<string>("id:desc");
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [calculatedRating, setCalculatedRating] = useState({ avg: 0, count: 0 }); 

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // --- 1. XỬ LÝ URL ---
  useEffect(() => {
    const urlCatId = searchParams.get("categoryId");
    if (urlCatId) setSelectedCategories([Number(urlCatId)]);
    else setSelectedCategories([]);
  }, [searchParams]);

  // --- 2. LOAD DANH MỤC ---
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get("/categories/list");
        if (res.data?.data?.categories) setCategories(res.data.data.categories);
      } catch (err) { console.error("Lỗi categories:", err); }
    };
    fetchCategories();
  }, []);

  // --- 3. LOAD SẢN PHẨM ---
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const searchKeyword = searchParams.get("search") || "";
      const typeParam = searchParams.get("type");
      let typeKeyword = "";
      if (typeParam === 'food') typeKeyword = "thức ăn";
      else if (typeParam === 'clothes') typeKeyword = "áo";
      else if (typeParam === 'toys') typeKeyword = "đồ chơi";

      const finalKeyword = searchKeyword || typeKeyword;

      const params: any = {
        page: page > 0 ? page - 1 : 0,
        size: PAGE_SIZE,
        sort: sort,
        isDeleted: false,
      };
      if (finalKeyword) params.keyword = finalKeyword;
      if (selectedCategories.length > 0) params.categoryId = selectedCategories.join(",");

      const res = await api.get("/products/list", { params });
      
      if (res.data?.data) {
        const data = res.data.data;
        setProducts(data.products || data.content || []);
        setTotalPages(data.totalPages || 1);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error("Lỗi load products", err);
      setProducts([]); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, sort, selectedCategories, searchParams]);

  const handleCategoryChange = (id: number) => {
    setSelectedCategories((prev) => prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id]);
    setPage(1); 
  };
  const handleFilter = () => { setPage(1); fetchProducts(); };
  
  const handleAddToCart = async (product: Product) => {
    const token = localStorage.getItem("accessToken");
    if (!token) { alert("Vui lòng đăng nhập để mua hàng!"); return; }
    try {
      await api.post("/cart/add", { productId: product.id, quantity: 1 });
      alert(`Đã thêm "${product.name}" vào giỏ hàng!`);
      window.dispatchEvent(new Event("cartChange"));
    } catch (error: any) { alert(error.response?.data?.message || "Thêm vào giỏ thất bại."); }
  };

  const handleBuyNow = (product: Product) => {
    const token = localStorage.getItem("accessToken");
    if (!token) { alert("Vui lòng đăng nhập để mua hàng!"); return; }
    navigate("/checkout", { state: { items: [{ ...product, productId: product.id, quantity: 1, type: 'product' }] } });
  };

  const openProductDetail = (product: Product) => {
      setSelectedProduct(product);
      setCalculatedRating({ avg: 0, count: 0 }); 
  };
  const closeProductDetail = () => setSelectedProduct(null);
  const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  const renderStars = (avg: number) => {
      const rounded = Math.round(avg);
      return (
          <div style={{color: '#fbbf24', fontSize: '1.2rem', margin: '10px 0', textShadow: '0 0 2px rgba(251, 191, 36, 0.5)'}}>
              {[1,2,3,4,5].map(s => (
                  <span key={s}>{s <= rounded ? '★' : '☆'}</span>
              ))}
              <span style={{color: '#6b7280', fontSize: '0.9rem', marginLeft: 8, fontWeight: 500}}>
                  ({calculatedRating.count} đánh giá)
              </span>
          </div>
      );
  };

  return (
    <div className="customer-page-wrapper">
      <div className="customer-container">
        {/* SIDEBAR */}
        <aside className="customer-sidebar glass-panel">
            <h3 className="sidebar-title">Danh Mục</h3>
            <ul className="category-list">
            {categories.map((cat) => (
                <li key={cat.id} className="category-item">
                <label className="custom-checkbox">
                    <input type="checkbox" checked={selectedCategories.includes(cat.id)} onChange={() => handleCategoryChange(cat.id)}/>
                    <span className="checkmark"></span>
                    <span className="cat-name">{cat.name}</span>
                </label>
                </li>
            ))}
            </ul>
            <button className="btn-modern primary full-width" onClick={handleFilter}>Áp Dụng Lọc</button>
        </aside>

        {/* MAIN CONTENT */}
        <main className="customer-content">
            <div className="customer-content-header glass-panel">
                <h2 className="page-title">{searchParams.get("search") ? `Kết quả: "${searchParams.get("search")}"` : "Tất cả sản phẩm"}</h2>
                <div className="content-controls">
                    <select className="neo-select" value={sort} onChange={(e) => setSort(e.target.value)}>
                    <option value="id:desc">Mới nhất</option>
                    <option value="price:asc">Giá tăng dần</option>
                    <option value="price:desc">Giá giảm dần</option>
                    </select>
                </div>
            </div>

            {loading ? (
            <div className="loading-state">
                <div className="spinner"></div>
                <p>Đang tải sản phẩm...</p>
            </div>
            ) : products.length === 0 ? (
            <div className="empty-state-glass">
                <p>Không tìm thấy sản phẩm nào phù hợp.</p>
                <button className="btn-modern secondary" onClick={() => { setPage(1); setSelectedCategories([]); navigate("/customer"); }}>Xem tất cả</button>
            </div>
            ) : (
            <div className="product-grid">
                {products.map((p) => {
                const firstImageUrl = p.images && p.images.length > 0 ? p.images[0].imageUrl : undefined;
                return (
                    <div className="product-card glass-card" key={p.id}>
                        {/* 1. ẢNH SẢN PHẨM (Không còn nút đè lên) */}
                        <div className="product-image-wrap">
                            <div className="img-clickable" onClick={() => openProductDetail(p)}>
                                {firstImageUrl ? <img src={firstImageUrl} alt={p.name} /> : <div className="product-image-placeholder">No Image</div>}
                            </div>
                        </div>

                        {/* 2. THÔNG TIN SẢN PHẨM */}
                        <div className="product-info">
                            <div className="product-brand">{p.categoryName || "PetCare"}</div>
                            <div className="product-name" title={p.name} onClick={() => openProductDetail(p)}>{p.name}</div>
                            <div className="product-price-wrap">
                                <span className="product-price">{formatCurrency(p.price)}</span>
                            </div>
                        </div>

                        {/* 3. FOOTER MỚI: 3 NÚT TRÒN NẰM Ở ĐÂY */}
                        <div className="product-card-bottom-actions">
                            <button className="action-btn-icon" data-tooltip="Mua ngay" onClick={() => handleBuyNow(p)}>
                                <i className="fas fa-credit-card"></i>
                            </button>
                            <button className="action-btn-icon" data-tooltip="Thêm vào giỏ" onClick={() => handleAddToCart(p)}>
                                <i className="fas fa-cart-plus"></i>
                            </button>
                            <button className="action-btn-icon" data-tooltip="Xem chi tiết" onClick={() => openProductDetail(p)}>
                                <i className="fas fa-eye"></i>
                            </button>
                        </div>
                    </div>
                );
                })}
            </div>
            )}

            {/* Pagination */}
            {products.length > 0 && (
                <div className="pagination-glass">
                <button disabled={page <= 1} onClick={() => setPage(page - 1)} className={`page-btn ${page <= 1 ? "disabled" : ""}`}>&laquo; Trước</button>
                <span className="page-info">Trang {page} / {totalPages}</span>
                <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className={`page-btn ${page >= totalPages ? "disabled" : ""}`}>Sau &raquo;</button>
                </div>
            )}
        </main>
      </div>

      {/* MODAL CHI TIẾT */}
      {selectedProduct && (
        <div className="modal-overlay" onClick={closeProductDetail}>
          <div className="modal-content glass-modal product-detail-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn-abs" onClick={closeProductDetail}>×</button>
            <div className="detail-layout">
                <div className="detail-left">
                    <div className="detail-img-wrapper">
                        <img src={selectedProduct.images?.[0]?.imageUrl || "https://placehold.co/300"} alt={selectedProduct.name} className="detail-img"/>
                    </div>
                </div>
                <div className="detail-right">
                    <span className="detail-category">{selectedProduct.categoryName || "Sản phẩm"}</span>
                    <h2 className="detail-title">{selectedProduct.name}</h2>
                    {renderStars(calculatedRating.avg)}
                    <p className="detail-price">{formatCurrency(selectedProduct.price)}</p>
                    <div className="detail-desc-box">
                        <p>{selectedProduct.description || "Chưa có mô tả chi tiết cho sản phẩm này."}</p>
                    </div>
                    <div className="detail-actions">
                        <button className="btn-modern primary" onClick={() => { handleBuyNow(selectedProduct); closeProductDetail(); }}>
                            <i className="fas fa-credit-card"></i> Mua Ngay
                        </button>
                        <button className="btn-modern secondary" onClick={() => handleAddToCart(selectedProduct)}>
                            <i className="fas fa-cart-plus"></i> Thêm Giỏ Hàng
                        </button>
                    </div>
                </div>
            </div>
            <div className="detail-reviews-section">
                <h3 className="review-heading">Đánh giá & Nhận xét</h3>
                <ReviewSection 
                    productId={selectedProduct.id} 
                    onStatsUpdate={(avg, count) => setCalculatedRating({ avg, count })}
                />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customer;