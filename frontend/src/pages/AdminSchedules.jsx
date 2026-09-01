import { useEffect, useState } from "react";
import {
  createEventSession,
  deleteEventSession,
  getEvents,
  getEventSessions,
  getSpeakers,
  updateEventSession,
} from "../services/api";

const initialForm = {
  TieuDe: "",
  MoTa: "",
  ThoiGianBatDau: "",
  ThoiGianKetThuc: "",
  DiaDiem: "",
  DienGiaId: "",
};

function AdminSchedules() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [sessions, setSessions] = useState([]);
  const [speakers, setSpeakers] = useState([]);

  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ======================================================
  // 1. LOAD EVENTS & SPEAKERS
  // ======================================================
  useEffect(() => {
    async function init() {
      try {
        setError("");
        const [eventData, speakerData] = await Promise.all([
          getEvents(),
          getSpeakers(),
        ]);
        setEvents(eventData);
        setSpeakers(speakerData);

        if (eventData.length > 0) {
          setSelectedEventId(eventData[0].SuKienId);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // ======================================================
  // 2. LOAD SESSIONS WHEN SELECTED EVENT CHANGES
  // ======================================================
  useEffect(() => {
    if (!selectedEventId) return;

    async function loadSessions() {
      setLoadingSessions(true);
      try {
        setError("");
        const data = await getEventSessions(selectedEventId);
        setSessions(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingSessions(false);
      }
    }

    loadSessions();
  }, [selectedEventId]);

  // ======================================================
  // 3. HANDLE FORM INPUT
  // ======================================================
  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        name === "DienGiaId"
          ? value === ""
            ? ""
            : Number(value)
          : value,
    }));
  }

  // ======================================================
  // 4. SUBMIT FORM (CREATE / UPDATE)
  // ======================================================
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedEventId) {
      setError("Vui lòng chọn sự kiện trước khi thao tác.");
      return;
    }

    if (!form.TieuDe || !form.TieuDe.trim()) {
      setError("Tiêu đề phiên sự kiện không được để trống.");
      return;
    }

    if (!form.ThoiGianBatDau || !form.ThoiGianKetThuc) {
      setError("Vui lòng nhập đầy đủ thời gian bắt đầu và kết thúc.");
      return;
    }

    if (new Date(form.ThoiGianKetThuc) <= new Date(form.ThoiGianBatDau)) {
      setError("Thời gian kết thúc phiên phải sau thời gian bắt đầu.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        SuKienId: Number(selectedEventId),
        TieuDe: form.TieuDe.trim(),
        MoTa: form.MoTa.trim() || null,
        ThoiGianBatDau: new Date(form.ThoiGianBatDau).toISOString(),
        ThoiGianKetThuc: new Date(form.ThoiGianKetThuc).toISOString(),
        DiaDiem: form.DiaDiem.trim() || null,
        DienGiaId: form.DienGiaId ? Number(form.DienGiaId) : null,
      };

      if (editingId) {
        await updateEventSession(editingId, payload);
        setSuccess("Cập nhật phiên sự kiện thành công.");
      } else {
        await createEventSession(selectedEventId, payload);
        setSuccess("Thêm mới phiên sự kiện thành công.");
      }

      setForm(initialForm);
      setEditingId(null);
      setShowForm(false);

      const updated = await getEventSessions(selectedEventId);
      setSessions(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // ======================================================
  // 5. EDIT & DELETE
  // ======================================================
  function handleEdit(item) {
    setError("");
    setSuccess("");
    setEditingId(item.PhienSuKienId);
    setForm({
      TieuDe: item.TieuDe || "",
      MoTa: item.MoTa || "",
      ThoiGianBatDau: toInputDateTime(item.ThoiGianBatDau),
      ThoiGianKetThuc: toInputDateTime(item.ThoiGianKetThuc),
      DiaDiem: item.DiaDiem || "",
      DienGiaId: item.DienGiaId || "",
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(item) {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa phiên "${item.TieuDe}" không?`
    );
    if (!confirmed) return;

    setError("");
    setSuccess("");
    try {
      await deleteEventSession(item.PhienSuKienId);
      setSuccess("Xóa phiên sự kiện thành công.");
      const updated = await getEventSessions(selectedEventId);
      setSessions(updated);
    } catch (err) {
      setError(err.message);
    }
  }

  function cancelForm() {
    setForm(initialForm);
    setEditingId(null);
    setShowForm(false);
    setError("");
  }

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner" />
        <p>Đang tải dữ liệu lịch trình...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header">
          <h1>Quản lý lịch trình & Phiên sự kiện</h1>
          <p>Thiết lập các phiên thuyết trình, hội thảo và diễn giả phụ trách.</p>
        </div>

        <button
          className="primary-button"
          onClick={() => {
            setForm(initialForm);
            setEditingId(null);
            setShowForm((prev) => !prev);
          }}
          disabled={!selectedEventId}
        >
          {showForm ? "Đóng Form" : "+ Thêm phiên"}
        </button>
      </div>

      {error && <div className="alert error-alert">{error}</div>}
      {success && <div className="alert success-alert">{success}</div>}

      {/* EVENT SELECTOR CARD */}
      <section className="filter-card" style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <label style={{ fontWeight: 600, minWidth: "120px" }}>
            Chọn sự kiện:
          </label>
          <select
            value={selectedEventId}
            onChange={(e) => {
              setSelectedEventId(e.target.value);
              cancelForm();
            }}
            style={{
              flex: 1,
              maxWidth: "500px",
            }}
          >
            {events.map((ev) => (
              <option key={ev.SuKienId} value={ev.SuKienId}>
                #{ev.SuKienId} - {ev.TenSuKien} ({ev.TrangThai})
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* FORM CARD */}
      {showForm && (
        <section className="event-form-card">
          <h2>
            {editingId
              ? `Cập nhật phiên #${editingId}`
              : "Thêm phiên sự kiện mới"}
          </h2>

          <form className="event-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Tiêu đề phiên sự kiện *</label>
                <input
                  type="text"
                  name="TieuDe"
                  placeholder="Ví dụ: Khai mạc & Keynote: Xu hướng AI 2026"
                  value={form.TieuDe}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Diễn giả phụ trách</label>
                <select
                  name="DienGiaId"
                  value={form.DienGiaId}
                  onChange={handleChange}
                >
                  <option value="">-- Chưa có diễn giả / Tự do --</option>
                  {speakers.map((spk) => (
                    <option key={spk.DienGiaId} value={spk.DienGiaId}>
                      {spk.HoTen} {spk.ChucDanh ? `(${spk.ChucDanh})` : ""}
                    </option>
                  ))}
                </select>
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
                <label>Địa điểm chi tiết / Phòng họp</label>
                <input
                  type="text"
                  name="DiaDiem"
                  placeholder="Ví dụ: Hội trường chính tầng 2"
                  value={form.DiaDiem}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Mô tả nội dung phiên</label>
              <textarea
                name="MoTa"
                rows="3"
                placeholder="Tóm tắt nội dung báo cáo, thảo luận..."
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
                  : "Thêm phiên"}
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

      {/* SESSIONS LIST */}
      <section className="dashboard-section">
        <div className="section-header">
          <h2>Lịch trình chi tiết</h2>
          <span>{sessions.length} phiên</span>
        </div>

        {loadingSessions ? (
          <div className="loading-state">
            <div className="loading-spinner" />
            <p>Đang tải danh sách phiên sự kiện...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">⏱️</span>
            <h3>Chưa có phiên lịch trình</h3>
            <p>Sự kiện này chưa có phiên lịch trình nào. Hãy nhấn "+ Thêm phiên" để bắt đầu.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tiêu đề phiên</th>
                  <th>Diễn giả</th>
                  <th>Thời gian</th>
                  <th>Địa điểm</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((item) => (
                  <tr key={item.PhienSuKienId}>
                    <td>#{item.PhienSuKienId}</td>
                    <td>
                      <strong>{item.TieuDe}</strong>
                      {item.MoTa && (
                        <p
                          style={{
                            margin: "4px 0 0",
                            fontSize: "13px",
                            color: "#64748b",
                          }}
                        >
                          {item.MoTa}
                        </p>
                      )}
                    </td>
                    <td>
                      {item.dien_gia ? (
                        <div>
                          <strong>{item.dien_gia.HoTen}</strong>
                          <div style={{ fontSize: "12px", color: "#64748b" }}>
                            {item.dien_gia.ChucDanh || item.dien_gia.DonVi || ""}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: "#94a3b8", fontStyle: "italic" }}>
                          (Chưa có)
                        </span>
                      )}
                    </td>
                    <td>
                      <div>
                        {new Date(item.ThoiGianBatDau).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        -{" "}
                        {new Date(item.ThoiGianKetThuc).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>
                        {new Date(item.ThoiGianBatDau).toLocaleDateString("vi-VN")}
                      </div>
                    </td>
                    <td>{item.DiaDiem || "—"}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="edit-button"
                          onClick={() => handleEdit(item)}
                        >
                          Sửa
                        </button>
                        <button
                          className="delete-button"
                          onClick={() => handleDelete(item)}
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function toInputDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
}

export default AdminSchedules;
