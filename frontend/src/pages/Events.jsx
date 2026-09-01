import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router";
import { getEvents } from "../services/api";

function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("NEWEST");

  const token = sessionStorage.getItem("access_token");

  useEffect(() => {
    async function loadEvents() {
      try {
        const data = await getEvents();
        setEvents(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "Không thể tải danh sách sự kiện");
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, []);

  // Filter & Sort Events
  const filteredEvents = useMemo(() => {
    return events
      .filter((ev) => {
        // Search term filter
        const matchSearch =
          !searchTerm.trim() ||
          (ev.TenSuKien && ev.TenSuKien.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (ev.DiaDiem && ev.DiaDiem.toLowerCase().includes(searchTerm.toLowerCase()));

        // Status filter
        const matchStatus =
          statusFilter === "ALL" ||
          (statusFilter === "DA_DUYET" && (ev.TrangThai === "DA_DUYET" || ev.TrangThai === "DANG_DIEN_RA")) ||
          ev.TrangThai === statusFilter;

        return matchSearch && matchStatus;
      })
      .sort((a, b) => {
        if (sortBy === "NEWEST") {
          return b.SuKienId - a.SuKienId;
        }
        if (sortBy === "UPCOMING") {
          return new Date(a.ThoiGianBatDau) - new Date(b.ThoiGianBatDau);
        }
        if (sortBy === "CAPACITY") {
          return (b.SoLuongToiDa || 0) - (a.SoLuongToiDa || 0);
        }
        return 0;
      });
  }, [events, searchTerm, statusFilter, sortBy]);

  // Status mapping
  function renderStatusBadge(status) {
    switch (status) {
      case "DA_DUYET":
        return <span className="status approved">Đang mở</span>;
      case "DANG_DIEN_RA":
        return <span className="status approved">Đang diễn ra</span>;
      case "NHAP":
        return <span className="status draft">Bản nháp</span>;
      case "KET_THUC":
        return <span className="status pending">Đã kết thúc</span>;
      default:
        return <span className="status pending">{status || "Chưa xác định"}</span>;
    }
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-app)" }}>
      {/* 1. TOP HEADER NAVIGATION */}
      <header className="public-nav-container">
        <div className="public-nav">
          <div className="public-nav-brand">
            <h2>Event.AI</h2>
            <span>Khám phá sự kiện công nghệ và AI</span>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <Link
              to="/feedback"
              className="secondary-button"
              style={{ fontSize: "13px", padding: "8px 14px" }}
            >
              ⭐ Gửi đánh giá
            </Link>

            {token ? (
              <Link
                to="/dashboard"
                className="primary-button"
                style={{ fontSize: "13px", padding: "8px 16px" }}
              >
                🚀 Trang quản trị
              </Link>
            ) : (
              <Link
                to="/login"
                className="primary-button"
                style={{ fontSize: "13px", padding: "8px 16px" }}
              >
                🔐 Đăng nhập
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* 2. MAIN CONTAINER */}
      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px 20px" }}>
        {/* MINI HERO BANNER */}
        <section className="public-hero">
          <h1>Khám phá sự kiện</h1>
          <p>Tìm kiếm, theo dõi lịch trình và đăng ký những sự kiện phù hợp với bạn.</p>
        </section>

        {/* 3. FILTER & SEARCH BAR */}
        <section className="events-filter-bar">
          <input
            type="text"
            placeholder="🔍 Tìm theo tên sự kiện hoặc địa điểm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="DA_DUYET">Đang mở đăng ký</option>
            <option value="NHAP">Bản nháp</option>
            <option value="KET_THUC">Đã kết thúc</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="NEWEST">Sắp xếp: Mới nhất</option>
            <option value="UPCOMING">Sắp diễn ra</option>
            <option value="CAPACITY">Sức chứa lớn nhất</option>
          </select>
        </section>

        {/* ALERTS & LOADING */}
        {loading && (
          <div className="loading-state">
            <div className="loading-spinner" />
            <p>Đang tải danh sách sự kiện...</p>
          </div>
        )}

        {error && <div className="alert error-alert">{error}</div>}

        {/* 4. EVENT GRID */}
        {!loading && !error && (
          <>
            {filteredEvents.length === 0 ? (
              <div className="empty-state">
                <span className="empty-state-icon">🔍</span>
                <h3>Hiện chưa có sự kiện phù hợp.</h3>
                <p>Vui lòng thử tìm kiếm với từ khóa khác hoặc điều chỉnh bộ lọc trạng thái.</p>
              </div>
            ) : (
              <div className="public-event-grid">
                {filteredEvents.map((event) => (
                  <article className="public-event-card" key={event.SuKienId}>
                    <div>
                      <div className="event-card-header">
                        <span className="event-id-tag">Mã #{event.SuKienId}</span>
                        {renderStatusBadge(event.TrangThai)}
                      </div>

                      <h2 className="event-card-title">{event.TenSuKien}</h2>

                      <div className="event-card-info-list">
                        <div className="event-info-row">
                          <span className="event-info-icon">📍</span>
                          <div>
                            <span>Địa điểm: </span>
                            <span className="event-info-text">
                              {event.DiaDiem || "Chưa cập nhật địa điểm"}
                            </span>
                          </div>
                        </div>

                        <div className="event-info-row">
                          <span className="event-info-icon">⏰</span>
                          <div>
                            <span>Bắt đầu: </span>
                            <span className="event-info-text">
                              {new Date(event.ThoiGianBatDau).toLocaleString("vi-VN", {
                                hour: "2-digit",
                                minute: "2-digit",
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        </div>

                        <div className="event-info-row">
                          <span className="event-info-icon">👥</span>
                          <div>
                            <span>Sức chứa: </span>
                            <span className="event-info-text">
                              {event.SoLuongToiDa ? `${event.SoLuongToiDa} người tham dự` : "Không giới hạn"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid var(--border)" }}>
                      <Link
                        to={`/events/${event.SuKienId}`}
                        className="primary-button"
                        style={{ width: "100%", textAlign: "center" }}
                      >
                        Xem chi tiết & Đăng ký &rarr;
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default Events;