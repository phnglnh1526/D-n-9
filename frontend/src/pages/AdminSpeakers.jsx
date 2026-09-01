import { useEffect, useState } from "react";
import {
  createSpeaker,
  deleteSpeaker,
  getSpeakers,
  updateSpeaker,
} from "../services/api";

const initialForm = {
  HoTen: "",
  ChucDanh: "",
  DonVi: "",
  GioiThieu: "",
};

function AdminSpeakers() {
  const [speakers, setSpeakers] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeDropdownId, setActiveDropdownId] = useState(null);
  
  // Toolbar states
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("NEWEST");

  const filteredAndSortedSpeakers = speakers
    .filter((spk) => {
      const q = searchQuery.toLowerCase();
      const name = (spk.HoTen || "").toLowerCase();
      const title = (spk.ChucDanh || "").toLowerCase();
      const org = (spk.DonVi || "").toLowerCase();
      return name.includes(q) || title.includes(q) || org.includes(q);
    })
    .sort((a, b) => {
      if (sortBy === "A_Z") {
        return (a.HoTen || "").localeCompare(b.HoTen || "");
      }
      if (sortBy === "Z_A") {
        return (b.HoTen || "").localeCompare(a.HoTen || "");
      }
      // "NEWEST" fallback to ID descending
      return b.DienGiaId - a.DienGiaId;
    });

  async function loadSpeakers() {
    try {
      setError("");
      const data = await getSpeakers();
      setSpeakers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSpeakers();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.HoTen || !form.HoTen.trim()) {
      setError("Họ tên diễn giả không được để trống.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        HoTen: form.HoTen.trim(),
        ChucDanh: form.ChucDanh.trim() || null,
        DonVi: form.DonVi.trim() || null,
        GioiThieu: form.GioiThieu.trim() || null,
      };

      if (editingId) {
        await updateSpeaker(editingId, payload);
        setSuccess("Cập nhật diễn giả thành công.");
      } else {
        await createSpeaker(payload);
        setSuccess("Thêm mới diễn giả thành công.");
      }

      setForm(initialForm);
      setEditingId(null);
      setShowForm(false);
      await loadSpeakers();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(spk) {
    setError("");
    setSuccess("");
    setEditingId(spk.DienGiaId);
    setForm({
      HoTen: spk.HoTen || "",
      ChucDanh: spk.ChucDanh || "",
      DonVi: spk.DonVi || "",
      GioiThieu: spk.GioiThieu || "",
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(spk) {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa diễn giả "${spk.HoTen}" không?`
    );
    if (!confirmed) return;

    setError("");
    setSuccess("");
    try {
      await deleteSpeaker(spk.DienGiaId);
      setSuccess("Xóa diễn giả thành công.");
      await loadSpeakers();
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
      <div className="empty-state" style={{ marginTop: "100px", border: "none" }}>
        <p style={{ color: "var(--text-secondary)" }}>Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (error && speakers.length === 0) {
    return (
      <div className="empty-state" style={{ marginTop: "100px", border: "none" }}>
        <span className="empty-state-icon" style={{ color: "var(--danger-text)" }}>⚠️</span>
        <h3 style={{ color: "var(--danger-text)" }}>Không thể tải dữ liệu.</h3>
        <p>Vui lòng thử lại.</p>
        <button type="button" className="secondary-button" onClick={loadSpeakers} style={{ marginTop: "12px" }}>
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header">
          <h1>Quản lý diễn giả</h1>
          <p>
            Quản lý hồ sơ và thông tin các diễn giả tham gia sự kiện.
          </p>
          <div style={{ marginTop: "8px", display: "flex", gap: "12px", fontSize: "12.5px", color: "var(--text-secondary)", fontWeight: 500 }}>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "var(--info)" }}></span>
              {speakers.length} diễn giả
            </span>
          </div>
        </div>

        <button
          className="btn-primary"
          onClick={() => {
            setForm(initialForm);
            setEditingId(null);
            setShowForm((prev) => !prev);
          }}
        >
          {showForm ? "Đóng Form" : "+ Thêm diễn giả"}
        </button>
      </div>

      {error && <div className="alert error-alert">{error}</div>}
      {success && <div className="alert success-alert">{success}</div>}

      {showForm && (
        <section className="event-form-card">
          <h2>
            {editingId ? `Cập nhật diễn giả #${editingId}` : "Thêm diễn giả mới"}
          </h2>

          <form className="event-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Họ và tên diễn giả *</label>
                <input
                  type="text"
                  name="HoTen"
                  placeholder="Ví dụ: TS. Lê Hoàng Nam"
                  value={form.HoTen}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Chức danh</label>
                <input
                  type="text"
                  name="ChucDanh"
                  placeholder="Ví dụ: Giám đốc Viện AI / Lead Architect"
                  value={form.ChucDanh}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Đơn vị công tác</label>
                <input
                  type="text"
                  name="DonVi"
                  placeholder="Ví dụ: Tập đoàn Công nghệ TechViet"
                  value={form.DonVi}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Tiểu sử / Giới thiệu</label>
              <textarea
                name="GioiThieu"
                rows="4"
                placeholder="Kinh nghiệm nghiên cứu, chuyên môn và các chủ đề chia sẻ..."
                value={form.GioiThieu}
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
                  : "Thêm diễn giả"}
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
            placeholder="Tìm tên, chức danh hoặc đơn vị..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="form-group" style={{ flex: "0 0 160px", marginBottom: 0 }}>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="NEWEST">Mới nhất</option>
            <option value="A_Z">Tên A-Z</option>
            <option value="Z_A">Tên Z-A</option>
          </select>
        </div>
      </div>

      <section className="dashboard-section">
        <div className="section-header">
          <h2>Danh sách diễn giả</h2>
          <span>{filteredAndSortedSpeakers.length} diễn giả</span>
        </div>

        {speakers.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">🎙️</span>
            <h3>Chưa có diễn giả</h3>
            <p>Thêm diễn giả để liên kết với lịch trình sự kiện.</p>
            <button
              type="button"
              className="primary-button"
              onClick={() => setShowForm(true)}
              style={{ marginTop: "16px" }}
            >
              + Thêm diễn giả
            </button>
          </div>
        ) : filteredAndSortedSpeakers.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">🔍</span>
            <h3>Không tìm thấy kết quả phù hợp.</h3>
          </div>
        ) : (
          <div className="speaker-grid">
            {filteredAndSortedSpeakers.map((spk) => {
              const words = spk.HoTen ? spk.HoTen.split(" ") : ["D", "G"];
              const initials = words.length >= 2 
                ? (words[0][0] + words[words.length - 1][0]).toUpperCase()
                : words[0].substring(0, 2).toUpperCase();

              return (
                <div key={spk.DienGiaId} className="speaker-card">
                  <div className="speaker-card-header">
                    <div className="speaker-avatar">
                      {initials}
                    </div>
                    
                    <div className="speaker-card-actions">
                      <button
                        type="button"
                        className="action-trigger-btn"
                        onClick={() =>
                          setActiveDropdownId(
                            activeDropdownId === spk.DienGiaId ? null : spk.DienGiaId
                          )
                        }
                      >
                        ⋯
                      </button>
                      {activeDropdownId === spk.DienGiaId && (
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
                                handleEdit(spk);
                              }}
                            >
                              Sửa diễn giả
                            </button>
                            <div className="action-dropdown-divider"></div>
                            <button
                              type="button"
                              className="danger-text"
                              onClick={() => {
                                setActiveDropdownId(null);
                                handleDelete(spk);
                              }}
                            >
                              Xóa diễn giả
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="speaker-info">
                    <h4 className="speaker-name">{spk.HoTen}</h4>
                    {spk.ChucDanh ? (
                      <span className="speaker-title">{spk.ChucDanh}</span>
                    ) : (
                      <span className="speaker-title text-muted">Chưa cập nhật chức danh</span>
                    )}
                    {spk.DonVi ? (
                      <span className="speaker-org">🏢 {spk.DonVi}</span>
                    ) : (
                      <span className="speaker-org text-muted">🏢 Chưa cập nhật đơn vị</span>
                    )}
                  </div>

                  <div className="speaker-bio" title={spk.GioiThieu}>
                    {spk.GioiThieu ? (
                      spk.GioiThieu
                    ) : (
                      <span className="text-muted">Chưa cập nhật phần giới thiệu</span>
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

export default AdminSpeakers;
