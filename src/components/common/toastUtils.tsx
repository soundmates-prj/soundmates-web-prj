import React from "react";
import { toast } from "react-toastify";
import type { ToastOptions } from "react-toastify";

interface ToastContent {
    title: string;
    description?: string;
}

const ToastMessage: React.FC<ToastContent> = ({ title, description }) => (
    <div>
        <div style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: description ? 4 : 0 }}>
            {title}
        </div>
        {description && (
            <div style={{ fontWeight: 400, fontSize: "0.85rem", color: "#6b7280" }}>
                {description}
            </div>
        )}
    </div>
);

const opts: ToastOptions = { icon: undefined };

export const showError = (title: string, description?: string) =>
    toast.error(<ToastMessage title={title} description={description} />, opts);

export const showSuccess = (title: string, description?: string) =>
    toast.success(<ToastMessage title={title} description={description} />, opts);

export const showWarning = (title: string, description?: string) =>
    toast.warning(<ToastMessage title={title} description={description} />, opts);

export const showInfo = (title: string, description?: string) =>
    toast.info(<ToastMessage title={title} description={description} />, opts);
