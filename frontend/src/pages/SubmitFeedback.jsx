import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import {
  getMyRegistrations,
  getRegistrationById,
  submitEventFeedback,
  submitFeedback,
} from "../services/api";

function SubmitFeedback() {
  const { registrationId } = useParams();
  const [searchParams] = useSearchParams();
  const queryEventId = searchParams.get("eventId");

  const [myRegistrations, setMyRegistrations] = useState([]);
  const [selectedRegId, setSelectedRegId] = useState(registrationId || "");
  const [selectedEventId, setSelectedEventId] = useState(queryEventId || "");
  const [score, setScore] = useState(5);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // ==========================================
  // 1. LOAD ATTENDEE REGISTRATIONS (IF NO ID)
  // ==========================================
  useEffect(() => {
    if (registrationId) {
      setSelectedRegId(registrationId);
      return;
    }

    async function loadData() {
      const token = sessionStorage.getItem("access_token");
      if (!token) return;

      setLoading(true);
      try {
        const regs = await getMyRegistrations();
        const list = Array.isArray(regs) ? regs : [];
        setMyRegistrations(list);
        if (list.length > 0 && !selectedRegId) {
          setSelectedRegId(String(list[0].DangKyId));
          setSelectedEventId(String(list[0].SuKienId));
        }
      } catch (err) {
        // May not be logged in or error
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [registrationId]);

  // ==========================================
  // 2. SUBMIT FEEDBACK
  // ==========================================
  async function handleSubmit(e) {
    e.preventDefault();

    if (score < 1 || score > 5) {
      setError("Điểm đánh giá phải từ 1 đến 5 sao.");
      return;
    }

    setError("");
    setSending(true);

    try {
      if (selectedRegId) {
        await submitFeedback(selectedRegId, {
          DiemDanhGia: Number(score),
          NoiDung: content.trim() || null,
        });
      } else if (selectedEventId) {
        await submitEventFeedback(selectedEventId, {
          DiemDanhGia: Number(score),
          NoiDung: content.trim() || null,
        });
      } else {
        throw new Error("Vui lòng chọn sự kiện hoặc vé tham dự bạn muốn đánh giá.");
      }

      setSuccess(true);
    } catch (err) {
      setError(err.message || "Không thể gửi phản hồi.");
    } finally {
      setSending(false);
    }
  }

  if (success) {
    return (
      <div className="feedback-public-page">
        <div className="feedback-success-card">
          <div className="success-icon">✓</div>
          <h1>Cảm ơn bạn!</h1>
          <p>
            Đánh giá của bạn đã được ghi nhận thành công. Ý kiến đóng góp của bạn sẽ giúp ban tổ chức hoàn thiện hơn trong các sự kiện tiếp theo.
          </p>
          <div style={{ marginTop: "24px", display: "flex", gap: "12px", justifyContent: "center" }}>
            <Link to="/events" className="event-detail-button">
              🌐 Xem các sự kiện khác
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="feedback-public-page">
      <div className="feedback-form-card">
        <Link to="/events" className="back-link">
          ← Quay lại danh sách sự kiện
        </Link>

        <h1>Đánh Giá & Phản Hồi Sự Kiện</h1>
        <p>Hãy chia sẻ trải nghiệm thực tế của bạn để ban tổ chức nâng cao chất lượng sự kiện.</p>

        {error && <div className="alert error-alert">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* SELECT REGISTRATION IF MULTIPLE AVAILABLE */}
          {!registrationId && myRegistrations.length > 0 && (
            <div className="form-group">
              <label>Chọn vé sự kiện đã tham gia *</label>
              <select
                value={selectedRegId}
                onChange={(e) => {
                  const regId = e.target.value;
                  setSelectedRegId(regId);
                  const found = myRegistrations.find(
                    (r) => String(r.DangKyId) === String(regId)
                  );
                  if (found) {
                    setSelectedEventId(String(found.SuKienId));
                  }
                }}
              >
                {myRegistrations.map((reg) => (
                  <option key={reg.DangKyId} value={reg.DangKyId}>
                    Vé #{reg.MaDangKy} (Sự kiện #{reg.SuKienId}) - {reg.HoTen}
                  </option>
                ))}
              </select>
            </div>
          )}

          {registrationId && (
            <div
              style={{
                marginBottom: "16px",
                padding: "10px 14px",
                background: "rgba(99, 102, 241, 0.1)",
                borderRadius: "8px",
                fontSize: "14px",
                color: "#818cf8",
              }}
            >
              🎟️ Đang đánh giá cho vé mã số: <strong>#{registrationId}</strong>
            </div>
          )}

          {/* RATING BUTTONS */}
          <div className="form-group">
            <label>Mức độ hài lòng *</label>
            <div className="rating-buttons">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={
                    score === value
                      ? "rating-button active"
                      : "rating-button"
                  }
                  onClick={() => setScore(value)}
                >
                  {value} ★
                </button>
              ))}
            </div>
          </div>

          {/* CONTENT INPUT */}
          <div className="form-group">
            <label>Nhận xét chi tiết (Tùy chọn)</label>
            <textarea
              rows="5"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Hãy chia sẻ cảm nhận về nội dung bài giảng, diễn giả, địa điểm, công tác đón tiếp..."
            />
          </div>

          <button
            type="submit"
            className="primary-button"
            disabled={sending || loading}
            style={{ width: "100%" }}
          >
            {sending ? "Đang gửi phản hồi..." : "✨ Gửi đánh giá ngay"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default SubmitFeedback;