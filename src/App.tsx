import { Routes, Route, Navigate } from "react-router-dom";
import { PlayerProvider } from "./context/PlayerContext";
import { ThemeProvider } from "./context/ThemeContext";
import { LiveSessionProvider } from "./context/LiveSessionContext";
import Home from "./pages/Home/Home";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import MainLayout from "./components/layout/MainLayout";
import AdminLayout from "./components/layout/AdminLayout";
import HostLayout from "./components/layout/HostLayout";
import { AnalyticsScreen } from "./pages/Admin/Analytics/AnalyticsScreen";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import AdminSettingsPage from "./pages/Admin/AdminSettingsPage";
import { ToastProvider } from "./components/common/Toast";
import VerifyOtp from "./pages/Auth/VerifyOtp";
import ForgetPassword from "./pages/Auth/ForgetPassword";
import { UserManagementScreen } from "./pages/Admin/UserManagement/UserManagement";
import { LiveSessionsPage } from "./pages/Livestream/LiveSessionsPage";
import { LiveRoomPage } from "./pages/Livestream/LiveRoomPage";
import { useParams } from "react-router-dom";
import Subscription from "./pages/Subscription/Subscription";
import ProtectedRoute from "./components/common/ProtectedRoute";
import Profile from "./pages/Profile/profile";
import SettingsPage from "./pages/Settings/SettingsPage";
import StaffLayout from "./components/layout/StaffLayout";
import { StaffDashboard } from "./pages/Staff/Dashboard/StaffDashboard";
import StaffSettingsPage from "./pages/Staff/Settings/StaffSettingsPage";
import { StationsScreen } from "./pages/Staff/Stations/StationsScreen";
import { PlaylistsScreen } from "./pages/Staff/Playlists/PlaylistsScreen";
import { MusicCatalogScreen } from "./pages/Staff/MusicCatalog/MusicCatalogScreen";
import { LiveSessionsScreen as StaffLiveSessionsScreen } from "./pages/Staff/LiveSessions/LiveSessionsScreen";
import { ScheduleScreen } from "./pages/Staff/Schedule/ScheduleScreen";
import { MusicRequestsScreen } from "./pages/Staff/MusicRequests/MusicRequestsScreen";
import { PodcastRequestsScreen } from "./pages/Staff/PodcastRequests/PodcastRequestsScreen";
import TransactionHistory from "./pages/Profile/TransactionHistory";
import PaymentResult from "./pages/Payment/PaymentResult";
import DashboardPage from "./pages/Admin/LiveOps/DashboardPage";
import StationPage from "./pages/Admin/LiveOps/StationPage";
import MusicCatalogPage from "./pages/Admin/LiveOps/MusicCatalogPage";
import PlaylistPage from "./pages/Admin/LiveOps/PlaylistPage";
import PlaylistDetailPage from "./pages/Admin/LiveOps/PlaylistDetailPage";
import PodcastPage from "./pages/Admin/LiveOps/PodcastPage";
import PodcastEditor from "./pages/Admin/LiveOps/PodcastEditor";
import { PodcastCreatorPage } from "./pages/PodcastCreator/PodcastCreatorPage";
import ForumPage from "./pages/Forum/ForumPage";
import SchedulePublicPage from "./pages/SchedulePublic/SchedulePublicPage";
import TransactionsPage from "./pages/Admin/LiveOps/TransactionsPage";
import MyPodcastsPage from "./pages/podcast/MyPodcastsPage";
import PayoutScreen from "./pages/Admin/LiveOps/PayoutScreen";

// ── Host Page Imports ──
import { HostDashboard } from "./pages/Host/Dashboard/HostDashboard";
import { HostScheduleView } from "./pages/Host/Schedule/HostScheduleView";
import HostLiveSessionPage from "./pages/Host/LiveSession/HostLiveSessionPage";
import HostLiveSessionDetailPage from "./pages/Host/LiveSession/HostLiveSessionDetailPage";
import { HostAnalyticsScreen } from "./pages/Host/Analytics/HostAnalyticsScreen";
import { HostSessionAnalyticsDetailScreen } from "./pages/Host/Analytics/HostSessionAnalyticsDetailScreen";
import HostSettingsPage from "./pages/Host/Settings/HostSettingsPage";

// ── Staff Page Imports ──
import { ChatModerationScreen } from "./pages/Staff/ChatModeration/ChatModerationScreen";
import { ScriptModerationScreen } from "./pages/Staff/Scripts/ScriptModerationScreen";
import { CreateLiveSessionScreen } from "./pages/Staff/LiveSession/CreateLiveSessionScreen";
import { StaffAnalyticsScreen } from "./pages/Staff/Analytics/StaffAnalyticsScreen";
import { LiveStreamScriptEditor } from "./pages/Staff/Schedule/LiveStreamScriptEditor";

// ── Admin Page Imports ──
import { UserPostsManagementScreen } from "./pages/Admin/Posts/UserPostsManagementScreen";
import { SystemConfigScreen } from "./pages/Admin/SystemConfig/SystemConfigScreen";
import { RoleManagementScreen } from "./pages/Admin/Roles/RoleManagementScreen";
import PodcastScreen from "./pages/Podcast/PodcastScreen";
import PodcastDetailScreen from "./pages/Podcast/PodcastDetailScreen";

// ── LiveRoomPageWithKey: force remount when sessionId changes ──
function LiveRoomPageWithKey() {
  const { sessionId } = useParams<{ sessionId: string }>();
  return <LiveRoomPage key={sessionId} />;
}

function App() {
  return (
    <ThemeProvider>
      <PlayerProvider>
        <LiveSessionProvider>
          <ToastProvider />
          <Routes>
            {/* ── Auth Routes (no layout) ── */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-otp" element={<VerifyOtp />} />
            <Route path="/forget-password" element={<ForgetPassword />} />

            {/* ── Admin Routes ── */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="analytics" element={<AnalyticsScreen />} />
              <Route path="music" element={<MusicCatalogPage />} />
              <Route
                path="users"
                element={
                  <ErrorBoundary>
                    <UserManagementScreen />
                  </ErrorBoundary>
                }
              />
              <Route
                path="roles"
                element={
                  <ErrorBoundary>
                    <RoleManagementScreen />
                  </ErrorBoundary>
                }
              />
              <Route path="stations" element={<StationPage />} />
              <Route path="playlists" element={<PlaylistPage />} />
              <Route
                path="playlists/:playlistId"
                element={<PlaylistDetailPage />}
              />
              <Route path="podcasts" element={<PodcastPage />} />
              <Route path="podcasts/new" element={<PodcastEditor />} />
              <Route path="podcasts/:podcastId" element={<PodcastEditor />} />
              <Route path="settings" element={<AdminSettingsPage />} />
              <Route path="transactions" element={<TransactionsPage />} />
              <Route path="posts" element={<UserPostsManagementScreen />} />
            </Route>
            {/* ── Admin Routes ── */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="analytics" element={<AnalyticsScreen />} />
              <Route path="music" element={<MusicCatalogPage />} />
              <Route
                path="users"
                element={
                  <ErrorBoundary>
                    <UserManagementScreen />
                  </ErrorBoundary>
                }
              />
              <Route
                path="roles"
                element={
                  <ErrorBoundary>
                    <RoleManagementScreen />
                  </ErrorBoundary>
                }
              />
              <Route path="stations" element={<StationPage />} />
              <Route path="playlists" element={<PlaylistPage />} />
              <Route
                path="playlists/:playlistId"
                element={<PlaylistDetailPage />}
              />
              <Route path="podcasts" element={<PodcastPage />} />
              <Route path="podcasts/new" element={<PodcastEditor />} />
              <Route path="podcasts/:podcastId" element={<PodcastEditor />} />
              <Route path="settings" element={<AdminSettingsPage />} />
              <Route path="transactions" element={<TransactionsPage />} />
              <Route path="payouts" element={<PayoutScreen />} />
              <Route path="posts" element={<UserPostsManagementScreen />} />
            </Route>

            {/* ── Staff Routes ── */}
            <Route
              path="/staff"
              element={
                <ProtectedRoute requiredRole="STAFF">
                  <StaffLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<StaffDashboard />} />
              <Route path="sessions" element={<StaffLiveSessionsScreen />} />
              <Route
                path="create-session"
                element={<CreateLiveSessionScreen />}
              />
              <Route path="schedule" element={<ScheduleScreen />} />
              <Route path="music-requests" element={<MusicRequestsScreen />} />
              <Route
                path="podcast-requests"
                element={<PodcastRequestsScreen />}
              />
              <Route
                path="chat-moderation"
                element={<ChatModerationScreen />}
              />
              <Route path="ai-scripts" element={<ScriptModerationScreen />} />
              <Route
                path="script-editor"
                element={<LiveStreamScriptEditor />}
              />
              <Route path="analytics" element={<StaffAnalyticsScreen />} />
              <Route path="podcast-creator" element={<PodcastCreatorPage />} />
              <Route path="music-catalog" element={<MusicCatalogScreen />} />
              <Route path="playlists" element={<PlaylistsScreen />} />
              <Route path="stations" element={<StationsScreen />} />
              <Route path="settings" element={<StaffSettingsPage />} />
            </Route>

            {/* ── Host Routes ── */}
            <Route
              path="/host"
              element={
                <ProtectedRoute requiredRole="HOST">
                  <HostLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<HostDashboard />} />
              <Route path="sessions" element={<HostLiveSessionPage />} />
              <Route
                path="sessions/:sessionId"
                element={<HostLiveSessionDetailPage />}
              />
              <Route path="schedule" element={<HostScheduleView />} />
              <Route path="analytics" element={<HostAnalyticsScreen />} />
              <Route
                path="analytics/:sessionId"
                element={<HostSessionAnalyticsDetailScreen />}
              />
              <Route path="settings" element={<HostSettingsPage />} />
            </Route>

            {/* ── Public Routes ── */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<Home />} />
              {/* Redirect /livestream → /live */}
              <Route
                path="/livestream"
                element={<Navigate to="/live" replace />}
              />
              <Route path="/live" element={<LiveSessionsPage />} />
              <Route
                path="/live/:sessionId"
                element={
                  <ErrorBoundary>
                    <LiveRoomPageWithKey />
                  </ErrorBoundary>
                }
              />
              <Route path="/subscription" element={<Subscription />} />
              <Route path="/podcast" element={<PodcastScreen />} />
              <Route path="/podcast/:id" element={<PodcastDetailScreen />} />
              <Route path="/podcast/my" element={<MyPodcastsPage />} />
              <Route path="/forum" element={<ForumPage />} />
              <Route path="/schedule-public" element={<SchedulePublicPage />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/:userId" element={<Profile />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/payment/result" element={<PaymentResult />} />
              <Route
                path="/profile/transactions"
                element={<TransactionHistory />}
              />
              <Route
                path="/podcast-creator"
                element={
                  <ProtectedRoute>
                    <PodcastCreatorPage />
                  </ProtectedRoute>
                }
              />
            </Route>
          </Routes>
        </LiveSessionProvider>
      </PlayerProvider>
    </ThemeProvider>
  );
}

export default App;
