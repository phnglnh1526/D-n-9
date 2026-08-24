import {
  useState,
} from "react";

import {
  Link,
  useParams,
} from "react-router";

import {
  submitFeedback,
} from "../services/api";


function SubmitFeedback() {
  const { registrationId } =
    useParams();

  const [score, setScore] =
    useState(5);

  const [content, setContent] =
    useState("");

  const [sending, setSending] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState(false);


  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setSending(true);

    try {

      await submitFeedback(
        registrationId,
        {
          DiemDanhGia: score,
          NoiDung: content,
        }
      );

      setSuccess(true);

    } catch (err) {

      setError(err.message);

    } finally {

      setSending(false);

    }
  }


  if (success) {
    return (
      <div className="feedback-public-page">

        <div className="feedback-success-card">

          <div className="success-icon">
            ✓
          </div>

          <h1>
            Cảm ơn bạn!
          </h1>

          <p>
            Phản hồi của bạn đã được
            ghi nhận thành công.
          </p>

          <Link
            to="/events"
            className="event-detail-button"
          >
            Xem các sự kiện
          </Link>

        </div>

      </div>
    );
  }


  return (
    <div className="feedback-public-page">

      <div className="feedback-form-card">

        <Link
          to="/events"
          className="back-link"
        >
          ← Danh sách sự kiện
        </Link>


        <h1>
          Đánh giá sự kiện
        </h1>

        <p>
          Mã đăng ký #{registrationId}
        </p>


        {error && (
          <div className="alert error-alert">
            {error}
          </div>
        )}


        <form onSubmit={handleSubmit}>

          <div className="form-group">

            <label>
              Mức độ hài lòng
            </label>


            <div className="rating-buttons">

              {[1, 2, 3, 4, 5].map(
                (value) => (

                  <button
                    key={value}
                    type="button"
                    className={
                      score === value
                        ? "rating-button active"
                        : "rating-button"
                    }
                    onClick={() =>
                      setScore(value)
                    }
                  >
                    {value} ★
                  </button>

                )
              )}

            </div>

          </div>


          <div className="form-group">

            <label>
              Nhận xét
            </label>

            <textarea
              rows="6"
              value={content}
              onChange={(e) =>
                setContent(
                  e.target.value
                )
              }
              placeholder="Hãy chia sẻ cảm nhận của bạn về nội dung, diễn giả, không gian tổ chức..."
              required
            />

          </div>


          <button
            type="submit"
            className="primary-button"
            disabled={sending}
          >
            {sending
              ? "Đang gửi..."
              : "Gửi phản hồi"}
          </button>

        </form>

      </div>

    </div>
  );
}


export default SubmitFeedback;