import { Outlet } from "react-router-dom";
import SharedSidebar from "./SharedSidebar";
import SharedHeader from "./SharedHeader";
import "./SharedLayout.css";

export default function HostLayout() {
    return (
        <div className="shared-layout">
            <SharedSidebar role="HOST" />
            <div className="shared-content-wrapper">
                <SharedHeader role="HOST" />
                <main className="shared-main">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
