import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../api/axiosInstance";
import "./OrderDetail.css"; // (Nhớ tạo file css này ở bước 3)

// --- INTERFACES ---
interface OrderItem {
  productId: number;
  productName: string;
  productImage: string; // URL ảnh
  quantity: number;
  unitPrice: number;
  subTotal: number;
}

interface OrderDetailData {
  id: number;
  customerName: string;
  shippingAddress: string;
  paymentMethod: string;
  status: string; // PENDING, SHIPPING, COMPLETED, CANCELLED
  totalAmount: number;
  createdAt: string;
  items: OrderItem[];
}

const OrderDetail: React.FC = () => {
  const { id } = useParams(); // Lấy ID từ URL
  const navigate = useNavigate();
  
  const [order, setOrder] = useState<OrderDetailData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [processing, setProcessing] = useState<boolean>(false);

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchOrderDetail = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/orders/${id}`);
        if (res.data && res.data.status === 200) {
          setOrder(res.data.data);
        }
      } catch (error) {
        console.error("Lỗi tải đơn hàng:", error);
        alert("Không tìm thấy đơn hàng!");
        navigate("/admin/orders");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchOrderDetail();
  }, [id, navigate]);

  // --- UPDATE STATUS ---
  const handleUpdateStatus = async (newStatus: string) => {
    if (!window.confirm(`Bạn có chắc muốn chuyển trạng thái thành "${newStatus}"?`)) return;

    try {
      setProcessing(true);
      // Gọi API PATCH /orders/{id}/status?status=...
      const res = await api.patch(`/orders/${id}/status`, null, {
        params: { status: newStatus }
      });

      if (res.data && res.data.status === 200) {
        alert("Cập nhật thành công!");
        // Cập nhật lại state giao diện
        setOrder(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (error: any) {
      console.error("Lỗi update status:", error);
      const msg = error.response?.data?.message || "Lỗi cập nhật trạng thái";
      alert(msg);
    } finally {
      setProcessing(false);
    }
  };

  // --- HELPER RENDERS ---
  const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  const formatTime = (iso: string) => new Date(iso).toLocaleString('vi-VN');

  // Logic hiển thị nút bấm dựa trên trạng thái hiện tại
  const renderActionButtons = (currentStatus: string) => {
    if (processing) return <button className="btn-disabled" disabled>Đang xử lý...</button>;

    switch (currentStatus) {
      case "PENDING":
        return (
          <div className="action-group">
            <button className="btn-action btn-approve" onClick={() => handleUpdateStatus("SHIPPING")}>
               🚀 Xác nhận & Giao hàng
            </button>
            <button className="btn-action btn-cancel" onClick={() => handleUpdateStatus("CANCELLED")}>
               ❌ Hủy đơn
            </button>
          </div>
        );
      case "SHIPPING":
        return (
          <div className="action-group">
            <button className="btn-action btn-complete" onClick={() => handleUpdateStatus("DELIVERED")}>
               📦 Đã giao cho khách (DELIVERED)
            </button>
            <button className="btn-action btn-cancel" onClick={() => handleUpdateStatus("CANCELLED")}>
               ❌ Hủy đơn
            </button>
          </div>
        );
      case "DELIVERED":
         return (
          <div className="action-group">
            <button className="btn-action btn-finish" onClick={() => handleUpdateStatus("COMPLETED")}>
               ✅ Hoàn tất đơn hàng (COMPLETED)
            </button>
          </div>
        );
      case "COMPLETED":
        return <div className="text-green-600 font-bold p-2 border border-green-200 bg-green-50 rounded text-center">Đơn hàng đã hoàn thành</div>;
      case "CANCELLED":
        return <div className="text-red-600 font-bold p-2 border border-red-200 bg-red-50 rounded text-center">Đơn hàng đã hủy</div>;
      default:
        return null;
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Đang tải thông tin...</div>;
  if (!order) return null;

  return (
    <div className="order-detail-container p-6">
      <button onClick={() => navigate(-1)} className="mb-4 text-gray-500 hover:text-black font-medium">
         ⬅ Quay lại danh sách
      </button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Chi tiết đơn hàng #{order.id}</h2>
        <span className={`status-badge-lg status-${order.status}`}>
            {order.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CỘT TRÁI: THÔNG TIN */}
        <div className="col-span-1 flex flex-col gap-6">
          
          <div className="info-card">
            <h3>Thông tin khách hàng</h3>
            <p><span className="font-semibold">Họ tên:</span> {order.customerName}</p>
            <p><span className="font-semibold">Ngày đặt:</span> {formatTime(order.createdAt)}</p>
            <p><span className="font-semibold">Thanh toán:</span> {order.paymentMethod}</p>
          </div>

          <div className="info-card">
            <h3>Địa chỉ giao hàng</h3>
            <p className="address-text">{order.shippingAddress}</p>
          </div>

          {/* KHU VỰC CẬP NHẬT TRẠNG THÁI */}
          <div className="info-card action-card">
            <h3>Cập nhật trạng thái</h3>
            <div className="mt-4">
              {renderActionButtons(order.status)}
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: DANH SÁCH SẢN PHẨM */}
        <div className="col-span-2 info-card">
          <h3>Danh sách sản phẩm</h3>
          <div className="overflow-x-auto">
            <table className="w-full mt-4 text-left border-collapse">
                <thead>
                <tr className="border-b text-gray-500 text-sm bg-gray-50">
                    <th className="py-3 px-2">Sản phẩm</th>
                    <th className="py-3 px-2 text-center">Đơn giá</th>
                    <th className="py-3 px-2 text-center">SL</th>
                    <th className="py-3 px-2 text-right">Thành tiền</th>
                </tr>
                </thead>
                <tbody>
                {order.items.map((item, index) => (
                    <tr key={index} className="border-b last:border-0 hover:bg-gray-50 transition">
                    <td className="py-3 px-2 flex items-center gap-3">
                        {item.productImage ? (
                            <img src={item.productImage} alt="" className="w-12 h-12 object-cover rounded border" />
                        ) : (
                            <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">No img</div>
                        )}
                        <span className="font-medium text-gray-700">{item.productName}</span>
                    </td>
                    <td className="text-center px-2">{formatCurrency(item.unitPrice)}</td>
                    <td className="text-center px-2 font-bold">x{item.quantity}</td>
                    <td className="text-right px-2 font-bold text-blue-600">
                        {formatCurrency(item.subTotal)}
                    </td>
                    </tr>
                ))}
                </tbody>
                <tfoot>
                <tr>
                    <td colSpan={3} className="text-right py-4 px-2 font-bold text-lg text-gray-700">Tổng tiền:</td>
                    <td className="text-right py-4 px-2 font-bold text-xl text-red-600">
                    {formatCurrency(order.totalAmount)}
                    </td>
                </tr>
                </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;