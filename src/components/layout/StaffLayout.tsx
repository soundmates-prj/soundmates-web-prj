import { Outlet } from "react-router-dom";
import StaffSidebar from "./StaffSidebar";
import StaffHeader from "./StaffHeader";
import "./StaffLayout.css";

export default function StaffLayout() {
    return (
        <div className="staff-layout">
            <StaffSidebar />
            <div className="staff-content-wrapper">
                <StaffHeader />
                <main className="staff-main">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
