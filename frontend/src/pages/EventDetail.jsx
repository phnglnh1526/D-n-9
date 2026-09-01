import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useParams,
} from "react-router";

import {
  getEventById,
  getEventSessions,
  registerForEvent,
} from "../services/api";
import { getCurrentUser } from "../services/auth";
import { QRCodeSVG } from "qrcode.react";

const initialRegistrationForm = {
  HoTen: "",
  Email: "",
  SoDienThoai: "",
};


function EventDetail() {
  const { eventId } = useParams();

  const [event, setEvent] =
    useState(null);

  const [sessions, setSessions] =
    useState([]);

  const [currentUser, setCurrentUser] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // ==============================
  // REGISTRATION
  // ==============================

  const [showRegistration, setShowRegistration] =
    useState(false);

  const [registrationForm, setRegistrationForm] =
    useState(initialRegistrationForm);

  const [registering, setRegistering] =
    useState(false);

  const [registrationError, setRegistrationError] =
    useState("");

  const [registrationResult, setRegistrationResult] =
    useState(null);


  // ==============================
  // LOAD EVENT, SESSIONS & USER
  // ==============================

  useEffect(() => {
    async function loadEventData() {
      try {
        const token = sessionStorage.getItem("access_token");
        if (token) {
          try {
            const user = await getCurrentUser(token);
            setCurrentUser(user);
            setRegistrationForm((prev) => ({
              ...prev,
              HoTen: user.HoTen || "",
              Email: user.Email || "",
            }));
          } catch {
            // Token expired or invalid
          }
        }

        const [eventData, sessionData] = await Promise.all([
          getEventById(eventId),
          getEventSessions(eventId).catch(() => []),
        ]);

        setEvent(eventData);
        setSessions(sessionData);

      } catch (err) {
        setError(err.message);

      } finally {
        setLoading(false);
      }
    }

    loadEventData();

  }, [eventId]);


  // ==============================
  // FORM INPUT
  // ==============================

  function handleRegistrationChange(e) {
    const {
      name,
      value,
    } = e.target;

    setRegistrationForm(
      (current) => ({
        ...current,
        [name]: value,
      })
    );
  }


  // ==============================
  // SUBMIT REGISTRATION
  // ==============================

  async function handleRegistrationSubmit(e) {
    e.preventDefault();

    setRegistrationError("");
    setRegistrationResult(null);

    const token = sessionStorage.getItem("access_token");
    if (!token) {
      setRegistrationError("Vui lòng đăng nhập tài khoản trước khi đăng ký.");
      return;
    }

    setRegistering(true);

    try {
      const result =
        await registerForEvent(
          eventId,
          registrationForm
        );

      setRegistrationResult(result);

      setShowRegistration(false);

    } catch (err) {
      setRegistrationError(
        err.message
      );

    } finally {
      setRegistering(false);
    }
  }


  // ==============================
  // LOADING / ERROR
  // ==============================

  if (loading) {
    return (
      <div className="public-detail-page">
        <p>
          Đang tải sự kiện...
        </p>
      </div>
    );
  }


  if (error) {
    return (
      <div className="public-detail-page">

        <div className="alert error-alert">
          {error}
        </div>

        <Link
          to="/events"
          className="back-link"
        >
          ← Quay lại danh sách
        </Link>

      </div>
    );
  }


  if (!event) {
    return null;
  }


  // ==============================
  // UI
  // ==============================

  return (
    <div className="public-detail-page">

      <Link
        to="/events"
        className="back-link"
      >
        ← Danh sách sự kiện
      </Link>


      {/* EVENT INFO */}

      <div className="event-detail-card">

        <div className="event-detail-header">

          <div>

            <span className="event-code">
              Sự kiện #{event.SuKienId}
            </span>

            <h1>
              {event.TenSuKien}
            </h1>

          </div>


          <span
            className={
              event.TrangThai === "DA_DUYET"
                ? "status approved"
                : "status draft"
            }
          >
            {event.TrangThai}
          </span>

        </div>


        <div className="event-detail-grid">

          <div className="detail-item">

            <span>
              Địa điểm
            </span>

            <strong>
              {
                event.DiaDiem
                || "Chưa cập nhật"
              }
            </strong>

          </div>


          <div className="detail-item">

            <span>
              Thời gian bắt đầu
            </span>

            <strong>
              {new Date(
                event.ThoiGianBatDau
              ).toLocaleString(
                "vi-VN"
              )}
            </strong>

          </div>


          <div className="detail-item">

            <span>
              Thời gian kết thúc
            </span>

            <strong>
              {new Date(
                event.ThoiGianKetThuc
              ).toLocaleString(
                "vi-VN"
              )}
            </strong>

          </div>


          <div className="detail-item">
            <span>Trạng thái</span>
            <strong>{event.TrangThai}</strong>
          </div>

          <div className="detail-item">
            <span>Số lượng khách tối đa</span>
            <strong>
              {event.SoLuongToiDa
                ? `${event.SoLuongToiDa} người`
                : "Không giới hạn"}
            </strong>
          </div>
        </div>


        <div className="event-description">
          <h2>Giới thiệu sự kiện</h2>
          <p>{event.MoTa || "Sự kiện chưa có mô tả."}</p>
        </div>

        {/* SCHEDULE & SESSIONS */}
        {sessions.length > 0 && (
          <div className="event-description" style={{ marginTop: "24px" }}>
            <h2>📅 Lịch trình & Diễn giả</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px" }}>
              {sessions.map((sess) => (
                <div
                  key={sess.PhienSuKienId}
                  style={{
                    padding: "16px",
                    borderRadius: "12px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>
                      {sess.TieuDe}
                    </h3>
                    <span style={{ fontSize: "13px", padding: "4px 10px", borderRadius: "20px", background: "rgba(59, 130, 246, 0.15)", color: "#60a5fa" }}>
                      ⏰ {new Date(sess.ThoiGianBatDau).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} - {new Date(sess.ThoiGianKetThuc).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  {sess.DiaDiem && (
                    <div style={{ fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}>
                      📍 {sess.DiaDiem}
                    </div>
                  )}

                  {sess.MoTa && (
                    <p style={{ margin: "8px 0 0", fontSize: "14px", color: "#cbd5e1" }}>
                      {sess.MoTa}
                    </p>
                  )}

                  {sess.dien_gia && (
                    <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px dashed rgba(255, 255, 255, 0.1)", display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "13px" }}>
                        {sess.dien_gia.HoTen.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "13px" }}>
                          🎤 {sess.dien_gia.HoTen}
                        </div>
                        <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                          {sess.dien_gia.ChucDanh} {sess.dien_gia.DonVi ? `— ${sess.dien_gia.DonVi}` : ""}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* REGISTER BUTTON & STATUS NOTICE */}
        {!registrationResult && (
          <div>
            {event.TrangThai !== "DA_DUYET" && event.TrangThai !== "DANG_DIEN_RA" ? (
              <div
                style={{
                  marginTop: "20px",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  background: "rgba(239, 68, 68, 0.1)",
                  color: "#f87171",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                  fontWeight: 500,
                }}
              >
                🔒 Sự kiện hiện không mở đăng ký (Trạng thái: {event.TrangThai}).
              </div>
            ) : !currentUser ? (
              <div style={{ marginTop: "20px" }}>
                <Link
                  to="/login"
                  className="register-button"
                  style={{
                    display: "inline-block",
                    textDecoration: "none",
                    textAlign: "center",
                  }}
                >
                  🔑 Đăng nhập để đăng ký tham gia
                </Link>
              </div>
            ) : (
              <button
                className="register-button"
                onClick={() => {
                  setShowRegistration((current) => !current);
                  setRegistrationError("");
                }}
              >
                {showRegistration
                  ? "Đóng form đăng ký"
                  : "Đăng ký tham gia ngay"}
              </button>
            )}
          </div>
        )}

      </div>


      {/* ==============================
          REGISTRATION FORM
      ============================== */}

      {showRegistration && (

        <section className="registration-form-card">

          <h2>
            Đăng ký tham gia
          </h2>

          <p>
            Sự kiện:{" "}
            <strong>
              {event.TenSuKien}
            </strong>
          </p>


          {registrationError && (

            <div className="alert error-alert">
              {registrationError}
            </div>

          )}


          <form
            onSubmit={
              handleRegistrationSubmit
            }
          >

            <div className="form-group">

              <label>
                Họ và tên *
              </label>

              <input
                type="text"
                name="HoTen"
                value={
                  registrationForm.HoTen
                }
                onChange={
                  handleRegistrationChange
                }
                placeholder="Nguyễn Văn A"
                required
              />

            </div>


            <div className="form-group">

              <label>
                Email *
              </label>

              <input
                type="email"
                name="Email"
                value={
                  registrationForm.Email
                }
                onChange={
                  handleRegistrationChange
                }
                placeholder="example@gmail.com"
                required
              />

            </div>


            <div className="form-group">

              <label>
                Số điện thoại
              </label>

              <input
                type="tel"
                name="SoDienThoai"
                value={
                  registrationForm.SoDienThoai
                }
                onChange={
                  handleRegistrationChange
                }
                placeholder="0912345678"
              />

            </div>


            <button
              type="submit"
              className="primary-button"
              disabled={registering}
            >

              {registering
                ? "Đang đăng ký..."
                : "Xác nhận đăng ký"}

            </button>

          </form>

        </section>

      )}


      {/* ==============================
          SUCCESS RESULT
      ============================== */}

      {registrationResult && (

        <section className="registration-success">

          <div className="success-icon">
            ✓
          </div>

          <h2>
            Đăng ký thành công
          </h2>

          <p>
            Bạn đã đăng ký tham gia:
          </p>

          <strong className="registered-event-name">
            {event.TenSuKien}
          </strong>


          <div className="registration-result-grid">

            <div className="registration-code-box">

              <span>
                Mã đăng ký
              </span>

              <strong>
                {
                  registrationResult.MaDangKy
                }
              </strong>

            </div>


            <div className="registration-code-box qr-box">

  <span>
    Mã QR check-in
  </span>

  <QRCodeSVG
    value={registrationResult.MaQR}
    size={180}
    level="M"
    marginSize={4}
    title="Mã QR check-in sự kiện"
  />

  <strong className="qr-text">
    {registrationResult.MaQR}
  </strong>

  <button
    type="button"
    className="copy-code-button"
    onClick={() =>
      navigator.clipboard.writeText(
        registrationResult.MaQR
      )
    }
  >
    Sao chép mã QR
  </button>

</div>

          </div>


          <p className="registration-note">
            Hãy lưu mã đăng ký hoặc mã QR
            để sử dụng khi check-in.
          </p>
<Link
  to={`/feedback/${registrationResult.DangKyId}`}
  className="feedback-link-button"
>
  Gửi phản hồi sau khi check-in
</Link>

          <button
            className="secondary-button"
            onClick={() => {
              setRegistrationResult(null);
              setShowRegistration(false);
            }}
            
          >
            Đóng
          </button>

        </section>

      )}

    </div>
  );
}


export default EventDetail;