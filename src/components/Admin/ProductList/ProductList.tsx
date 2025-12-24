import React, { useEffect, useState } from "react";
import api from "../../../api/axiosInstance";
import "./ProductList.css";
// Lưu ý: Sửa đường dẫn import này cho đúng với cấu trúc thư mục thực tế của bạn
// Nếu file CategoryList.tsx nằm trong thư mục con "CategoryList":
import CategoryList from "./CategoryList/CategoryList"; 

// --- INTERFACES ---
interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  description: string;
  categoryName: string;
  images: { id: number; imageUrl: string }[];
}

interface Category {
  id: number;
  name: string;
}

interface ProductFormData {
  name: string;
  price: number;
  stock: number;
  description: string;
  categoryId: number;
  thumbnail: string;
}

const ProductList: React.FC = () => {
  // --- STATE TAB QUẢN LÝ ---
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');

  // --- STATE PRODUCT ---
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  
  // State chế độ xem (false = Đang bán, true = Thùng rác)
  const [viewDeleted, setViewDeleted] = useState<boolean>(false); 

  // State Lọc theo Category ID (0 = Tất cả)
  const [filterCategoryId, setFilterCategoryId] = useState<number>(0);

  // Pagination
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Modal & Form
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [currentId, setCurrentId] = useState<number | null>(null);

  const [formData, setFormData] = useState<ProductFormData>({
    name: "", price: 0, stock: 0, description: "", categoryId: 0, thumbnail: ""
  });

  // --- EFFECTS ---

  // 1. Load danh mục (để dùng cho Dropdown lọc và Dropdown trong Modal)
  useEffect(() => {
    fetchCategories(); 
  }, []);

  // 2. Khi đổi Tab, Chế độ xem, hoặc Filter Category -> Reset về trang 1
  useEffect(() => {
    if (activeTab === 'products') {
        setPage(1);
        fetchProducts(1);
    }
  }, [viewDeleted, activeTab, filterCategoryId]);

  // 3. Khi đổi trang (Page) -> Gọi API trang đó
  useEffect(() => {
    if (activeTab === 'products') {
        fetchProducts(page);
    }
  }, [page]); 

  // --- API CALLS ---
  const fetchProducts = async (pageNumber: number) => {
    setLoading(true);
    try {
      const res = await api.get("/products/list", {
        params: { 
            page: pageNumber, 
            size: 10, 
            sort: "id:desc",
            isDeleted: viewDeleted,
            // Gửi param categoryId lên BE (nếu > 0)
            categoryId: filterCategoryId > 0 ? filterCategoryId : undefined 
        }
      });
      if (res.data && res.data.status === 200 && res.data.data) {
        setProducts(res.data.data.products || []);
        setTotalPages(res.data.data.totalPages || 1);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error("Lỗi tải sản phẩm:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get("/categories/list", {
        params: { sort: "id:asc", page: 1, size: 100 }, 
      });
      if (res.data && res.data.status === 200 && res.data.data) {
        // Kiểm tra key trả về là categories hay content tùy vào BE của bạn
        setCategories(res.data.data.categories || res.data.data.content || []); 
      }
    } catch (error) {
      console.error("Lỗi tải danh mục:", error);
      setCategories([]);
    }
  };

  // --- HANDLERS ---
  const handleAddNew = () => {
    setIsEditMode(false);
    setFormData({ name: "", price: 0, stock: 0, description: "", categoryId: 0, thumbnail: "" });
    setShowModal(true);
  };

  const handleEdit = (product: Product) => {
    setIsEditMode(true);
    setCurrentId(product.id);
    
    // Logic map category name sang id (nếu BE trả về name)
    const cat = categories.find(c => c.name === product.categoryName);
    const catId = cat ? cat.id : 0;
    const imgUrl = (product.images && product.images.length > 0) ? product.images[0].imageUrl : "";

    setFormData({
      name: product.name,
      price: product.price,
      stock: product.stock,
      description: product.description || "",
      categoryId: catId,
      thumbnail: imgUrl
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Chuyển vào thùng rác?")) return;
    try {
      await api.delete(`/products/del/${id}`);
      alert("Đã chuyển vào thùng rác!");
      fetchProducts(page);
    } catch (error: any) {
      alert("Lỗi: " + (error.response?.data?.message || "Server error"));
    }
  };

  const handleRestore = async (id: number) => {
    if (!window.confirm("Khôi phục sản phẩm này?")) return;
    try {
      await api.put(`/products/restore/${id}`);
      alert("Khôi phục thành công!");
      fetchProducts(page);
    } catch (error: any) {
      alert("Lỗi: " + error.response?.data?.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || formData.price <= 0 || formData.categoryId === 0) {
      alert("Vui lòng nhập đủ thông tin (Tên, Giá > 0, Danh mục)!");
      return;
    }

    try {
      const payload = {
        name: formData.name,
        price: formData.price,
        stock: formData.stock,
        description: formData.description,
        categoryId: formData.categoryId,
        imageUrls: formData.thumbnail ? [formData.thumbnail] : [] 
      };

      if (isEditMode && currentId) {
        await api.put(`/products/upd/${currentId}`, payload);
        alert("Cập nhật thành công!");
      } else {
        await api.post("/products/add", payload);
        alert("Thêm mới thành công!");
      }

      setShowModal(false);
      fetchProducts(page);
    } catch (error: any) {
        const msg = error.response?.data?.message || "Có lỗi xảy ra";
        alert(msg.includes("Data too long") ? "Link ảnh quá dài!" : msg);
    }
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  // --- RENDER ---
  return (
    <div className="product-list-container">
        {/* TABS HEADER */}
        <div className="main-tabs" style={{ marginBottom: '20px', borderBottom: '2px solid #e5e7eb', paddingBottom: '15px' }}>
            <button 
                onClick={() => setActiveTab('products')}
                style={{
                    padding: '10px 24px', marginRight: '15px', border: 'none',
                    background: activeTab === 'products' ? '#4f46e5' : '#f3f4f6',
                    color: activeTab === 'products' ? 'white' : '#374151',
                    borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer'
                }}
            >
                🛍️ Quản lý Sản phẩm
            </button>
            <button 
                onClick={() => setActiveTab('categories')}
                style={{
                    padding: '10px 24px', border: 'none',
                    background: activeTab === 'categories' ? '#4f46e5' : '#f3f4f6',
                    color: activeTab === 'categories' ? 'white' : '#374151',
                    borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer'
                }}
            >
                📂 Quản lý Danh mục
            </button>
        </div>

        {/* LOGIC HIỂN THỊ */}
        {activeTab === 'categories' ? (
            // === TAB DANH MỤC ===
            <CategoryList />
        ) : (
            // === TAB SẢN PHẨM ===
            <>
                <div className="page-header">
                    <h2 className="page-title">Sản phẩm</h2>
                    
                    {/* 🟢 GOM NHÓM BUTTON VÀO ĐÂY ĐỂ THẲNG HÀNG */}
                    <div className="header-actions">
                        
                        {/* 1. Dropdown Lọc */}
                        <select 
                            className="category-filter"
                            value={filterCategoryId}
                            onChange={(e) => setFilterCategoryId(Number(e.target.value))}
                        >
                            <option value={0}>-- Tất cả danh mục --</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>

                        {/* 2. Nút Chế độ xem */}
                        <button 
                            className={`view-mode-btn ${!viewDeleted ? 'active-mode' : ''}`}
                            onClick={() => setViewDeleted(false)}
                        >
                            📦 Đang bán
                        </button>
                        <button 
                            className={`view-mode-btn ${viewDeleted ? 'active-mode' : ''}`}
                            onClick={() => setViewDeleted(true)}
                        >
                            🗑️ Thùng rác
                        </button>

                        {/* 3. Nút Thêm mới (Ẩn khi ở thùng rác) */}
                        {!viewDeleted && (
                            <button className="btn-add" onClick={handleAddNew}>
                                + Thêm mới
                            </button>
                        )}
                    </div>
                </div>

                {/* TABLE */}
                <div className="table-wrapper">
                    <table className="product-table">
                    <thead>
                        <tr>
                        <th>ID</th>
                        <th>Ảnh</th>
                        <th>Tên sản phẩm</th>
                        <th>Danh mục</th>
                        <th>Giá bán</th>
                        <th>Kho</th>
                        <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                             <tr><td colSpan={7} className="no-data">Đang tải dữ liệu...</td></tr>
                        ) : (
                            Array.isArray(products) && products.length > 0 ? (
                            products.map((p) => (
                                <tr key={p.id}>
                                <td>#{p.id}</td>
                                <td>
                                    <img 
                                    src={(p.images?.[0]?.imageUrl) || "https://placehold.co/50x50?text=No+Img"} 
                                    alt="" className="product-thumb"
                                    onError={(e) => (e.target as HTMLImageElement).src = "https://placehold.co/50x50?text=Error"}
                                    />
                                </td>
                                <td className="product-name-cell"><strong>{p.name}</strong></td>
                                <td>{p.categoryName || "---"}</td>
                                <td className="text-price">{formatCurrency(p.price)}</td>
                                <td><span className={`stock-badge ${p.stock > 0 ? 'in-stock' : 'out-stock'}`}>{p.stock}</span></td>
                                <td>
                                    <div className="action-buttons">
                                    {!viewDeleted ? (
                                        <>
                                            <button className="btn-edit" onClick={() => handleEdit(p)}>Sửa</button>
                                            <button className="btn-delete" onClick={() => handleDelete(p.id)}>Xóa</button>
                                        </>
                                    ) : (
                                        <button className="btn-restore" onClick={() => handleRestore(p.id)}>
                                            ♻️ Khôi phục
                                        </button>
                                    )}
                                    </div>
                                </td>
                                </tr>
                            ))
                            ) : (
                            <tr><td colSpan={7} className="no-data">
                                {viewDeleted ? "Thùng rác trống." : "Không tìm thấy sản phẩm phù hợp."}
                            </td></tr>
                            )
                        )}
                    </tbody>
                    </table>
                </div>

                {/* PAGINATION */}
                <div className="pagination">
                    <button disabled={page === 1} onClick={() => setPage(page - 1)}>« Trước</button>
                    <span>Trang {page} / {totalPages}</span>
                    <button disabled={page === totalPages} onClick={() => setPage(page + 1)}>Sau »</button>
                </div>

                {/* MODAL */}
                {showModal && !viewDeleted && (
                    <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                        <h3>{isEditMode ? "Cập nhật sản phẩm" : "Thêm sản phẩm mới"}</h3>
                        <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmit} className="product-form">
                        <div className="form-group">
                            <label>Tên sản phẩm *</label>
                            <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                            <label>Giá (VNĐ) *</label>
                            <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} required />
                            </div>
                            <div className="form-group">
                            <label>Số lượng kho *</label>
                            <input type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} required />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Danh mục *</label>
                            <select value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: Number(e.target.value)})} required>
                            <option value={0}>-- Chọn danh mục --</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Link ảnh (URL)</label>
                            <input type="text" value={formData.thumbnail} onChange={e => setFormData({...formData, thumbnail: e.target.value})} />
                            {formData.thumbnail && (
                                <img src={formData.thumbnail} alt="Preview" className="img-preview" 
                                onError={(e) => (e.target as HTMLImageElement).src = "https://placehold.co/100x100?text=Error"}/>
                            )}
                        </div>
                        <div className="form-group">
                            <label>Mô tả</label>
                            <textarea rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                        </div>
                        <div className="modal-actions">
                            <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Hủy</button>
                            <button type="submit" className="btn-save">Lưu lại</button>
                        </div>
                        </form>
                    </div>
                    </div>
                )}
            </>
        )}
    </div>
  );
};

export default ProductList;