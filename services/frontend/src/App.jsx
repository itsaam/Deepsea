import { Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Verify2FA from "./pages/Verify2FA";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import SpeciesList from "./pages/SpeciesList";
import SpeciesDetail from "./pages/SpeciesDetail";
import CreateSpecies from "./pages/CreateSpecies";
import ObservationsList from "./pages/ObservationsList";
import AdminPanel from "./pages/AdminPanel";
import Statistics from "./pages/Statistics";
import Taxonomy from "./pages/Taxonomy";
import Casino from "./pages/Casino";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-2fa" element={<Verify2FA />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route
        path="/species"
        element={
          <ProtectedRoute>
            <SpeciesList />
          </ProtectedRoute>
        }
      />

      <Route
        path="/species/create"
        element={
          <ProtectedRoute>
            <CreateSpecies />
          </ProtectedRoute>
        }
      />

      <Route
        path="/species/:id"
        element={
          <ProtectedRoute>
            <SpeciesDetail />
          </ProtectedRoute>
        }
      />

      <Route
        path="/observations"
        element={
          <ProtectedRoute>
            <ObservationsList />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminPanel />
          </ProtectedRoute>
        }
      />

      <Route
        path="/casino"
        element={
          <ProtectedRoute>
            <Casino />
          </ProtectedRoute>
        }
      />

      <Route
        path="/statistics"
        element={
          <ProtectedRoute>
            <Statistics />
          </ProtectedRoute>
        }
      />

      <Route
        path="/taxonomy"
        element={
          <ProtectedRoute>
            <Taxonomy />
          </ProtectedRoute>
        }
      />

      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
