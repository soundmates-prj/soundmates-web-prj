import { useCallback, useEffect, useRef, useState } from "react";
import {
  CreditCard,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  TrendingUp,
  Users,
  ArrowUpCircle,
  ArrowDownCircle,
} from "lucide-react";
import api from "../../../services/axios";
import "../../../pages/Admin/SharedDashboard.css";
import "./TransactionsPage.css";

interface AdminTransaction {
  id: string;
  paymentId: string;
  paymentProvider: string;
  paymentMethod: string;
  amount: number;
  paymentAt: string;
  transactionStatus: string;
  createdAt: string;
  userProfile?: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl?: string;
  };
}

interface PagedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterProvider, setFilterProvider] = useState("all");

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const isMountedRef = useRef(true);

  const fetchTransactions = useCallback(async (pageNum = 1) => {
    setLoading(true);
    try {
      const response = await api.get("/transaction", {
        params: {
          page: pageNum,
          pageSize: pageSize,
        },
      });
      if (!isMountedRef.current) return;

      if (response.data?.success) {
        const data: PagedResponse<AdminTransaction> = response.data.data;
        setTransactions(data.items || []);
        setTotalCount(data.totalCount || 0);
        setTotalPages(data.totalPages || 1);
        setPage(data.page || 1);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      if (!isMountedRef.current) return;
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [pageSize]);

  useEffect(() => {
    isMountedRef.current = true;
    void fetchTransactions(page);

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleRefresh = useCallback(() => {
    void fetchTransactions(page);
  }, [fetchTransactions, page]);

  const handlePageChange = useCallback(
    (newPage: number) => {
      if (newPage < 1 || newPage > totalPages) return;
      setPage(newPage);
      void fetchTransactions(newPage);
    },
    [totalPages, fetchTransactions]
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      t.paymentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.paymentProvider.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.userProfile?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.userProfile?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" ||
      t.transactionStatus.toLowerCase() === filterStatus.toLowerCase();
    const matchesProvider =
      filterProvider === "all" ||
      t.paymentProvider.toLowerCase() === filterProvider.toLowerCase();
    return matchesSearch && matchesStatus && matchesProvider;
  });

  // Stats
  const successTransactions = transactions.filter(
    (t) => t.transactionStatus.toLowerCase() === "success"
  );
  const totalRevenue = successTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalFailed = transactions.filter(
    (t) => t.transactionStatus.toLowerCase() === "failed"
  ).length;
  const totalPending = transactions.filter(
    (t) => t.transactionStatus.toLowerCase() === "pending"
  ).length;

  const uniqueProviders = Array.from(
    new Set(transactions.map((t) => t.paymentProvider))
  );

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "success":
        return <CheckCircle2 size={12} />;
      case "failed":
        return <XCircle size={12} />;
      default:
        return <Clock size={12} />;
    }
  };

  return (
    <div className="lm-page">
      {/* Header */}
      <div className="lm-header">
        <div className="lm-header-left">
          <h1>Tất Cả Giao Dịch</h1>
          <p>Giám sát và quản lý giao dịch của toàn hệ thống</p>
        </div>
        <div className="lm-header-actions">
          <button className="lm-btn lm-btn--outline" onClick={handleRefresh}>
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
            <span className="lm-stat-label">Tổng doanh thu</span>
            <span className="lm-stat-value">{formatCurrency(totalRevenue)}</span>
            <div className="lm-stat-change positive">
              <TrendingUp size={12} />
              {successTransactions.length} giao dịch
            </div>
          </div>
        </div>

        <div className="lm-stat-card">
          <div className="lm-stat-icon" style={{ color: "#10b981", background: "rgba(16, 185, 129, 0.15)" }}>
            <ArrowUpCircle size={22} />
          </div>
          <div className="lm-stat-content">
            <span className="lm-stat-label">Thành công</span>
            <span className="lm-stat-value">{successTransactions.length}</span>
            <div className="lm-stat-change positive">
              <CheckCircle2 size={12} />
              Hoàn thành
            </div>
          </div>
        </div>

        <div className="lm-stat-card">
          <div className="lm-stat-icon" style={{ color: "#f59e0b", background: "rgba(245, 158, 11, 0.15)" }}>
            <Clock size={22} />
          </div>
          <div className="lm-stat-content">
            <span className="lm-stat-label">Đang xử lý</span>
            <span className="lm-stat-value">{totalPending}</span>
            <div className="lm-stat-change">
              <Clock size={12} />
              Đang xử lý
            </div>
          </div>
        </div>

        <div className="lm-stat-card">
          <div className="lm-stat-icon" style={{ color: "#ef4444", background: "rgba(239, 68, 68, 0.15)" }}>
            <XCircle size={22} />
          </div>
          <div className="lm-stat-content">
            <span className="lm-stat-label">Thất bại</span>
            <span className="lm-stat-value">{totalFailed}</span>
            <div className="lm-stat-change negative">
              <XCircle size={12} />
              Đã hủy
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
              placeholder="Tìm kiếm theo mã giao dịch, nhà cung cấp, người dùng..."
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
            <option value="success">Thành công</option>
            <option value="pending">Đang xử lý</option>
            <option value="failed">Thất bại</option>
          </select>

          <select
            value={filterProvider}
            onChange={(e) => setFilterProvider(e.target.value)}
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
            <option value="all">Tất cả nhà cung cấp</option>
            {uniqueProviders.map((p) => (
              <option key={p} value={p.toLowerCase()}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="lm-card">
        <div className="lm-card-header">
          <h3 className="lm-card-title">
            Danh sách giao dịch ({totalCount.toLocaleString()} tổng cộng)
          </h3>
        </div>

        {loading ? (
          <div className="lm-loading">
            <RefreshCw size={32} className="lm-spin" />
            <span>Đang tải giao dịch...</span>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="lm-empty">
            <CreditCard size={48} />
            <p>Không tìm thấy giao dịch nào</p>
          </div>
        ) : (
          <>
            <div className="tx-table-wrap">
              <table className="tx-table">
                <thead>
                  <tr>
                    <th>Người dùng</th>
                    <th>Mã giao dịch</th>
                    <th>Nhà cung cấp</th>
                    <th>Phương thức</th>
                    <th>Số tiền</th>
                    <th>Ngày</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          {t.userProfile?.avatarUrl ? (
                            <img
                              src={t.userProfile.avatarUrl}
                              alt={t.userProfile.fullName}
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: "50%",
                                objectFit: "cover",
                                flexShrink: 0,
                              }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                          ) : (
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
                                fontSize: 13,
                                fontWeight: 700,
                                flexShrink: 0,
                              }}
                            >
                              {(t.userProfile?.fullName || "U").charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>
                              {t.userProfile?.fullName || "Người dùng không xác định"}
                            </div>
                            <div style={{ fontSize: 11, color: "#94a3b8" }}>
                              {t.userProfile?.email || "—"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontSize: 12,
                            color: "#1a9fd4",
                            fontWeight: 600,
                          }}
                        >
                          #{t.paymentId.split("-")[0]}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <CreditCard size={14} style={{ color: "#1a9fd4" }} />
                          <span style={{ fontWeight: 500 }}>{t.paymentProvider}</span>
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: 12,
                            padding: "3px 8px",
                            background: "rgba(124, 58, 237, 0.08)",
                            borderRadius: 6,
                            color: "#1a9fd4",
                          }}
                        >
                          {t.paymentMethod}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: "#059669" }}>
                          {formatCurrency(t.amount)}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: 12 }}>
                          <div style={{ fontWeight: 500 }}>
                            {new Date(t.paymentAt).toLocaleDateString("vi-VN")}
                          </div>
                          <div style={{ color: "#94a3b8" }}>
                            {new Date(t.paymentAt).toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`tx-status tx-status--${t.transactionStatus.toLowerCase()}`}
                        >
                          {getStatusIcon(t.transactionStatus)}
                          {t.transactionStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="tx-pagination">
              <span className="tx-pagination-info">
                Trang {page} của {totalPages} — {totalCount.toLocaleString()} giao dịch
              </span>
              <div className="tx-pagination-btns">
                <button
                  className="tx-page-btn"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                >
                  <ChevronLeft size={18} />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = i + 1;
                  if (totalPages > 5) {
                    if (page > 3) {
                      pageNum = page - 2 + i;
                      if (pageNum > totalPages) return null;
                    }
                  }
                  return (
                    <button
                      key={pageNum}
                      className={`tx-page-btn ${page === pageNum ? "active" : ""}`}
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  className="tx-page-btn"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
