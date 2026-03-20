import { Routes, Route } from "react-router-dom";
import { PlayerProvider } from "./context/PlayerContext";
import { ThemeProvider } from "./context/ThemeContext";
import Home from "./pages/Home/Home";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import MainLayout from "./components/layout/MainLayout";
import AdminLayout from "./components/layout/AdminLayout";
import { AdminDashboard } from "./pages/Admin/Dashboard/Dashboard";
import { AnalyticsScreen } from "./pages/Admin/Analytics/AnalyticsScreen";
import { ToastProvider } from "./components/common/Toast";
import VerifyOtp from "./pages/Auth/VerifyOtp";
import ForgetPassword from "./pages/Auth/ForgetPassword";
import { MusicCatalogScreen } from "./pages/Admin/MusicCatalog/MusicCatalog";
import { UserManagementScreen } from "./pages/Admin/UserManagement/UserManagement";
import LivestreamPage from "./pages/Livestream/Livestream";
import Subscription from "./pages/Subscription/Subscription";
import ProtectedRoute from "./components/common/ProtectedRoute";
import Profile from "./pages/Profile/profile";
import Settings from "./pages/Settings";

function App() {
  return (
    <ThemeProvider>
      <PlayerProvider>
        <ToastProvider />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/forget-password" element={<ForgetPassword />} />

        {/* Admin Routes with Sidebar Layout - Protected for ADMIN role only */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="analytics" element={<AnalyticsScreen />} />
          <Route path="music" element={<MusicCatalogScreen />} />
          <Route path="users" element={<UserManagementScreen />} />
        </Route>

        {/* Public Routes with Main Layout */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/livestream" element={<LivestreamPage />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
      </PlayerProvider>
    </ThemeProvider>
  );
}

export default App;
