import { Outlet } from "react-router-dom";
import SharedSidebar from "./SharedSidebar";
import SharedHeader from "./SharedHeader";
import "./SharedLayout.css";

export default function StaffLayout() {
    return (
        <div className="shared-layout">
            <SharedSidebar role="STAFF" />
            <div className="shared-content-wrapper">
                <SharedHeader role="STAFF" />
                <main className="shared-main">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
