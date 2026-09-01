const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";


function getAuthHeaders() {
  const token = sessionStorage.getItem("access_token");

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}


// ========================================================
// GET EVENTS - PUBLIC
// ========================================================

export async function getEvents() {
  const response = await fetch(
    `${API_URL}/events`
  );

  if (!response.ok) {
    throw new Error(
      "Không thể tải danh sách sự kiện"
    );
  }

  return response.json();
}


// ========================================================
// CREATE EVENT
// ========================================================

export async function createEvent(data) {
  const response = await fetch(
    `${API_URL}/events`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json();

    throw new Error(
      error.detail || "Không thể tạo sự kiện"
    );
  }

  return response.json();
}


// ========================================================
// UPDATE EVENT
// ========================================================

export async function updateEvent(
  eventId,
  data
) {
  const response = await fetch(
    `${API_URL}/events/${eventId}`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json();

    throw new Error(
      error.detail || "Không thể cập nhật sự kiện"
    );
  }

  return response.json();
}


// ========================================================
// DELETE EVENT
// ========================================================

export async function deleteEvent(eventId) {
  const response = await fetch(
    `${API_URL}/events/${eventId}`,
    {
      method: "DELETE",
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    let message = "Không thể xóa sự kiện";

    try {
      const error = await response.json();

      message = error.detail || message;
    } catch {
      // giữ message mặc định
    }

    throw new Error(message);
  }

  return response.json();
}
// ========================================================
// GET REGISTRATIONS OF EVENT
// ========================================================

export async function getEventRegistrations(eventId) {
  const response = await fetch(
    `${API_URL}/events/${eventId}/registrations`,
    {
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    let message =
      "Không thể tải danh sách đăng ký";

    try {
      const error = await response.json();
      message = error.detail || message;
    } catch {
      // giữ message mặc định
    }

    throw new Error(message);
  }

  return response.json();
}


export async function lookupForCheckIn(code, eventId = null) {
  const query = eventId ? `?event_id=${eventId}` : "";
  const response = await fetch(
    `${API_URL}/check-in/lookup/${encodeURIComponent(code)}${query}`,
    {
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    let message = "Không tìm thấy thông tin check-in";
    try {
      const error = await response.json();
      message = error.detail || message;
    } catch {}
    throw new Error(message);
  }

  return response.json();
}


// ========================================================
// CHECK-IN REGISTRATION
// ========================================================

export async function checkInRegistration(
  registrationId,
  method = "MANUAL",
  qrCode = null,
  eventId = null
) {
  const response = await fetch(
    `${API_URL}/registrations/${registrationId}/check-in`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        SuKienId: eventId ? Number(eventId) : null,
        PhuongThucCheckIn: method,
        MaQR: qrCode,
      }),
    }
  );

  if (!response.ok) {
    let message = "Check-in thất bại";
    try {
      const error = await response.json();
      message = error.detail || message;
    } catch {}
    throw new Error(message);
  }

  return response.json();
}
export async function getEventById(eventId) {
  const response = await fetch(
    `${API_URL}/events/${eventId}`
  );

  if (!response.ok) {
    let message = "Không thể tải thông tin sự kiện";

    try {
      const error = await response.json();
      message = error.detail || message;
    } catch {
      // giữ message mặc định
    }

    throw new Error(message);
  }

  return response.json();
}
// ========================================================
// REGISTER FOR EVENT - AUTHENTICATED ATTENDEE
// ========================================================

export async function registerForEvent(
  eventId,
  data
) {
  const response = await fetch(
    `${API_URL}/events/${eventId}/registrations`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    let message =
      "Không thể đăng ký sự kiện";

    try {
      const error = await response.json();

      message =
        error.detail || message;
    } catch {
      // giữ thông báo mặc định
    }

    throw new Error(message);
  }

  return response.json();
}

export async function getMyRegistrations() {
  const response = await fetch(
    `${API_URL}/users/me/registrations`,
    {
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error("Không thể tải danh sách vé đã đăng ký");
  }

  return response.json();
}

export async function getRegistrationById(registrationId) {
  const response = await fetch(
    `${API_URL}/registrations/${registrationId}`,
    {
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    let message = "Không thể tải thông tin vé đăng ký";
    try {
      const error = await response.json();
      message = error.detail || message;
    } catch {}
    throw new Error(message);
  }

  return response.json();
}
// ========================================================
// AI FEEDBACK SUMMARY
// ========================================================

// ========================================================
// SUBMIT FEEDBACK
// ========================================================

export async function submitEventFeedback(
  eventId,
  data
) {
  const response = await fetch(
    `${API_URL}/events/${eventId}/feedback`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    let message = "Không thể gửi phản hồi";
    try {
      const error = await response.json();
      message = error.detail || message;
    } catch {}
    throw new Error(message);
  }

  return response.json();
}

export async function submitFeedback(
  registrationId,
  data
) {
  const response = await fetch(
    `${API_URL}/registrations/${registrationId}/feedback`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    let message =
      "Không thể gửi phản hồi";

    try {
      const error =
        await response.json();

      message =
        error.detail || message;

    } catch {
      // giữ message mặc định
    }

    throw new Error(message);
  }

  return response.json();
}
export async function getEventFeedback(eventId) {
  const response = await fetch(
    `${API_URL}/events/${eventId}/feedback`,
    {
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    let message = "Không thể tải danh sách phản hồi";

    try {
      const error = await response.json();
      message = error.detail || message;
    } catch {
      // giữ message mặc định
    }

    throw new Error(message);
  }

  return response.json();
}

export async function getFeedbackSummary(eventId) {
  const response = await fetch(
    `${API_URL}/events/${eventId}/ai/feedback-summary`,
    {
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    let message = "Không thể phân tích phản hồi bằng AI";

    try {
      const error = await response.json();
      message = error.detail || message;
    } catch {
      // giữ message mặc định
    }

    throw new Error(message);
  }

  return response.json();
}

// ========================================================
// AI ATTENDANCE INSIGHT
// ========================================================

export async function getAttendanceInsight(payload) {
  const response = await fetch(
    `${API_URL}/ai/attendance-insight`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    let message = "Không thể thực hiện phân tích AI lúc này.";

    try {
      const error = await response.json();
      message = error.detail || message;
    } catch {
      // giữ message mặc định
    }

    throw new Error(message);
  }

  return response.json();
}


// ========================================================
// SPEAKERS (DIỄN GIẢ)
// ========================================================

export async function getSpeakers() {
  const response = await fetch(`${API_URL}/speakers`);
  if (!response.ok) {
    throw new Error("Không thể tải danh sách diễn giả");
  }
  return response.json();
}

export async function createSpeaker(data) {
  const response = await fetch(`${API_URL}/speakers`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Không thể tạo diễn giả");
  }
  return response.json();
}

export async function updateSpeaker(speakerId, data) {
  const response = await fetch(`${API_URL}/speakers/${speakerId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Không thể cập nhật diễn giả");
  }
  return response.json();
}

export async function deleteSpeaker(speakerId) {
  const response = await fetch(`${API_URL}/speakers/${speakerId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Không thể xóa diễn giả");
  }
  return response.json();
}


// ========================================================
// SCHEDULES / SESSIONS (LỊCH TRÌNH / PHIÊN SỰ KIỆN)
// ========================================================

export async function getEventSessions(eventId) {
  const response = await fetch(`${API_URL}/events/${eventId}/sessions`);
  if (!response.ok) {
    throw new Error("Không thể tải lịch trình sự kiện");
  }
  return response.json();
}

export async function createEventSession(eventId, data) {
  const response = await fetch(`${API_URL}/events/${eventId}/sessions`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Không thể tạo phiên sự kiện");
  }
  return response.json();
}

export async function updateEventSession(sessionId, data) {
  const response = await fetch(`${API_URL}/sessions/${sessionId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Không thể cập nhật phiên sự kiện");
  }
  return response.json();
}

export async function deleteEventSession(sessionId) {
  const response = await fetch(`${API_URL}/sessions/${sessionId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Không thể xóa phiên sự kiện");
  }
  return response.json();
}

// ========================================================
// AI ANNOUNCEMENT / NOTIFICATIONS
// ========================================================

export async function generateAINotification(eventId, data) {
  const response = await fetch(
    `${API_URL}/events/${eventId}/ai/generate-notification`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    let message = "Không thể sinh thông báo bằng AI";
    try {
      const error = await response.json();
      message = error.detail || message;
    } catch {}
    throw new Error(message);
  }

  return response.json();
}

export async function saveEventNotification(eventId, data) {
  const response = await fetch(
    `${API_URL}/events/${eventId}/notifications`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    let message = "Không thể lưu thông báo";
    try {
      const error = await response.json();
      message = error.detail || message;
    } catch {}
    throw new Error(message);
  }

  return response.json();
}

export async function getEventNotifications(eventId) {
  const response = await fetch(`${API_URL}/events/${eventId}/notifications`);
  if (!response.ok) {
    throw new Error("Không thể tải danh sách thông báo");
  }
  return response.json();
}

export async function deleteEventNotification(eventId, notificationId) {
  const response = await fetch(
    `${API_URL}/events/${eventId}/notifications/${notificationId}`,
    {
      method: "DELETE",
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error("Không thể xóa thông báo");
  }
  return true;
}

// ========================================================
// AI CHATBOT (HỎI ĐÁP SỰ KIỆN)
// ========================================================

export async function sendAIChat(message, eventId = null) {
  const payload = {
    message,
    event_id: eventId ? Number(eventId) : null,
  };

  const url = eventId ? `${API_URL}/events/${eventId}/ai/chat` : `${API_URL}/ai/chat`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMsg = "Không thể gửi câu hỏi tới AI Chatbot";
    try {
      const err = await response.json();
      errorMsg = err.detail || errorMsg;
    } catch {}
    throw new Error(errorMsg);
  }

  return response.json();
}

// ========================================================
// STATISTICS / DASHBOARD
// ========================================================

export async function getDashboardOverview() {
  const response = await fetch(`${API_URL}/events/statistics/overview`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Không thể tải thống kê tổng quan");
  }

  return response.json();
}

export async function getEventStatistics(eventId) {
  const response = await fetch(`${API_URL}/events/${eventId}/statistics`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Không thể tải thống kê chi tiết sự kiện");
  }

  return response.json();
}
