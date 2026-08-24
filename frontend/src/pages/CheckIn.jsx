import {
  useEffect,
  useState,
} from "react";

import {
  checkInRegistration,
  getEventRegistrations,
  getEvents,
} from "../services/api";
import { Link } from "react-router";

function CheckIn() {
  const [events, setEvents] =
    useState([]);

  const [selectedEventId, setSelectedEventId] =
    useState("");

  const [registrations, setRegistrations] =
    useState([]);

  const [qrCode, setQrCode] =
    useState("");

  const [registration, setRegistration] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [checking, setChecking] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");


  // ==========================================
  // LOAD EVENTS
  // ==========================================

  useEffect(() => {

    async function loadEvents() {

      try {

        const data =
          await getEvents();

        setEvents(data);

        if (data.length > 0) {
          setSelectedEventId(
            String(data[0].SuKienId)
          );
        }

      } catch (err) {

        setError(err.message);

      }

    }

    loadEvents();

  }, []);


  // ==========================================
  // LOAD REGISTRATIONS
  // ==========================================

  useEffect(() => {

    if (!selectedEventId) {
      return;
    }

    loadRegistrations(
      selectedEventId
    );

  }, [selectedEventId]);


  async function loadRegistrations(
    eventId
  ) {

    setLoading(true);
    setError("");

    try {

      const data =
        await getEventRegistrations(
          eventId
        );

      setRegistrations(data);

    } catch (err) {

      setError(err.message);

    } finally {

      setLoading(false);

    }

  }


  // ==========================================
  // FIND QR
  // ==========================================

  async function handleFindRegistration(e) {
  e.preventDefault();

  setError("");
  setSuccess("");
  setRegistration(null);

  const code = qrCode
    .trim()
    .toLowerCase();

  if (!code) {
    setError(
      "Vui lòng nhập hoặc quét mã QR."
    );
    return;
  }

  try {
    // Luôn lấy dữ liệu mới nhất
    const latestRegistrations =
      await getEventRegistrations(
        selectedEventId
      );

    setRegistrations(
      latestRegistrations
    );

    const found =
      latestRegistrations.find(
        (item) =>
          item.MaQR
            ?.trim()
            .toLowerCase()
          === code
      );

    if (!found) {
      setError(
        "Không tìm thấy đăng ký phù hợp với mã QR của sự kiện đã chọn."
      );
      return;
    }

    setRegistration(found);

  } catch (err) {
    setError(err.message);
  }
}

  // ==========================================
  // CHECK-IN
  // ==========================================

  async function handleCheckIn() {

    if (!registration) {
      return;
    }


    if (registration.DaCheckIn) {

      setError(
        "Người tham dự này đã check-in trước đó."
      );

      return;

    }


    setChecking(true);
    setError("");
    setSuccess("");


    try {

      const result =
        await checkInRegistration(
          registration.DangKyId,
          "QR",
          registration.MaQR
        );


      setRegistration(result);

      setSuccess(
        `Check-in thành công cho ${result.HoTen}.`
      );


      await loadRegistrations(
        selectedEventId
      );

    } catch (err) {

      setError(err.message);

    } finally {

      setChecking(false);

    }

  }


  return (
    <div>

      <div className="page-header">

        <h1>
          Check-in sự kiện
        </h1>

        <p>
          Kiểm tra mã QR và xác nhận
          người tham dự.
        </p>

      </div>


      <div className="checkin-layout">

        {/* LEFT */}

        <section className="checkin-panel">

          <h2>
            Quét / nhập mã QR
          </h2>


          <div className="form-group">

            <label>
              Sự kiện
            </label>

            <select
              value={selectedEventId}
              onChange={(e) => {

                setSelectedEventId(
                  e.target.value
                );

                setQrCode("");
                setRegistration(null);
                setError("");
                setSuccess("");

              }}
            >

              {events.map(
                (event) => (

                  <option
                    key={event.SuKienId}
                    value={event.SuKienId}
                  >
                    {event.TenSuKien}
                  </option>

                )
              )}

            </select>

          </div>


          <form
            onSubmit={
              handleFindRegistration
            }
          >

            <div className="form-group">

              <label>
                Mã QR
              </label>

              <input
                type="text"
                value={qrCode}
                onChange={(e) =>
                  setQrCode(
                    e.target.value
                  )
                }
                placeholder="QR-XXXXXXXXXXXX..."
                autoFocus
              />

            </div>


            <button
              type="submit"
              className="primary-button"
              disabled={loading}
            >
              Kiểm tra mã
            </button>

          </form>


          {error && (

            <div className="alert error-alert checkin-alert">
              {error}
            </div>

          )}


          {success && (

            <div className="alert success-alert checkin-alert">
              {success}
            </div>

          )}

        </section>


        {/* RIGHT */}

        <section className="checkin-panel">

          <h2>
            Thông tin người tham dự
          </h2>


          {!registration ? (

            <div className="checkin-empty">

              <p>
                Nhập mã QR để tìm
                người tham dự.
              </p>

            </div>

          ) : (

            <div className="attendee-card">

              <div className="attendee-avatar">
                {
                  registration.HoTen
                    ?.charAt(0)
                    .toUpperCase()
                }
              </div>


              <h2>
                {registration.HoTen}
              </h2>


              <p>
                {registration.Email}
              </p>


              <div className="attendee-info">

                <div>

                  <span>
                    Mã đăng ký
                  </span>

                  <strong>
                    {
                      registration.MaDangKy
                    }
                  </strong>

                </div>


                <div>

                  <span>
                    Số điện thoại
                  </span>

                  <strong>
                    {
                      registration.SoDienThoai
                      || "—"
                    }
                  </strong>

                </div>


                <div>

                  <span>
                    Trạng thái
                  </span>

                  <strong>
                    {registration.DaCheckIn
                      ? "Đã check-in"
                      : "Chưa check-in"}
                  </strong>

                </div>


                <div>

                  <span>
                    Phương thức
                  </span>

                  <strong>
                    {
                      registration.PhuongThucCheckIn
                      || "—"
                    }
                  </strong>

                </div>

              </div>


              {registration.DaCheckIn ? (

                <div className="checkin-completed">

  <div className="already-checkin">
    ✓ Người tham dự đã check-in
  </div>

  <Link
    to={`/feedback/${registration.DangKyId}`}
    className="feedback-after-checkin"
  >
    Gửi phản hồi sự kiện
  </Link>

</div>

              ) : (

                <button
                  className="confirm-checkin-button"
                  onClick={
                    handleCheckIn
                  }
                  disabled={checking}
                >

                  {checking
                    ? "Đang check-in..."
                    : "Xác nhận check-in"}

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