import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from "recharts";
import api from "../../../api/axiosInstance";
import "./Revenue.css"; // Nhớ import file CSS

// --- INTERFACES ---
interface DailyRevenue {
  date: string;
  total: number;
}

interface RevenueStats {
  revenue: number;
  newOrders: number;
  shippingOrders: number;
  shippingCount?: number; 
  cancelledOrders: number;
  totalOrders: number;
  chartData: DailyRevenue[];
}

const Revenue: React.FC = () => {
  const navigate = useNavigate();

  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // --- HÀM HELPER FORMAT NGÀY ---
  const formatDateISO = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const endStr = formatDateISO(today);     
    const startStr = formatDateISO(firstDay); 
    
    setToDate(endStr);
    setFromDate(startStr);
    
    fetchRevenue(startStr, endStr);
  }, []);

  const fetchRevenue = async (start: string, end: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/orders/stats`, {
        params: { fromDate: start, toDate: end }
      });

      if (response.data && response.data.status === 200) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error("Lỗi lấy báo cáo:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    if (!fromDate || !toDate) {
      alert("Vui lòng chọn ngày!");
      return;
    }
    fetchRevenue(fromDate, toDate);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  return (
    <div className="revenue-container">
      {/* HEADER: Đã sửa class cho nút Back */}
      <div className="revenue-header">
        <button 
            onClick={() => navigate("/admin/dashboard")} 
            className="back-btn" // Class CSS mới
        >
            <span>⬅ Quay lại</span>
        </button>
        <h2 className="page-title">Báo cáo doanh thu</h2>
      </div>

      {/* FILTER BAR */}
      <div className="filter-bar">
        <div className="filter-group">
          <label>Từ ngày</label>
          <input 
            type="date" 
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label>Đến ngày</label>
          <input 
            type="date" 
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
        <button 
          onClick={handleFilter}
          className="filter-btn"
          disabled={loading}
        >
          {loading ? "Đang tải..." : "Xem báo cáo"}
        </button>
      </div>

      {/* RESULT */}
      {loading ? (
          <div className="loading-text">Đang tính toán số liệu...</div>
      ) : stats ? (
        <>
          {/* CARDS */}
          <div className="revenue-grid">
            <div className="stat-card revenue-card">
              <div className="card-label text-green-600">Tổng doanh thu thực</div>
              <div className="card-value">{formatCurrency(stats.revenue)}</div>
              <div className="card-sub">Đã trừ đơn hủy</div>
            </div>

            <div className="stat-card">
              <div className="card-label text-blue-600">Tổng đơn hàng</div>
              <div className="card-value">{stats.totalOrders} đơn</div>
            </div>

            <div className="stat-card">
              <div className="card-label text-yellow-600">Đơn thành công</div>
              <div className="card-value">
                  {stats.totalOrders - stats.cancelledOrders} đơn
              </div>
            </div>

            <div className="stat-card">
              <div className="card-label text-red-600">Đơn hủy</div>
              <div className="card-value">{stats.cancelledOrders} đơn</div>
            </div>
          </div>

          {/* CHART AREA */}
          <div className="chart-container">
            <h3>Biểu đồ tăng trưởng doanh thu (Theo ngày)</h3>
            
            {stats.chartData && stats.chartData.length > 0 ? (
                <div style={{ width: "100%", height: 400 }}>
                    <ResponsiveContainer>
                    <BarChart
                        data={stats.chartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" />
                        <YAxis 
                            tickFormatter={(value) => 
                                new Intl.NumberFormat('vi-VN', { notation: "compact", compactDisplay: "short" }).format(value)
                            } 
                        />
                        <Tooltip 
                            formatter={(value: number) => formatCurrency(value)}
                            labelStyle={{ color: "#333" }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Legend />
                        <Bar name="Doanh thu" dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                             {stats.chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#3b82f6" : "#60a5fa"} />
                             ))}
                        </Bar>
                    </BarChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div className="no-data">
                    Chưa có đơn hàng hoàn thành (COMPLETED) trong khoảng thời gian này để vẽ biểu đồ.
                </div>
            )}
          </div>
        </>
      ) : (
        <div className="no-data">
            Không có dữ liệu. Vui lòng chọn ngày và bấm "Xem báo cáo".
        </div>
      )}
    </div>
  );
};

export default Revenue;