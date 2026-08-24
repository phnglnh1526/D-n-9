import {
  useEffect,
  useState,
} from "react";

import {
  checkInRegistration,
  getEventRegistrations,
  getEvents,
} from "../services/api";


function Registrations() {
  const [events, setEvents] =
    useState([]);

  const [selectedEventId, setSelectedEventId] =
    useState("");

  const [registrations, setRegistrations] =
    useState([]);

  const [loadingEvents, setLoadingEvents] =
    useState(true);

  const [loadingRegistrations, setLoadingRegistrations] =
    useState(false);

  const [checkingId, setCheckingId] =
    useState(null);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [search, setSearch] =
    useState("");


  // ======================================================
  // LOAD EVENTS
  // ======================================================

  useEffect(() => {
    async function loadEvents() {
      try {
        const data = await getEvents();

        setEvents(data);

        if (data.length > 0) {
          setSelectedEventId(
            String(data[0].SuKienId)
          );
        }

      } catch (err) {
        setError(err.message);

      } finally {
        setLoadingEvents(false);
      }
    }

    loadEvents();
  }, []);


  // ======================================================
  // LOAD REGISTRATIONS WHEN EVENT CHANGES
  // ======================================================

  useEffect(() => {
    if (!selectedEventId) {
      return;
    }

    loadRegistrations(selectedEventId);

  }, [selectedEventId]);


  async function loadRegistrations(eventId) {
    setLoadingRegistrations(true);
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
      setLoadingRegistrations(false);
    }
  }


  // ======================================================
  // CHECK-IN
  // ======================================================

  async function handleCheckIn(registration) {
    if (registration.DaCheckIn) {
      return;
    }

    const confirmed = window.confirm(
      `Xác nhận check-in cho "${registration.HoTen}"?`
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");
    setCheckingId(
      registration.DangKyId
    );

    try {
      await checkInRegistration(
        registration.DangKyId,
        "MANUAL",
        null
      );

      setSuccess(
        `Check-in thành công cho ${registration.HoTen}.`
      );

      await loadRegistrations(
        selectedEventId
      );

    } catch (err) {
      setError(err.message);

    } finally {
      setCheckingId(null);
    }
  }


  // ======================================================
  // FILTER
  // ======================================================

  const filteredRegistrations =
    registrations.filter(
      (registration) => {

        const keyword =
          search
            .trim()
            .toLowerCase();

        if (!keyword) {
          return true;
        }

        return (
          registration.HoTen
            ?.toLowerCase()
            .includes(keyword)
          ||
          registration.Email
            ?.toLowerCase()
            .includes(keyword)
          ||
          registration.MaDangKy
            ?.toLowerCase()
            .includes(keyword)
        );
      }
    );


  const totalRegistrations =
    registrations.length;

  const checkedIn =
    registrations.filter(
      (item) => item.DaCheckIn
    ).length;

  const notCheckedIn =
    totalRegistrations - checkedIn;


  if (loadingEvents) {
    return (
      <p>
        Đang tải danh sách sự kiện...
      </p>
    );
  }


  return (
    <div>

      {/* HEADER */}

      <div className="page-header">

        <h1>
          Quản lý đăng ký
        </h1>

        <p>
          Theo dõi người tham dự và
          trạng thái check-in.
        </p>

      </div>


      {/* SELECT EVENT */}

      <section className="filter-card">

        <div className="filter-grid">

          <div className="form-group">

            <label>
              Chọn sự kiện
            </label>

            <select
              value={selectedEventId}
              onChange={(event) => {
                setSelectedEventId(
                  event.target.value
                );

                setSearch("");
                setSuccess("");
                setError("");
              }}
            >

              {events.map(
                (eventItem) => (

                  <option
                    key={
                      eventItem.SuKienId
                    }
                    value={
                      eventItem.SuKienId
                    }
                  >
                    {eventItem.TenSuKien}
                  </option>

                )
              )}

            </select>

          </div>


          <div className="form-group">

            <label>
              Tìm người đăng ký
            </label>

            <input
              type="text"
              placeholder="Tên, email hoặc mã đăng ký..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />

          </div>

        </div>

      </section>


      {/* MESSAGE */}

      {error && (
        <div className="alert error-alert">
          {error}
        </div>
      )}

      {success && (
        <div className="alert success-alert">
          {success}
        </div>
      )}


      {/* STATISTICS */}

      <div className="registration-stats">

        <div className="mini-stat">

          <span>
            Tổng đăng ký
          </span>

          <strong>
            {totalRegistrations}
          </strong>

        </div>


        <div className="mini-stat">

          <span>
            Đã check-in
          </span>

          <strong>
            {checkedIn}
          </strong>

        </div>


        <div className="mini-stat">

          <span>
            Chưa check-in
          </span>

          <strong>
            {notCheckedIn}
          </strong>

        </div>

      </div>


      {/* TABLE */}

      <section className="dashboard-section">

        <div className="section-header">

          <h2>
            Danh sách người đăng ký
          </h2>

          <span>
            {filteredRegistrations.length}
            {" "}người
          </span>

        </div>


        {loadingRegistrations ? (

          <p>
            Đang tải danh sách đăng ký...
          </p>

        ) : filteredRegistrations.length === 0 ? (

          <div className="empty-state">

            <h3>
              Chưa có đăng ký
            </h3>

            <p>
              Sự kiện này chưa có người
              đăng ký hoặc không tìm thấy
              kết quả phù hợp.
            </p>

          </div>

        ) : (

          <div className="table-wrapper">

            <table className="data-table">

              <thead>
                <tr>
                  <th>ID</th>
                  <th>Người tham dự</th>
                  <th>Liên hệ</th>
                  <th>Mã đăng ký</th>
                  <th>Ngày đăng ký</th>
                  <th>Check-in</th>
                  <th>Thao tác</th>
                </tr>
              </thead>


              <tbody>

                {filteredRegistrations.map(
                  (registration) => (

                    <tr
                      key={
                        registration.DangKyId
                      }
                    >

                      <td>
                        #
                        {
                          registration.DangKyId
                        }
                      </td>


                      <td>

                        <strong>
                          {
                            registration.HoTen
                          }
                        </strong>

                      </td>


                      <td>

                        <div>
                          {
                            registration.Email
                          }
                        </div>

                        <small>
                          {
                            registration.SoDienThoai
                            || "—"
                          }
                        </small>

                      </td>


                      <td>

                        <code>
                          {
                            registration.MaDangKy
                          }
                        </code>

                      </td>


                      <td>

                        {registration.ThoiGianDangKy
                          ? new Date(
                              registration.ThoiGianDangKy
                            ).toLocaleString(
                              "vi-VN"
                            )
                          : "—"}

                      </td>


                      <td>

                        {registration.DaCheckIn ? (

                          <div>

                            <span className="status approved">
                              Đã check-in
                            </span>

                            {registration.ThoiGianCheckIn && (

                              <div className="checkin-time">
                                {new Date(
                                  registration.ThoiGianCheckIn
                                ).toLocaleString(
                                  "vi-VN"
                                )}
                              </div>

                            )}

                          </div>

                        ) : (

                          <span className="status pending">
                            Chưa check-in
                          </span>

                        )}

                      </td>


                      <td>

                        {registration.DaCheckIn ? (

                          <button
                            className="disabled-button"
                            disabled
                          >
                            Hoàn tất
                          </button>

                        ) : (

                          <button
                            className="checkin-button"
                            disabled={
                              checkingId
                              === registration.DangKyId
                            }
                            onClick={() =>
                              handleCheckIn(
                                registration
                              )
                            }
                          >

                            {checkingId
                              === registration.DangKyId
                                ? "Đang xử lý..."
                                : "Check-in"}

                          </button>

                        )}

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </section>

    </div>
  );
}


export default Registrations;