import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home/Home";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import MainLayout from "./components/layout/MainLayout";
import AdminLayout from "./components/layout/AdminLayout";
import { AdminDashboard } from "./pages/Admin/Dashboard/Dashboard";
import { AnalyticsScreen } from "./pages/Admin/Analytics/AnalyticsScreen";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Admin Routes with Sidebar Layout */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route path="dashboard" element={<AdminDashboard />} />
        {/* Thêm các routes admin khác ở đây */}
        <Route path="analytics" element={<AnalyticsScreen />} />
        {/* <Route path="ai-content" element={<AIContent />} /> */}
        {/* <Route path="users" element={<Users />} /> */}
        {/* <Route path="broadcasts" element={<Broadcasts />} /> */}
        {/* <Route path="posts" element={<Posts />} /> */}
        {/* <Route path="music" element={<MusicCatalog />} /> */}
        {/* <Route path="mentors" element={<Mentors />} /> */}
        {/* <Route path="settings" element={<Settings />} /> */}
      </Route>

      {/* Public Routes with Main Layout */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
      </Route>
    </Routes>
  );
}

export default App;
