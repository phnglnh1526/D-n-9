import {
  useEffect,
  useState,
} from "react";

import {
  createEvent,
  deleteEvent,
  getEvents,
  updateEvent,
} from "../services/api";


const initialForm = {
  NguoiToChucId: 2,
  TenSuKien: "",
  MoTa: "",
  ThoiGianBatDau: "",
  ThoiGianKetThuc: "",
  DiaDiem: "",
  TrangThai: "NHAP",
};


function AdminEvents() {
  const [events, setEvents] =
    useState([]);

  const [form, setForm] =
    useState(initialForm);

  const [editingId, setEditingId] =
    useState(null);

  const [showForm, setShowForm] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");


  // ======================================================
  // LOAD EVENTS
  // ======================================================

  async function loadEvents() {
    try {
      setError("");

      const data = await getEvents();

      setEvents(data);

    } catch (err) {
      setError(err.message);

    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    loadEvents();
  }, []);


  // ======================================================
  // INPUT
  // ======================================================

  function handleChange(event) {
    const {
      name,
      value,
    } = event.target;

    setForm((current) => ({
      ...current,

      [name]:
        name === "NguoiToChucId"
          ? Number(value)
          : value,
    }));
  }


  // ======================================================
  // CREATE / UPDATE
  // ======================================================

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const payload = {
        ...form,

        ThoiGianBatDau:
          new Date(
            form.ThoiGianBatDau
          ).toISOString(),

        ThoiGianKetThuc:
          new Date(
            form.ThoiGianKetThuc
          ).toISOString(),
      };


      if (editingId) {
        await updateEvent(
          editingId,
          payload
        );

        setSuccess(
          "Cập nhật sự kiện thành công."
        );

      } else {
        await createEvent(payload);

        setSuccess(
          "Tạo sự kiện thành công."
        );
      }


      setForm(initialForm);
      setEditingId(null);
      setShowForm(false);

      await loadEvents();

    } catch (err) {
      setError(err.message);

    } finally {
      setSaving(false);
    }
  }


  // ======================================================
  // EDIT
  // ======================================================

  function handleEdit(eventItem) {
    setError("");
    setSuccess("");

    setEditingId(
      eventItem.SuKienId
    );

    setForm({
      NguoiToChucId:
        eventItem.NguoiToChucId,

      TenSuKien:
        eventItem.TenSuKien || "",

      MoTa:
        eventItem.MoTa || "",

      ThoiGianBatDau:
        toInputDateTime(
          eventItem.ThoiGianBatDau
        ),

      ThoiGianKetThuc:
        toInputDateTime(
          eventItem.ThoiGianKetThuc
        ),

      DiaDiem:
        eventItem.DiaDiem || "",

      TrangThai:
        eventItem.TrangThai || "NHAP",
    });

    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }


  // ======================================================
  // DELETE
  // ======================================================

  async function handleDelete(eventItem) {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa "${eventItem.TenSuKien}" không?`
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      await deleteEvent(
        eventItem.SuKienId
      );

      setSuccess(
        "Xóa sự kiện thành công."
      );

      await loadEvents();

    } catch (err) {
      setError(err.message);
    }
  }


  // ======================================================
  // CANCEL
  // ======================================================

  function cancelForm() {
    setForm(initialForm);
    setEditingId(null);
    setShowForm(false);
    setError("");
  }


  if (loading) {
    return (
      <p>Đang tải sự kiện...</p>
    );
  }


  return (
    <div>

      {/* HEADER */}

      <div className="page-header-row">

        <div className="page-header">
          <h1>Quản lý sự kiện</h1>

          <p>
            Tạo, chỉnh sửa và quản lý
            các sự kiện trong hệ thống.
          </p>
        </div>


        <button
          className="primary-button"
          onClick={() => {
            setForm(initialForm);
            setEditingId(null);

            setShowForm(
              (current) => !current
            );
          }}
        >
          + Thêm sự kiện
        </button>

      </div>


      {/* MESSAGE */}

      {error && (
        <div className="alert error-alert">
          {error}
        </div>
      )}

      {success && (
        <div className="alert success-alert">
          {success}
        </div>
      )}


      {/* FORM */}

      {showForm && (

        <section className="event-form-card">

          <h2>
            {editingId
              ? "Cập nhật sự kiện"
              : "Thêm sự kiện mới"}
          </h2>


          <form
            className="event-form"
            onSubmit={handleSubmit}
          >

            <div className="form-grid">

              <div className="form-group">
                <label>
                  Người tổ chức ID
                </label>

                <input
                  type="number"
                  name="NguoiToChucId"
                  value={
                    form.NguoiToChucId
                  }
                  onChange={handleChange}
                  required
                />
              </div>


              <div className="form-group">
                <label>
                  Tên sự kiện
                </label>

                <input
                  type="text"
                  name="TenSuKien"
                  value={
                    form.TenSuKien
                  }
                  onChange={handleChange}
                  required
                />
              </div>


              <div className="form-group">
                <label>
                  Thời gian bắt đầu
                </label>

                <input
                  type="datetime-local"
                  name="ThoiGianBatDau"
                  value={
                    form.ThoiGianBatDau
                  }
                  onChange={handleChange}
                  required
                />
              </div>


              <div className="form-group">
                <label>
                  Thời gian kết thúc
                </label>

                <input
                  type="datetime-local"
                  name="ThoiGianKetThuc"
                  value={
                    form.ThoiGianKetThuc
                  }
                  onChange={handleChange}
                  required
                />
              </div>


              <div className="form-group">
                <label>
                  Địa điểm
                </label>

                <input
                  type="text"
                  name="DiaDiem"
                  value={
                    form.DiaDiem
                  }
                  onChange={handleChange}
                />
              </div>


              {editingId && (

                <div className="form-group">
                  <label>
                    Trạng thái
                  </label>

                  <select
                    name="TrangThai"
                    value={
                      form.TrangThai
                    }
                    onChange={
                      handleChange
                    }
                  >
                    <option value="NHAP">
                      NHAP
                    </option>

                    <option value="DA_DUYET">
                      DA_DUYET
                    </option>

                    <option value="DANG_DIEN_RA">
                      DANG_DIEN_RA
                    </option>

                    <option value="DA_KET_THUC">
                      DA_KET_THUC
                    </option>
                  </select>
                </div>

              )}

            </div>


            <div className="form-group">
              <label>Mô tả</label>

              <textarea
                name="MoTa"
                rows="4"
                value={form.MoTa}
                onChange={handleChange}
              />
            </div>


            <div className="form-actions">

              <button
                type="submit"
                className="primary-button"
                disabled={saving}
              >
                {saving
                  ? "Đang lưu..."
                  : editingId
                    ? "Lưu thay đổi"
                    : "Tạo sự kiện"}
              </button>


              <button
                type="button"
                className="secondary-button"
                onClick={cancelForm}
              >
                Hủy
              </button>

            </div>

          </form>

        </section>

      )}


      {/* TABLE */}

      <section className="dashboard-section">

        <div className="section-header">

          <h2>
            Danh sách sự kiện
          </h2>

          <span>
            {events.length} sự kiện
          </span>

        </div>


        {events.length === 0 ? (

          <p>Chưa có sự kiện.</p>

        ) : (

          <div className="table-wrapper">

            <table className="data-table">

              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tên sự kiện</th>
                  <th>Địa điểm</th>
                  <th>Bắt đầu</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>


              <tbody>

                {events.map(
                  (eventItem) => (

                    <tr
                      key={
                        eventItem.SuKienId
                      }
                    >

                      <td>
                        #{eventItem.SuKienId}
                      </td>

                      <td>
                        <strong>
                          {
                            eventItem.TenSuKien
                          }
                        </strong>
                      </td>

                      <td>
                        {
                          eventItem.DiaDiem
                          || "—"
                        }
                      </td>

                      <td>
                        {new Date(
                          eventItem.ThoiGianBatDau
                        ).toLocaleString(
                          "vi-VN"
                        )}
                      </td>

                      <td>
                        <span
                          className={
                            eventItem.TrangThai
                            === "DA_DUYET"
                              ? "status approved"
                              : "status draft"
                          }
                        >
                          {
                            eventItem.TrangThai
                          }
                        </span>
                      </td>

                      <td>

                        <div className="table-actions">

                          <button
                            className="edit-button"
                            onClick={() =>
                              handleEdit(
                                eventItem
                              )
                            }
                          >
                            Sửa
                          </button>


                          <button
                            className="delete-button"
                            onClick={() =>
                              handleDelete(
                                eventItem
                              )
                            }
                          >
                            Xóa
                          </button>

                        </div>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </section>

    </div>
  );
}


function toInputDateTime(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  const offset =
    date.getTimezoneOffset();

  const localDate =
    new Date(
      date.getTime()
      - offset * 60 * 1000
    );

  return localDate
    .toISOString()
    .slice(0, 16);
}


export default AdminEvents;