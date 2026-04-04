import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import "./PaymentResult.css";

interface ResultState {
  status: "loading" | "success" | "failed";
  transactionId?: string;
  paymentId?: string;
  amount?: string;
  provider?: string;
  transactionNo?: string;
  message?: string;
}

const VNP_RESPONSE_MESSAGES: Record<string, string> = {
  "00": "Giao dịch thành công",
  "07": "Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).",
  "09": "Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking.",
  "10": "Xác thực thông tin thẻ/tài khoản không đúng quá 3 lần.",
  "11": "Đã hết hạn chờ thanh toán.",
  "12": "Thẻ/Tài khoản bị khóa.",
  "13": "Sai mật khẩu OTP.",
  "24": "Khách hàng hủy giao dịch.",
  "51": "Tài khoản không đủ số dư.",
  "65": "Tài khoản vượt quá hạn mức giao dịch trong ngày.",
  "75": "Ngân hàng thanh toán đang bảo trì.",
  "79": "Sai mật khẩu thanh toán quá số lần quy định.",
  "99": "Lỗi không xác định.",
};

const PAYOS_RESPONSE_MESSAGES: Record<string, string> = {
  "00": "Giao dịch thành công",
  "-01": "Giao dịch bị hủy bởi người dùng",
  "-02": "Giao dịch thất bại",
  "-03": "Giao dịch đang xử lý",
  "-04": "Giao dịch hết hạn",
};

function formatAmount(amount?: string) {
  if (!amount) return "—";
  const num = parseFloat(amount);
  if (isNaN(num)) return amount;
  // Amount from backend is already in VND (NOT in xu/cents)
  // Only divide by 100 if the value looks like it's in xu (very large numbers like 9900000)
  // Heuristic: if amount > 1,000,000 assume it's in xu; otherwise treat as VND
  if (num > 1000000) {
    return Math.floor(num / 100).toLocaleString("vi-VN") + " đ";
  }
  return num.toLocaleString("vi-VN") + " đ";
}

export default function PaymentResult() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState<ResultState>({ status: "loading" });

  useEffect(() => {
    const status = params.get("status");
    const provider = params.get("provider");
    const responseCode = params.get("vnp_ResponseCode") ?? params.get("code") ?? "";

    // VNPay direct callback: VNPay redirects to this page after payment
    // vnp_ResponseCode=00 means success
    const isVNPayCallback = !!params.get("vnp_ResponseCode");
    if (isVNPayCallback) {
      const isSuccess = responseCode === "00";
      if (isSuccess) {
        setState({
          status: "success",
          // vnp_TxnRef = our internal payment ID (GUID)
          transactionId: params.get("vnp_TxnRef") ?? undefined,
          // vnp_Amount is already in VND (same as subscription.Price in DB)
          amount: params.get("vnp_Amount") ?? undefined,
          provider: "VNPay",
          transactionNo: params.get("vnp_TransactionNo") ?? undefined,
          message: VNP_RESPONSE_MESSAGES[responseCode] ?? "Giao dịch thành công",
        });
      } else {
        setState({
          status: "failed",
          message:
            VNP_RESPONSE_MESSAGES[responseCode] ??
            "Giao dịch thất bại hoặc bị hủy.",
          transactionNo: params.get("vnp_TransactionNo") ?? undefined,
        });
      }
      return;
    }

    // VNPay redirect via BE callback: BE callback đã xử lý → redirect về FE với kết quả trong query params
    if (provider?.toLowerCase() === "vnpay") {
      if (status === "success") {
        // transactionId and paymentId may both be the internal payment GUID (vnp_TxnRef)
        const txId = params.get("transactionId") ?? params.get("paymentId") ?? undefined;
        setState({
          status: "success",
          transactionId: txId,
          paymentId: txId,
          amount: params.get("amount") ?? undefined,
          provider: "VNPay",
          transactionNo: params.get("vnp_TransactionNo") ?? undefined,
          message: "Giao dịch thành công",
        });
      } else {
        // Fallback: vnp_TxnRef can serve as transactionId reference
        const txId = params.get("transactionId") ?? params.get("paymentId") ?? undefined;
        setState({
          status: "failed",
          message:
            params.get("message") ??
            VNP_RESPONSE_MESSAGES[responseCode] ??
            "Giao dịch thất bại hoặc bị hủy.",
          transactionId: txId,
          transactionNo: params.get("vnp_TransactionNo") ?? undefined,
        });
      }
      return;
    }

    // PayOS redirect: BE đã xử lý → redirect về FE với kết quả trong query params
    if (provider?.toLowerCase() === "payos") {
      if (status === "success") {
        const txId = params.get("transactionId") ?? params.get("paymentId") ?? undefined;
        setState({
          status: "success",
          transactionId: txId,
          paymentId: params.get("paymentId") ?? undefined,
          amount: params.get("amount") ?? undefined,
          provider: "PayOS",
          transactionNo: params.get("payos_TransactionNo") ?? undefined,
          message: PAYOS_RESPONSE_MESSAGES[responseCode] ?? "Giao dịch thành công",
        });
      } else {
        const txId = params.get("transactionId") ?? params.get("paymentId") ?? undefined;
        setState({
          status: "failed",
          message:
            params.get("message") ??
            PAYOS_RESPONSE_MESSAGES[responseCode] ??
            "Giao dịch thất bại hoặc bị hủy.",
          transactionId: txId,
          transactionNo: params.get("payos_TransactionNo") ?? undefined,
        });
      }
      return;
    }

    // Last resort: check vnp_TxnRef or orderId as fallback for any provider
    const txnRef = params.get("vnp_TxnRef") ?? params.get("orderId") ?? undefined;
    if (txnRef) {
      setState({
        status: params.get("status") === "success" ? "success" : "failed",
        transactionId: txnRef,
        paymentId: txnRef,
        amount: params.get("amount") ?? params.get("vnp_Amount") ?? undefined,
        provider: provider ?? "unknown",
        transactionNo: params.get("vnp_TransactionNo") ?? params.get("payos_TransactionNo") ?? undefined,
        message: params.get("message") ?? "Kết quả thanh toán",
      });
      return;
    }

    // Fallback: không có provider → hiển thị loading
    setState({ status: "loading" });
  }, [params]);

  const isSuccess = state.status === "success";
  const isLoading = state.status === "loading";

  return (
    <div className="payment-result-page">
      <div className="payment-result-card">
        {/* Icon */}
        <div className="result-icon-container">
          <div className={`result-icon ${state.status}`}>
            {isLoading ? (
              <Loader2 className="result-spinner" />
            ) : isSuccess ? (
              <CheckCircle />
            ) : (
              <XCircle />
            )}
          </div>
        </div>

        {/* Title */}
        <h1 className="result-title">
          {isLoading
            ? "Đang xử lý giao dịch..."
            : isSuccess
            ? "Thanh toán thành công!"
            : "Thanh toán thất bại"}
        </h1>

        <p className="result-subtitle">
          {isLoading
            ? "Hệ thống đang kiểm tra trạng thái thanh toán, vui lòng không đóng trang này."
            : state.message}
        </p>

        {/* Details */}
        {!isLoading && (
          <div className="result-details-wrapper">
            <div className="result-details">
              {state.transactionNo && (
                <div className="result-row">
                  <span className="result-row-label">Mã giao dịch</span>
                  <span className="result-row-value">{state.transactionNo}</span>
                </div>
              )}
              {state.amount && (
                <div className="result-row">
                  <span className="result-row-label">Số tiền</span>
                  <span className="result-row-value">{formatAmount(state.amount)}</span>
                </div>
              )}
              {state.provider && (
                <div className="result-row">
                  <span className="result-row-label">Cổng thanh toán</span>
                  <span className="result-row-value">{state.provider}</span>
                </div>
              )}
              <div className="result-row">
                <span className="result-row-label">Trạng thái</span>
                <span className={`result-row-value ${state.status}`}>
                  {isSuccess ? "Thành công" : "Thất bại"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        {!isLoading && (
          <div className="result-actions">
            {isSuccess ? (
              <>
                <button
                  className="btn-result-primary"
                  onClick={() => navigate("/")}
                >
                  Về trang chủ
                </button>
                <button
                  className="btn-result-ghost"
                  onClick={() => navigate("/settings")}
                >
                  Xem gói của tôi
                </button>
              </>
            ) : (
              <>
                <button
                  className="btn-result-primary"
                  onClick={() => navigate("/subscription")}
                >
                  Thử lại
                </button>
                <button
                  className="btn-result-ghost"
                  onClick={() => navigate("/")}
                >
                  Về trang chủ
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
