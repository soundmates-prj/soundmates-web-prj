import { useState } from "react";
import { X } from "lucide-react";

interface RejectReasonModalProps {
  isOpen: boolean;
  songTitle: string;
  onConfirm: (reason: string) => Promise<void>;
  onCancel: () => void;
}

export function RejectReasonModal({
  isOpen,
  songTitle,
  onConfirm,
  onCancel,
}: RejectReasonModalProps) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(reason || "Host từ chối");
    } finally {
      setLoading(false);
      setReason("");
    }
  };

  return (
    <div className="reject-modal-overlay" onClick={onCancel}>
      <div className="reject-modal" onClick={(e) => e.stopPropagation()}>
        <div className="reject-modal-header">
          <h4>Từ chối yêu cầu</h4>
          <button className="reject-modal-close" onClick={onCancel} disabled={loading}>
            <X size={16} />
          </button>
        </div>
        <div className="reject-modal-body">
          <p>
            Bài: <strong>{songTitle}</strong>
          </p>
          <label className="reject-modal-label">Lý do từ chối (tùy chọn)</label>
          <textarea
            className="reject-modal-textarea"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Nhập lý do..."
            rows={3}
          />
        </div>
        <div className="reject-modal-actions">
          <button
            className="reject-modal-btn reject-modal-btn--outline"
            onClick={onCancel}
            disabled={loading}
          >
            Hủy
          </button>
          <button
            className="reject-modal-btn reject-modal-btn--danger"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? "Đang xử lý..." : "Xác nhận từ chối"}
          </button>
        </div>
      </div>
    </div>
  );
}
