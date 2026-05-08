import { useCallback, useEffect, useRef, useState } from "react";
import {
  Wallet,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  DollarSign,
  TrendingUp,
  User,
  Building2,
  CreditCard,
} from "lucide-react";
import api from "../../../services/axios";
import "../../../pages/Admin/SharedDashboard.css";
import "./TransactionsPage.css";

interface PendingPayoutDto {
  id: string;
  paymentId: string;
  targetUserId: string;
  amount: number;
  bankId?: string;
  accountNumber?: string;
  accountName?: string;
  status: string;
  errorMessage?: string;
  scheduledAt: string;
  createdAt: string;
}

export default function PayoutScreen() {
  const [payouts, setPayouts] = useState<PendingPayoutDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [payoutPercentage, setPayoutPercentage] = useState<number>(80);
  const [isSavingPercent, setIsSavingPercent] = useState(false);
  const isMountedRef = useRef(true);

  const fetchPayoutPercent = useCallback(async () => {
    try {
      const res = await api.get("/settings/PAYOUT_PERCENTAGE");
      if (res.data?.data?.value && isMountedRef.current) {
        setPayoutPercentage(Number(res.data.data.value));
      }
    } catch {
      // ignore if setting not found
    }
  }, []);

  const savePayoutPercent = async () => {
    if (payoutPercentage <= 0 || payoutPercentage > 100) return;
    setIsSavingPercent(true);
    try {
      await api.patch("/settings/PAYOUT_PERCENTAGE", { value: payoutPercentage.toString() });
    } catch (err: any) {
      console.error("Failed to save payout percentage", err);
    } finally {
      if (isMountedRef.current) setIsSavingPercent(false);
    }
  };

  const fetchPayouts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/payments/payouts");
      if (!isMountedRef.current) return;

      const data: PendingPayoutDto[] = response.data?.data ?? [];
      setPayouts(data);
    } catch (err: any) {
      if (!isMountedRef.current) return;
      setError(
        err.response?.data?.message ??
          err.message ??
          "Không thể tải danh sách payout."
      );
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    void fetchPayouts();
    void fetchPayoutPercent();
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchPayouts, fetchPayoutPercent]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return {
      date: d.toLocaleDateString("vi-VN"),
      time: d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    };
  };

  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return { icon: <Clock size={12} />, label: "Chờ xử lý", cls: "tx-status--pending" };
      case "paid":
      case "success":
      case "completed":
        return { icon: <CheckCircle2 size={12} />, label: "Đã thanh toán", cls: "tx-status--success" };
      case "failed":
      case "failed_no_bank":
        return { icon: <XCircle size={12} />, label: "Thất bại", cls: "tx-status--failed" };
      default:
        return { icon: <AlertCircle size={12} />, label: status, cls: "tx-status--processing" };
    }
  };

  const filteredPayouts = payouts.filter((p) => {
    const matchSearch =
      p.targetUserId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.accountName ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.accountNumber ?? "").includes(searchTerm) ||
      (p.bankId ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.paymentId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus =
      filterStatus === "all" || p.status.toLowerCase() === filterStatus.toLowerCase();
    return matchSearch && matchStatus;
  });

  // Stats
  const totalAmount = payouts.reduce((s, p) => s + p.amount, 0);
  const pendingCount = payouts.filter((p) => p.status.toLowerCase() === "pending").length;
  const failedCount = payouts.filter((p) =>
    ["failed", "failed_no_bank"].includes(p.status.toLowerCase())
  ).length;
  const paidCount = payouts.filter((p) =>
    ["paid", "success", "completed"].includes(p.status.toLowerCase())
  ).length;

  return (
    <div className="lm-page">
      {/* Header */}
      <div className="lm-header">
        <div className="lm-header-left">
          <h1>Quản lý Payout</h1>
          <p>Danh sách các khoản thanh toán đến tác giả podcast</p>
        </div>
        <div className="lm-header-actions" style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--neutral-50)", padding: "4px 8px", borderRadius: 8, border: "1px solid var(--neutral-200)" }}>
            <span style={{ fontSize: 13, color: "var(--neutral-600)", fontWeight: 500 }}>Tỷ lệ tác giả nhận (%):</span>
            <input
              type="number"
              min="0"
              max="100"
              value={payoutPercentage}
              onChange={(e) => setPayoutPercentage(Number(e.target.value))}
              onBlur={savePayoutPercent}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.currentTarget.blur();
                }
              }}
              disabled={isSavingPercent}
              style={{
                width: 60,
                padding: "4px 8px",
                border: "1px solid var(--neutral-300)",
                borderRadius: 6,
                fontSize: 14,
                textAlign: "center",
                opacity: isSavingPercent ? 0.7 : 1
              }}
            />
          </div>
          <button className="lm-btn lm-btn--outline" onClick={fetchPayouts}>
            <RefreshCw size={15} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="lm-stats-grid">
        <div className="lm-stat-card">
          <div className="lm-stat-icon">
            <DollarSign size={22} />
          </div>
          <div className="lm-stat-content">
            <span className="lm-stat-label">Tổng cần thanh toán</span>
            <span className="lm-stat-value">{formatCurrency(totalAmount)}</span>
            <div className="lm-stat-change">
              <TrendingUp size={12} />
              {payouts.length} khoản
            </div>
          </div>
        </div>

        <div className="lm-stat-card">
          <div
            className="lm-stat-icon"
            style={{ color: "#f59e0b", background: "rgba(245,158,11,0.15)" }}
          >
            <Clock size={22} />
          </div>
          <div className="lm-stat-content">
            <span className="lm-stat-label">Chờ xử lý</span>
            <span className="lm-stat-value">{pendingCount}</span>
            <div className="lm-stat-change">
              <Clock size={12} />
              Đang hàng đợi
            </div>
          </div>
        </div>

        <div className="lm-stat-card">
          <div
            className="lm-stat-icon"
            style={{ color: "#10b981", background: "rgba(16,185,129,0.15)" }}
          >
            <CheckCircle2 size={22} />
          </div>
          <div className="lm-stat-content">
            <span className="lm-stat-label">Đã thanh toán</span>
            <span className="lm-stat-value">{paidCount}</span>
            <div className="lm-stat-change positive">
              <CheckCircle2 size={12} />
              Hoàn thành
            </div>
          </div>
        </div>

        <div className="lm-stat-card">
          <div
            className="lm-stat-icon"
            style={{ color: "#ef4444", background: "rgba(239,68,68,0.15)" }}
          >
            <XCircle size={22} />
          </div>
          <div className="lm-stat-content">
            <span className="lm-stat-label">Thất bại</span>
            <span className="lm-stat-value">{failedCount}</span>
            <div className="lm-stat-change negative">
              <XCircle size={12} />
              Cần xem lại
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="lm-card" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "1 1 300px" }}>
            <Search
              size={16}
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#1a9fd4",
              }}
            />
            <input
              type="text"
              placeholder="Tìm theo tên, số tài khoản, ngân hàng, mã giao dịch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px 10px 40px",
                border: "1px solid var(--neutral-200)",
                borderRadius: 10,
                fontSize: 14,
                outline: "none",
                background: "var(--neutral-50)",
                color: "var(--neutral-900)",
              }}
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: "10px 12px",
              border: "1px solid var(--neutral-200)",
              borderRadius: 10,
              fontSize: 14,
              outline: "none",
              background: "var(--neutral-50)",
              color: "var(--neutral-700)",
              cursor: "pointer",
            }}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Chờ xử lý</option>
            <option value="paid">Đã thanh toán</option>
            <option value="failed">Thất bại</option>
            <option value="failed_no_bank">Thiếu tài khoản ngân hàng</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="lm-card">
        <div className="lm-card-header">
          <h3 className="lm-card-title">
            Danh sách payout ({filteredPayouts.length} kết quả)
          </h3>
        </div>

        {loading ? (
          <div className="lm-loading">
            <RefreshCw size={32} className="lm-spin" />
            <span>Đang tải danh sách payout...</span>
          </div>
        ) : error ? (
          <div className="lm-empty">
            <AlertCircle size={40} style={{ color: "#ef4444" }} />
            <p style={{ color: "#ef4444" }}>{error}</p>
            <button
              className="lm-btn lm-btn--outline"
              onClick={fetchPayouts}
              style={{ marginTop: 12 }}
            >
              <RefreshCw size={14} />
              Thử lại
            </button>
          </div>
        ) : filteredPayouts.length === 0 ? (
          <div className="lm-empty">
            <Wallet size={48} />
            <p>Không tìm thấy payout nào</p>
          </div>
        ) : (
          <div className="tx-table-wrap">
            <table className="tx-table">
              <thead>
                <tr>
                  <th>Tác giả (User ID)</th>
                  <th>Ngân hàng</th>
                  <th>Số tài khoản</th>
                  <th>Số tiền</th>
                  <th>Ngày tạo</th>
                  <th>Ngày dự kiến</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayouts.map((p) => {
                  const statusCfg = getStatusConfig(p.status);
                  const created = formatDate(p.createdAt);
                  const scheduled = formatDate(p.scheduledAt);

                  return (
                    <tr key={p.id}>
                      {/* Target User */}
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: "50%",
                              background: "linear-gradient(135deg, #1a9fd4, #55c5f1)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#fff",
                              flexShrink: 0,
                            }}
                          >
                            <User size={16} />
                          </div>
                          <div>
                            <div
                              style={{
                                fontFamily: "monospace",
                                fontSize: 11,
                                color: "#1a9fd4",
                                fontWeight: 600,
                              }}
                            >
                              #{p.targetUserId.split("-")[0]}
                            </div>
                            <div style={{ fontSize: 10, color: "#94a3b8" }}>
                              Payment #{p.paymentId.split("-")[0]}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Bank */}
                      <td>
                        {p.bankId ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <Building2 size={14} style={{ color: "#1a9fd4" }} />
                            <span style={{ fontWeight: 600, fontSize: 13 }}>{p.bankId}</span>
                          </div>
                        ) : (
                          <span style={{ color: "#ef4444", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                            <XCircle size={12} />
                            Chưa cấu hình
                          </span>
                        )}
                      </td>

                      {/* Account Number */}
                      <td>
                        {p.accountNumber ? (
                          <div>
                            <div
                              style={{
                                fontFamily: "monospace",
                                fontSize: 13,
                                fontWeight: 600,
                                color: "#0f172a",
                              }}
                            >
                              {p.accountNumber}
                            </div>
                            {p.accountName && (
                              <div style={{ fontSize: 11, color: "#64748b" }}>
                                {p.accountName}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: "#94a3b8", fontSize: 12 }}>—</span>
                        )}
                      </td>

                      {/* Amount */}
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <CreditCard size={14} style={{ color: "#059669" }} />
                          <span style={{ fontWeight: 700, color: "#059669", fontSize: 14 }}>
                            {formatCurrency(p.amount)}
                          </span>
                        </div>
                      </td>

                      {/* Created At */}
                      <td>
                        <div style={{ fontSize: 12 }}>
                          <div style={{ fontWeight: 500 }}>{created.date}</div>
                          <div style={{ color: "#94a3b8" }}>{created.time}</div>
                        </div>
                      </td>

                      {/* Scheduled At */}
                      <td>
                        <div style={{ fontSize: 12 }}>
                          <div style={{ fontWeight: 500 }}>{scheduled.date}</div>
                          <div style={{ color: "#94a3b8" }}>{scheduled.time}</div>
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        <div>
                          <span className={`tx-status ${statusCfg.cls}`}>
                            {statusCfg.icon}
                            {statusCfg.label}
                          </span>
                          {p.errorMessage && (
                            <div
                              style={{
                                fontSize: 10,
                                color: "#ef4444",
                                marginTop: 4,
                                maxWidth: 160,
                                lineHeight: 1.3,
                              }}
                              title={p.errorMessage}
                            >
                              {p.errorMessage.length > 50
                                ? p.errorMessage.slice(0, 50) + "..."
                                : p.errorMessage}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
