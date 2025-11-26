// src/pages/Customer/Customer.tsx
import React, { useEffect, useState } from "react";
import api from "../../api/axiosInstance";
import "./Customer.css";

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
  salePrice?: number;
  images?: ProductImage[];
}

const Customer: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);

  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);

  const [sort, setSort] = useState<string>("id:asc"); // sort mặc định

  // ================== FETCH CATEGORIES ==================
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get("/categories/list", {
          params: { sort: "id:asc", page: 1, size: 30 },
        });

        setCategories(res.data.data.categories);
      } catch (err) {
        console.error("Lỗi categories:", err);
      }
    };

    fetchCategories();
  }, []);

  // ================== FETCH PRODUCTS ==================
  const fetchProducts = async () => {
    setLoading(true);

    try {
      const res = await api.get("/products/list", {
        params: {
          sort: sort,
          page: page,
          size: PAGE_SIZE,
          categoryId:
            selectedCategories.length > 0
              ? selectedCategories.join(",") // Gửi danh sách các categoryId
              : undefined,
        },
      });

      const pageData = res.data.data;
      setProducts(pageData.products);
      setTotalPages(pageData.totalPages ?? 1);
    } catch (err) {
      console.error("Lỗi load products", err);
    } finally {
      setLoading(false);
    }
  };

  // gọi khi page hoặc sort thay đổi
  useEffect(() => {
    fetchProducts();
  }, [page, sort]);

  const handleCategoryChange = (id: number) => {
    setSelectedCategories((prev) =>
      prev.includes(id)
        ? prev.filter((categoryId) => categoryId !== id)  // Bỏ chọn nếu đã chọn
        : [...prev, id]  // Thêm vào nếu chưa chọn
    );
  };

  const handleFilter = () => {
    setPage(1);  // Reset page về 1 khi lọc lại
    fetchProducts();
  };

  return (
    <div className="customer-page">
      {/* Sidebar */}
      <aside className="customer-sidebar">
        <h3 className="sidebar-title">Loại Sản Phẩm</h3>

        <ul className="category-list">
          {categories.map((cat) => (
            <li key={cat.id} className="category-item">
              <label>
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(cat.id)}
                  onChange={() => handleCategoryChange(cat.id)}
                />
                {cat.name}
              </label>
            </li>
          ))}
        </ul>

        {/* NÚT LỌC */}
        <button className="filter-btn" onClick={handleFilter}>
          Lọc
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="customer-content">
        <div className="customer-content-header">
          <h2>Sản phẩm</h2>

          <div className="content-controls">
            <span>Hiển thị {PAGE_SIZE} / trang</span>

            {/* SORT */}
            <select
              className="sort-select"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="id:asc">Mặc định</option>
              <option value="price:asc">Giá tăng dần</option>
              <option value="price:desc">Giá giảm dần</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading">Đang tải...</div>
        ) : (
          <div className="product-grid">
            {products.map((p) => {
              const firstImageUrl =
                p.images?.length ? p.images[0].imageUrl : undefined;

              return (
                <div className="product-card" key={p.id}>
                  <div className="product-image-wrap">
                    {firstImageUrl ? (
                      <img src={firstImageUrl} alt={p.name} />
                    ) : (
                      <div className="product-image-placeholder">
                        Ảnh sản phẩm
                      </div>
                    )}
                  </div>

                  <div className="product-info">
                    <div className="product-brand">{p.categoryName}</div>
                    <div className="product-name">{p.name}</div>

                    <div className="product-price-wrap">
                      <span className="product-price">
                        {p.price.toLocaleString()}đ
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* PAGINATION */}
        <div className="pagination">
          <button disabled={page === 1} onClick={() => setPage(page - 1)}>
            &laquo; Trước
          </button>
          <span>
            Trang {page}/{totalPages}
          </span>
          <button disabled={page === totalPages} onClick={() => setPage(page + 1)}>
            Sau &raquo;
          </button>
        </div>
      </main>
    </div>
  );
};

export default Customer;
