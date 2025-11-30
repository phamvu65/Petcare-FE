import React, { useEffect, useState } from "react";
import api from "../../../api/axiosInstance";
import { useNavigate } from "react-router-dom";
import "./MyPets.css";

// 1. Interface cho dữ liệu hiển thị (khớp PetResponse)
interface Pet {
  id: number;
  owner: string; 
  name: string;
  species: string; 
  breed: string;   
  color: string;
  sex: "male" | "female"; 
  birthDate: string; 
}

// Interface cho lịch sử dịch vụ (Khớp AppointmentResponse)
interface Appointment {
  id: number;
  petId: number;       // Cần trường này để lọc
  petName: string;
  serviceName: string;
  scheduledAt: string;
  status: string;      // BOOKED, DONE, CANCELLED...
  totalAmount: number;
}

// 2. Interface cho dữ liệu gửi đi
interface PetFormData {
  id?: number;
  ownerId: number;
  name: string;
  species: string;
  breed: string;
  color: string;
  sex: string;
  birthDate: string;
}

const MyPets: React.FC = () => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State Modal Thêm/Sửa
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // State Modal Lịch sử
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyList, setHistoryList] = useState<Appointment[]>([]);
  const [selectedPetName, setSelectedPetName] = useState("");

  const currentUserId = Number(localStorage.getItem("userId"));

  const [formData, setFormData] = useState<PetFormData>({
    ownerId: currentUserId,
    name: "",
    species: "",
    breed: "",
    color: "",
    sex: "male", 
    birthDate: "",
  });

  const navigate = useNavigate();

  // --- Helpers ---
  const calculateAge = (birthDateString: string) => {
    if (!birthDateString) return "Chưa rõ";
    const birthDate = new Date(birthDateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age < 1 ? "Dưới 1 tuổi" : `${age} tuổi`;
  };

  const getPetImage = (species: string) => {
    if (!species) return "https://cdn-icons-png.flaticon.com/512/3048/3048122.png";
    const s = species.toLowerCase();
    if (s.includes("chó") || s.includes("dog")) 
      return "https://cdn-icons-png.flaticon.com/512/616/616408.png"; 
    if (s.includes("mèo") || s.includes("cat")) 
      return "https://cdn-icons-png.flaticon.com/512/616/616430.png"; 
    return "https://cdn-icons-png.flaticon.com/512/3048/3048122.png"; 
  };

  const formatDateTime = (isoString: string) => {
    return new Date(isoString).toLocaleString('vi-VN');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DONE': return '#2ecc71'; // Green
      case 'BOOKED': return '#3498db'; // Blue
      case 'CANCELLED': return '#e74c3c'; // Red
      default: return '#95a5a6'; // Grey
    }
  };

  // --- API CALLS ---
  const fetchMyPets = async () => {
    if (!currentUserId) return;
    try {
      const res = await api.get(`/pets/${currentUserId}`);
      if (res.data && Array.isArray(res.data.data)) {
         setPets(res.data.data);
      } else {
         setPets([]);
      }
    } catch (error) {
      console.error("Lỗi lấy danh sách thú cưng", error);
    } finally {
      setLoading(false);
    }
  };

  // 🟢 HÀM MỚI: Lấy lịch sử dịch vụ
  const handleViewHistory = async (pet: Pet) => {
    setSelectedPetName(pet.name);
    try {
      // Gọi API lấy toàn bộ lịch hẹn của User
      const res = await api.get("/appointments/my");
      // Dữ liệu API trả về nằm trong res.data.data
      const allAppointments: Appointment[] = res.data.data;

      // Lọc danh sách chỉ lấy của con Pet này
      const petHistory = allAppointments.filter(appt => appt.petId === pet.id);
      
      setHistoryList(petHistory);
      setShowHistoryModal(true);
    } catch (error) {
      console.error("Lỗi tải lịch sử:", error);
      alert("Không thể tải lịch sử dịch vụ. Vui lòng thử lại sau.");
    }
  };

  useEffect(() => {
    if (!currentUserId) {
      alert("Vui lòng đăng nhập!");
      navigate("/");
    } else {
      fetchMyPets();
    }
  }, [currentUserId, navigate]);

  // --- HANDLERS FORM ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const openAddModal = () => {
    setIsEditing(false);
    setFormData({
      ownerId: currentUserId,
      name: "",
      species: "",
      breed: "",
      color: "",
      sex: "male",
      birthDate: "",
    });
    setShowModal(true);
  };

  const openEditModal = (pet: Pet) => {
    setIsEditing(true);
    setFormData({
      id: pet.id,
      ownerId: currentUserId, 
      name: pet.name,
      species: pet.species,
      breed: pet.breed,
      color: pet.color,
      sex: pet.sex.toLowerCase(),
      birthDate: pet.birthDate,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...formData, ownerId: currentUserId };
      if (isEditing) {
        await api.put("/pets/upd", payload);
        alert("Cập nhật thành công!");
      } else {
        await api.post("/pets/add", payload);
        alert("Thêm thú cưng thành công!");
      }
      setShowModal(false);
      fetchMyPets();
    } catch (error: any) {
      console.error("Lỗi lưu thú cưng:", error);
      const msg = error.response?.data?.message || "Có lỗi xảy ra";
      alert(`Thất bại: ${msg}`);
    }
  };

  const handleDelete = async (petId: number) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa thú cưng này?")) {
      try {
        await api.delete(`/pets/del/${petId}`);
        alert("Đã xóa thành công!");
        fetchMyPets();
      } catch (error) {
        console.error("Lỗi xóa thú cưng:", error);
        alert("Xóa thất bại");
      }
    }
  };

  if (loading) return <div className="loading-text" style={{textAlign:"center", padding:"50px"}}>Đang tải dữ liệu...</div>;

  return (
    <div className="my-pets-container">
      <div className="pets-header">
        <h2>🐾 Thú Cưng Của Tôi</h2>
        <button className="btn-add" onClick={openAddModal}>+ Thêm Thú Cưng</button>
      </div>
      
      {pets.length === 0 ? (
        <div className="empty-state">
           <p>Bạn chưa đăng ký thú cưng nào. Hãy thêm ngay để theo dõi sức khỏe nhé!</p>
        </div>
      ) : (
        <div className="pet-list-grid">
          {pets.map((pet) => (
            <div key={pet.id} className="pet-card">
              <div className="pet-avatar">
                <img src={getPetImage(pet.species)} alt={pet.name} />
              </div>
              <div className="pet-info">
                <h3>{pet.name}</h3>
                <p><strong>Loài:</strong> {pet.species} - {pet.breed}</p>
                <p><strong>Giới tính:</strong> {pet.sex === "male" ? "Đực ♂" : "Cái ♀"}</p>
                <p><strong>Màu sắc:</strong> {pet.color}</p>
                <p><strong>Tuổi:</strong> {calculateAge(pet.birthDate)}</p>
                
                <div className="pet-actions">
                  <button className="btn-history" onClick={() => handleViewHistory(pet)}>
                    📜 Lịch sử
                  </button>
                  <button className="btn-edit" onClick={() => openEditModal(pet)}>Sửa</button>
                  <button className="btn-delete" onClick={() => handleDelete(pet.id)}>Xóa</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- MODAL THÊM / SỬA --- */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{isEditing ? "Cập Nhật Hồ Sơ" : "Thêm Thú Cưng Mới"}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Tên thú cưng *</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} required placeholder="Ví dụ: Milu" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Loại (Species) *</label>
                  <input type="text" name="species" value={formData.species} onChange={handleInputChange} required placeholder="VD: Chó, Mèo..." />
                </div>
                <div className="form-group">
                  <label>Giống (Breed)</label>
                  <input type="text" name="breed" value={formData.breed} onChange={handleInputChange} placeholder="VD: Poodle..." />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Giới tính</label>
                  <select name="sex" value={formData.sex} onChange={handleInputChange}>
                    <option value="male">Đực</option>
                    <option value="female">Cái</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Màu lông</label>
                  <input type="text" name="color" value={formData.color} onChange={handleInputChange} />
                </div>
              </div>
              <div className="form-group">
                <label>Ngày sinh *</label>
                <input type="date" name="birthDate" value={formData.birthDate} onChange={handleInputChange} required />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn-submit">{isEditing ? "Lưu Thay Đổi" : "Thêm Mới"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL LỊCH SỬ DỊCH VỤ --- */}
      {showHistoryModal && (
        <div className="modal-overlay">
          <div className="modal-content history-modal">
            <button className="close-btn" onClick={() => setShowHistoryModal(false)}>✕</button>
            <h3>Lịch sử dịch vụ: {selectedPetName}</h3>
            
            <div className="history-list">
              {historyList.length === 0 ? (
                <div className="empty-state" style={{border: 'none', padding: '20px'}}>
                  <p>Chưa có dịch vụ nào được thực hiện.</p>
                </div>
              ) : (
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Dịch vụ</th>
                      <th>Ngày thực hiện</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyList.map(appt => (
                      <tr key={appt.id}>
                        <td>{appt.serviceName || "Dịch vụ spa/khám"}</td>
                        <td>{formatDateTime(appt.scheduledAt)}</td>
                        <td>
                          <span 
                            style={{
                              backgroundColor: getStatusColor(appt.status),
                              color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold'
                            }}
                          >
                            {appt.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyPets;