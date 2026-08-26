import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  getEvents
} from "../services/api";


function Events() {
  const [events, setEvents] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [retryCount, setRetryCount] =
    useState(0);


  useEffect(() => {
    async function loadEvents() {
      try {
        const data = await getEvents();
        setEvents(data);

      } catch (err) {
        setError(err.message);

      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, [retryCount]);


  if (loading) {
    return <p>Đang tải sự kiện...</p>;
  }

  if (error) {
    return (
      <div className="page">
        <div className="alert error-alert" role="alert">
          <strong>Không thể tải danh sách sự kiện</strong>
          <p>{error}</p>
          <button
            className="secondary-button"
            type="button"
            onClick={() => {
              setError("");
              setLoading(true);
              setRetryCount((count) => count + 1);
            }}
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }


  return (
  <div className="page">

    <h1>Danh sách sự kiện</h1>

    {events.length === 0 ? (
      <p>Chưa có sự kiện.</p>
    ) : (
      <div className="event-list">

        {events.map((event) => (
          <div
            className="event-card"
            key={event.SuKienId}
          >

            <h3>
              {event.TenSuKien}
            </h3>

            <p>
              <strong>Mã:</strong>{" "}
              {event.SuKienId}
            </p>

            <p>
              <strong>Địa điểm:</strong>{" "}
              {event.DiaDiem}
            </p>

            <p>
              <strong>Trạng thái:</strong>{" "}
              {event.TrangThai}
            </p>
            <Link           
              to={`/events/${event.SuKienId}`}
              className="event-detail-button"
            >
            Xem chi tiết
            </Link>
          </div>
        ))}

      </div>
    )}

  </div>
);
}


export default Events;