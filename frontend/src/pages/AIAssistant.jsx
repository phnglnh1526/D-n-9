import { useEffect, useRef, useState } from "react";
import {
  deleteEventNotification,
  generateAINotification,
  getEventNotifications,
  getEvents,
  saveEventNotification,
  sendAIChat,
} from "../services/api";

function AIAssistant() {
  // Navigation Tabs: "chatbot" | "announcement"
  const [activeTab, setActiveTab] = useState("chatbot");

  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);

  // ==========================================
  // 1. ANNOUNCEMENT STATE
  // ==========================================
  const [notificationType, setNotificationType] = useState("NHAC_LICH");
  const [extraNote, setExtraNote] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [generating, setGenerating] = useState(false);

  const [previewTitle, setPreviewTitle] = useState("");
  const [previewContent, setPreviewContent] = useState("");
  const [isGenerated, setIsGenerated] = useState(false);
  const [saving, setSaving] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ==========================================
  // 2. CHATBOT STATE
  // ==========================================
  const [chatMessages, setChatMessages] = useState([
    {
      id: "welcome",
      sender: "bot",
      text: "👋 Xin chào! Tôi là Trợ lý AI hỏi đáp dữ liệu sự kiện Event.AI.\n\nTôi có thể trả lời chính xác số lượng đăng ký, số người đã check-in, tỷ lệ tham dự, điểm feedback trung bình, lịch trình và diễn giả dựa trên dữ liệu thật 100% từ Database.\n\nHãy chọn câu hỏi mẫu bên dưới hoặc nhập câu hỏi của bạn!",
      time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      source: "SYSTEM",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef(null);

  // Quick 10 Demo Sample Questions
  const sampleQuestions = [
    "Có những sự kiện nào trong hệ thống?",
    "Sự kiện này có bao nhiêu người đăng ký?",
    "Bao nhiêu người đã check-in?",
    "Tỷ lệ tham dự là bao nhiêu?",
    "Điểm feedback trung bình là bao nhiêu?",
    "Sự kiện diễn ra ở đâu?",
    "Thời gian bắt đầu và kết thúc khi nào?",
    "Lịch trình các phiên của sự kiện là gì?",
    "Diễn giả của sự kiện là ai?",
    "Sự kiện nào sắp diễn ra?",
  ];

  // ==========================================
  // LOAD EVENTS
  // ==========================================
  useEffect(() => {
    async function loadEvents() {
      try {
        const data = await getEvents();
        const list = Array.isArray(data) ? data : [];
        setEvents(list);
        if (list.length > 0) {
          setSelectedEventId(String(list[0].SuKienId));
          setSelectedEvent(list[0]);
        }
      } catch (err) {
        setError(err.message || "Không thể tải danh sách sự kiện");
      }
    }
    loadEvents();
  }, []);

  // Update selected event object and load notifications
  useEffect(() => {
    if (!selectedEventId) {
      setSelectedEvent(null);
      setNotifications([]);
      return;
    }

    const current = events.find((e) => String(e.SuKienId) === String(selectedEventId));
    setSelectedEvent(current || null);

    if (activeTab === "announcement") {
      setIsGenerated(false);
      setPreviewTitle("");
      setPreviewContent("");
      setError("");
      setSuccess("");
      loadHistory(selectedEventId);
    }
  }, [selectedEventId, events, activeTab]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  async function loadHistory(eventId) {
    setLoadingHistory(true);
    try {
      const data = await getEventNotifications(eventId);
      setNotifications(Array.isArray(data) ? data : []);
    } catch {
      setNotifications([]);
    } finally {
      setLoadingHistory(false);
    }
  }

  // ==========================================
  // HANDLERS: CHATBOT
  // ==========================================
  async function handleSendChat(questionText = null) {
    const query = (questionText || chatInput).trim();
    if (!query || chatLoading) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: "user",
      text: query,
      time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    if (!questionText) setChatInput("");
    setChatLoading(true);

    try {
      const res = await sendAIChat(query, selectedEventId ? Number(selectedEventId) : null);

      const botMsg = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: res.response || res.CauTraLoi || "Không nhận được phản hồi từ AI.",
        time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
        source: res.source || res.Nguon || "DATABASE_AI",
      };

      setChatMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: `⚠️ Lỗi: ${err.message || "Không thể kết nối tới Chatbot"}`,
        time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
        source: "ERROR",
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    } finally {
      setChatLoading(false);
    }
  }

  // ==========================================
  // HANDLERS: ANNOUNCEMENT
  // ==========================================
  async function handleGenerateAI(e) {
    e.preventDefault();
    if (!selectedEventId) {
      setError("Vui lòng chọn sự kiện trước khi tạo thông báo.");
      return;
    }

    setGenerating(true);
    setError("");
    setSuccess("");

    try {
      const result = await generateAINotification(selectedEventId, {
        LoaiThongBao: notificationType,
        GhiChu: extraNote.trim() || null,
        DiaDiemMoi: newLocation.trim() || null,
      });

      setPreviewTitle(result.TieuDe || "");
      setPreviewContent(result.NoiDung || "");
      setIsGenerated(true);
      setSuccess("✨ AI đã soạn thảo xong thông báo! Bạn có thể xem và chỉnh sửa trước khi lưu.");
    } catch (err) {
      setError(err.message || "Không thể sinh thông báo bằng AI");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSaveNotification(e) {
    e.preventDefault();
    if (!previewTitle.trim() || !previewContent.trim()) {
      setError("Tiêu đề và nội dung thông báo không được để trống.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await saveEventNotification(selectedEventId, {
        TieuDe: previewTitle.trim(),
        NoiDung: previewContent.trim(),
        LoaiThongBao: notificationType,
      });

      setSuccess("🎉 Đã lưu và phát hành thông báo thành công vào hệ thống!");
      setIsGenerated(false);
      setPreviewTitle("");
      setPreviewContent("");
      setExtraNote("");
      setNewLocation("");
      await loadHistory(selectedEventId);
    } catch (err) {
      setError(err.message || "Không thể lưu thông báo");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteNotification(notificationId) {
    if (!window.confirm("Bạn có chắc chắn muốn xóa thông báo này?")) return;

    try {
      await deleteEventNotification(selectedEventId, notificationId);
      setSuccess("Đã xóa thông báo thành công.");
      await loadHistory(selectedEventId);
    } catch (err) {
      setError(err.message || "Không thể xóa thông báo");
    }
  }

  const typeLabels = {
    NHAC_LICH: "📢 Nhắc lịch tham gia",
    THAY_DOI_DIA_DIEM: "🔔 Thay đổi địa điểm",
    CAP_NHAT: "📝 Cập nhật lịch trình",
    KHAI_MAC: "🎉 Khai mạc sự kiện",
    CAM_ON: "💐 Thư cảm ơn",
    KET_THUC: "✨ Bế mạc sự kiện",
    TUY_CHINH: "✍️ Thông báo tùy chỉnh",
  };

  return (
    <div>
      <div className="page-header" style={{ marginBottom: "20px" }}>
        <h1>Trung Tâm Trí Tuệ Nhân Tạo (Event AI Suite)</h1>
        <p>Hỏi đáp dữ liệu sự kiện thông minh từ Database & Soạn thảo thông báo tự động.</p>

        {/* TOP TAB SWITCHER */}
        <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
          <button
            type="button"
            className={activeTab === "chatbot" ? "primary-button" : "secondary-button"}
            onClick={() => setActiveTab("chatbot")}
            style={{ padding: "9px 18px" }}
          >
            💬 AI Chatbot Hỏi Đáp Sự Kiện
          </button>

          <button
            type="button"
            className={activeTab === "announcement" ? "primary-button" : "secondary-button"}
            onClick={() => setActiveTab("announcement")}
            style={{ padding: "9px 18px" }}
          >
            📢 AI Sinh Thông Báo (Announcement)
          </button>
        </div>
      </div>

      {/* EVENT SELECTOR BAR */}
      <div className="filter-card" style={{ padding: "14px 20px", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
          <label style={{ fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap" }}>
            🎯 Chọn sự kiện trọng tâm:
          </label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            style={{ flex: 1, minWidth: "280px" }}
          >
            {events.map((ev) => (
              <option key={ev.SuKienId} value={ev.SuKienId}>
                #{ev.SuKienId} - {ev.TenSuKien} ({ev.TrangThai} | {ev.DiaDiem || "Chưa có địa điểm"})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: AI CHATBOT HỎI ĐÁP SỰ KIỆN */}
      {/* ========================================================================= */}
      {activeTab === "chatbot" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "24px", alignItems: "start" }}>
          {/* MAIN CHAT CONVERSATION WINDOW */}
          <div
            style={{
              backgroundColor: "var(--bg-surface)",
              borderRadius: "var(--radius-xl)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-sm)",
              display: "flex",
              flexDirection: "column",
              height: "620px",
              overflow: "hidden",
            }}
          >
            {/* CHAT HEADER */}
            <div
              style={{
                padding: "14px 20px",
                borderBottom: "1px solid var(--border)",
                backgroundColor: "#f8fafc",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <strong style={{ fontSize: "15px", color: "var(--text-primary)" }}>
                  🤖 Trợ lý Sự kiện AI
                </strong>
                <span style={{ fontSize: "12px", color: "var(--success)", display: "block", fontWeight: 500 }}>
                  ● Đang kết nối trực tiếp với MySQL Database
                </span>
              </div>
              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  setChatMessages([
                    {
                      id: "cleared",
                      sender: "bot",
                      text: "Đã làm mới cuộc hội thoại. Hãy đặt câu hỏi về dữ liệu sự kiện!",
                      time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
                      source: "SYSTEM",
                    },
                  ])
                }
                style={{ padding: "5px 10px", fontSize: "12px" }}
              >
                Làm mới chat
              </button>
            </div>

            {/* MESSAGES LIST */}
            <div
              style={{
                flex: 1,
                padding: "20px",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                backgroundColor: "var(--bg-app)",
              }}
            >
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                    maxWidth: "80%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: msg.sender === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      backgroundColor: msg.sender === "user" ? "var(--primary)" : "var(--bg-surface)",
                      color: msg.sender === "user" ? "white" : "var(--text-primary)",
                      padding: "12px 16px",
                      borderRadius:
                        msg.sender === "user"
                          ? "16px 16px 4px 16px"
                          : "16px 16px 16px 4px",
                      border:
                        msg.sender === "user"
                          ? "none"
                          : "1px solid var(--border)",
                      fontSize: "13.5px",
                      lineHeight: "1.6",
                      whiteSpace: "pre-wrap",
                      boxShadow: "var(--shadow-sm)",
                    }}
                  >
                    {msg.text}
                  </div>

                  <div
                    style={{
                      marginTop: "4px",
                      fontSize: "11px",
                      color: "var(--text-muted)",
                      display: "flex",
                      gap: "6px",
                    }}
                  >
                    <span>{msg.time}</span>
                    {msg.source && (
                      <span
                        style={{
                          backgroundColor: "var(--primary-light)",
                          color: "var(--primary)",
                          padding: "1px 6px",
                          borderRadius: "4px",
                          fontWeight: 600,
                        }}
                      >
                        {msg.source}
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {chatLoading && (
                <div
                  style={{
                    alignSelf: "flex-start",
                    backgroundColor: "var(--bg-surface)",
                    padding: "10px 16px",
                    borderRadius: "16px",
                    color: "var(--text-secondary)",
                    fontSize: "13px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    border: "1px solid var(--border)",
                  }}
                >
                  <span>🔄</span>
                  <span>AI đang truy vấn dữ liệu từ MySQL...</span>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* INPUT FORM */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendChat();
              }}
              style={{
                padding: "14px 16px",
                borderTop: "1px solid var(--border)",
                backgroundColor: "var(--bg-surface)",
                display: "flex",
                gap: "10px",
              }}
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Nhập câu hỏi (ví dụ: Sự kiện này có bao nhiêu người đăng ký?)..."
                disabled={chatLoading}
                style={{
                  flex: 1,
                  height: "42px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border)",
                  padding: "8px 14px",
                  fontSize: "13.5px",
                }}
              />
              <button
                type="submit"
                disabled={chatLoading || !chatInput.trim()}
                className="primary-button"
                style={{ padding: "0 20px" }}
              >
                {chatLoading ? "..." : "Gửi 🚀"}
              </button>
            </form>
          </div>

          {/* RIGHT COLUMN: 10 SAMPLE QUICK QUESTIONS */}
          <div
            style={{
              backgroundColor: "var(--bg-surface)",
              borderRadius: "var(--radius-xl)",
              padding: "20px",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-sm)",
              display: "flex",
              flexDirection: "column",
              height: "620px",
            }}
          >
            <h3 style={{ fontSize: "15px", marginBottom: "8px", color: "var(--text-primary)" }}>
              💡 10 Câu hỏi mẫu để Demo
            </h3>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "14px", lineHeight: "1.4" }}>
              Nhấp trực tiếp vào bất kỳ câu hỏi nào dưới đây để AI tự động truy vấn database và trả lời:
            </p>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                overflowY: "auto",
                flex: 1,
                paddingRight: "2px",
              }}
            >
              {sampleQuestions.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendChat(q)}
                  disabled={chatLoading}
                  style={{
                    textAlign: "left",
                    padding: "9px 12px",
                    backgroundColor: "#f8fafc",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                    color: "var(--text-primary)",
                    fontSize: "12.5px",
                    cursor: "pointer",
                    lineHeight: "1.4",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--primary-light)";
                    e.currentTarget.style.borderColor = "var(--primary-border)";
                    e.currentTarget.style.color = "var(--primary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#f8fafc";
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.color = "var(--text-primary)";
                  }}
                >
                  <span style={{ color: "var(--primary)", fontWeight: 600, marginRight: "4px" }}>
                    {idx + 1}.
                  </span>
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: AI SINH THÔNG BÁO (ANNOUNCEMENT GENERATOR) */}
      {/* ========================================================================= */}
      {activeTab === "announcement" && (
        <div>
          {error && <div className="alert error-alert">{error}</div>}
          {success && <div className="alert success-alert">{success}</div>}

          <div className="checkin-layout" style={{ gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            {/* LEFT COLUMN: AI GENERATION CONFIG */}
            <section className="checkin-panel">
              <h2>1. Cấu hình & Sinh thông báo</h2>

              {selectedEvent && (
                <div
                  style={{
                    marginBottom: "16px",
                    padding: "12px 14px",
                    backgroundColor: "#f8fafc",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                    fontSize: "12.5px",
                    lineHeight: "1.6",
                    color: "var(--text-secondary)",
                  }}
                >
                  <div><strong>📍 Địa điểm:</strong> {selectedEvent.DiaDiem || "Chưa cập nhật"}</div>
                  <div><strong>⏰ Bắt đầu:</strong> {new Date(selectedEvent.ThoiGianBatDau).toLocaleString("vi-VN")}</div>
                  <div><strong>⌛ Kết thúc:</strong> {new Date(selectedEvent.ThoiGianKetThuc).toLocaleString("vi-VN")}</div>
                </div>
              )}

              <form onSubmit={handleGenerateAI}>
                <div className="form-group">
                  <label>Loại thông báo cần tạo *</label>
                  <select
                    value={notificationType}
                    onChange={(e) => setNotificationType(e.target.value)}
                  >
                    <option value="NHAC_LICH">📢 Nhắc lịch tham gia & check-in</option>
                    <option value="THAY_DOI_DIA_DIEM">🔔 Thay đổi địa điểm / Hội trường mới</option>
                    <option value="KHAI_MAC">🎉 Chào mừng khai mạc sự kiện</option>
                    <option value="CAM_ON">💐 Thư cảm ơn sau sự kiện</option>
                    <option value="KET_THUC">✨ Bế mạc & Kết thúc sự kiện</option>
                    <option value="TUY_CHINH">✍️ Yêu cầu thông báo tùy chỉnh</option>
                  </select>
                </div>

                {notificationType === "THAY_DOI_DIA_DIEM" && (
                  <div className="form-group">
                    <label>Địa điểm mới (Nếu có)</label>
                    <input
                      type="text"
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      placeholder="Ví dụ: Hội trường A tầng 2 (Tòa nhà B)..."
                    />
                  </div>
                )}

                <div className="form-group">
                  <label>Ghi chú / Yêu cầu thêm cho AI (Tùy chọn)</label>
                  <textarea
                    rows="3"
                    value={extraNote}
                    onChange={(e) => setExtraNote(e.target.value)}
                    placeholder="Ví dụ: Nhắc người tham dự mang theo laptop; Lưu ý gửi xe ở hầm B1..."
                  />
                </div>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={generating || !selectedEventId}
                  style={{ width: "100%", padding: "12px", marginTop: "8px" }}
                >
                  {generating ? "🔄 AI đang soạn thảo..." : "✨ Tạo thông báo bằng AI"}
                </button>
              </form>
            </section>

            {/* RIGHT COLUMN: REVIEW & EDIT BEFORE SAVING */}
            <section className="checkin-panel">
              <h2>2. Xem trước & Chỉnh sửa (Review & Edit)</h2>

              {!isGenerated && !previewTitle ? (
                <div className="checkin-empty">
                  <span className="checkin-empty-icon">📢</span>
                  <h3 style={{ fontSize: "16px", color: "var(--text-primary)", marginBottom: "6px" }}>
                    Chưa có bản thảo
                  </h3>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", maxWidth: "320px", margin: "0 auto" }}>
                    Chọn loại thông báo và nhấn <strong>"Tạo thông báo bằng AI"</strong> để xem và chỉnh sửa bản thảo tại đây.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSaveNotification}>
                  <div className="form-group">
                    <label>Tiêu đề thông báo (Có thể sửa) *</label>
                    <input
                      type="text"
                      value={previewTitle}
                      onChange={(e) => setPreviewTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Nội dung thông báo chi tiết (Có thể sửa) *</label>
                    <textarea
                      rows="8"
                      value={previewContent}
                      onChange={(e) => setPreviewContent(e.target.value)}
                      required
                      style={{ minHeight: "160px" }}
                    />
                  </div>

                  <div className="form-actions">
                    <button
                      type="submit"
                      className="confirm-checkin-button"
                      disabled={saving}
                      style={{ flex: 1 }}
                    >
                      {saving ? "🔄 Đang lưu..." : "💾 Lưu & Phát hành thông báo"}
                    </button>

                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => {
                        setIsGenerated(false);
                        setPreviewTitle("");
                        setPreviewContent("");
                      }}
                    >
                      Hủy
                    </button>
                  </div>
                </form>
              )}
            </section>
          </div>

          {/* NOTIFICATION HISTORY */}
          <section className="dashboard-section" style={{ marginTop: "28px" }}>
            <div className="section-header">
              <h2>📋 Danh sách thông báo đã phát hành ({notifications.length})</h2>
            </div>

            {loadingHistory ? (
              <div style={{ padding: "30px", textAlign: "center", color: "var(--text-secondary)" }}>
                <p>Đang tải lịch sử thông báo...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="empty-state">
                <h3>Chưa có thông báo</h3>
                <p>Sự kiện này chưa có thông báo nào được lưu hoặc phát hành.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {notifications.map((item) => (
                  <article className="feedback-item" key={item.ThongBaoId}>
                    <div className="feedback-item-header">
                      <div>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "2px 8px",
                            borderRadius: "var(--radius-sm)",
                            fontSize: "12px",
                            backgroundColor: "var(--primary-light)",
                            color: "var(--primary)",
                            marginBottom: "6px",
                            fontWeight: 600,
                            border: "1px solid var(--primary-border)",
                          }}
                        >
                          {typeLabels[item.LoaiThongBao] || item.LoaiThongBao}
                        </span>
                        <strong style={{ display: "block", fontSize: "15px", color: "var(--text-primary)" }}>
                          {item.TieuDe}
                        </strong>
                      </div>

                      <button
                        type="button"
                        className="delete-button"
                        onClick={() => handleDeleteNotification(item.ThongBaoId)}
                      >
                        🗑️ Xóa
                      </button>
                    </div>

                    <p style={{ marginTop: "8px", fontSize: "13.5px", lineHeight: "1.6", color: "var(--text-primary)" }}>
                      {item.NoiDung}
                    </p>

                    <small style={{ color: "var(--text-secondary)", display: "block", marginTop: "8px" }}>
                      Đã phát hành lúc: {item.NgayTao ? new Date(item.NgayTao).toLocaleString("vi-VN") : "—"}
                    </small>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export default AIAssistant;