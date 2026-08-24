const API_URL = import.meta.env.VITE_API_URL;


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


// ========================================================
// CHECK-IN REGISTRATION
// ========================================================

export async function checkInRegistration(
  registrationId,
  method = "MANUAL",
  qrCode = null
) {
  const response = await fetch(
    `${API_URL}/registrations/${registrationId}/check-in`,
    {
      method: "POST",

      headers: getAuthHeaders(),

      body: JSON.stringify({
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
    } catch {
      // giữ message mặc định
    }

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
// REGISTER FOR EVENT - PUBLIC
// ========================================================

export async function registerForEvent(
  eventId,
  data
) {
  const response = await fetch(
    `${API_URL}/events/${eventId}/registrations`,
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
// ========================================================
// AI FEEDBACK SUMMARY
// ========================================================

// ========================================================
// SUBMIT FEEDBACK - PUBLIC
// ========================================================

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