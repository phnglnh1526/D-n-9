import { useEffect, useState } from "react";
import {
  createEvent,
  deleteEvent,
  getEvents,
  updateEvent,
} from "../services/api";
import { getCurrentUser } from "../services/auth";

const initialForm = {
  NguoiToChucId: 2,
  TenSuKien: "",
  MoTa: "",
  ThoiGianBatDau: "",
  ThoiGianKetThuc: "",
  DiaDiem: "",
  SoLuongToiDa: "",
  TrangThai: "NHAP",
};

function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Toolbar States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("NEWEST");
  const [activeDropdownId, setActiveDropdownId] = useState(null);

  const filteredAndSortedEvents = events
    .filter((ev) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        ev.TenSuKien.toLowerCase().includes(q) ||
        (ev.DiaDiem && ev.DiaDiem.toLowerCase().includes(q));
      const matchesStatus = statusFilter === "ALL" || ev.TrangThai === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "NEWEST") {
        return b.SuKienId - a.SuKienId; // Fallback for newly created
      }
      if (sortBy === "UPCOMING") {
        return new Date(a.ThoiGianBatDau) - new Date(b.ThoiGianBatDau);
      }
      if (sortBy === "A_Z") {
        return a.TenSuKien.localeCompare(b.TenSuKien);
      }
      return 0;
    });

  // ======================================================
  // LOAD EVENTS & CURRENT USER
  // ======================================================
  async function loadData() {
    try {
      setError("");
      const token = sessionStorage.getItem("access_token");
      if (token) {
        try {
          const user = await getCurrentUser(token);
          setCurrentUser(user);
          setForm((prev) => ({
            ...prev,
            NguoiToChucId: user.NguoiDungId,
          }));
        } catch {
          // Keep default
        }
      }

      const data = await getEvents();
      setEvents(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // ======================================================
  // INPUT
  // ======================================================
  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]:
        name === "NguoiToChucId" || name === "SoLuongToiDa"
          ? value === ""
            ? ""
            : Number(value)
          : value,
    }));
  }

  // ======================================================
  // CREATE / UPDATE
  // ======================================================
  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    // Frontend Validation
    if (!form.TenSuKien || !form.TenSuKien.trim()) {
      setError("Tên sự kiện không được để trống.");
      return;
    }

    if (!form.ThoiGianBatDau || !form.ThoiGianKetThuc) {
      setError("Vui lòng nhập đầy đủ thời gian bắt đầu và kết thúc.");
      return;
    }

    if (new Date(form.ThoiGianKetThuc) <= new Date(form.ThoiGianBatDau)) {
      setError("Thời gian kết thúc phải sau thời gian bắt đầu.");
      return;
    }

    if (form.SoLuongToiDa !== "" && Number(form.SoLuongToiDa) <= 0) {
      setError("Số lượng khách tối đa phải lớn hơn 0.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        ...form,
        TenSuKien: form.TenSuKien.trim(),
        NguoiToChucId:
          Number(form.NguoiToChucId) || currentUser?.NguoiDungId || 2,
        SoLuongToiDa:
          form.SoLuongToiDa !== "" ? Number(form.SoLuongToiDa) : null,
        ThoiGianBatDau: new Date(form.ThoiGianBatDau).toISOString(),
        ThoiGianKetThuc: new Date(form.ThoiGianKetThuc).toISOString(),
      };

      if (editingId) {
        await updateEvent(editingId, payload);
        setSuccess("Cập nhật sự kiện thành công.");
      } else {
        await createEvent(payload);
        setSuccess("Tạo sự kiện mới thành công.");
      }

      setForm({
        ...initialForm,
        NguoiToChucId: currentUser?.NguoiDungId || 2,
      });
      setEditingId(null);
      setShowForm(false);

      const updatedEvents = await getEvents();
      setEvents(updatedEvents);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // ======================================================
  // EDIT
  // ======================================================
  function handleEdit(eventItem) {
    setError("");
    setSuccess("");

    setEditingId(eventItem.SuKienId);

    setForm({
      NguoiToChucId: eventItem.NguoiToChucId,
      TenSuKien: eventItem.TenSuKien || "",
      MoTa: eventItem.MoTa || "",
      ThoiGianBatDau: toInputDateTime(eventItem.ThoiGianBatDau),
      ThoiGianKetThuc: toInputDateTime(eventItem.ThoiGianKetThuc),
      DiaDiem: eventItem.DiaDiem || "",
      SoLuongToiDa:
        eventItem.SoLuongToiDa !== null && eventItem.SoLuongToiDa !== undefined
          ? eventItem.SoLuongToiDa
          : "",
      TrangThai: eventItem.TrangThai || "NHAP",
    });

    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // ======================================================
  // DELETE
  // ======================================================
  async function handleDelete(eventItem) {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa sự kiện "${eventItem.TenSuKien}" không?`
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      await deleteEvent(eventItem.SuKienId);
      setSuccess("Xóa sự kiện thành công.");
      const updatedEvents = await getEvents();
      setEvents(updatedEvents);
    } catch (err) {
      setError(err.message);
    }
  }

  // ======================================================
  // CANCEL
  // ======================================================
  function cancelForm() {
    setForm({
      ...initialForm,
      NguoiToChucId: currentUser?.NguoiDungId || 2,
    });
    setEditingId(null);
    setShowForm(false);
    setError("");
  }

  if (loading) {
    return (
      <div className="empty-state" style={{ marginTop: "100px", border: "none" }}>
        <p style={{ color: "var(--text-secondary)" }}>Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (error && events.length === 0) {
    return (
      <div className="empty-state" style={{ marginTop: "100px", border: "none" }}>
        <span className="empty-state-icon" style={{ color: "var(--danger-text)" }}>⚠️</span>
        <h3 style={{ color: "var(--danger-text)" }}>Không thể tải dữ liệu.</h3>
        <p>Vui lòng thử lại.</p>
        <button type="button" className="secondary-button" onClick={loadEvents} style={{ marginTop: "12px" }}>
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* HEADER */}
      <div className="page-header-row">
        <div className="page-header">
          <h1>Quản lý sự kiện</h1>
          <p>
            Theo dõi, cập nhật và vận hành các sự kiện.
          </p>
          <div style={{ marginTop: "8px", display: "flex", gap: "12px", fontSize: "12.5px", color: "var(--text-secondary)", fontWeight: 500 }}>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "var(--primary)" }}></span>
              {events.length} sự kiện
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "var(--success)" }}></span>
              {events.filter(e => e.TrangThai === "DA_DUYET").length} đã duyệt
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "var(--warning)" }}></span>
              {events.filter(e => e.TrangThai === "NHAP").length} bản nháp
            </span>
          </div>
        </div>

        <button
          className="btn-primary"
          onClick={() => {
            setForm({
              ...initialForm,
              NguoiToChucId: currentUser?.NguoiDungId || 2,
            });
            setEditingId(null);
            setShowForm((current) => !current);
          }}
        >
          {showForm ? "Đóng Form" : "+ Tạo sự kiện"}
        </button>
      </div>

      {/* MESSAGE ALERTS */}
      {error && <div className="alert error-alert">{error}</div>}
      {success && <div className="alert success-alert">{success}</div>}

      {/* FORM */}
      {showForm && (
        <section className="event-form-card">
          <h2>
            {editingId ? `Cập nhật sự kiện #${editingId}` : "Thêm sự kiện mới"}
          </h2>

          <form className="event-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              {/* Nếu là ADMIN thì cho chọn/sửa Organizer, nếu là ORGANIZER thì auto gán */}
              {currentUser?.VaiTro === "ADMIN" && (
                <div className="form-group">
                  <label>Người tổ chức (User ID)</label>
                  <input
                    type="number"
                    name="NguoiToChucId"
                    value={form.NguoiToChucId}
                    onChange={handleChange}
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label>Tên sự kiện *</label>
                <input
                  type="text"
                  name="TenSuKien"
                  placeholder="Ví dụ: Hội thảo Công nghệ AI 2026"
                  value={form.TenSuKien}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Thời gian bắt đầu *</label>
                <input
                  type="datetime-local"
                  name="ThoiGianBatDau"
                  value={form.ThoiGianBatDau}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Thời gian kết thúc *</label>
                <input
                  type="datetime-local"
                  name="ThoiGianKetThuc"
                  value={form.ThoiGianKetThuc}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Địa điểm</label>
                <input
                  type="text"
                  name="DiaDiem"
                  placeholder="Ví dụ: Trung tâm Hội nghị Quốc gia"
                  value={form.DiaDiem}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Số lượng khách tối đa</label>
                <input
                  type="number"
                  name="SoLuongToiDa"
                  min="1"
                  placeholder="Để trống nếu không giới hạn"
                  value={form.SoLuongToiDa}
                  onChange={handleChange}
                />
              </div>

              {editingId && (
                <div className="form-group">
                  <label>Trạng thái sự kiện</label>
                  <select
                    name="TrangThai"
                    value={form.TrangThai}
                    onChange={handleChange}
                  >
                    <option value="NHAP">NHAP (Bản nháp)</option>
                    <option value="DA_DUYET">DA_DUYET (Đã duyệt / Mở đăng ký)</option>
                    <option value="DANG_DIEN_RA">DANG_DIEN_RA (Đang diễn ra)</option>
                    <option value="DA_KET_THUC">DA_KET_THUC (Đã kết thúc)</option>
                    <option value="DA_HUY">DA_HUY (Đã hủy)</option>
                  </select>
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Mô tả chi tiết</label>
              <textarea
                name="MoTa"
                rows="4"
                placeholder="Nhập giới thiệu, mục tiêu và nội dung chính của sự kiện..."
                value={form.MoTa}
                onChange={handleChange}
              />
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="primary-button"
                disabled={saving}
              >
                {saving
                  ? "Đang lưu..."
                  : editingId
                  ? "Lưu thay đổi"
                  : "Tạo sự kiện"}
              </button>

              <button
                type="button"
                className="secondary-button"
                onClick={cancelForm}
              >
                Hủy
              </button>
            </div>
          </form>
        </section>
      )}

      {/* TOOLBAR */}
      <div className="filter-card" style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center", marginBottom: "24px" }}>
        <div className="form-group" style={{ flex: "1 1 300px", marginBottom: 0 }}>
          <input
            type="text"
            placeholder="Tìm theo tên hoặc địa điểm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="form-group" style={{ flex: "0 0 160px", marginBottom: 0 }}>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">Tất cả trạng thái</option>
            <option value="DA_DUYET">Đã duyệt</option>
            <option value="NHAP">Bản nháp</option>
            <option value="DANG_DIEN_RA">Đang diễn ra</option>
            <option value="DA_KET_THUC">Đã kết thúc</option>
            <option value="DA_HUY">Đã hủy</option>
          </select>
        </div>
        <div className="form-group" style={{ flex: "0 0 160px", marginBottom: 0 }}>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="NEWEST">Mới nhất</option>
            <option value="UPCOMING">Sắp diễn ra</option>
            <option value="A_Z">Tên A-Z</option>
          </select>
        </div>
      </div>

      {/* TABLE */}
      <section className="dashboard-section">
        <div className="section-header">
          <h2>Danh sách sự kiện</h2>
          <span>{filteredAndSortedEvents.length} sự kiện</span>
        </div>

        {events.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">📅</span>
            <h3>Chưa có sự kiện</h3>
            <p>Tạo sự kiện đầu tiên để bắt đầu quản lý.</p>
            <button
              type="button"
              className="primary-button"
              onClick={() => setShowForm(true)}
              style={{ marginTop: "16px" }}
            >
              + Tạo sự kiện
            </button>
          </div>
        ) : filteredAndSortedEvents.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">🔍</span>
            <h3>Không tìm thấy kết quả phù hợp.</h3>
          </div>
        ) : (
          <div className="modern-list">
            {filteredAndSortedEvents.map((eventItem) => {
              const d = new Date(eventItem.ThoiGianBatDau);
              const day = d.getDate().toString().padStart(2, "0");
              const month = "TH" + (d.getMonth() + 1);
              const time = d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

              return (
                <div key={eventItem.SuKienId} className="modern-list-item">
                  {/* 1. Date */}
                  <div className="item-date-block">
                    <span className="item-date-day">{day}</span>
                    <span className="item-date-month">{month}</span>
                    <span className="item-date-time">{time}</span>
                  </div>

                  {/* 2. Title & Location */}
                  <div className="item-main-info">
                    <h4 className="item-title">{eventItem.TenSuKien}</h4>
                    <span className="item-subtitle">
                      📍 {eventItem.DiaDiem || "Chưa cập nhật địa điểm"}
                    </span>
                  </div>

                  {/* 3. Capacity */}
                  <div className="item-meta">
                    👥 {eventItem.SoLuongToiDa ? `${eventItem.SoLuongToiDa} khách` : "Không giới hạn"}
                  </div>

                  {/* 4. Status */}
                  <div className="item-meta">
                    {eventItem.TrangThai === "DA_DUYET" ? (
                      <span className="status status-success">Đã duyệt</span>
                    ) : eventItem.TrangThai === "DANG_DIEN_RA" ? (
                      <span className="status status-success">Đang diễn ra</span>
                    ) : eventItem.TrangThai === "DA_KET_THUC" ? (
                      <span className="status status-neutral">Đã kết thúc</span>
                    ) : eventItem.TrangThai === "DA_HUY" ? (
                      <span className="status status-danger">Đã hủy</span>
                    ) : (
                      <span className="status status-warning">Bản nháp</span>
                    )}
                  </div>

                  {/* 5. Actions */}
                  <div className="item-actions-menu">
                    <button
                      type="button"
                      className="action-trigger-btn"
                      onClick={() =>
                        setActiveDropdownId(
                          activeDropdownId === eventItem.SuKienId ? null : eventItem.SuKienId
                        )
                      }
                    >
                      ⋯
                    </button>
                    {activeDropdownId === eventItem.SuKienId && (
                      <>
                        <div
                          className="dropdown-overlay"
                          onClick={() => setActiveDropdownId(null)}
                        ></div>
                        <div className="action-dropdown">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveDropdownId(null);
                              window.open(`/events/${eventItem.SuKienId}`, "_blank");
                            }}
                          >
                            Xem trang sự kiện
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveDropdownId(null);
                              handleEdit(eventItem);
                            }}
                          >
                            Sửa sự kiện
                          </button>
                          <div className="action-dropdown-divider"></div>
                          <button
                            type="button"
                            className="danger-text"
                            onClick={() => {
                              setActiveDropdownId(null);
                              handleDelete(eventItem);
                            }}
                          >
                            Xóa sự kiện
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function toInputDateTime(value) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
}

export default AdminEvents;