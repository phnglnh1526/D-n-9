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


def mock_summary(
    event_name: str,
    average_score: float,
    feedback_texts: list[str]
) -> str:
    total_feedback = len(feedback_texts)

    # 1. Nhận xét chung dựa vào điểm trung bình
    if average_score >= 4.5:
        general = "Người tham dự nhìn chung đánh giá sự kiện rất xuất sắc và bày tỏ sự hài lòng cao."
    elif average_score >= 3.5:
        general = "Người tham dự nhìn chung có đánh giá tích cực, chương trình đạt mục tiêu đề ra."
    elif average_score >= 2.5:
        general = "Đánh giá về sự kiện ở mức trung bình, có một số khâu tổ chức cần cải thiện."
    else:
        general = "Sự kiện nhận được nhiều phản hồi chưa hài lòng và cần nghiêm túc rà soát lại quy trình tổ chức."

    # 2. Phân tích keyword từ feedback thực tế
    combined_text = " ".join(feedback_texts).lower()

    strengths = []
    if any(k in combined_text for k in ["hữu ích", "huu ich", "thực tế", "thuc te", "hay", "tuyệt", "tuyet", "tốt", "tot"]):
        strengths.append("Nội dung chương trình được đánh giá thiết thực, hữu ích và mang lại nhiều giá trị.")
    if any(k in combined_text for k in ["dễ hiểu", "de hieu", "rõ ràng", "ro rang"]):
        strengths.append("Cách thức truyền tải và bố cục nội dung rõ ràng, dễ tiếp thu.")
    if any(k in combined_text for k in ["diễn giả", "dien gia", "thầy", "chuyên gia"]):
        strengths.append("Diễn giả có chuyên môn sâu và tương tác nhiệt tình với khán giả.")
    if any(k in combined_text for k in ["chuyên nghiệp", "chuyen nghiep", "chu đáo", "chu dao"]):
        strengths.append("Công tác tổ chức và đón tiếp được thực hiện chu đáo, chuyên nghiệp.")

    if not strengths:
        strengths.append("Chương trình nhận được sự quan tâm và theo dõi tích cực từ người tham dự.")

    improvements = []
    if any(k in combined_text for k in ["ngắn", "ngan", "thiếu thời gian", "it thoi gian"]):
        improvements.append("Thời lượng một số phiên chia sẻ còn ngắn, chưa đủ thời gian thảo luận sâu.")
    if any(k in combined_text for k in ["chật", "chat", "nóng", "nong", "âm thanh", "am thanh", "mic"]):
        improvements.append("Không gian hội trường hoặc chất lượng âm thanh/kỹ thuật cần được tối ưu thêm.")
    if any(k in combined_text for k in ["khó hiểu", "kho hieu", "nhanh", "slide"]):
        improvements.append("Tốc độ thuyết trình một số phần còn nhanh, cần bổ sung thêm tài liệu minh họa.")

    if not improvements:
        improvements.append("Cần tiếp tục duy trì và nâng cao trải nghiệm tổng thể của khán giả.")

    strengths_text = "\n".join(f"- {item}" for item in strengths)
    improvements_text = "\n".join(f"- {item}" for item in improvements)

    return f"""1. TỔNG QUAN ĐÁNH GIÁ:
{general}
(Phân tích dựa trên {total_feedback} ý kiến đóng góp thực tế từ khán giả sự kiện "{event_name}").

2. ĐIỂM TÍCH CỰC & NỔI BẬT:
{strengths_text}

3. ĐIỂM CẦN CẢI THIỆN:
{improvements_text}

4. ĐỀ XUẤT CHO SỰ KIỆN TIẾP THEO:
- Tiếp tục phát huy thế mạnh về nội dung chuyên môn và chất lượng diễn giả.
- Dành thêm thời gian cho phần hỏi đáp (Q&A) tương tác trực tiếp với người tham dự.
- Rà soát kỹ hạ tầng âm thanh, ánh sáng và không gian trước giờ khai mạc."""


def summarize_feedback(
    event_name: str,
    average_score: float,
    feedback_texts: list[str]
) -> str:
    ai_mode = os.getenv("AI_MODE", "mock").lower()

    # =============================================
    # 1. MOCK MODE
    # =============================================
    if ai_mode != "openai":
        return mock_summary(
            event_name=event_name,
            average_score=average_score,
            feedback_texts=feedback_texts
        )

    # =============================================
    # 2. OPENAI MODE
    # =============================================
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        print("[AI Service] Warning: AI_MODE=openai but OPENAI_API_KEY is missing. Fallback to mock.")
        return mock_summary(
            event_name=event_name,
            average_score=average_score,
            feedback_texts=feedback_texts
        )

    feedback_content = "\n".join(
        f"- {text}"
        for text in feedback_texts
        if text and text.strip()
    )
    if not feedback_content:
        feedback_content = "(Khán giả chỉ chấm điểm số sao, không để lại nhận xét bằng lời)"

    prompt = f"""Bạn là trợ lý AI chuyên nghiệp phân tích phản hồi sự kiện cho ban tổ chức.

Tên sự kiện: {event_name}
Điểm đánh giá trung bình: {average_score:.2f} / 5.0 sao
Danh sách ý kiến đóng góp từ người tham dự:
{feedback_content}

Hãy phân tích khách quan toàn bộ các phản hồi thực tế ở trên và trình bày theo định dạng tiếng Việt chuẩn:

1. TỔNG QUAN ĐÁNH GIÁ:
(Nhận xét chung về mức độ hài lòng của khán giả)

2. ĐIỂM TÍCH CỰC & NỔI BẬT:
(Gạch đầu dòng các khía cạnh được khen ngợi nhiều nhất)

3. ĐIỂM CẦN CẢI THIỆN:
(Gạch đầu dòng các vấn đề hoặc hạn chế người tham dự đã góp ý)

4. ĐỀ XUẤT CHO SỰ KIỆN TIẾP THEO:
(Các khuyến nghị hành động cụ thể cho ban tổ chức)

Lưu ý: Tuyệt đối chỉ phân tích dựa trên dữ liệu phản hồi được cung cấp, không tự bịa thêm thông tin ngoài lề."""

    try:
        model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        base_url = os.getenv("OPENAI_BASE_URL", None)
        openai_client = OpenAI(api_key=api_key, base_url=base_url) if base_url else OpenAI(api_key=api_key)

        response = openai_client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "Bạn là chuyên gia phân tích dữ liệu sự kiện và trải nghiệm người dùng."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=800
        )
        return response.choices[0].message.content.strip()

    except Exception as error:
        print(f"[AI Service] OpenAI API error: {error}. Activating mock summary fallback.")
        return mock_summary(
            event_name=event_name,
            average_score=average_score,
            feedback_texts=feedback_texts
        )
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


def answer_event_query(
    question: str,
    event_data: dict | None = None,
    all_events_data: list[dict] | None = None,
    faqs: list[dict] | None = None
) -> tuple[str, str]:
    """
    Hỏi đáp dữ liệu sự kiện dựa trên số liệu thực tế từ Database.
    Hỗ trợ cả MOCK MODE và OPENAI MODE (với dữ liệu thực tế được inject vào context).
    """
    ai_mode = os.getenv("AI_MODE", "mock").lower()
    normalized_q = normalize_text(question)

    # =====================================================
    # 1. NẾU HỎI VỀ TẤT CẢ SỰ KIỆN / SỰ KIỆN SẮP DIỄN RA
    # =====================================================
    is_asking_all_events = (
        not event_data
        or any(k in normalized_q for k in [
            "nhung su kien nao", "danh sach su kien", "co su kien nao",
            "cac su kien", "sap dien ra", "tat ca su kien", "bao nhieu su kien"
        ])
    )

    if is_asking_all_events and all_events_data:
        active_events = [e for e in all_events_data if e.get("TrangThai") in ["DA_DUYET", "DANG_DIEN_RA"]]
        if not active_events:
            active_events = all_events_data

        events_list_str = "\n".join(
            f"• #{e['SuKienId']} - {e['TenSuKien']} (Địa điểm: {e.get('DiaDiem', 'Đang cập nhật')} | Bắt đầu: {e.get('ThoiGianBatDau', '')})"
            for e in active_events[:6]
        )

        mock_ans = (
            f"Hiện tại hệ thống đang có {len(all_events_data)} sự kiện:\n"
            f"{events_list_str}\n\n"
            f"Bạn có thể chọn một sự kiện cụ thể để hỏi chi tiết về số lượng đăng ký, check-in, lịch trình hoặc diễn giả!"
        )

        if ai_mode != "openai":
            return mock_ans, "DATABASE_MOCK"

        # OPENAI MODE FOR ALL EVENTS
        api_key = os.getenv("OPENAI_API_KEY", "").strip()
        if not api_key:
            return mock_ans, "DATABASE_MOCK"

        prompt = f"""Bạn là trợ lý ảo hỏi đáp sự kiện thông minh.
Dưới đây là danh sách sự kiện thực tế từ database:
{events_list_str}

Câu hỏi của người dùng: {question}
Hãy trả lời thân thiện, chính xác dựa trên danh sách sự kiện ở trên."""

        try:
            model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
            base_url = os.getenv("OPENAI_BASE_URL", None)
            openai_client = OpenAI(api_key=api_key, base_url=base_url) if base_url else OpenAI(api_key=api_key)
            response = openai_client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": "Bạn là trợ lý sự kiện. Chỉ sử dụng thông tin được cung cấp."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.6,
                max_tokens=400
            )
            return response.choices[0].message.content.strip(), "DATABASE_OPENAI"
        except Exception as error:
            print(f"[AI Service] OpenAI chat error: {error}. Fallback to mock.")
            return mock_ans, "DATABASE_MOCK"

    # =====================================================
    # 2. HỎI ĐÁP SỰ KIỆN CỤ THỂ (DỰA TRÊN EVENT_DATA TỪ DB)
    # =====================================================
    if not event_data:
        return "Hiện chưa có thông tin sự kiện phù hợp để trả lời. Vui lòng chọn một sự kiện.", "DATABASE_MOCK"

    event_name = event_data.get("TenSuKien", "Sự kiện")
    event_loc = event_data.get("DiaDiem") or "Chưa cập nhật"
    event_start = event_data.get("ThoiGianBatDau", "")
    event_end = event_data.get("ThoiGianKetThuc", "")
    max_cap = event_data.get("SoLuongToiDa", 0)
    total_reg = event_data.get("TongDangKy", 0)
    checked_in = event_data.get("DaCheckIn", 0)
    checkin_rate = event_data.get("TyLeCheckIn", "0%")
    total_feedback = event_data.get("TongPhanHoi", 0)
    avg_score = event_data.get("DiemTrungBinh", 0.0)
    sessions = event_data.get("Sessions", [])
    speakers = event_data.get("Speakers", [])

    # Format sessions string
    sessions_summary = "Chưa có lịch trình chi tiết."
    if sessions:
        sessions_summary = "\n".join(
            f"- {s.get('TieuDe')}: {s.get('ThoiGianBatDau', '')} - {s.get('ThoiGianKetThuc', '')} (Diễn giả: {s.get('DienGia') or 'Chưa phân công'})"
            for s in sessions
        )

    # Format speakers string
    speakers_summary = "Chưa có danh sách diễn giả."
    if speakers:
        speakers_summary = ", ".join(
            f"{sp.get('HoTen')} ({sp.get('ChucDanh') or sp.get('DonVi') or 'Chuyên gia'})"
            for sp in speakers
        )

    # -----------------------------------------------------
    # MOCK MODE / RULE-BASED MATCHING
    # -----------------------------------------------------
    # a. Hỏi về Đăng ký
    if any(k in normalized_q for k in ["dang ky", "tham gia", "bao nhieu ve", "so luong dang ky", "khach dang ky"]):
        return (
            f"Sự kiện \"{event_name}\" hiện có {total_reg} người đăng ký tham gia "
            f"(Sức chứa tối đa: {max_cap} người, trạng thái: {event_data.get('TrangThai', 'Đang mở')}).",
            "DATABASE_MOCK"
        )

    # b. Hỏi về Check-in
    if any(k in normalized_q for k in ["check-in", "checkin", "diem danh", "da den", "co mat"]):
        return (
            f"Hiện đã có {checked_in} / {total_reg} người tham dự hoàn thành check-in tại sự kiện \"{event_name}\".",
            "DATABASE_MOCK"
        )

    # c. Hỏi về Tỷ lệ tham dự / Tỷ lệ check-in
    if any(k in normalized_q for k in ["ty le", "phan tram", "ti le", "ti le tham du"]):
        return (
            f"Tỷ lệ tham dự (check-in) của sự kiện \"{event_name}\" hiện đạt {checkin_rate} "
            f"({checked_in} người đã check-in trên tổng số {total_reg} lượt đăng ký).",
            "DATABASE_MOCK"
        )

    # d. Hỏi về Feedback / Đánh giá
    if any(k in normalized_q for k in ["feedback", "danh gia", "diem", "sao", "nhan xet", "phan hoi"]):
        return (
            f"Sự kiện \"{event_name}\" hiện nhận được {total_feedback} lượt đánh giá phản hồi từ người tham dự, "
            f"với điểm số trung bình đạt {avg_score} / 5.0 ⭐.",
            "DATABASE_MOCK"
        )

    # e. Hỏi về Địa điểm
    if any(k in normalized_q for k in ["dia diem", "o dau", "cho nao", "to chuc o", "dia chi"]):
        return f"Sự kiện \"{event_name}\" được tổ chức tại: {event_loc}.", "DATABASE_MOCK"

    # f. Hỏi về Thời gian
    if any(k in normalized_q for k in ["bat dau", "ket thuc", "may gio", "khi nao", "ngay nao", "thoi gian"]):
        return f"Sự kiện \"{event_name}\" diễn ra từ {event_start} đến {event_end}.", "DATABASE_MOCK"

    # g. Hỏi về Lịch trình / Phiên
    if any(k in normalized_q for k in ["lich trinh", "phien", "chuong trinh", "timeline", "agenda"]):
        return f"Lịch trình các phiên sự kiện \"{event_name}\":\n{sessions_summary}", "DATABASE_MOCK"

    # h. Hỏi về Diễn giả
    if any(k in normalized_q for k in ["dien gia", "thuyet trinh", "khach moi", "speaker", "ai noi"]):
        return f"Danh sách diễn giả tham gia sự kiện \"{event_name}\": {speakers_summary}", "DATABASE_MOCK"

    # i. Check FAQ nếu có
    if faqs:
        best_faq = find_best_faq(question, faqs)
        if best_faq and best_faq.get("CauTraLoi"):
            return best_faq.get("CauTraLoi"), "FAQ"

    # -----------------------------------------------------
    # OPENAI MODE (NẾU ĐƯỢC BẬT VÀ KHÔNG TRÚNG RULE ĐƠN GIẢN)
    # -----------------------------------------------------
    if ai_mode == "openai":
        api_key = os.getenv("OPENAI_API_KEY", "").strip()
        if api_key:
            db_context = f"""THÔNG TIN THỰC TẾ TỪ DATABASE:
- Tên sự kiện: {event_name}
- Địa điểm: {event_loc}
- Thời gian bắt đầu: {event_start}
- Thời gian kết thúc: {event_end}
- Trạng thái: {event_data.get('TrangThai')}
- Sức chứa tối đa: {max_cap} người
- Tổng số đăng ký: {total_reg} người
- Số người đã check-in: {checked_in} người
- Tỷ lệ check-in: {checkin_rate}
- Tổng số phản hồi: {total_feedback} lượt
- Điểm đánh giá trung bình: {avg_score} / 5.0 sao
- Lịch trình: {sessions_summary}
- Diễn giả: {speakers_summary}"""

            prompt = f"""Bạn là trợ lý AI chuyên nghiệp trả lời các câu hỏi về dữ liệu sự kiện.
{db_context}

Câu hỏi của người dùng: {question}

YÊU CẦU BẮT BUỘC:
- Trả lời bằng tiếng Việt lịch sự, ngắn gọn và tự nhiên.
- TUYỆT ĐỐI CHỈ sử dụng số liệu thực tế được cung cấp ở trên từ Database.
- KHÔNG ĐƯỢC TỰ BỊA ĐẶT bất kỳ số liệu hay thông tin nào."""

            try:
                model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
                base_url = os.getenv("OPENAI_BASE_URL", None)
                openai_client = OpenAI(api_key=api_key, base_url=base_url) if base_url else OpenAI(api_key=api_key)

                response = openai_client.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": "Bạn là trợ lý sự kiện chính xác và trung thực."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.6,
                    max_tokens=400
                )
                return response.choices[0].message.content.strip(), "DATABASE_OPENAI"
            except Exception as error:
                print(f"[AI Service] OpenAI chat error: {error}. Fallback to mock.")

    # General event overview fallback in mock mode
    return (
        f"Thông tin tổng quan sự kiện \"{event_name}\":\n"
        f"📍 Địa điểm: {event_loc}\n"
        f"⏰ Thời gian: {event_start} - {event_end}\n"
        f"👥 Đăng ký: {total_reg}/{max_cap} người (Đã check-in: {checked_in} người, đạt {checkin_rate})\n"
        f"⭐ Đánh giá: {avg_score}/5.0 ({total_feedback} nhận xét)",
        "DATABASE_MOCK"
    )


def answer_event_question(
    event_name: str,
    event_location: str | None,
    event_start: datetime,
    event_end: datetime,
    question: str,
    faqs: list[dict]
) -> tuple[str, str]:
    """Compatibility wrapper for simple event question answering."""
    event_data = {
        "TenSuKien": event_name,
        "DiaDiem": event_location,
        "ThoiGianBatDau": event_start.strftime("%H:%M ngày %d/%m/%Y") if isinstance(event_start, datetime) else str(event_start),
        "ThoiGianKetThuc": event_end.strftime("%H:%M ngày %d/%m/%Y") if isinstance(event_end, datetime) else str(event_end),
    }
    return answer_event_query(question=question, event_data=event_data, faqs=faqs)
# =========================================================
# AI - SINH THÔNG BÁO SỰ KIỆN
# =========================================================

def mock_event_notification(
    event_name: str,
    event_location: str | None,
    event_start: datetime,
    event_end: datetime,
    notification_type: str,
    extra_note: str | None = None,
    new_location: str | None = None
) -> tuple[str, str]:
    notification_type = notification_type.upper()
    effective_location = new_location.strip() if new_location else (event_location or "địa điểm đang cập nhật")

    if notification_type == "NHAC_LICH":
        title = f"📢 [Nhắc lịch] Sự kiện {event_name} sắp diễn ra"
        note_str = f" Lưu ý thêm: {extra_note}." if extra_note else ""
        content = (
            f'Ban tổ chức xin nhắc lịch: Sự kiện "{event_name}" sẽ chính thức bắt đầu vào lúc '
            f'{event_start.strftime("%H:%M ngày %d/%m/%Y")} tại {effective_location}. '
            f'Quý khách vui lòng mang theo mã vé QR để làm thủ tục check-in nhanh chóng.{note_str}'
        )

    elif notification_type in ["THAY_DOI_DIA_DIEM", "CAP_NHAT"]:
        title = f"🔔 [Thông báo quan trọng] Cập nhật thông tin sự kiện {event_name}"
        loc_msg = f"địa điểm mới: {effective_location}" if new_location else f"địa điểm: {effective_location}"
        note_str = f" Chi tiết thay đổi: {extra_note}." if extra_note else ""
        content = (
            f'Ban tổ chức xin thông báo sự kiện "{event_name}" được tổ chức tại {loc_msg}, '
            f'thời gian từ {event_start.strftime("%H:%M")} đến {event_end.strftime("%H:%M ngày %d/%m/%Y")}.{note_str} '
            f'Rất mong quý khách tham dự đúng giờ và theo dõi thông báo mới nhất.'
        )

    elif notification_type == "KHAI_MAC":
        title = f"🎉 [Khai mạc] Sự kiện {event_name} chính thức bắt đầu"
        note_str = f" {extra_note}" if extra_note else ""
        content = (
            f'Chào mừng quý vị đại biểu và các bạn đã có mặt tại sự kiện "{event_name}" '
            f'tại {effective_location}. Chương trình đã chính thức bắt đầu với các phiên chia sẻ đặc sắc.{note_str} '
            f'Chúc quý vị có những trải nghiệm thật ý nghĩa và bổ ích!'
        )

    elif notification_type == "CAM_ON":
        title = f"💐 [Thư cảm ơn] Cảm ơn bạn đã tham gia sự kiện {event_name}"
        note_str = f" {extra_note}" if extra_note else ""
        content = (
            f'Ban tổ chức xin trân trọng cảm ơn bạn đã dành thời gian quý báu tham gia sự kiện "{event_name}". '
            f'Sự hiện diện và đóng góp của bạn là yếu tố quan trọng tạo nên thành công của chương trình.{note_str} '
            f'Kính chúc bạn luôn nhiều sức khỏe và gặt hái thêm nhiều thành công!'
        )

    elif notification_type == "KET_THUC":
        title = f"✨ [Bế mạc] Sự kiện {event_name} đã kết thúc tốt đẹp"
        content = (
            f'Sự kiện "{event_name}" tại {effective_location} đã chính thức khép lại. '
            f'Ban tổ chức xin chân thành cảm ơn tất cả diễn giả, khách mời và quý người tham dự. '
            f'Đừng quên gửi đánh giá phản hồi để giúp chúng tôi hoàn thiện hơn trong các sự kiện tiếp theo.'
        )

    else: # TUY_CHINH / KHAC
        title = f"📢 Thông báo từ Ban tổ chức sự kiện {event_name}"
        content = (
            f'Ban tổ chức sự kiện "{event_name}" xin gửi thông báo đến toàn thể người tham dự. '
            f'{extra_note or "Vui lòng theo dõi các hướng dẫn từ ban tổ chức và ban lễ tân sự kiện."} '
            f'Mọi thắc mắc xin vui lòng liên hệ bàn tiếp đón tại {effective_location}.'
        )

    return title, content


def generate_event_notification(
    event_name: str,
    event_location: str | None,
    event_start: datetime,
    event_end: datetime,
    notification_type: str,
    extra_note: str | None = None,
    new_location: str | None = None
) -> tuple[str, str]:
    ai_mode = os.getenv("AI_MODE", "mock").lower()
    notification_type = notification_type.upper()
    effective_location = new_location.strip() if new_location else (event_location or "địa điểm đang cập nhật")

    # =====================================================
    # 1. MOCK MODE
    # =====================================================
    if ai_mode != "openai":
        return mock_event_notification(
            event_name=event_name,
            event_location=event_location,
            event_start=event_start,
            event_end=event_end,
            notification_type=notification_type,
            extra_note=extra_note,
            new_location=new_location
        )

    # =====================================================
    # 2. OPENAI MODE
    # =====================================================
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        print("[AI Service] Warning: AI_MODE=openai but OPENAI_API_KEY is missing. Fallback to mock notification.")
        return mock_event_notification(
            event_name=event_name,
            event_location=event_location,
            event_start=event_start,
            event_end=event_end,
            notification_type=notification_type,
            extra_note=extra_note,
            new_location=new_location
        )

    note_section = f"\nYêu cầu / Ghi chú đặc biệt từ ban tổ chức:\n{extra_note}" if extra_note else ""
    loc_section = f"\nĐịa điểm cập nhật mới: {new_location}" if new_location else f"\nĐịa điểm: {effective_location}"

    prompt = f"""Bạn là trợ lý AI chuyên nghiệp hỗ trợ ban tổ chức sự kiện soạn thảo thông báo gửi người tham dự.

Thông tin sự kiện:
- Tên sự kiện: {event_name}
- Thời gian bắt đầu: {event_start.strftime("%H:%M ngày %d/%m/%Y")}
- Thời gian kết thúc: {event_end.strftime("%H:%M ngày %d/%m/%Y")}
- Địa điểm: {effective_location}
- Loại thông báo cần tạo: {notification_type}{loc_section}{note_section}

Yêu cầu:
- Soạn một tiêu đề ngắn gọn, thu hút (có icon phù hợp).
- Soạn nội dung thông báo chuẩn mực, lịch sự, rõ ràng (khoảng 2 đến 4 câu).
- Sử dụng đúng thông tin sự kiện được cung cấp, không bịa đặt.

Trả lời CHÍNH XÁC theo định dạng:
TIÊU ĐỀ: [Tiêu đề thông báo]
NỘI DUNG: [Nội dung thông báo]"""

    try:
        model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        base_url = os.getenv("OPENAI_BASE_URL", None)
        openai_client = OpenAI(api_key=api_key, base_url=base_url) if base_url else OpenAI(api_key=api_key)

        response = openai_client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "Bạn là chuyên viên truyền thông sự kiện chuyên nghiệp."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=500
        )

        result = response.choices[0].message.content.strip()
        title = f"Thông báo: {event_name}"
        content = result

        if "TIÊU ĐỀ:" in result and "NỘI DUNG:" in result:
            title_part, content_part = result.split("NỘI DUNG:", 1)
            title = title_part.replace("TIÊU ĐỀ:", "").strip()
            content = content_part.strip()

        return title, content

    except Exception as error:
        print(f"[AI Service] OpenAI notification error: {error}. Fallback to mock notification.")
        return mock_event_notification(
            event_name=event_name,
            event_location=event_location,
            event_start=event_start,
            event_end=event_end,
            notification_type=notification_type,
            extra_note=extra_note,
            new_location=new_location
        )


# =========================================================
# AI - PHÂN TÍCH TỶ LỆ THAM DỰ (ATTENDANCE INSIGHT)
# =========================================================

def mock_attendance_insight(
    context: str,
    event: dict | None = None,
    comparison: list[dict] | None = None,
    calculations: dict | None = None
) -> dict:
    """
    Tạo nhận xét, phát hiện và đề xuất deterministic dựa trên số liệu thực tế đầu vào.
    Hoạt động khi AI_MODE=mock hoặc khi không có OpenAI API Key.
    """
    event = event or {}
    comparison = comparison or []
    calculations = calculations or {}

    if context == "all_events":
        total_reg = event.get("registrations", 0)
        total_checkin = event.get("checkIns", 0)
        unchecked = event.get("unchecked", max(0, total_reg - total_checkin))
        rate = event.get("attendanceRate", 0.0)
        total_events = calculations.get("numberOfComparedEvents", len(comparison))

        summary = (
            f"Toàn hệ thống hiện ghi nhận {total_checkin} lượt check-in trên tổng số {total_reg} người đăng ký "
            f"từ {total_events} sự kiện, đạt tỷ lệ tham dự bình quân {rate}%."
        )

        findings = [
            f"Tổng số người đã tham dự thực tế đạt {total_checkin} trên {total_reg} lượt đăng ký.",
            f"Còn {unchecked} lượt đăng ký chưa tham gia hoặc chưa được ghi nhận check-in.",
        ]
        if comparison:
            top_event = max(comparison, key=lambda x: x.get("attendanceRate", 0), default=None)
            if top_event and top_event.get("attendanceRate", 0) > 0:
                findings.append(
                    f"Sự kiện có tỷ lệ tham dự cao nhất gần đây là '{top_event.get('eventName')}' ({top_event.get('attendanceRate')}%)."
                )

        recommendations = [
            "Tổng hợp quy trình tổ chức và truyền thông từ các sự kiện có tỷ lệ tham dự cao để áp dụng chung.",
            "Thiết lập kênh gửi thông báo nhắc lịch tự động trước sự kiện nhằm tối ưu tỷ lệ check-in.",
        ]

        return {
            "summary": summary,
            "findings": findings[:3],
            "recommendations": recommendations[:3],
            "source": "MOCK"
        }

    # Context: single_event
    event_name = event.get("name") or "Sự kiện"
    total_reg = event.get("registrations", 0)
    total_checkin = event.get("checkIns", 0)
    unchecked = event.get("unchecked", max(0, total_reg - total_checkin))
    rate = event.get("attendanceRate", 0.0)
    avg_rate = calculations.get("comparisonAverage")
    diff = calculations.get("differenceFromAverage")
    rank_pos = calculations.get("rankingPosition")
    num_compared = calculations.get("numberOfComparedEvents", len(comparison))

    if total_reg == 0:
        summary = f"Sự kiện '{event_name}' hiện chưa có người đăng ký tham gia."
        findings = [
            "Chưa có dữ liệu đăng ký hoặc check-in nào được ghi nhận cho sự kiện này.",
            "Cần mở cổng đăng ký và tiến hành truyền thông để thu hút người tham dự.",
        ]
        recommendations = [
            "Đẩy mạnh công tác truyền thông, đăng tải thông tin diễn giả và lịch trình hấp dẫn.",
            "Kiểm tra tính khả dụng của biểu mẫu đăng ký trực tuyến.",
        ]
        return {
            "summary": summary,
            "findings": findings,
            "recommendations": recommendations,
            "source": "MOCK"
        }

    # Summary
    if num_compared >= 2 and avg_rate is not None and diff is not None:
        diff_str = f"cao hơn {abs(diff):.1f}%" if diff > 0 else (f"thấp hơn {abs(diff):.1f}%" if diff < 0 else "ngang bằng")
        summary = (
            f"Sự kiện '{event_name}' đạt tỷ lệ tham dự {rate}%, {diff_str} so với mức trung bình ({avg_rate}%) "
            f"của các sự kiện được so sánh."
        )
    else:
        summary = f"Sự kiện '{event_name}' ghi nhận tỷ lệ tham dự đạt {rate}% ({total_checkin}/{total_reg} người)."

    # Findings
    findings = [
        f"{total_checkin} trong tổng số {total_reg} người đăng ký đã hoàn tất thủ tục check-in ({rate}%).",
    ]
    if unchecked > 0:
        findings.append(f"Còn {unchecked} người đăng ký chưa được ghi nhận có mặt tại sự kiện.")
    else:
        findings.append("Toàn bộ 100% người đăng ký đã tham gia sự kiện đầy đủ.")

    if num_compared >= 2 and rank_pos:
        findings.append(f"Tỷ lệ tham dự của sự kiện xếp vị trí #{rank_pos} trong số {num_compared} sự kiện gần đây.")

    # Recommendations
    recommendations = []
    if rate >= 80:
        recommendations.append("Duy trì quy trình điều phối và thời điểm gửi thông báo nhắc lịch hiệu quả như hiện tại.")
        if unchecked > 0:
            recommendations.append("Khảo sát lý do vắng mặt của nhóm chưa check-in để hoàn thiện thêm khâu tổ chức.")
    else:
        recommendations.append("Gửi thông báo nhắc lịch kèm mã QR check-in trước giờ khai mạc 24h và 2h để tăng tỷ lệ đến dự.")
        if unchecked > 0:
            recommendations.append(f"Kiểm tra danh sách {unchecked} người chưa check-in để hỗ trợ kịp thời hoặc ghi nhận lý do.")

    if not recommendations:
        recommendations.append("Tiếp tục theo dõi tiến độ check-in và cập nhật phản hồi sau sự kiện.")

    return {
        "summary": summary,
        "findings": findings[:3],
        "recommendations": recommendations[:3],
        "source": "MOCK"
    }


def generate_attendance_insight(
    context: str,
    event: dict | None = None,
    comparison: list[dict] | None = None,
    calculations: dict | None = None
) -> dict:
    """
    Sinh insight phân tích tỷ lệ tham dự từ OpenAI (nếu có) hoặc Fallback Mock.
    Tuyệt đối tuân thủ Grounding Rule và trả về JSON có cấu trúc.
    """
    ai_mode = os.getenv("AI_MODE", "mock").lower()

    if ai_mode != "openai":
        return mock_attendance_insight(context, event, comparison, calculations)

    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        print("[AI Service] Warning: AI_MODE=openai but OPENAI_API_KEY is missing. Fallback to mock attendance insight.")
        return mock_attendance_insight(context, event, comparison, calculations)

    # Prepare prompt data
    event = event or {}
    comparison = comparison or []
    calculations = calculations or {}

    comparison_lines = "\n".join(
        f"• {c.get('eventName')}: {c.get('checkIns')}/{c.get('registrations')} người ({c.get('attendanceRate')}%)"
        for c in comparison[:6]
    )

    data_payload_str = f"""DỮ LIỆU THỐNG KÊ ĐÃ ĐƯỢC TÍNH TOÁN:
- Ngữ cảnh phân tích: {"Toàn bộ sự kiện trong hệ thống" if context == "all_events" else "Sự kiện đơn lẻ"}
- Tên sự kiện: {event.get('name', 'Toàn bộ sự kiện')}
- Tổng số đăng ký: {event.get('registrations', 0)} người
- Số người đã check-in: {event.get('checkIns', 0)} người
- Số người chưa check-in: {event.get('unchecked', 0)} người
- Tỷ lệ tham dự: {event.get('attendanceRate', 0.0)}%
- Số lượng sự kiện so sánh: {calculations.get('numberOfComparedEvents', len(comparison))}
- Tỷ lệ tham dự trung bình nhóm so sánh: {calculations.get('comparisonAverage', 'N/A')}%
- Chênh lệch so với mức trung bình: {calculations.get('differenceFromAverage', 'N/A')}%
- Xếp hạng trong nhóm so sánh: #{calculations.get('rankingPosition', 'N/A')}

DANH SÁCH SỰ KIỆN SO SÁNH GẦN ĐÂY:
{comparison_lines if comparison_lines else "Chưa có sự kiện so sánh"}"""

    prompt = f"""Bạn là trợ lý AI chuyên gia phân tích dữ liệu tham dự sự kiện.
Nhiệm vụ: Dựa HOÀN TOÀN vào các số liệu thực tế được cung cấp ở trên, hãy đưa ra nhận xét, phát hiện và đề xuất hành động.

{data_payload_str}

QUY TẮC BẮT BUỘC:
1. TUYỆT ĐỐI KHÔNG tự bịa đặt hoặc suy đoán số liệu, nguyên nhân không có trong dữ liệu (ví dụ: không tự bịa nguyên nhân thời tiết, chiến dịch email, sự hài lòng nếu không có trong dữ liệu).
2. KHÔNG đưa ra dự báo tương lai trong phần này.
3. Độ dài: summary (2-3 câu ngắn gọn), findings (tối đa 3 điểm chính), recommendations (2-3 hành động thực tế).
4. Phải trả về JSON CHÍNH XÁC theo cấu trúc sau (không kèm markdown format ngoài json):
{{
  "summary": "Tóm tắt 2-3 câu ngắn...",
  "findings": [
    "Điểm phát hiện 1...",
    "Điểm phát hiện 2...",
    "Điểm phát hiện 3..."
  ],
  "recommendations": [
    "Đề xuất hành động 1...",
    "Đề xuất hành động 2..."
  ]
}}"""

    try:
        import json
        model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        base_url = os.getenv("OPENAI_BASE_URL", None)
        openai_client = OpenAI(api_key=api_key, base_url=base_url) if base_url else OpenAI(api_key=api_key)

        response = openai_client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "Bạn là chuyên gia phân tích dữ liệu sự kiện. Luôn trả lời bằng định dạng JSON chính xác."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
            max_tokens=600
        )

        content = response.choices[0].message.content.strip()
        parsed = json.loads(content)

        summary = parsed.get("summary") or "Đã phân tích dữ liệu sự kiện thành công."
        findings = parsed.get("findings") if isinstance(parsed.get("findings"), list) else []
        recommendations = parsed.get("recommendations") if isinstance(parsed.get("recommendations"), list) else []

        return {
            "summary": str(summary),
            "findings": [str(f) for f in findings[:3]],
            "recommendations": [str(r) for r in recommendations[:3]],
            "source": "OPENAI"
        }

    except Exception as error:
        print(f"[AI Service] OpenAI attendance insight error: {error}. Fallback to mock.")
        return mock_attendance_insight(context, event, comparison, calculations)
