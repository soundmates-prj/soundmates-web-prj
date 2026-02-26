import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home/Home";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import MainLayout from "./components/layout/MainLayout";
import AdminLayout from "./components/layout/AdminLayout";
import { AdminDashboard } from "./pages/Admin/Dashboard/Dashboard";
import { AnalyticsScreen } from "./pages/Admin/Analytics/AnalyticsScreen";
import { ToastProvider } from "./components/common/Toast";
import VerifyOtp from "./pages/Auth/VerifyOtp";
import { MusicCatalogScreen } from "./pages/Admin/MusicCatalog/MusicCatalog";
import { UserManagementScreen } from "./pages/Admin/UserManagement/UserManagement";

function App() {
  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        theme="light"
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />

      {/* Admin Routes with Sidebar Layout */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="analytics" element={<AnalyticsScreen />} />
        <Route path="music" element={<MusicCatalogScreen />} />
        <Route path="users" element={<UserManagementScreen />} />
      </Route>

        {/* Public Routes with Main Layout */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
