import {
  useEffect,
  useState,
} from "react";

import {
  getEvents,
} from "../services/api";


function Dashboard() {
  const [events, setEvents] =
    useState([]);

  const [loading, setLoading] =
    useState(true);


  useEffect(() => {
    async function loadDashboard() {
      try {
        const data = await getEvents();

        setEvents(data);

      } catch (error) {
        console.error(
          "Dashboard error:",
          error
        );

      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);


  const totalEvents = events.length;


  const draftEvents = events.filter(
    (event) =>
      event.TrangThai === "NHAP"
  ).length;


  const approvedEvents = events.filter(
    (event) =>
      event.TrangThai === "DA_DUYET"
  ).length;


  const otherEvents =
    totalEvents
    - draftEvents
    - approvedEvents;


  if (loading) {
    return (
      <p>
        Đang tải Dashboard...
      </p>
    );
  }


  return (
    <div>

      <div className="page-header">
        <div>
          <h1>Tổng quan</h1>

          <p>
            Theo dõi hoạt động hệ thống
            quản lý sự kiện
          </p>
        </div>
      </div>


      {/* STAT CARDS */}

      <div className="stats-grid">

        <div className="stat-card">

          <span className="stat-label">
            Tổng sự kiện
          </span>

          <strong className="stat-number">
            {totalEvents}
          </strong>

        </div>


        <div className="stat-card">

          <span className="stat-label">
            Bản nháp
          </span>

          <strong className="stat-number">
            {draftEvents}
          </strong>

        </div>


        <div className="stat-card">

          <span className="stat-label">
            Đã duyệt
          </span>

          <strong className="stat-number">
            {approvedEvents}
          </strong>

        </div>


        <div className="stat-card">

          <span className="stat-label">
            Trạng thái khác
          </span>

          <strong className="stat-number">
            {otherEvents}
          </strong>

        </div>

      </div>


      {/* RECENT EVENTS */}

      <section className="dashboard-section">

        <div className="section-header">

          <h2>
            Sự kiện gần đây
          </h2>

        </div>


        {events.length === 0 ? (

          <p>
            Chưa có sự kiện.
          </p>

        ) : (

          <div className="table-wrapper">

            <table className="data-table">

              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tên sự kiện</th>
                  <th>Địa điểm</th>
                  <th>Bắt đầu</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>

              <tbody>

                {events
                  .slice()
                  .reverse()
                  .slice(0, 5)
                  .map((event) => (

                    <tr key={event.SuKienId}>

                      <td>
                        #{event.SuKienId}
                      </td>

                      <td>
                        {event.TenSuKien}
                      </td>

                      <td>
                        {event.DiaDiem}
                      </td>

                      <td>
                        {new Date(
                          event.ThoiGianBatDau
                        ).toLocaleDateString(
                          "vi-VN"
                        )}
                      </td>

                      <td>
                        <span
                          className={
                            event.TrangThai
                            === "DA_DUYET"
                              ? "status approved"
                              : "status draft"
                          }
                        >
                          {event.TrangThai}
                        </span>
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


export default Dashboard;