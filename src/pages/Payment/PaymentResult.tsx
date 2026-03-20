import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import api from "../../services/axios";
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

function formatAmount(amount?: string) {
  if (!amount) return "—";
  const num = parseFloat(amount);
  if (isNaN(num)) return amount;
  return num.toLocaleString("vi-VN") + " đ";
}

export default function PaymentResult() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState<ResultState>({ status: "loading" });

  useEffect(() => {
    const status = params.get("status");
    const responseCode = params.get("vnp_ResponseCode") ?? "";

    // If VNPay redirected directly to frontend (Option B flow)
    // We need to call backend callback API to process the payment
    const vnpParams = Object.fromEntries(params.entries());
    const isVNPayRedirect = !!vnpParams["vnp_SecureHash"];

    if (isVNPayRedirect) {
      // Call backend callback to process payment
      api
        .get("/payments/vnpay/callback", { params: vnpParams })
        .then((res) => {
          const data = res.data;
          setState({
            status: data.status === "success" ? "success" : "failed",
            transactionId: data.transactionId,
            paymentId: data.paymentId,
            amount: data.amount,
            provider: data.provider,
            transactionNo: data.vnp_TransactionNo ?? vnpParams["vnp_TransactionNo"],
            message: VNP_RESPONSE_MESSAGES[responseCode] ?? "Giao dịch hoàn tất",
          });
        })
        .catch((err) => {
          setState({
            status: "failed",
            message:
              err?.response?.data?.message ??
              VNP_RESPONSE_MESSAGES[responseCode] ??
              "Có lỗi xảy ra khi xử lý thanh toán.",
          });
        });
      return;
    }

    // Backend already processed and redirected here with result params
    if (status === "success") {
      setState({
        status: "success",
        transactionId: params.get("transactionId") ?? undefined,
        paymentId: params.get("paymentId") ?? undefined,
        amount: params.get("amount") ?? undefined,
        provider: params.get("provider") ?? undefined,
        transactionNo: params.get("vnp_TransactionNo") ?? undefined,
        message: VNP_RESPONSE_MESSAGES[responseCode] ?? "Giao dịch thành công",
      });
    } else {
      setState({
        status: "failed",
        message:
          params.get("message") ??
          VNP_RESPONSE_MESSAGES[responseCode] ??
          "Giao dịch thất bại hoặc bị hủy.",
        transactionNo: params.get("vnp_TransactionNo") ?? undefined,
      });
    }
  }, [params]);

  const isSuccess = state.status === "success";
  const isLoading = state.status === "loading";

  return (
    <div className="payment-result-page">
      <div className="payment-result-card">
        {/* Icon */}
        <div className={`result-icon ${state.status}`}>
          {isLoading ? (
            <Loader2 size={36} className="result-spinner" />
          ) : isSuccess ? (
            <CheckCircle size={36} />
          ) : (
            <XCircle size={36} />
          )}
        </div>

        {/* Title */}
        <h1 className="result-title">
          {isLoading
            ? "Đang xử lý..."
            : isSuccess
            ? "Thanh toán thành công"
            : "Thanh toán thất bại"}
        </h1>

        <p className="result-subtitle">
          {isLoading
            ? "Vui lòng chờ trong giây lát..."
            : state.message}
        </p>

        {/* Details */}
        {!isLoading && (
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
