import { Outlet } from "react-router-dom";
import StaffSidebar from "./StaffSidebar";
import "./StaffLayout.css";

export default function StaffLayout() {
    return (
        <div className="staff-layout">
            <StaffSidebar />
            <main className="staff-main">
                <Outlet />
            </main>
        </div>
    );
}
