import {
  useEffect,
  useState,
} from "react";
import {
  getEventFeedback,
  getEventRegistrations,
  getEvents,
  getFeedbackSummary,
} from "../services/api";

function Feedback() {
  const [events, setEvents] =
    useState([]);

  const [selectedEventId, setSelectedEventId] =
    useState("");

  const [feedbacks, setFeedbacks] =
    useState([]);

  const [registrations, setRegistrations] =
    useState([]);

  const [summary, setSummary] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [analyzing, setAnalyzing] =
    useState(false);

  const [error, setError] =
    useState("");
  // ==========================================
  // EVENTS
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
  // FEEDBACK
  // ==========================================

  useEffect(() => {
  if (!selectedEventId) {
    return;
  }

  setSummary(null);

  loadFeedback(selectedEventId);

}, [selectedEventId]);

  async function loadFeedback(eventId) {

    setLoading(true);
    setError("");
     

    try {

      const [
        feedbackData,
        registrationData,
      ] = await Promise.all([
        getEventFeedback(eventId),
        getEventRegistrations(eventId),
      ]);


      setFeedbacks(feedbackData);

      setRegistrations(
        registrationData
      );

    } catch (err) {

      setError(err.message);

    } finally {

      setLoading(false);

    }

  }


  // ==========================================
  // FIND ATTENDEE
  // ==========================================

  function getAttendee(
    registrationId
  ) {

    return registrations.find(
      (item) =>
        item.DangKyId
        === registrationId
    );

  }


  // ==========================================
  // AVERAGE
  // ==========================================

  const averageScore =
    feedbacks.length > 0
      ? (
          feedbacks.reduce(
            (total, item) =>
              total
              + Number(
                  item.DiemDanhGia
                ),
            0
          )
          / feedbacks.length
        ).toFixed(1)
      : "0.0";


  // ==========================================
  // AI
  // ==========================================

  async function handleAnalyze() {

    setAnalyzing(true);
    setError("");

    try {

      const result =
        await getFeedbackSummary(
          selectedEventId
        );

      setSummary(result);

    } catch (err) {

      setError(err.message);

    } finally {

      setAnalyzing(false);

    }

  }


  return (
    <div>

      <div className="page-header-row">

        <div className="page-header">

          <h1>
            Phản hồi sự kiện
          </h1>

          <p>
            Theo dõi đánh giá và phân tích
            phản hồi bằng AI.
          </p>

        </div>


        <button
          className="ai-button"
          onClick={handleAnalyze}
          disabled={
            analyzing
            || feedbacks.length === 0
          }
        >

          {analyzing
            ? "AI đang phân tích..."
            : "✨ Tóm tắt bằng AI"}

        </button>

      </div>


      {/* EVENT SELECT */}

      <section className="filter-card">

        <div className="form-group">

          <label>
            Chọn sự kiện
          </label>

          <select
            value={selectedEventId}
            onChange={(e) =>
              setSelectedEventId(
                e.target.value
              )
            }
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

      </section>


      {error && (
        <div className="alert error-alert">
          {error}
        </div>
      )}


      {/* STATS */}

      <div className="registration-stats">

        <div className="mini-stat">

          <span>
            Tổng phản hồi
          </span>

          <strong>
            {feedbacks.length}
          </strong>

        </div>


        <div className="mini-stat">

          <span>
            Điểm trung bình
          </span>

          <strong>
            {averageScore}/5
          </strong>

        </div>


        <div className="mini-stat">

          <span>
            Đánh giá 5 sao
          </span>

          <strong>
            {
              feedbacks.filter(
                (item) =>
                  Number(
                    item.DiemDanhGia
                  ) === 5
              ).length
            }
          </strong>

        </div>

      </div>


      {/* AI SUMMARY */}

      {summary && (

        <section className="ai-summary-card">

          <div className="ai-summary-header">

            <div>

              <span className="ai-badge">
                AI
              </span>

              <h2>
                Phân tích phản hồi
              </h2>

            </div>


            <div>

              {summary.DiemTrungBinh}/5

            </div>

          </div>


          <div className="ai-summary-content">
            {summary.TomTatAI}
          </div>

        </section>

      )}


      {/* FEEDBACK LIST */}

      <section className="dashboard-section">

        <div className="section-header">

          <h2>
            Danh sách phản hồi
          </h2>

        </div>


        {loading ? (

          <p>
            Đang tải phản hồi...
          </p>

        ) : feedbacks.length === 0 ? (

          <div className="empty-state">

            <h3>
              Chưa có phản hồi
            </h3>

            <p>
              Chưa có người tham dự gửi
              đánh giá cho sự kiện này.
            </p>

          </div>

        ) : (

          <div className="feedback-list">

            {feedbacks.map(
              (feedback) => {

                const attendee =
                  getAttendee(
                    feedback.DangKyId
                  );


                return (

                  <article
                    className="feedback-item"
                    key={
                      feedback.PhanHoiId
                    }
                  >

                    <div className="feedback-item-header">

                      <div>

                        <strong>
                          {attendee?.HoTen
                            || `Đăng ký #${feedback.DangKyId}`}
                        </strong>

                        <div className="feedback-email">
                          {attendee?.Email || ""}
                        </div>

                      </div>


                      <div className="feedback-score">

                        {feedback.DiemDanhGia}
                        /5 ★

                      </div>

                    </div>


                    <p>
                      {feedback.NoiDung}
                    </p>


                    <small>
                      {feedback.NgayTao
                        ? new Date(
                            feedback.NgayTao
                          ).toLocaleString(
                            "vi-VN"
                          )
                        : ""}
                    </small>

                  </article>

                );

              }
            )}

          </div>

        )}

      </section>

    </div>
  );
}


export default Feedback;