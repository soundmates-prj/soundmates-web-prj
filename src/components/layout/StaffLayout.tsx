import { useState } from "react";
import { Outlet } from "react-router-dom";
import SharedSidebar from "./SharedSidebar";
import SharedHeader from "./SharedHeader";
import "./SharedLayout.css";

export default function StaffLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="shared-layout">
            <SharedSidebar role="STAFF" isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            <div className="shared-content-wrapper">
                <SharedHeader role="STAFF" onToggleSidebar={() => setIsSidebarOpen(true)} />
                <main className="shared-main">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
