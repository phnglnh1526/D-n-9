import { useEffect, useState } from "react";
import {
  getEventFeedback,
  getEvents,
  getFeedbackSummary,
} from "../services/api";

function Feedback() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [feedbacks, setFeedbacks] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");

  // ==========================================
  // 1. LOAD EVENTS
  // ==========================================
  useEffect(() => {
    async function loadEvents() {
      try {
        const data = await getEvents();
        const eventList = Array.isArray(data) ? data : [];
        setEvents(eventList);

        if (eventList.length > 0) {
          setSelectedEventId(String(eventList[0].SuKienId));
        }
      } catch (err) {
        setError(err.message || "Không thể tải danh sách sự kiện");
      }
    }

    loadEvents();
  }, []);

  // ==========================================
  // 2. LOAD FEEDBACK WHEN EVENT CHANGES
  // ==========================================
  useEffect(() => {
    if (!selectedEventId) {
      setFeedbacks([]);
      return;
    }

    setSummary(null);
    loadFeedback(selectedEventId);
  }, [selectedEventId]);

  async function loadFeedback(eventId) {
    setLoading(true);
    setError("");

    try {
      const feedbackData = await getEventFeedback(eventId);
      setFeedbacks(Array.isArray(feedbackData) ? feedbackData : []);
    } catch (err) {
      setFeedbacks([]);
      setError(err.message || "Không thể tải danh sách phản hồi của sự kiện");
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // 3. STATS
  // ==========================================
  const totalCount = feedbacks.length;
  const averageScore =
    totalCount > 0
      ? (
          feedbacks.reduce(
            (total, item) => total + (Number(item.DiemDanhGia) || 0),
            0
          ) / totalCount
        ).toFixed(1)
      : "0.0";

  const fiveStarCount = feedbacks.filter(
    (item) => Number(item.DiemDanhGia) === 5
  ).length;

  // ==========================================
  // 4. AI FEEDBACK SUMMARY
  // ==========================================
  async function handleAnalyze() {
    if (!selectedEventId) return;

    setAnalyzing(true);
    setError("");

    try {
      const result = await getFeedbackSummary(selectedEventId);
      setSummary(result);
    } catch (err) {
      setError(err.message || "Không thể phân tích phản hồi bằng AI");
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header">
          <h1>Phản Hồi & Đánh Giá Sự Kiện</h1>
          <p>Theo dõi điểm đánh giá của người tham dự và phân tích ý kiến bằng AI.</p>
        </div>

        <button
          className="ai-button"
          onClick={handleAnalyze}
          disabled={analyzing || feedbacks.length === 0}
        >
          {analyzing ? "AI đang phân tích..." : "✨ Tóm tắt phản hồi bằng AI"}
        </button>
      </div>

      {/* EVENT SELECT */}
      <section className="filter-card">
        <div className="form-group">
          <label>Chọn sự kiện</label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
          >
            {events.length === 0 ? (
              <option value="">-- Chưa có sự kiện nào --</option>
            ) : (
              events.map((event) => (
                <option key={event.SuKienId} value={event.SuKienId}>
                  #{event.SuKienId} - {event.TenSuKien} ({event.TrangThai})
                </option>
              ))
            )}
          </select>
        </div>
      </section>

      {error && <div className="alert error-alert">{error}</div>}

      {/* STATS */}
      <div className="registration-stats">
        <div className="mini-stat">
          <span>Tổng số phản hồi</span>
          <strong>{totalCount}</strong>
        </div>

        <div className="mini-stat">
          <span>Điểm đánh giá trung bình</span>
          <strong style={{ color: "#f59e0b" }}>⭐ {averageScore} / 5.0</strong>
        </div>

        <div className="mini-stat">
          <span>Đánh giá xuất sắc (5 sao)</span>
          <strong style={{ color: "#10b981" }}>{fiveStarCount}</strong>
        </div>
      </div>

      {/* AI SUMMARY */}
      {summary && (
        <section className="ai-summary-card">
          <div className="ai-summary-header">
            <div>
              <span className="ai-badge">AI INSIGHT</span>
              <h2>Tóm tắt & Đánh giá tổng quan từ AI</h2>
            </div>
            <div style={{ fontSize: "16px", fontWeight: "bold" }}>
              Điểm TB: {summary.DiemTrungBinh || averageScore}/5.0
            </div>
          </div>

          <div className="ai-summary-content" style={{ whiteSpace: "pre-line" }}>
            {summary.TomTatAI}
          </div>
        </section>
      )}

      {/* FEEDBACK LIST */}
      <section className="dashboard-section">
        <div className="section-header">
          <h2>Danh sách phản hồi của người tham dự</h2>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
            <p>Đang tải danh sách phản hồi...</p>
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">⭐</span>
            <h3>Chưa có phản hồi</h3>
            <p>Chưa có người tham dự nào gửi đánh giá cho sự kiện này.</p>
          </div>
        ) : (
          <div className="feedback-list">
            {feedbacks.map((feedback) => (
              <article className="feedback-item" key={feedback.PhanHoiId}>
                <div className="feedback-item-header">
                  <div>
                    <strong>
                      {feedback.HoTen || `Khách tham dự (Vé #${feedback.DangKyId})`}
                    </strong>
                    {feedback.Email && (
                      <div className="feedback-email">{feedback.Email}</div>
                    )}
                  </div>

                  <div className="feedback-score" style={{ fontWeight: "bold" }}>
                    ⭐ {feedback.DiemDanhGia} / 5
                  </div>
                </div>

                <p style={{ marginTop: "10px", fontSize: "14px", lineHeight: "1.6" }}>
                  {feedback.NoiDung ? feedback.NoiDung : <em>(Không có nhận xét chi tiết)</em>}
                </p>

                <small style={{ color: "#94a3b8", display: "block", marginTop: "8px" }}>
                  {feedback.NgayTao
                    ? new Date(feedback.NgayTao).toLocaleString("vi-VN")
                    : ""}
                </small>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Feedback;