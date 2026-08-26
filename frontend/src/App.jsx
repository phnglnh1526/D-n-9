import {
  Navigate,
  Route,
  Routes,
} from "react-router";

import AdminEvents from "./pages/AdminEvents";
import AIAssistant from "./pages/AIAssistant";
import CheckIn from "./pages/CheckIn";
import Dashboard from "./pages/Dashboard";
import EventDetail from "./pages/EventDetail";
import Events from "./pages/Events";
import Feedback from "./pages/Feedback";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Registrations from "./pages/Registrations";
import SubmitFeedback from "./pages/SubmitFeedback";

import AdminLayout from "./components/AdminLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicLayout from "./components/PublicLayout";

import "./App.css";


function App() {
  return (
    <Routes>
      {/* PUBLIC */}
      <Route element={<PublicLayout />}>
        <Route index element={<Home />} />

        <Route
          path="events"
          element={<Events />}
        />

        <Route
          path="events/:eventId"
          element={<EventDetail />}
        />

        <Route
          path="feedback/:registrationId"
          element={<SubmitFeedback />}
        />
      </Route>

      <Route
        path="/login"
        element={<Login />}
      />

      {/* ADMIN */}
      <Route
        path="/admin"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />

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
          path="/admin/events"
          element={<AdminEvents />}
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
    </Routes>
  );
}


export default App;
