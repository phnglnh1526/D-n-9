import { useEffect, useState } from "react";
import { Link } from "react-router";

import { getEvents } from "../services/api";


function Home() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadEvents() {
      setLoading(true);
      setError("");

      try {
        const data = await getEvents();

        if (!cancelled) {
          setEvents(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadEvents();

    return () => {
      cancelled = true;
    };
  }, [retryCount]);

  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="home-hero-copy">
          <span className="home-eyebrow">
            EVENT MANAGEMENT AI
          </span>

          <h1>
            Quản lý sự kiện rõ ràng hơn,
            <span> vận hành thông minh hơn.</span>
          </h1>

          <p>
            Theo dõi sự kiện, người tham dự và tỷ lệ check-in
            trên một nền tảng duy nhất.
          </p>

          <div className="home-actions">
            <Link
              className="primary-button"
              to="/events"
            >
              Xem danh sách sự kiện
            </Link>

            <Link
              className="secondary-button"
              to="/login"
            >
              Mở trang quản trị
            </Link>
          </div>
        </div>

        <div className="home-hero-note">
          <span className="home-note-label">
            TRUNG TÂM ĐIỀU HÀNH
          </span>

          <strong>
            Từ đăng ký đến check-in
          </strong>

          <p>
            Dữ liệu vận hành được cập nhật từ hệ thống để
            người tổ chức theo dõi và ra quyết định nhanh hơn.
          </p>

          <Link
            className="home-note-link"
            to="/admin/ai"
          >
            Xem phân tích tỷ lệ tham dự
            <span aria-hidden="true"> →</span>
          </Link>
        </div>
      </section>

      <section
        className="home-events-section"
        aria-labelledby="home-events-title"
      >
        <div className="home-section-heading">
          <div>
            <span className="home-eyebrow">
              DỮ LIỆU TRỰC TIẾP
            </span>

            <h2 id="home-events-title">
              Sự kiện mới nhất
            </h2>
          </div>

          <Link
            className="home-view-all"
            to="/events"
          >
            Xem tất cả
            <span aria-hidden="true"> →</span>
          </Link>
        </div>

        {loading && (
          <p
            className="home-status"
            aria-live="polite"
          >
            Đang tải sự kiện...
          </p>
        )}

        {error && (
          <div
            className="alert error-alert"
            role="alert"
          >
            <strong>
              Không thể tải danh sách sự kiện
            </strong>

            <p>{error}</p>

            <button
              className="secondary-button home-retry-button"
              type="button"
              onClick={() =>
                setRetryCount((count) => count + 1)
              }
            >
              Thử lại
            </button>
          </div>
        )}

        {!loading && !error && events.length === 0 && (
          <div className="empty-state">
            <h3>Chưa có sự kiện.</h3>
            <p>
              Các sự kiện được tạo trong trang quản trị sẽ
              xuất hiện tại đây.
            </p>
          </div>
        )}

        {!loading && !error && events.length > 0 && (
          <div className="event-list">
            {events.slice(0, 3).map((event) => (
              <article
                className="event-card"
                key={event.SuKienId}
              >
                <span className="home-event-status">
                  {event.TrangThai}
                </span>

                <h3>{event.TenSuKien}</h3>

                <p>
                  <strong>Địa điểm:</strong>{" "}
                  {event.DiaDiem || "Chưa cập nhật"}
                </p>

                <p>
                  <strong>Bắt đầu:</strong>{" "}
                  {new Date(
                    event.ThoiGianBatDau
                  ).toLocaleString("vi-VN")}
                </p>

                <Link
                  to={`/events/${event.SuKienId}`}
                  className="event-detail-button"
                >
                  Xem chi tiết
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}


export default Home;
