import { Outlet } from "react-router-dom";
import SharedSidebar from "./SharedSidebar";
import SharedHeader from "./SharedHeader";
import "./SharedLayout.css";

export default function AdminLayout() {
    return (
        <div className="shared-layout">
            <SharedSidebar role="ADMIN" />
            <div className="shared-content-wrapper">
                <SharedHeader role="ADMIN" />
                <main className="shared-main">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
