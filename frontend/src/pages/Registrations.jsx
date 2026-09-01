import { useEffect, useState } from "react";
import {
  checkInRegistration,
  getEventRegistrations,
  getEvents,
} from "../services/api";

function Registrations() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [registrations, setRegistrations] = useState([]);

  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
  const [checkingId, setCheckingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");

  // ======================================================
  // 1. LOAD EVENTS
  // ======================================================
  useEffect(() => {
    async function loadEvents() {
      try {
        const data = await getEvents();
        const list = Array.isArray(data) ? data : [];
        setEvents(list);
        if (list.length > 0) {
          setSelectedEventId(String(list[0].SuKienId));
        }
      } catch (err) {
        setError(err.message || "Không thể tải danh sách sự kiện");
      } finally {
        setLoadingEvents(false);
      }
    }

    loadEvents();
  }, []);

  // ======================================================
  // 2. LOAD REGISTRATIONS WHEN SELECTED EVENT CHANGES
  // ======================================================
  useEffect(() => {
    if (!selectedEventId) {
      setRegistrations([]);
      return;
    }

    async function loadRegistrations(eventId) {
      setLoadingRegistrations(true);
      setError("");

      try {
        const data = await getEventRegistrations(eventId);
        setRegistrations(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "Không thể tải danh sách đăng ký");
        setRegistrations([]);
      } finally {
        setLoadingRegistrations(false);
      }
    }

    loadRegistrations(selectedEventId);
  }, [selectedEventId]);

  // ======================================================
  // 3. CHECK-IN HANDLER
  // ======================================================
  async function handleCheckIn(registration) {
    if (registration.DaCheckIn) return;

    const confirmed = window.confirm(
      `Xác nhận check-in cho người tham dự "${registration.HoTen}"?`
    );
    if (!confirmed) return;

    setError("");
    setSuccess("");
    setCheckingId(registration.DangKyId);

    try {
      await checkInRegistration(registration.DangKyId, "MANUAL", null);
      setSuccess(`Check-in thành công cho ${registration.HoTen}.`);

      // Reload list
      const refreshed = await getEventRegistrations(selectedEventId);
      setRegistrations(Array.isArray(refreshed) ? refreshed : []);
    } catch (err) {
      setError(err.message || "Không thể thực hiện check-in");
    } finally {
      setCheckingId(null);
    }
  }

  // ======================================================
  // 4. FILTER & SEARCH
  // ======================================================
  const filteredRegistrations = registrations.filter((reg) => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return true;

    return (
      (reg.HoTen && reg.HoTen.toLowerCase().includes(keyword)) ||
      (reg.Email && reg.Email.toLowerCase().includes(keyword)) ||
      (reg.MaDangKy && reg.MaDangKy.toLowerCase().includes(keyword)) ||
      (reg.SoDienThoai && reg.SoDienThoai.toLowerCase().includes(keyword))
    );
  });

  const totalRegistrations = registrations.length;
  const checkedIn = registrations.filter((item) => item.DaCheckIn).length;
  const notCheckedIn = Math.max(0, totalRegistrations - checkedIn);

  if (loadingEvents) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>
        <p>Đang tải danh sách sự kiện...</p>
      </div>
    );
  }

  return (
    <div>
      {/* 1. TITLE & SUBTITLE */}
      <div className="page-header">
        <h1>Quản lý đăng ký</h1>
        <p>Theo dõi người tham dự và trạng thái check-in.</p>
      </div>

      {/* 2. COMPACT FILTER CARD */}
      <section className="filter-card">
        <div className="filter-grid">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Chọn sự kiện *</label>
            <select
              value={selectedEventId}
              onChange={(e) => {
                setSelectedEventId(e.target.value);
                setSearch("");
                setSuccess("");
                setError("");
              }}
            >
              {events.map((ev) => (
                <option key={ev.SuKienId} value={ev.SuKienId}>
                  #{ev.SuKienId} - {ev.TenSuKien} ({ev.TrangThai})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Tìm kiếm người tham dự</label>
            <input
              type="text"
              placeholder="🔍 Nhập tên, email, số điện thoại hoặc mã vé..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* 3. ALERTS */}
      {error && <div className="alert error-alert">{error}</div>}
      {success && <div className="alert success-alert">{success}</div>}

      {/* 4. STAT CARDS (UNIFORM HEIGHT & NUMBER HIGHLIGHT) */}
      <div
        className="stats-grid"
        style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "16px", marginBottom: "24px" }}
      >
        <div className="stat-card" style={{ borderTop: "4px solid var(--primary)" }}>
          <span className="stat-label">Tổng số đăng ký</span>
          <strong className="stat-number" style={{ color: "var(--primary)" }}>
            {totalRegistrations}
          </strong>
          <small>Người tham dự đã đăng ký vé</small>
        </div>

        <div className="stat-card" style={{ borderTop: "4px solid var(--success)" }}>
          <span className="stat-label">Đã Check-in</span>
          <strong className="stat-number" style={{ color: "var(--success)" }}>
            {checkedIn}
          </strong>
          <small>Đã hoàn thành thủ tục vào cổng</small>
        </div>

        <div className="stat-card" style={{ borderTop: "4px solid var(--warning)" }}>
          <span className="stat-label">Chưa Check-in</span>
          <strong className="stat-number" style={{ color: "var(--warning)" }}>
            {notCheckedIn}
          </strong>
          <small>Chưa có mặt tại sự kiện</small>
        </div>
      </div>

      {/* 5. REGISTRATION TABLE */}
      <section className="dashboard-section">
        <div className="section-header">
          <h2>Danh sách người đăng ký</h2>
          <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 500 }}>
            Hiển thị: <strong>{filteredRegistrations.length}</strong> / {totalRegistrations} vé
          </span>
        </div>

        {loadingRegistrations ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>
            <p>Đang tải danh sách đăng ký...</p>
          </div>
        ) : filteredRegistrations.length === 0 ? (
          <div className="empty-state">
            <h3>Chưa có người đăng ký sự kiện này.</h3>
            <p>
              {search
                ? "Không tìm thấy kết quả phù hợp với từ khóa tìm kiếm."
                : "Sự kiện hiện chưa có lượt đăng ký nào."}
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: "60px" }}>ID</th>
                  <th style={{ width: "160px" }}>Mã vé / QR</th>
                  <th>Người tham dự</th>
                  <th>Ngày đăng ký</th>
                  <th style={{ width: "160px" }}>Trạng thái Check-in</th>
                  <th style={{ width: "130px", textAlign: "center" }}>Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {filteredRegistrations.map((reg) => (
                  <tr key={reg.DangKyId}>
                    <td>
                      <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>
                        #{reg.DangKyId}
                      </span>
                    </td>

                    <td>
                      <span className="code-badge">{reg.MaDangKy || "—"}</span>
                    </td>

                    <td>
                      <strong style={{ fontSize: "14px", color: "var(--text-primary)", display: "block" }}>
                        {reg.HoTen}
                      </strong>
                      <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                        <span>✉️ {reg.Email}</span>
                        {reg.SoDienThoai && <span style={{ marginLeft: "10px" }}>📞 {reg.SoDienThoai}</span>}
                      </div>
                    </td>

                    <td>
                      <span style={{ fontSize: "13px", color: "var(--text-primary)" }}>
                        {reg.ThoiGianDangKy
                          ? new Date(reg.ThoiGianDangKy).toLocaleString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })
                          : "—"}
                      </span>
                    </td>

                    <td>
                      {reg.DaCheckIn ? (
                        <div>
                          <span className="status approved">Đã check-in</span>
                          {reg.ThoiGianCheckIn && (
                            <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px" }}>
                              {new Date(reg.ThoiGianCheckIn).toLocaleTimeString("vi-VN", {
                                hour: "2-digit",
                                minute: "2-digit",
                                day: "2-digit",
                                month: "2-digit",
                              })}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="status draft">Chưa check-in</span>
                      )}
                    </td>

                    <td style={{ textAlign: "center" }}>
                      {reg.DaCheckIn ? (
                        <button className="disabled-button" disabled style={{ width: "100%" }}>
                          ✓ Hoàn tất
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="checkin-button"
                          disabled={checkingId === reg.DangKyId}
                          onClick={() => handleCheckIn(reg)}
                          style={{ width: "100%", justifyContent: "center" }}
                        >
                          {checkingId === reg.DangKyId ? "Đang xử lý..." : "Check-in"}
                        </button>
                      )}
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

export default Registrations;