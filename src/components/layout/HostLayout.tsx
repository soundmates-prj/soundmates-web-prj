import { useState } from "react";
import { Outlet } from "react-router-dom";
import SharedSidebar from "./SharedSidebar";
import SharedHeader from "./SharedHeader";
import "./SharedLayout.css";

export default function HostLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="shared-layout">
            <SharedSidebar role="HOST" isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            <div className="shared-content-wrapper">
                <SharedHeader role="HOST" onToggleSidebar={() => setIsSidebarOpen(true)} />
                <main className="shared-main">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
