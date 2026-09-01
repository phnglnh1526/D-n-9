import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  checkInRegistration,
  getEventRegistrations,
  getEvents,
  lookupForCheckIn,
} from "../services/api";

function CheckIn() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [registrations, setRegistrations] = useState([]);
  const [inputCode, setInputCode] = useState("");
  const [registration, setRegistration] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ==========================================
  // 1. LOAD EVENTS
  // ==========================================
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
      }
    }
    loadEvents();
  }, []);

  // ==========================================
  // 2. LOAD REGISTRATIONS OF SELECTED EVENT
  // ==========================================
  useEffect(() => {
    if (!selectedEventId) {
      setRegistrations([]);
      return;
    }

    async function loadRegistrations() {
      try {
        const data = await getEventRegistrations(selectedEventId);
        setRegistrations(Array.isArray(data) ? data : []);
      } catch (err) {
        // Handle silently
      }
    }

    loadRegistrations();
  }, [selectedEventId]);

  // ==========================================
  // 3. FIND REGISTRATION BY CODE / QR
  // ==========================================
  async function handleFindRegistration(e) {
    if (e) e.preventDefault();

    setError("");
    setSuccess("");
    setRegistration(null);

    const code = inputCode.trim();
    if (!code) {
      setError("Vui lòng nhập hoặc quét mã đăng ký / mã QR.");
      return;
    }

    setLoading(true);
    try {
      const found = await lookupForCheckIn(code, selectedEventId || null);
      setRegistration(found);

      if (found.DaCheckIn) {
        setSuccess(
          `Người tham dự "${found.HoTen}" đã check-in vào lúc ${
            found.ThoiGianCheckIn
              ? new Date(found.ThoiGianCheckIn).toLocaleString("vi-VN")
              : "trước đó"
          }.`
        );
      }
    } catch (err) {
      setError(
        err.message ||
          "Không tìm thấy vé hoặc mã không hợp lệ cho sự kiện này."
      );
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // 4. CONFIRM CHECK-IN
  // ==========================================
  async function handleCheckIn() {
    if (!registration) return;

    if (registration.DaCheckIn) {
      setError("Người tham dự này đã check-in trước đó. Không thể check-in lại.");
      return;
    }

    setChecking(true);
    setError("");
    setSuccess("");

    try {
      const isQR = registration.MaQR && inputCode.trim() === registration.MaQR;
      const method = isQR ? "QR" : "MANUAL";

      const result = await checkInRegistration(
        registration.DangKyId,
        method,
        registration.MaQR,
        selectedEventId || null
      );

      setRegistration(result);
      setSuccess(`Check-in thành công cho người tham dự "${result.HoTen}"!`);

      if (selectedEventId) {
        const updatedList = await getEventRegistrations(selectedEventId);
        setRegistrations(Array.isArray(updatedList) ? updatedList : []);
      }
    } catch (err) {
      setError(err.message || "Không thể thực hiện check-in");
    } finally {
      setChecking(false);
    }
  }

  const selectedEventObj = events.find(
    (ev) => String(ev.SuKienId) === String(selectedEventId)
  );

  const checkedCount = registrations.filter((r) => r.DaCheckIn).length;
  const totalCount = registrations.length;

  return (
    <div>
      {/* 1. PAGE HEADER */}
      <div className="page-header">
        <h1>Check-in Sự kiện</h1>
        <p>Quét mã QR hoặc nhập mã đăng ký để xác nhận người tham dự vào cổng.</p>
      </div>

      {/* 2. ALERTS */}
      {error && <div className="alert error-alert">{error}</div>}
      {success && <div className="alert success-alert">{success}</div>}

      {/* 3. TWO-COLUMN BALANCED CHECK-IN LAYOUT */}
      <div className="checkin-layout">
        {/* LEFT COLUMN: TRA CỨU VÉ */}
        <section className="checkin-panel">
          <h2>1. Tra cứu vé tham dự</h2>

          <div className="form-group">
            <label>Chọn sự kiện đang diễn ra *</label>
            <select
              value={selectedEventId}
              onChange={(e) => {
                setSelectedEventId(e.target.value);
                setInputCode("");
                setRegistration(null);
                setError("");
                setSuccess("");
              }}
            >
              {events.map((event) => (
                <option key={event.SuKienId} value={event.SuKienId}>
                  #{event.SuKienId} - {event.TenSuKien} ({event.TrangThai})
                </option>
              ))}
            </select>
          </div>

          {/* QUICK EVENT PROGRESS SNIPPET */}
          {selectedEventObj && (
            <div
              style={{
                backgroundColor: "#f8fafc",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                padding: "10px 14px",
                marginBottom: "16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "12.5px",
              }}
            >
              <span style={{ color: "var(--text-secondary)" }}>
                📍 {selectedEventObj.DiaDiem || "Tại hội trường"}
              </span>
              <span style={{ fontWeight: 600, color: "var(--primary)" }}>
                🎟️ Đã vào cổng: {checkedCount} / {totalCount}
              </span>
            </div>
          )}

          <form onSubmit={handleFindRegistration}>
            <div className="form-group">
              <label>Mã Đăng ký hoặc Chuỗi mã QR *</label>
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="Nhập mã (VD: REG-XXXXXXXXXX)..."
                autoFocus
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  fontFamily: "ui-monospace, SFMono-Regular, monospace",
                  padding: "11px 14px",
                }}
              />
              <small style={{ color: "var(--text-secondary)", marginTop: "4px" }}>
                💡 Ví dụ: REG-729B356026 hoặc dán chuỗi quét từ QR code của khách.
              </small>
            </div>

            <button
              type="submit"
              className="primary-button"
              disabled={loading}
              style={{ width: "100%", padding: "12px", marginTop: "6px" }}
            >
              {loading ? "🔄 Đang tra cứu vé..." : "🔍 Tra cứu & Xác thực vé"}
            </button>
          </form>

          {/* RECENT CHECK-IN ATTENDEES */}
          {registrations.length > 0 && (
            <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid var(--border-light)" }}>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  marginBottom: "8px",
                  textTransform: "uppercase",
                }}
              >
                Khách vừa check-in gần đây:
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {registrations
                  .filter((r) => r.DaCheckIn)
                  .slice(-3)
                  .reverse()
                  .map((r) => (
                    <div
                      key={r.DangKyId}
                      style={{
                        fontSize: "12.5px",
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "6px 10px",
                        backgroundColor: "#f8fafc",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{r.HoTen}</span>
                      <span className="code-badge" style={{ fontSize: "11px", padding: "2px 6px" }}>
                        {r.MaDangKy}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </section>

        {/* RIGHT COLUMN: THÔNG TIN NGƯỜI THAM DỰ */}
        <section className="checkin-panel">
          <h2>2. Thông tin người tham dự</h2>

          {!registration ? (
            <div className="checkin-empty">
              <span className="checkin-empty-icon">🎟️</span>
              <h3 style={{ fontSize: "16px", color: "var(--text-primary)", marginBottom: "6px" }}>
                Chưa có thông tin vé
              </h3>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", maxWidth: "320px", margin: "0 auto" }}>
                Vui lòng nhập mã đăng ký hoặc quét mã QR ở bảng bên trái để tra cứu người tham dự.
              </p>
            </div>
          ) : (
            <div className="attendee-card">
              <div className="attendee-card-header">
                <div className="attendee-avatar">
                  {registration.HoTen ? registration.HoTen.charAt(0).toUpperCase() : "👤"}
                </div>
                <div>
                  <h3 className="attendee-name">{registration.HoTen}</h3>
                  <div className="attendee-contact">
                    <span>✉️ {registration.Email}</span>
                    {registration.SoDienThoai && (
                      <span style={{ marginLeft: "12px" }}>📞 {registration.SoDienThoai}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* ATTENDEE DETAILS GRID */}
              <div className="attendee-info-grid">
                <div className="attendee-info-item">
                  <span>Mã Đăng ký</span>
                  <span className="code-badge">{registration.MaDangKy || "—"}</span>
                </div>

                <div className="attendee-info-item">
                  <span>Sự kiện</span>
                  <strong style={{ fontSize: "13px" }}>
                    {registration.TenSuKien || selectedEventObj?.TenSuKien || "—"}
                  </strong>
                </div>

                <div className="attendee-info-item">
                  <span>Trạng thái</span>
                  <div>
                    {registration.DaCheckIn ? (
                      <span className="status approved">✓ ĐÃ CHECK-IN</span>
                    ) : (
                      <span className="status draft">⏳ CHƯA CHECK-IN</span>
                    )}
                  </div>
                </div>

                <div className="attendee-info-item">
                  <span>Phương thức</span>
                  <strong>{registration.PhuongThucCheckIn || "Thủ công (Manual)"}</strong>
                </div>
              </div>

              {/* CHECK-IN ACTION OR ALREADY CHECKED-IN BOX */}
              {registration.DaCheckIn ? (
                <div>
                  <div className="checkin-success-box">
                    <strong>✓ Người tham dự đã check-in thành công vào cổng.</strong>
                    {registration.ThoiGianCheckIn && (
                      <div style={{ marginTop: "4px", fontSize: "12px" }}>
                        Thời gian check-in:{" "}
                        {new Date(registration.ThoiGianCheckIn).toLocaleString("vi-VN")}
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: "10px" }}>
                    <button className="disabled-button" disabled style={{ flex: 1, padding: "10px" }}>
                      ✓ Đã hoàn tất Check-in
                    </button>
                    <Link
                      to={`/feedback/${registration.DangKyId}`}
                      className="secondary-button"
                      style={{ textDecoration: "none", fontSize: "13px", padding: "10px 16px" }}
                    >
                      ⭐ Trang phản hồi
                    </Link>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="confirm-checkin-button"
                  onClick={handleCheckIn}
                  disabled={checking}
                >
                  {checking ? "🔄 Đang xác nhận..." : "✓ Xác nhận Check-in ngay"}
                </button>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default CheckIn;