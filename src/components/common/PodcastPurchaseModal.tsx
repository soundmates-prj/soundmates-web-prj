import React, { useEffect } from "react";
import { X, Mic2, Loader2, CreditCard } from "lucide-react";
import "./PodcastPurchaseModal.css";
import { resolveAuthor } from "../../types/podcast";

interface PodcastPurchaseModalProps {
  podcast: {
    id: string;
    title: string;
    price: number;
    banner?: string;
    author?: any;
  };
  isPurchasing: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const SYSTEM_FEE = 5000;

export default function PodcastPurchaseModal({
  podcast,
  isPurchasing,
  onConfirm,
  onCancel,
}: PodcastPurchaseModalProps) {
  // Prevent background scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const totalPrice = podcast.price + SYSTEM_FEE;

  return (
    <div className="purchase-modal-overlay" onClick={onCancel}>
      <div
        className="purchase-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="pm-header">
          <h2>Thanh toán Podcast</h2>
          <button className="pm-close-btn" onClick={onCancel} disabled={isPurchasing}>
            <X size={20} />
          </button>
        </div>

        <div className="pm-body">
          <div className="pm-podcast-info">
            {podcast.banner ? (
              <img src={podcast.banner} alt={podcast.title} className="pm-cover" />
            ) : (
              <div className="pm-cover-fallback">
                <Mic2 size={24} />
              </div>
            )}
            <div className="pm-title-group">
              <h3>{podcast.title}</h3>
              <span>{podcast.author ? resolveAuthor(podcast.author) : "SoundMates"}</span>
            </div>
          </div>

          <div className="pm-breakdown">
            <div className="pm-row">
              <span>Giá Podcast</span>
              <span>{podcast.price.toLocaleString("vi-VN")}₫</span>
            </div>
            <div className="pm-row">
              <span>Phí dịch vụ</span>
              <span>{SYSTEM_FEE.toLocaleString("vi-VN")}₫</span>
            </div>
            <div className="pm-row pm-total">
              <span>Tổng thanh toán</span>
              <span className="pm-total-val">{totalPrice.toLocaleString("vi-VN")}₫</span>
            </div>
          </div>

          <div className="pm-actions">
            <button
              className="pm-btn pm-btn-cancel"
              onClick={onCancel}
              disabled={isPurchasing}
            >
              Hủy
            </button>
            <button
              className="pm-btn pm-btn-pay"
              onClick={onConfirm}
              disabled={isPurchasing}
            >
              {isPurchasing ? (
                <>
                  <Loader2 size={18} className="pm-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <CreditCard size={18} />
                  Thanh toán VNPay
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
