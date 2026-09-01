import {
  Navigate,
  Route,
  Routes,
} from "react-router";
import SubmitFeedback
  from "./pages/SubmitFeedback";
import AdminLayout
  from "./components/AdminLayout";

import ProtectedRoute
  from "./components/ProtectedRoute";

import AIAssistant
  from "./pages/AIAssistant";

import AdminEvents
  from "./pages/AdminEvents";

import AdminSchedules
  from "./pages/AdminSchedules";

import AdminSpeakers
  from "./pages/AdminSpeakers";

import CheckIn
  from "./pages/CheckIn";

import Dashboard
  from "./pages/Dashboard";

import Events
  from "./pages/Events";

import Feedback
  from "./pages/Feedback";

import Login
  from "./pages/Login";

import Registrations
  from "./pages/Registrations";

import "./App.css";

import EventDetail
  from "./pages/EventDetail";
  
function App() {
  return (
    <Routes>

      {/* PUBLIC */}
      <Route
        path="/feedback"
        element={<SubmitFeedback />}
      />
      <Route
        path="/feedback/:registrationId"
        element={<SubmitFeedback />}
      />
      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/events"
        element={<Events />}
      />

      <Route
        path="/events/:eventId"
        element={<EventDetail />}
      />

      {/* ADMIN & ORGANIZER */}

      <Route
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />
        <Route
          path="/admin/dashboard"
          element={<Dashboard />}
        />
        <Route
          path="/admin"
          element={<Navigate to="/dashboard" replace />}
        />

        <Route
          path="/admin/events"
          element={<AdminEvents />}
        />

        <Route
          path="/admin/schedules"
          element={<AdminSchedules />}
        />

        <Route
          path="/admin/speakers"
          element={<AdminSpeakers />}
        />

        <Route
          path="/admin/registrations"
          element={<Registrations />}
        />

        <Route
          path="/admin/check-in"
          element={<CheckIn />}
        />

        <Route
          path="/admin/feedback"
          element={<Feedback />}
        />

        <Route
          path="/admin/ai"
          element={<AIAssistant />}
        />

      </Route>


      <Route
        path="/"
        element={
          <Navigate
            to="/events"
            replace
          />
        }
      />

      {/* 404 Catch-All */}
      <Route
        path="*"
        element={
          <Navigate
            to="/events"
            replace
          />
        }
      />

    </Routes>
  );
}


export default App;