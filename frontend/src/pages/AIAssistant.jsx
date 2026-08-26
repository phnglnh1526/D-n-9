import { useEffect, useState } from "react";

import {
  getAttendanceAnalysis,
  getEvents,
} from "../services/api";


function formatCount(value) {
  return Number(value).toLocaleString("vi-VN");
}


function formatPercent(value) {
  return `${Number(value).toFixed(2)}%`;
}


function getSourceLabel(source) {
  return source === "OPENAI"
    ? "OpenAI"
    : "Mock nội bộ";
}


function AIAssistant() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");


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


  async function handleAnalyze() {
    if (!selectedEventId) {
      setError("Vui lòng chọn một sự kiện.");
      return;
    }

    setAnalyzing(true);
    setAnalysis(null);
    setError("");

    try {
      const result = await getAttendanceAnalysis(
        selectedEventId
      );
      setAnalysis(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  }


  function handleEventChange(event) {
    setSelectedEventId(event.target.value);
    setAnalysis(null);
    setError("");
  }


  const hasEvents = events.length > 0;


  return (
    <div>
      <div className="page-header-row">
        <div className="page-header">
          <h1>Phân tích tỷ lệ tham dự</h1>
          <p>
            Dùng dữ liệu đăng ký và check-in thực tế để đánh giá mức độ tham dự.
          </p>
        </div>

        <button
          className="ai-button"
          type="button"
          onClick={handleAnalyze}
          disabled={
            loadingEvents
            || !hasEvents
            || !selectedEventId
            || analyzing
          }
          aria-busy={analyzing}
        >
          {analyzing
            ? "AI đang phân tích..."
            : "Dùng AI sinh logic thống kê tỷ lệ tham dự"}
        </button>
      </div>

      <section className="filter-card">
        <div className="form-group">
          <label htmlFor="attendance-event">
            Chọn sự kiện
          </label>
          <select
            id="attendance-event"
            value={selectedEventId}
            onChange={handleEventChange}
            disabled={loadingEvents || analyzing}
          >
            {!hasEvents && (
              <option value="">
                Chưa có sự kiện để phân tích.
              </option>
            )}

            {events.map((event) => (
              <option
                key={event.SuKienId}
                value={event.SuKienId}
              >
                {event.TenSuKien}
              </option>
            ))}
          </select>
        </div>
      </section>

      {loadingEvents && (
        <p aria-live="polite">
          Đang tải sự kiện...
        </p>
      )}

      {error && (
        <div
          className="alert error-alert"
          role="alert"
        >
          {error}
        </div>
      )}

      {analysis && (
        <>
          <div
            className="registration-stats attendance-analysis-stats"
            aria-live="polite"
          >
            <div className="mini-stat">
              <span>Tổng đăng ký</span>
              <strong>
                {formatCount(analysis.TongDangKy)}
              </strong>
            </div>

            <div className="mini-stat">
              <span>Đã check-in</span>
              <strong>
                {formatCount(analysis.DaCheckIn)}
              </strong>
            </div>

            <div className="mini-stat">
              <span>Chưa check-in</span>
              <strong>
                {formatCount(analysis.ChuaCheckIn)}
              </strong>
            </div>

            <div className="mini-stat attendance-rate-stat">
              <span>Tỷ lệ tham dự</span>
              <strong>
                {formatPercent(analysis.TyLeCheckIn)}
              </strong>
            </div>
          </div>

          <section
            className="ai-summary-card attendance-analysis-card"
            aria-labelledby="attendance-analysis-title"
          >
            <div className="ai-summary-header">
              <div>
                <span className="ai-badge">AI</span>
                <h2 id="attendance-analysis-title">
                  Phân tích tỷ lệ tham dự
                </h2>
              </div>

              <span className="attendance-analysis-source">
                Nguồn: {getSourceLabel(analysis.Nguon)}
              </span>
            </div>

            <div className="ai-summary-content">
              <div className="attendance-analysis-comment">
                <h3>Nhận xét từ AI</h3>
                <p>{analysis.NhanXetAI}</p>
              </div>

              <div>
                <h3>Đề xuất cải thiện</h3>
                <ul className="attendance-recommendations">
                  {analysis.DeXuatAI.map((suggestion) => (
                    <li key={suggestion}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}


export default AIAssistant;
