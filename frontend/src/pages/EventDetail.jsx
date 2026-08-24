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
  registerForEvent,
} from "../services/api";
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
  // LOAD EVENT
  // ==============================

  useEffect(() => {
    async function loadEvent() {
      try {
        const data =
          await getEventById(eventId);

        setEvent(data);

      } catch (err) {
        setError(err.message);

      } finally {
        setLoading(false);
      }
    }

    loadEvent();

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
    setRegistering(true);

    try {
      const result =
        await registerForEvent(
          eventId,
          registrationForm
        );

      setRegistrationResult(result);

      setRegistrationForm(
        initialRegistrationForm
      );

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

            <span>
              Trạng thái
            </span>

            <strong>
              {event.TrangThai}
            </strong>

          </div>

        </div>


        <div className="event-description">

          <h2>
            Giới thiệu sự kiện
          </h2>

          <p>
            {
              event.MoTa
              || "Sự kiện chưa có mô tả."
            }
          </p>

        </div>


        {/* REGISTER BUTTON */}

        {!registrationResult && (

          <button
            className="register-button"
            onClick={() => {
              setShowRegistration(
                (current) => !current
              );

              setRegistrationError("");
            }}
          >
            {showRegistration
              ? "Đóng form đăng ký"
              : "Đăng ký tham gia"}
          </button>

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