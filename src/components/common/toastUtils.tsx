import React from "react";
import { toast } from "react-toastify";

interface ToastMessageProps {
    title: string;
    description?: string;
}

const ToastMessage: React.FC<ToastMessageProps> = ({ title, description }) => (
    <div>
        <div style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: description ? 4 : 0 }}>
            {title}
        </div>
        {description && (
            <div style={{ fontWeight: 400, fontSize: "0.85rem", color: "#64748b" }}>
                {description}
            </div>
        )}
    </div>
);

export const showError = (title: string, description?: string) =>
    toast.error(<ToastMessage title={title} description={description} />, { icon: false });

export const showSuccess = (title: string, description?: string) =>
    toast.success(<ToastMessage title={title} description={description} />, { icon: false });

export const showWarning = (title: string, description?: string) =>
    toast.warning(<ToastMessage title={title} description={description} />, { icon: false });

export const showInfo = (title: string, description?: string) =>
    toast.info(<ToastMessage title={title} description={description} />, { icon: false });
