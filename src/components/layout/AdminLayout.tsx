import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import "./AdminLayout.css";

export default function AdminLayout() {
    return (
        <div className="admin-layout">
            <AdminSidebar />
            <div className="admin-content-wrapper">
                <AdminHeader />
                <main className="admin-main">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
