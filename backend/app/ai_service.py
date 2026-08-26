import json
import os
import unicodedata

from datetime import datetime
from difflib import SequenceMatcher
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI


BASE_DIR = Path(__file__).resolve().parents[2]
load_dotenv(BASE_DIR / ".env")


AI_MODE = os.getenv("AI_MODE", "mock").lower()

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY")
)


def mock_summary(
    event_name: str,
    average_score: float,
    feedback_texts: list[str]
) -> str:
    total_feedback = len(feedback_texts)

    # Nhận xét chung dựa vào điểm trung bình
    if average_score >= 4.5:
        general = "Người tham dự nhìn chung đánh giá sự kiện rất tích cực."
    elif average_score >= 3.5:
        general = "Người tham dự nhìn chung có đánh giá tích cực về sự kiện."
    elif average_score >= 2.5:
        general = "Đánh giá về sự kiện ở mức trung bình và còn một số điểm cần cải thiện."
    else:
        general = "Sự kiện nhận được nhiều đánh giá chưa tích cực và cần được xem xét cải thiện."

    # Ghép nội dung để phân tích keyword đơn giản
    combined_text = " ".join(feedback_texts).lower()

    strengths = []

    if "hữu ích" in combined_text or "thực tế" in combined_text:
        strengths.append("Nội dung được đánh giá hữu ích và có tính thực tế.")

    if "dễ hiểu" in combined_text:
        strengths.append("Cách trình bày được đánh giá dễ hiểu.")

    if "diễn giả" in combined_text:
        strengths.append("Diễn giả nhận được sự quan tâm từ người tham dự.")

    if not strengths:
        strengths.append(
            "Chưa có đủ dữ liệu để xác định rõ điểm mạnh nổi bật."
        )

    problems = []

    if "ngắn" in combined_text:
        problems.append("Thời lượng chương trình có thể còn ngắn.")

    if "chật" in combined_text:
        problems.append("Không gian tổ chức có thể chưa phù hợp.")

    if "khó hiểu" in combined_text:
        problems.append("Một số nội dung có thể chưa đủ dễ hiểu.")

    if not problems:
        problems.append(
            "Chưa phát hiện vấn đề nổi bật từ các phản hồi hiện có."
        )

    strengths_text = "\n".join(
        f"- {item}" for item in strengths
    )

    problems_text = "\n".join(
        f"- {item}" for item in problems
    )

    return f"""
1. Nhận xét chung
{general}
Sự kiện "{event_name}" hiện có {total_feedback} phản hồi được sử dụng để phân tích.

2. Điểm mạnh
{strengths_text}

3. Vấn đề cần cải thiện
{problems_text}

4. Đề xuất cho sự kiện tiếp theo
- Tiếp tục phát huy những nội dung được người tham dự đánh giá tích cực.
- Xem xét các góp ý thường xuyên xuất hiện trong phản hồi.
- Thu thập thêm phản hồi để có kết quả đánh giá chính xác hơn.
""".strip()


def summarize_feedback(
    event_name: str,
    average_score: float,
    feedback_texts: list[str]
) -> str:

    # =============================================
    # MOCK MODE
    # =============================================
    if AI_MODE == "mock":
        return mock_summary(
            event_name=event_name,
            average_score=average_score,
            feedback_texts=feedback_texts
        )

    # =============================================
    # OPENAI MODE
    # =============================================
    feedback_content = "\n".join(
        f"- {text}"
        for text in feedback_texts
        if text
    )

    prompt = f"""
Bạn là trợ lý AI hỗ trợ quản lý sự kiện.

Tên sự kiện:
{event_name}

Điểm đánh giá trung bình:
{average_score:.2f}/5

Các phản hồi của người tham dự:
{feedback_content}

Chỉ phân tích dựa trên dữ liệu được cung cấp.
Không tự tạo thêm số liệu hoặc phản hồi.

Trả lời bằng tiếng Việt gồm:

1. Nhận xét chung
2. Điểm mạnh
3. Vấn đề cần cải thiện
4. Đề xuất cho sự kiện tiếp theo
"""

    try:
        response = client.responses.create(
            model="gpt-5-mini",
            input=prompt
        )

        return response.output_text

    except Exception as error:
        print(f"OpenAI error: {error}")
        print("Chuyển sang AI fallback mode.")

        return mock_summary(
            event_name=event_name,
            average_score=average_score,
            feedback_texts=feedback_texts
        )


def _mock_attendance_analysis(
    attendance_rate: float,
) -> tuple[str, list[str], str]:
    if attendance_rate >= 80:
        comment = "Tỷ lệ tham dự rất tốt và cho thấy hoạt động nhắc lịch đang hiệu quả."
        suggestions = [
            "Tiếp tục duy trì quy trình nhắc lịch hiện tại.",
            "Khuyến khích người tham dự giới thiệu thêm người quan tâm.",
        ]
    elif attendance_rate >= 50:
        comment = "Tỷ lệ tham dự ở mức trung bình, vẫn còn dư địa để cải thiện."
        suggestions = [
            "Gửi email hoặc tin nhắn nhắc lịch trước ngày diễn ra.",
            "Đơn giản hóa quy trình check-in và gửi hướng dẫn sớm.",
        ]
    else:
        comment = "Tỷ lệ tham dự thấp và cần được ưu tiên cải thiện."
        suggestions = [
            "Xác nhận lại người đăng ký trước ngày diễn ra.",
            "Gửi thêm một lượt nhắc lịch có thông tin địa điểm và thời gian rõ ràng.",
            "Khảo sát lý do người đã đăng ký không thể tham dự.",
        ]

    return comment, suggestions, "MOCK_AI"


def analyze_attendance(
    event_name: str,
    total_registrations: int,
    checked_in: int,
    not_checked_in: int,
    attendance_rate: float,
) -> tuple[str, list[str], str]:
    """Generate commentary without allowing AI to change authoritative metrics."""
    if total_registrations == 0:
        return (
            "Sự kiện chưa có người đăng ký nên chưa thể đánh giá tỷ lệ tham dự.",
            [
                "Tăng cường truyền thông và mở đăng ký sớm.",
                "Theo dõi số lượng đăng ký trước khi gửi nhắc lịch.",
            ],
            "MOCK_AI",
        )

    if AI_MODE == "mock":
        return _mock_attendance_analysis(attendance_rate)

    prompt = f"""
Bạn là trợ lý phân tích dữ liệu sự kiện.

Sự kiện: {event_name}
Tổng đăng ký: {total_registrations}
Đã check-in: {checked_in}
Chưa check-in: {not_checked_in}
Tỷ lệ tham dự đã được backend tính chính xác: {attendance_rate:.2f}%

Chỉ phân tích các số liệu được cung cấp. Không thay đổi, làm tròn lại hoặc tự tạo số liệu.
Trả về đúng JSON hợp lệ, không có markdown, theo cấu trúc:
{{
  "NhanXetAI": "một nhận xét ngắn bằng tiếng Việt",
  "DeXuatAI": ["tối đa 3 đề xuất bằng tiếng Việt"]
}}
"""

    try:
        response = client.responses.create(
            model="gpt-5-mini",
            input=prompt,
        )
        payload = json.loads(response.output_text)
        comment = payload.get("NhanXetAI")
        suggestions = payload.get("DeXuatAI")

        if not isinstance(comment, str) or not comment.strip():
            raise ValueError("AI response thiếu NhanXetAI")
        if not isinstance(suggestions, list):
            raise ValueError("AI response thiếu DeXuatAI")

        cleaned_suggestions = [
            item.strip()
            for item in suggestions
            if isinstance(item, str) and item.strip()
        ][:3]

        if not cleaned_suggestions:
            raise ValueError("AI response không có đề xuất hợp lệ")

        return comment.strip(), cleaned_suggestions, "OPENAI"

    except Exception as error:
        print(f"OpenAI attendance analysis error: {error}")
        return _mock_attendance_analysis(attendance_rate)


# =========================================================
# CHATBOT - XỬ LÝ CÂU HỎI
# =========================================================

def normalize_text(text: str) -> str:
    """
    Chuẩn hóa tiếng Việt:
    - chuyển thành chữ thường
    - bỏ dấu
    - bỏ khoảng trắng thừa
    """

    text = text.lower().strip()

    text = unicodedata.normalize("NFD", text)

    text = "".join(
        char
        for char in text
        if unicodedata.category(char) != "Mn"
    )

    text = text.replace("đ", "d")

    return text


def find_best_faq(
    question: str,
    faqs: list[dict]
) -> dict | None:
    """
    Tìm FAQ giống câu hỏi người dùng nhất.
    """

    normalized_question = normalize_text(question)

    best_faq = None
    best_score = 0.0

    for faq in faqs:

        faq_question = faq.get("CauHoi")

        if not faq_question:
            continue

        normalized_faq = normalize_text(
            faq_question
        )

        score = SequenceMatcher(
            None,
            normalized_question,
            normalized_faq
        ).ratio()

        if score > best_score:
            best_score = score
            best_faq = faq

    # Ngưỡng 0.45: giống tương đối thì sử dụng FAQ
    if best_score >= 0.45:
        return best_faq

    return None


def answer_event_question(
    event_name: str,
    event_location: str | None,
    event_start: datetime,
    event_end: datetime,
    question: str,
    faqs: list[dict]
) -> tuple[str, str]:

    normalized_question = normalize_text(
        question
    )

    # =====================================================
    # 1. CÂU HỎI VỀ ĐỊA ĐIỂM
    # =====================================================

    if (
        "dia diem" in normalized_question
        or "o dau" in normalized_question
    ):
        if event_location:
            answer = (
                f'Sự kiện "{event_name}" được tổ chức '
                f'tại {event_location}.'
            )
        else:
            answer = (
                "Địa điểm của sự kiện hiện chưa được cập nhật."
            )

        return answer, "EVENT_INFO"


    # =====================================================
    # 2. CÂU HỎI VỀ THỜI GIAN BẮT ĐẦU
    # =====================================================

    if (
        "bat dau" in normalized_question
        or "may gio" in normalized_question
    ):
        answer = (
            "Sự kiện bắt đầu lúc "
            f'{event_start.strftime("%H:%M ngày %d/%m/%Y")}.'
        )

        return answer, "EVENT_INFO"


    # =====================================================
    # 3. CÂU HỎI VỀ THỜI GIAN KẾT THÚC
    # =====================================================

    if "ket thuc" in normalized_question:

        answer = (
            "Sự kiện kết thúc lúc "
            f'{event_end.strftime("%H:%M ngày %d/%m/%Y")}.'
        )

        return answer, "EVENT_INFO"


    # =====================================================
    # 4. TÌM CÂU TRẢ LỜI TRONG FAQ
    # =====================================================

    best_faq = find_best_faq(
        question=question,
        faqs=faqs
    )

    if best_faq:

        answer = best_faq.get(
            "CauTraLoi"
        )

        if answer:
            return answer, "FAQ"


    # =====================================================
    # 5. MOCK MODE
    # =====================================================

    if AI_MODE == "mock":

        return (
            "Hiện hệ thống chưa có đủ thông tin "
            "để trả lời câu hỏi này. "
            "Bạn có thể liên hệ ban tổ chức "
            "để được hỗ trợ thêm.",
            "MOCK_AI"
        )


    # =====================================================
    # 6. OPENAI MODE
    # =====================================================

    faq_content = "\n".join(
        f'- {faq.get("CauHoi", "")}: '
        f'{faq.get("CauTraLoi", "")}'
        for faq in faqs
    )

    prompt = f"""
Bạn là trợ lý hỏi đáp cho hệ thống quản lý sự kiện.

Tên sự kiện:
{event_name}

Địa điểm:
{event_location}

Thời gian bắt đầu:
{event_start}

Thời gian kết thúc:
{event_end}

Các câu hỏi thường gặp:
{faq_content}

Câu hỏi của người dùng:
{question}

Yêu cầu:
- Chỉ trả lời dựa trên dữ liệu được cung cấp.
- Không tự tạo thông tin.
- Nếu dữ liệu không đủ, hãy nói rằng hiện chưa có thông tin.
- Trả lời ngắn gọn bằng tiếng Việt.
"""

    try:

        response = client.responses.create(
            model="gpt-5-mini",
            input=prompt
        )

        return (
            response.output_text,
            "OPENAI"
        )

    except Exception as error:

        print(
            f"OpenAI chatbot error: {error}"
        )

        # Fallback nếu OpenAI lỗi
        return (
            "Hiện hệ thống chưa có đủ thông tin "
            "để trả lời câu hỏi này. "
            "Bạn có thể liên hệ ban tổ chức "
            "để được hỗ trợ thêm.",
            "MOCK_AI"
        )
# =========================================================
# AI - SINH THÔNG BÁO SỰ KIỆN
# =========================================================

def generate_event_notification(
    event_name: str,
    event_location: str | None,
    event_start: datetime,
    event_end: datetime,
    notification_type: str
) -> tuple[str, str]:

    notification_type = notification_type.upper()

    # =====================================================
    # MOCK MODE
    # =====================================================

    if AI_MODE == "mock":

        if notification_type == "NHAC_LICH":

            title = f"Nhắc lịch: {event_name}"

            content = (
                f'Sự kiện "{event_name}" sẽ bắt đầu lúc '
                f'{event_start.strftime("%H:%M ngày %d/%m/%Y")} '
                f'tại {event_location or "địa điểm đang cập nhật"}. '
                f'Vui lòng có mặt sớm để thực hiện check-in.'
            )

        elif notification_type == "CAP_NHAT":

            title = f"Cập nhật sự kiện: {event_name}"

            content = (
                f'Sự kiện "{event_name}" hiện được tổ chức tại '
                f'{event_location or "địa điểm đang cập nhật"}, '
                f'từ {event_start.strftime("%H:%M")} '
                f'đến {event_end.strftime("%H:%M ngày %d/%m/%Y")}. '
                f'Vui lòng theo dõi thông báo để cập nhật thông tin mới nhất.'
            )

        elif notification_type == "CAM_ON":

            title = f"Cảm ơn bạn đã tham gia {event_name}"

            content = (
                f'Cảm ơn bạn đã tham gia sự kiện "{event_name}". '
                f'Hy vọng chương trình mang lại những thông tin hữu ích. '
                f'Đừng quên gửi phản hồi để ban tổ chức cải thiện '
                f'các sự kiện tiếp theo.'
            )

        else:

            title = f"Thông báo: {event_name}"

            content = (
                f'Ban tổ chức xin gửi thông báo liên quan đến '
                f'sự kiện "{event_name}". '
                f'Vui lòng theo dõi thông tin cập nhật từ hệ thống.'
            )

        return title, content


    # =====================================================
    # OPENAI MODE
    # =====================================================

    prompt = f"""
Bạn là trợ lý AI hỗ trợ ban tổ chức sự kiện.

Thông tin sự kiện:

Tên:
{event_name}

Địa điểm:
{event_location}

Bắt đầu:
{event_start}

Kết thúc:
{event_end}

Loại thông báo:
{notification_type}

Hãy tạo một thông báo ngắn gọn bằng tiếng Việt.

Yêu cầu:
- Có tiêu đề.
- Nội dung khoảng 2 đến 4 câu.
- Chỉ sử dụng thông tin được cung cấp.
- Không tự tạo thêm địa điểm, thời gian hoặc dữ liệu.
- Văn phong lịch sự, rõ ràng.

Trả lời theo định dạng:

TIÊU ĐỀ: ...
NỘI DUNG: ...
"""

    try:

        response = client.responses.create(
            model="gpt-5-mini",
            input=prompt
        )

        result = response.output_text.strip()

        title = "Thông báo sự kiện"
        content = result

        if "TIÊU ĐỀ:" in result and "NỘI DUNG:" in result:

            title_part, content_part = result.split(
                "NỘI DUNG:",
                1
            )

            title = (
                title_part
                .replace("TIÊU ĐỀ:", "")
                .strip()
            )

            content = content_part.strip()

        return title, content

    except Exception as error:

        print(
            f"OpenAI notification error: {error}"
        )

        # Fallback nếu OpenAI lỗi
        return (
            f"Thông báo: {event_name}",
            (
                f'Sự kiện "{event_name}" sẽ diễn ra lúc '
                f'{event_start.strftime("%H:%M ngày %d/%m/%Y")} '
                f'tại {event_location or "địa điểm đang cập nhật"}.'
            )
        )