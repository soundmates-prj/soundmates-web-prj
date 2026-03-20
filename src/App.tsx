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
import { LiveSessionsPage } from "./pages/Livestream/LiveSessionsPage";
import { LiveRoomPage } from "./pages/Livestream/LiveRoomPage";
import Subscription from "./pages/Subscription/Subscription";
import ProtectedRoute from "./components/common/ProtectedRoute";
import Profile from "./pages/Profile/profile";
import SettingsPage from "./pages/Settings/SettingsPage";
import StaffLayout from "./components/layout/StaffLayout";
import { StaffDashboard } from "./pages/Staff/Dashboard/StaffDashboard";
import { StationsScreen } from "./pages/Staff/Stations/StationsScreen";
import { PlaylistsScreen } from "./pages/Staff/Playlists/PlaylistsScreen";
import { LiveSessionsScreen } from "./pages/Staff/LiveSessions/LiveSessionsScreen";
import { ScheduleScreen } from "./pages/Staff/Schedule/ScheduleScreen";
import { MusicRequestsScreen } from "./pages/Staff/MusicRequests/MusicRequestsScreen";
import { PodcastRequestsScreen } from "./pages/Staff/PodcastRequests/PodcastRequestsScreen";
import PaymentResult from "./pages/Payment/PaymentResult";

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

        {/* Staff Routes with Sidebar Layout - Protected for STAFF role */}
        <Route
          path="/staff"
          element={
            <ProtectedRoute requiredRole="STAFF">
              <StaffLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<StaffDashboard />} />
          <Route path="sessions" element={<LiveSessionsScreen />} />
          <Route path="schedule" element={<ScheduleScreen />} />
          <Route path="music-requests" element={<MusicRequestsScreen />} />
          <Route path="podcast-requests" element={<PodcastRequestsScreen />} />
          <Route path="playlists" element={<PlaylistsScreen />} />
          <Route path="stations" element={<StationsScreen />} />
        </Route>

        {/* Public Routes with Main Layout */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/livestream" element={<LivestreamPage />} />
          <Route path="/live" element={<LiveSessionsPage />} />
          <Route path="/live/:sessionId" element={<LiveRoomPage />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/payment/result" element={<PaymentResult />} />
        </Route>
      </Routes>
      </PlayerProvider>
    </ThemeProvider>
  );
}

export default App;
