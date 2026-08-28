import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  getDashboardOverview,
  getEvents,
  getEventStatistics,
} from "../services/api";
import { getCurrentUser } from "../services/auth";

const EVENT_STATUS_LABELS = {
  DA_DUYET: "Đang mở",
  DANG_DIEN_RA: "Đang diễn ra",
  KET_THUC: "Đã kết thúc",
  NHAP: "Bản nháp",
};

function getEventStatusLabel(status) {
  return EVENT_STATUS_LABELS[status] || status || "Không xác định";
}

function DistributionCustomTooltip({ active, payload, totalRegistrations }) {
  if (active && payload && payload.length) {
    const data = payload[0];
    const isCheckedIn = data.dataKey === "checkedIn";
    const label = isCheckedIn ? "Đã check-in" : "Chưa check-in";
    const value = data.value || 0;
    const color = isCheckedIn ? "var(--success)" : "var(--warning)";
    const percent =
      totalRegistrations > 0
        ? Math.round(((value / totalRegistrations) * 100) * 10) / 10
        : 0;

    return (
      <div className="analytics-chart-tooltip">
        <div className="analytics-chart-tooltip__header">
          <span
            className="analytics-chart-tooltip__dot"
            style={{ backgroundColor: color }}
            aria-hidden="true"
          />
          <strong className="analytics-chart-tooltip__title">{label}</strong>
        </div>
        <div className="analytics-chart-tooltip__body">
          <span className="analytics-chart-tooltip__value">
            {(Number(value) || 0).toLocaleString("vi-VN")} người
          </span>
          <span className="analytics-chart-tooltip__percent">
            ({percent}% tổng đăng ký)
          </span>
        </div>
      </div>
    );
  }
  return null;
}

function TrendCustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="analytics-chart-tooltip">
        <div className="analytics-chart-tooltip__header">
          <strong className="analytics-chart-tooltip__title">{data.eventName}</strong>
        </div>
        <div className="analytics-chart-tooltip__body" style={{ flexDirection: "column", alignItems: "flex-start", gap: "2px" }}>
          <span>Đăng ký: <strong>{(Number(data.registrations) || 0).toLocaleString("vi-VN")}</strong></span>
          <span>Check-in: <strong style={{ color: "var(--success)" }}>{(Number(data.checkIns) || 0).toLocaleString("vi-VN")}</strong></span>
          <span>Tỷ lệ tham dự: <strong style={{ color: "var(--primary)" }}>{data.attendanceRate}%</strong></span>
        </div>
      </div>
    );
  }
  return null;
}

function Dashboard() {
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState("");

  // Statistics Data State
  const [overviewStats, setOverviewStats] = useState({
    TongSoSuKien: 0,
    TongDangKy: 0,
    TongCheckIn: 0,
    TyLeThamDu: 0.0,
    TongPhanHoi: 0,
    DiemTrungBinh: 0.0,
    SuKienTheoTrangThai: {
      DA_DUYET: 0,
      DANG_DIEN_RA: 0,
      KET_THUC: 0,
      NHAP: 0,
    },
  });

  const [singleEventStats, setSingleEventStats] = useState(null);
  const [comparisonStats, setComparisonStats] = useState([]);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [comparisonError, setComparisonError] = useState("");

  // ==========================================
  // 1. INITIAL LOAD: USER, EVENTS & OVERVIEW
  // ==========================================
  useEffect(() => {
    async function loadInitialData() {
      setLoading(true);
      setError("");

      const token = sessionStorage.getItem("access_token");

      try {
        const promises = [getEvents(), getDashboardOverview()];
        if (token) {
          promises.push(getCurrentUser(token));
        }

        const results = await Promise.all(promises);
        const eventsData = results[0];
        const overviewData = results[1];
        const userData = results[2];

        setEvents(Array.isArray(eventsData) ? eventsData : []);
        if (overviewData) {
          setOverviewStats(overviewData);
        }
        if (userData) {
          setUser(userData);
        }
      } catch (err) {
        setError(err.message || "Không thể tải dữ liệu thống kê Dashboard");
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, []);

  // ==========================================
  // 2. SWITCH EVENT FILTER
  // ==========================================
  useEffect(() => {
    async function fetchStatsForSelection() {
      if (selectedEventId === "ALL") {
        setSingleEventStats(null);
        return;
      }

      setStatsLoading(true);
      try {
        const data = await getEventStatistics(Number(selectedEventId));
        setSingleEventStats(data);
      } catch (err) {
        // Handled silently
      } finally {
        setStatsLoading(false);
      }
    }

    fetchStatsForSelection();
  }, [selectedEventId]);

  // ==========================================
  // 3. LOAD COMPARISON & TREND DATASET (Top 5-6 events)
  // ==========================================
  useEffect(() => {
    let isMounted = true;

    async function loadComparisonData() {
      if (!events || events.length === 0) {
        if (isMounted) setComparisonStats([]);
        return;
      }

      setComparisonLoading(true);
      setComparisonError("");

      try {
        // Take up to 6 most recent events
        const targetEvents = events.slice(0, 6);

        const statsPromises = targetEvents.map(async (ev) => {
          try {
            const stat = await getEventStatistics(ev.SuKienId);
            const registrations = stat?.TongDangKy || 0;
            const checkIns = stat?.DaCheckIn || 0;
            const rate =
              stat?.TyLeCheckIn != null
                ? Math.min(100, Math.max(0, Number(stat.TyLeCheckIn)))
                : (registrations > 0
                    ? Math.min(100, Math.round(((checkIns / registrations) * 100) * 10) / 10)
                    : 0);

            return {
              eventId: ev.SuKienId,
              eventName: ev.TenSuKien,
              shortName:
                ev.TenSuKien.length > 14
                  ? `${ev.TenSuKien.slice(0, 13)}…`
                  : ev.TenSuKien,
              startTime: ev.ThoiGianBatDau,
              registrations,
              checkIns,
              attendanceRate: rate,
            };
          } catch {
            return {
              eventId: ev.SuKienId,
              eventName: ev.TenSuKien,
              shortName:
                ev.TenSuKien.length > 14
                  ? `${ev.TenSuKien.slice(0, 13)}…`
                  : ev.TenSuKien,
              startTime: ev.ThoiGianBatDau,
              registrations: 0,
              checkIns: 0,
              attendanceRate: 0,
            };
          }
        });

        const results = await Promise.all(statsPromises);
        if (isMounted) {
          setComparisonStats(results);
        }
      } catch (err) {
        if (isMounted) {
          setComparisonError("Không thể tải dữ liệu so sánh sự kiện.");
        }
      } finally {
        if (isMounted) {
          setComparisonLoading(false);
        }
      }
    }

    loadComparisonData();

    return () => {
      isMounted = false;
    };
  }, [events]);

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>
        <p>Đang tải dữ liệu tổng quan...</p>
      </div>
    );
  }

  // Determine current active metrics (Overview vs Single Event)
  const isAll = selectedEventId === "ALL";

  const totalEvents = isAll ? overviewStats.TongSoSuKien : 1;

  const totalRegistrations = isAll
    ? overviewStats.TongDangKy
    : singleEventStats?.TongDangKy || 0;

  const totalCheckIns = isAll
    ? overviewStats.TongCheckIn
    : singleEventStats?.DaCheckIn || 0;

  const uncheckedCount = isAll
    ? Math.max(0, totalRegistrations - totalCheckIns)
    : singleEventStats?.ChuaCheckIn || 0;

  const attendanceRate = isAll
    ? overviewStats.TyLeThamDu
    : singleEventStats?.TyLeCheckIn || 0.0;

  const avgFeedbackScore = isAll
    ? overviewStats.DiemTrungBinh
    : singleEventStats?.DiemTrungBinh || 0.0;

  const totalFeedbacks = isAll
    ? overviewStats.TongPhanHoi
    : singleEventStats?.TongPhanHoi || 0;

  const selectedEventObj = events.find(
    (e) => String(e.SuKienId) === String(selectedEventId)
  );

  const safeAttendanceRate =
    isNaN(attendanceRate) || attendanceRate < 0
      ? 0
      : Math.min(100, Number(attendanceRate));

  const checkedInPercent =
    totalRegistrations > 0
      ? Math.round(((totalCheckIns / totalRegistrations) * 100) * 10) / 10
      : 0;

  const uncheckedPercent =
    totalRegistrations > 0
      ? Math.max(0, Math.round((100 - checkedInPercent) * 10) / 10)
      : 0;

  // Trend dataset (chronological: cũ -> mới)
  const trendData = [...comparisonStats].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  // Ranking dataset (attendanceRate descending, max 5)
  const rankingData = [...comparisonStats]
    .filter((e) => e.registrations > 0)
    .sort((a, b) => b.attendanceRate - a.attendanceRate)
    .slice(0, 5);

  const renderCustomDot = (props) => {
    const { cx, cy, payload } = props;
    const isSelected = String(payload?.eventId) === String(selectedEventId);

    if (isSelected) {
      return (
        <g key={`dot-${payload?.eventId || Math.random()}`}>
          <circle cx={cx} cy={cy} r={7} fill="rgba(37, 99, 235, 0.2)" />
          <circle cx={cx} cy={cy} r={4} fill="var(--primary)" stroke="#fff" strokeWidth={2} />
        </g>
      );
    }

    return (
      <circle
        key={`dot-${payload?.eventId || Math.random()}`}
        cx={cx}
        cy={cy}
        r={3.5}
        fill="var(--primary)"
        stroke="#fff"
        strokeWidth={1.5}
      />
    );
  };

  return (
    <div className="analytics-page">
      {/* ========================================
          SECTION 1: PAGE HEADER
          ======================================== */}
      <header className="analytics-page-header">
        <div className="analytics-page-header__left">
          <div className="analytics-page-header__icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v18h18" />
              <path d="m19 9-5 5-4-4-3 3" />
            </svg>
          </div>
          <div className="analytics-page-header__titles">
            <h1 className="analytics-page-header__title">Phân tích tỷ lệ tham dự</h1>
            <p className="analytics-page-header__subtitle">Theo dõi mức độ tham gia và hiệu quả của từng sự kiện.</p>
          </div>
        </div>

        <div className="analytics-page-header__right" role="toolbar" aria-label="Bộ lọc và công cụ">
          {/* TODO: Date range filter — chưa có API hỗ trợ */}
          <button
            type="button"
            className="analytics-btn analytics-btn--outline"
            disabled
            title="Bộ lọc khoảng thời gian (sẽ triển khai ở bước sau)"
            aria-label="Khoảng thời gian (chưa khả dụng)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
              <line x1="16" x2="16" y1="2" y2="6"/>
              <line x1="8" x2="8" y1="2" y2="6"/>
              <line x1="3" x2="21" y1="10" y2="10"/>
            </svg>
            <span>Khoảng thời gian</span>
          </button>

          {/* TODO: AI phân tích — sẽ kết nối AI endpoint ở bước sau */}
          <button
            type="button"
            className="analytics-btn analytics-btn--primary"
            disabled
            title="Sẽ được triển khai ở bước AI Analytics"
            aria-label="AI phân tích chuyên sâu (sẽ triển khai ở bước sau)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>
            </svg>
            <span>AI phân tích chuyên sâu</span>
          </button>
        </div>
      </header>

      {error && <div className="alert error-alert">{error}</div>}

      {/* ========================================
          SECTION 2: EVENT SELECTOR (Context Selector)
          ======================================== */}
      <section className="analytics-event-selector" aria-labelledby="event-selector-label">
        <div className="analytics-event-selector__header">
          <label id="event-selector-label" htmlFor="event-selector-dropdown" className="analytics-event-selector__label">
            SỰ KIỆN ĐANG PHÂN TÍCH
          </label>
        </div>

        <div className="analytics-event-selector__control-wrapper">
          <span className="analytics-event-selector__icon" aria-hidden="true">
            {isAll ? "🌐" : "🎯"}
          </span>
          <select
            id="event-selector-dropdown"
            className="analytics-event-selector__dropdown"
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            aria-label="Chọn sự kiện để phân tích dữ liệu"
          >
            <option value="ALL">Toàn bộ sự kiện (Tổng quan hệ thống)</option>
            {events.map((ev) => (
              <option key={ev.SuKienId} value={ev.SuKienId}>
                #{ev.SuKienId} — {ev.TenSuKien} {ev.TrangThai ? `(${getEventStatusLabel(ev.TrangThai)})` : ""}
              </option>
            ))}
          </select>
          <span className="analytics-event-selector__arrow" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </span>
        </div>

        {/* Inline context & metadata */}
        <div className="analytics-event-selector__meta-bar">
          {isAll ? (
            <div className="analytics-event-selector__meta-all">
              <span className="analytics-event-selector__meta-item">
                📊 Tổng hợp dữ liệu từ <strong>{totalEvents}</strong> sự kiện trong hệ thống
              </span>
            </div>
          ) : selectedEventObj ? (
            <div className="analytics-event-selector__meta-list">
              {selectedEventObj.ThoiGianBatDau && (
                <span className="analytics-event-selector__meta-chip">
                  ⏰ {new Date(selectedEventObj.ThoiGianBatDau).toLocaleString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </span>
              )}

              {selectedEventObj.DiaDiem && selectedEventObj.DiaDiem.trim() && (
                <span className="analytics-event-selector__meta-chip">
                  📍 {selectedEventObj.DiaDiem.trim()}
                </span>
              )}

              {selectedEventObj.SoLuongToiDa && Number(selectedEventObj.SoLuongToiDa) > 0 && (
                <span className="analytics-event-selector__meta-chip">
                  👥 Sức chứa: {selectedEventObj.SoLuongToiDa} khách
                </span>
              )}

              {selectedEventObj.TrangThai && (
                <span className={`analytics-event-status-badge analytics-event-status-badge--${selectedEventObj.TrangThai.toLowerCase()}`}>
                  {getEventStatusLabel(selectedEventObj.TrangThai)}
                </span>
              )}
            </div>
          ) : null}
        </div>
      </section>

      {/* ========================================
          SECTION 3: KPI CARDS — 4 metrics
          ======================================== */}
      <section className="analytics-kpi-grid" aria-label="Các chỉ số hiệu quả chính">
        {/* KPI 1: Tổng đăng ký */}
        <div className="analytics-kpi-card">
          <div className="analytics-kpi-card__header">
            <div className="analytics-kpi-card__icon analytics-kpi-card__icon--primary" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <span className="analytics-kpi-card__label">Tổng đăng ký</span>
          </div>
          <div className="analytics-kpi-card__body">
            <strong className="analytics-kpi-card__value analytics-kpi-card__value--primary">
              {statsLoading ? "..." : (Number(totalRegistrations) || 0).toLocaleString("vi-VN")}
            </strong>
            <span className="analytics-kpi-card__sub">Người đã đăng ký tham gia</span>
          </div>
        </div>

        {/* KPI 2: Đã check-in */}
        <div className="analytics-kpi-card">
          <div className="analytics-kpi-card__header">
            <div className="analytics-kpi-card__icon analytics-kpi-card__icon--success" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <span className="analytics-kpi-card__label">Đã check-in</span>
          </div>
          <div className="analytics-kpi-card__body">
            <strong className="analytics-kpi-card__value analytics-kpi-card__value--success">
              {statsLoading ? "..." : (Number(totalCheckIns) || 0).toLocaleString("vi-VN")}
            </strong>
            <span className="analytics-kpi-card__sub">Người đã tham dự</span>
          </div>
        </div>

        {/* KPI 3: Chưa check-in */}
        <div className="analytics-kpi-card">
          <div className="analytics-kpi-card__header">
            <div className="analytics-kpi-card__icon analytics-kpi-card__icon--warning" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <span className="analytics-kpi-card__label">Chưa check-in</span>
          </div>
          <div className="analytics-kpi-card__body">
            <strong className="analytics-kpi-card__value analytics-kpi-card__value--warning">
              {statsLoading ? "..." : (Number(uncheckedCount) || 0).toLocaleString("vi-VN")}
            </strong>
            <span className="analytics-kpi-card__sub">Người chưa ghi nhận tham dự</span>
          </div>
        </div>

        {/* KPI 4: Tỷ lệ tham dự (Hero Metric) */}
        <div className="analytics-kpi-card analytics-kpi-card--hero">
          <div className="analytics-kpi-card__header">
            <div className="analytics-kpi-card__icon analytics-kpi-card__icon--hero" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                <polyline points="16 7 22 7 22 13" />
              </svg>
            </div>
            <span className="analytics-kpi-card__label">Tỷ lệ tham dự</span>
          </div>
          <div className="analytics-kpi-card__body">
            <strong className="analytics-kpi-card__value analytics-kpi-card__value--hero">
              {statsLoading ? "..." : `${safeAttendanceRate}%`}
            </strong>
            <div
              className="analytics-progress-bar"
              role="progressbar"
              aria-valuenow={safeAttendanceRate}
              aria-valuemin="0"
              aria-valuemax="100"
              aria-label="Tỷ lệ tham dự thực tế"
            >
              <div
                className="analytics-progress-bar__fill analytics-progress-bar__fill--primary"
                style={{ width: `${safeAttendanceRate}%` }}
              />
            </div>
            <span className="analytics-kpi-card__sub">Tỷ lệ check-in trên tổng đăng ký</span>
          </div>
        </div>
      </section>

      {/* ========================================
          SECTION 4: MAIN ANALYTICS + AI INSIGHT
          ======================================== */}
      <div className="analytics-main-grid">
        {/* === LEFT: Main Analytics Area (8/12) === */}
        <div className="analytics-main-area">

          {/* 4A: Phân bổ người tham dự — real chart */}
          <div className="analytics-card analytics-card--large">
            <div className="analytics-card__header">
              <div>
                <h3 className="analytics-card__title">Phân bổ người tham dự</h3>
                <p className="analytics-card__subtitle">
                  {isAll
                    ? "Theo trạng thái check-in của toàn bộ sự kiện"
                    : "Theo trạng thái check-in của người đăng ký"}
                </p>
              </div>
              <span className="analytics-distribution__badge">
                {safeAttendanceRate}% tham dự
              </span>
            </div>

            <div className="analytics-card__body">
              {totalRegistrations === 0 ? (
                <div className="analytics-empty-chart">
                  <div className="analytics-empty-chart__icon" aria-hidden="true">👥</div>
                  <h4 className="analytics-empty-chart__title">Chưa có dữ liệu đăng ký</h4>
                  <p className="analytics-empty-chart__text">
                    Biểu đồ phân bổ sẽ xuất hiện khi sự kiện có người đăng ký.
                  </p>
                </div>
              ) : (
                <div className="analytics-distribution">
                  {/* Summary row above chart */}
                  <div className="analytics-distribution__top-summary">
                    <span className="analytics-distribution__total-count">
                      <strong>{(Number(totalRegistrations) || 0).toLocaleString("vi-VN")}</strong> người đăng ký
                    </span>
                  </div>

                  {/* Horizontal Stacked Bar Chart */}
                  <div
                    className="analytics-distribution__chart-wrapper"
                    aria-label={`Biểu đồ phân bổ người đăng ký gồm ${totalCheckIns.toLocaleString("vi-VN")} người đã check-in (${checkedInPercent}%) và ${uncheckedCount.toLocaleString("vi-VN")} người chưa check-in (${uncheckedPercent}%).`}
                  >
                    <ResponsiveContainer width="100%" height={44}>
                      <BarChart
                        layout="vertical"
                        data={[
                          {
                            name: "Phân bổ",
                            checkedIn: totalCheckIns,
                            unchecked: uncheckedCount,
                          },
                        ]}
                        margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                      >
                        <XAxis type="number" domain={[0, totalRegistrations || 1]} hide />
                        <YAxis type="category" dataKey="name" hide />
                        <Tooltip
                          content={<DistributionCustomTooltip totalRegistrations={totalRegistrations} />}
                          cursor={{ fill: "transparent" }}
                        />
                        <Bar
                          dataKey="checkedIn"
                          name="Đã check-in"
                          stackId="attendanceStack"
                          fill="var(--success)"
                          radius={uncheckedCount === 0 ? [7, 7, 7, 7] : [7, 0, 0, 7]}
                          animationDuration={400}
                        />
                        <Bar
                          dataKey="unchecked"
                          name="Chưa check-in"
                          stackId="attendanceStack"
                          fill="var(--warning)"
                          radius={totalCheckIns === 0 ? [7, 7, 7, 7] : [0, 7, 7, 0]}
                          animationDuration={400}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Legend / Summary list below chart */}
                  <div className="analytics-distribution__legend">
                    <div className="analytics-distribution__legend-item">
                      <div className="analytics-distribution__legend-label">
                        <span className="analytics-distribution__dot analytics-distribution__dot--success" aria-hidden="true" />
                        <span>Đã check-in</span>
                      </div>
                      <div className="analytics-distribution__legend-values">
                        <strong>{(Number(totalCheckIns) || 0).toLocaleString("vi-VN")}</strong>
                        <span className="analytics-distribution__legend-percent">({checkedInPercent}%)</span>
                      </div>
                    </div>

                    <div className="analytics-distribution__legend-item">
                      <div className="analytics-distribution__legend-label">
                        <span className="analytics-distribution__dot analytics-distribution__dot--warning" aria-hidden="true" />
                        <span>Chưa check-in</span>
                      </div>
                      <div className="analytics-distribution__legend-values">
                        <strong>{(Number(uncheckedCount) || 0).toLocaleString("vi-VN")}</strong>
                        <span className="analytics-distribution__legend-percent">({uncheckedPercent}%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 4B + 4C: Secondary analytics row */}
          <div className="analytics-secondary-row">
            {/* 4B: Xu hướng hiệu quả sự kiện */}
            <div className="analytics-card">
              <div className="analytics-card__header">
                <div>
                  <h3 className="analytics-card__title">Xu hướng hiệu quả sự kiện</h3>
                  <p className="analytics-card__subtitle">Tỷ lệ tham dự của các sự kiện gần đây</p>
                </div>
              </div>
              <div className="analytics-card__body">
                {comparisonLoading ? (
                  <div className="analytics-card-loading">
                    <p>Đang tải dữ liệu xu hướng...</p>
                  </div>
                ) : comparisonError ? (
                  <div className="analytics-empty-chart">
                    <div className="analytics-empty-chart__icon" aria-hidden="true">⚠️</div>
                    <p className="analytics-empty-chart__text">{comparisonError}</p>
                  </div>
                ) : trendData.length < 2 ? (
                  <div className="analytics-empty-chart">
                    <div className="analytics-empty-chart__icon" aria-hidden="true">📈</div>
                    <h4 className="analytics-empty-chart__title">Chưa đủ dữ liệu xu hướng</h4>
                    <p className="analytics-empty-chart__text">
                      Cần dữ liệu từ ít nhất 2 sự kiện để hiển thị xu hướng.
                    </p>
                  </div>
                ) : (
                  <div
                    className="analytics-trend-chart-wrapper"
                    aria-label="Biểu đồ đường thể hiện xu hướng tỷ lệ tham dự qua các sự kiện gần đây"
                  >
                    <ResponsiveContainer width="100%" height={165}>
                      <LineChart
                        data={trendData}
                        margin={{ top: 8, right: 12, left: -20, bottom: 4 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
                        <XAxis
                          dataKey="shortName"
                          tick={{ fontSize: 11, fill: "var(--text-secondary)" }}
                          axisLine={{ stroke: "var(--border)" }}
                          tickLine={false}
                        />
                        <YAxis
                          domain={[0, 100]}
                          ticks={[0, 25, 50, 75, 100]}
                          tickFormatter={(val) => `${val}%`}
                          tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip content={<TrendCustomTooltip />} cursor={{ stroke: "rgba(37, 99, 235, 0.15)", strokeWidth: 1 }} />
                        <Line
                          type="monotone"
                          dataKey="attendanceRate"
                          name="Tỷ lệ tham dự"
                          stroke="var(--primary)"
                          strokeWidth={2.2}
                          dot={renderCustomDot}
                          activeDot={{ r: 6, fill: "var(--primary)", stroke: "#fff", strokeWidth: 2 }}
                          animationDuration={400}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            {/* 4C: So sánh sự kiện */}
            <div className="analytics-card">
              <div className="analytics-card__header">
                <div>
                  <h3 className="analytics-card__title">So sánh sự kiện</h3>
                  <p className="analytics-card__subtitle">Xếp hạng tỷ lệ tham dự giữa các sự kiện</p>
                </div>
              </div>
              <div className="analytics-card__body">
                {comparisonLoading ? (
                  <div className="analytics-card-loading">
                    <p>Đang tải dữ liệu so sánh...</p>
                  </div>
                ) : comparisonError ? (
                  <div className="analytics-empty-chart">
                    <div className="analytics-empty-chart__icon" aria-hidden="true">⚠️</div>
                    <p className="analytics-empty-chart__text">{comparisonError}</p>
                  </div>
                ) : rankingData.length === 0 ? (
                  <div className="analytics-empty-chart">
                    <div className="analytics-empty-chart__icon" aria-hidden="true">📊</div>
                    <h4 className="analytics-empty-chart__title">Chưa có dữ liệu so sánh</h4>
                    <p className="analytics-empty-chart__text">
                      Chưa có sự kiện nào có lượt đăng ký để xếp hạng.
                    </p>
                  </div>
                ) : (
                  <div className="analytics-comparison-list" role="list" aria-label="Bảng xếp hạng tỷ lệ tham dự sự kiện">
                    {rankingData.map((ev, index) => {
                      const isSelected = String(ev.eventId) === String(selectedEventId);
                      return (
                        <div
                          key={ev.eventId}
                          className={`analytics-comparison-item ${isSelected ? "analytics-comparison-item--active" : ""}`}
                          role="listitem"
                        >
                          <div className="analytics-comparison-item__top">
                            <div className="analytics-comparison-item__info">
                              <span className="analytics-comparison-item__rank">#{index + 1}</span>
                              <span className="analytics-comparison-item__name" title={ev.eventName}>
                                {ev.eventName}
                              </span>
                              {isSelected && (
                                <span className="analytics-comparison-item__badge">Đang xem</span>
                              )}
                            </div>
                            <div className="analytics-comparison-item__stats">
                              <span className="analytics-comparison-item__counts">
                                {ev.checkIns}/{ev.registrations} người
                              </span>
                              <strong className="analytics-comparison-item__rate">
                                {ev.attendanceRate}%
                              </strong>
                            </div>
                          </div>

                          <div
                            className="analytics-comparison-progress"
                            role="progressbar"
                            aria-valuenow={ev.attendanceRate}
                            aria-valuemin="0"
                            aria-valuemax="100"
                            aria-label={`Tỷ lệ tham dự ${ev.eventName}: ${ev.attendanceRate}%`}
                          >
                            <div
                              className="analytics-comparison-progress__fill"
                              style={{ width: `${ev.attendanceRate}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 4D: AI Prediction / Evaluation — shell */}
          <div className="analytics-card">
            <div className="analytics-card__header">
              <div>
                <h3 className="analytics-card__title">🤖 AI Dự báo & Đánh giá</h3>
                <p className="analytics-card__subtitle">Đánh giá hiệu quả sự kiện bằng AI</p>
              </div>
            </div>
            <div className="analytics-card__body">
              <div className="analytics-empty-chart">
                <div className="analytics-empty-chart__icon">🔮</div>
                <p className="analytics-empty-chart__text">
                  Chưa có dữ liệu dự báo. Tính năng sẽ hoạt động khi kết nối AI phân tích.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* === RIGHT: AI Insight Panel (4/12) === */}
        <div className="analytics-ai-panel">
          <div className="analytics-card analytics-card--ai">
            <div className="analytics-card__header">
              <div>
                <h3 className="analytics-card__title">🧠 AI Insight</h3>
                <p className="analytics-card__subtitle">Nhận xét thông minh từ dữ liệu</p>
              </div>
            </div>
            <div className="analytics-card__body">
              {/* AI nhận xét */}
              <div className="analytics-ai-section">
                <h4 className="analytics-ai-section__title">Nhận xét</h4>
                <div className="analytics-ai-section__content analytics-ai-section__content--placeholder">
                  Chọn <strong>AI phân tích</strong> để nhận nhận xét từ dữ liệu sự kiện.
                </div>
              </div>

              {/* AI phát hiện */}
              <div className="analytics-ai-section">
                <h4 className="analytics-ai-section__title">Phát hiện</h4>
                <div className="analytics-ai-section__content analytics-ai-section__content--placeholder">
                  Chưa có phát hiện bất thường.
                </div>
              </div>

              {/* Đề xuất */}
              <div className="analytics-ai-section">
                <h4 className="analytics-ai-section__title">Đề xuất</h4>
                <div className="analytics-ai-section__content analytics-ai-section__content--placeholder">
                  Đề xuất sẽ được tạo sau khi phân tích dữ liệu.
                </div>
              </div>
            </div>
          </div>

          {/* AI Explainability — data hiện có */}
          <div className="analytics-card">
            <div className="analytics-card__header">
              <div>
                <h3 className="analytics-card__title">📋 Tổng hợp dữ liệu</h3>
                <p className="analytics-card__subtitle">Số liệu nền tảng phân tích</p>
              </div>
            </div>
            <div className="analytics-card__body">
              <div className="analytics-data-list">
                <div className="analytics-data-list__item">
                  <span>Tổng đăng ký</span>
                  <strong style={{ color: "var(--primary)" }}>{totalRegistrations}</strong>
                </div>
                <div className="analytics-data-list__item">
                  <span>Đã check-in</span>
                  <strong style={{ color: "var(--success)" }}>{totalCheckIns}</strong>
                </div>
                <div className="analytics-data-list__item">
                  <span>Chưa check-in</span>
                  <strong style={{ color: "var(--warning)" }}>{uncheckedCount}</strong>
                </div>
                <div className="analytics-data-list__item">
                  <span>Tỷ lệ tham dự</span>
                  <strong>{attendanceRate}%</strong>
                </div>
                <div className="analytics-data-list__item">
                  <span>Điểm đánh giá TB</span>
                  <strong style={{ color: "var(--warning)" }}>{avgFeedbackScore} ⭐</strong>
                </div>
                <div className="analytics-data-list__item">
                  <span>Tổng phản hồi</span>
                  <strong>{totalFeedbacks}</strong>
                </div>
                {isAll && (
                  <div className="analytics-data-list__item">
                    <span>Tổng sự kiện</span>
                    <strong>{totalEvents}</strong>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================
          SECTION 5: QUICK ACTIONS
          ======================================== */}
      <div className="analytics-quick-actions">
        <h3 className="analytics-quick-actions__title">⚡ Hành động nhanh</h3>
        <div className="analytics-quick-actions__grid">
          {/* TODO: Kết nối notification API hiện có */}
          <button type="button" className="analytics-quick-action-btn" disabled>
            <span className="analytics-quick-action-btn__icon">🔔</span>
            <span className="analytics-quick-action-btn__text">Gửi nhắc lịch</span>
          </button>
          {/* TODO: Cần email service */}
          <button type="button" className="analytics-quick-action-btn" disabled>
            <span className="analytics-quick-action-btn__icon">✉️</span>
            <span className="analytics-quick-action-btn__text">Gửi email</span>
          </button>
          <Link to="/admin/feedback" className="analytics-quick-action-btn">
            <span className="analytics-quick-action-btn__icon">📝</span>
            <span className="analytics-quick-action-btn__text">Xem phản hồi</span>
          </Link>
          {/* TODO: Cần export service */}
          <button type="button" className="analytics-quick-action-btn" disabled>
            <span className="analytics-quick-action-btn__icon">📤</span>
            <span className="analytics-quick-action-btn__text">Xuất báo cáo</span>
          </button>
        </div>
      </div>

      {/* ========================================
          SECTION 6: RECENT EVENTS TABLE (kept)
          ======================================== */}
      <section className="dashboard-section" style={{ marginTop: "8px" }}>
        <div className="section-header">
          <h2>📋 Sự kiện gần đây</h2>
          <Link
            to="/admin/events"
            className="secondary-button"
            style={{ fontSize: "13px", padding: "6px 12px" }}
          >
            Quản lý tất cả sự kiện &rarr;
          </Link>
        </div>

        {events.length === 0 ? (
          <div className="empty-state">
            <h3>Chưa có sự kiện nào</h3>
            <p>Hệ thống hiện tại chưa ghi nhận sự kiện nào.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: "60px" }}>ID</th>
                  <th>Tên sự kiện</th>
                  <th>Địa điểm</th>
                  <th>Thời gian bắt đầu</th>
                  <th style={{ width: "130px" }}>Trạng thái</th>
                  <th style={{ width: "120px", textAlign: "center" }}>Thao tác</th>
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
                        <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>
                          #{event.SuKienId}
                        </span>
                      </td>
                      <td>
                        <strong style={{ fontSize: "13.5px", color: "var(--text-primary)" }}>
                          {event.TenSuKien}
                        </strong>
                      </td>
                      <td>
                        <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                          📍 {event.DiaDiem || "Chưa cập nhật"}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: "13px", color: "var(--text-primary)" }}>
                          {new Date(event.ThoiGianBatDau).toLocaleString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </span>
                      </td>
                      <td>
                        <span
                          className={
                            event.TrangThai === "DA_DUYET" || event.TrangThai === "DANG_DIEN_RA"
                              ? "status approved"
                              : "status draft"
                          }
                        >
                          {event.TrangThai === "DA_DUYET"
                            ? "Đang mở"
                            : event.TrangThai === "NHAP"
                            ? "Bản nháp"
                            : event.TrangThai}
                        </span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          type="button"
                          className="edit-button"
                          onClick={() => setSelectedEventId(String(event.SuKienId))}
                          style={{ padding: "4px 10px", fontSize: "12px" }}
                        >
                          📊 Lọc xem
                        </button>
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