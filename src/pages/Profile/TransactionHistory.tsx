import React, { useEffect, useState } from "react";
import {
  CreditCard,
  Search,
  Filter,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  CreditCard as CardIcon,
  Headphones,
  Crown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../services/axios";
import "./TransactionHistory.css";

interface Transaction {
  id: string;
  paymentId: string;
  paymentProvider: string;
  paymentMethod: string;
  amount: number;
  paymentAt: string;
  transactionStatus: string;
  createdAt: string;
  targetType?: string;
  targetId?: string;
}

interface Revenue {
  id: string;
  paymentId: string;
  amount: number;
  status: string;
  createdAt: string;
}

const getTargetTypeLabel = (targetType?: string) => {
  if (!targetType) return { label: "Giao dịch", icon: <CreditCard size={13} /> };
  if (targetType.toLowerCase() === "podcast")
    return { label: "Mua Podcast", icon: <Headphones size={13} /> };
  if (targetType.toLowerCase() === "subscription")
    return { label: "Nâng cấp Premium", icon: <Crown size={13} /> };
  return { label: targetType, icon: <CreditCard size={13} /> };
};

const TransactionHistory: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"transactions" | "revenues">("transactions");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === "transactions") {
        const response = await api.get("/me/transaction/history");
        if (response.data?.success) {
          setTransactions(response.data.data.items || []);
        }
      } else {
        const response = await api.get("/me/revenues");
        if (response.data?.success) {
          setRevenues(response.data.data || []);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      t.paymentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.paymentProvider.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === "all" ||
      t.transactionStatus.toLowerCase() === filterStatus.toLowerCase();
    const matchesType =
      filterType === "all" ||
      (t.targetType ?? "").toLowerCase() === filterType.toLowerCase();
    return matchesSearch && matchesFilter && matchesType;
  });

  const filteredRevenues = revenues.filter((r) => {
    const matchesSearch = r.paymentId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const totalAmount = transactions
    .filter((t) => t.transactionStatus.toLowerCase() === "success")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalRevenue = revenues.reduce((sum, r) => sum + r.amount, 0);

  const podcastCount = transactions.filter(
    (t) =>
      t.targetType?.toLowerCase() === "podcast" &&
      t.transactionStatus.toLowerCase() === "success"
  ).length;

  return (
    <div className="transaction-history-page">
      <div className="transaction-history-container">
        <div className="transaction-header-section">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="transaction-title-area"
          >
            <h1 className="transaction-title">Lịch sử {activeTab === "transactions" ? "giao dịch" : "doanh thu"}</h1>
            <p className="transaction-subtitle">
              {activeTab === "transactions" 
                ? "Quản lý và theo dõi các giao dịch thanh toán của bạn" 
                : "Quản lý doanh thu từ việc bán podcast của bạn"}
            </p>
          </motion.div>

          <div className="transaction-tabs" style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
            <button 
              className={`tab-btn ${activeTab === "transactions" ? "active" : ""}`}
              onClick={() => setActiveTab("transactions")}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "none",
                background: activeTab === "transactions" ? "var(--primary-color, #4f46e5)" : "#e5e7eb",
                color: activeTab === "transactions" ? "white" : "#374151",
                cursor: "pointer",
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s"
              }}
            >
              <CreditCard size={16} /> Giao dịch mua
            </button>
            <button 
              className={`tab-btn ${activeTab === "revenues" ? "active" : ""}`}
              onClick={() => setActiveTab("revenues")}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "none",
                background: activeTab === "revenues" ? "var(--primary-color, #4f46e5)" : "#e5e7eb",
                color: activeTab === "revenues" ? "white" : "#374151",
                cursor: "pointer",
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s"
              }}
            >
              <TrendingUp size={16} /> Doanh thu bán
            </button>
          </div>

          <div className="transaction-stats-grid">
            <motion.div whileHover={{ y: -5 }} className="stat-card total-spent">
              <div className="stat-icon-wrapper">
                <TrendingUp size={24} />
              </div>
              <div className="stat-content">
                <span className="stat-label">
                  {activeTab === "transactions" ? "Tổng chi tiêu" : "Tổng doanh thu"}
                </span>
                <span className="stat-value">
                  {formatCurrency(activeTab === "transactions" ? totalAmount : totalRevenue)}
                </span>
              </div>
            </motion.div>

            <motion.div whileHover={{ y: -5 }} className="stat-card active-plan">
              <div className="stat-icon-wrapper blue">
                <Headphones size={24} />
              </div>
              <div className="stat-content">
                <span className="stat-label">
                  {activeTab === "transactions" ? "Podcast đã mua" : "Lượt bán Podcast"}
                </span>
                <span className="stat-value">
                  {activeTab === "transactions" ? podcastCount : revenues.length} podcast
                </span>
              </div>
            </motion.div>

            <motion.div whileHover={{ y: -5 }} className="stat-card active-plan">
              <div
                className="stat-icon-wrapper"
                style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}
              >
                <CardIcon size={24} />
              </div>
              <div className="stat-content">
                <span className="stat-label">Giao dịch gần nhất</span>
                <span className="stat-value">
                  {activeTab === "transactions" 
                    ? (transactions[0] ? formatCurrency(transactions[0].amount) : "—")
                    : (revenues[0] ? formatCurrency(revenues[0].amount) : "—")
                  }
                </span>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="transaction-table-controls">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder={activeTab === "transactions" ? "Tìm kiếm mã giao dịch hoặc nhà cung cấp..." : "Tìm kiếm mã giao dịch..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-group">
            {activeTab === "transactions" && (
              <>
                <div className="filter-item">
                  <Filter size={16} />
                  <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                    <option value="all">Tất cả loại</option>
                    <option value="podcast">Mua Podcast</option>
                    <option value="subscription">Nâng cấp Premium</option>
                  </select>
                </div>
                <div className="filter-item">
                  <Filter size={16} />
                  <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="all">Tất cả trạng thái</option>
                    <option value="success">Thành công</option>
                    <option value="failed">Thất bại</option>
                    <option value="pending">Đang xử lý</option>
                  </select>
                </div>
              </>
            )}
            <button className="export-btn" onClick={() => window.print()}>
              <Download size={16} />
              <span>Xuất báo cáo</span>
            </button>
          </div>
        </div>

        <div className="transaction-list-wrapper">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Đang tải dữ liệu {activeTab === "transactions" ? "giao dịch" : "doanh thu"}...</p>
            </div>
          ) : activeTab === "transactions" ? (
            filteredTransactions.length > 0 ? (
              <div className="transaction-table">
                <div className="table-header">
                  <div className="col col-id">Mã Giao Dịch</div>
                  <div className="col col-type">Loại Giao Dịch</div>
                  <div className="col col-date">Ngày Giao Dịch</div>
                  <div className="col col-provider">Cổng Thanh Toán</div>
                  <div className="col col-amount">Số Tiền</div>
                  <div className="col col-status">Trạng Thái</div>
                </div>

                <AnimatePresence>
                  {filteredTransactions.map((t, index) => {
                    const typeInfo = getTargetTypeLabel(t.targetType);
                    return (
                      <motion.div
                        key={t.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="table-row"
                      >
                        <div className="col col-id">
                          <span className="id-text">
                            #{t.paymentId.split("-")[0].toUpperCase()}
                          </span>
                          <span className="method-tag">{t.paymentMethod || "QR"}</span>
                        </div>
                        <div className="col col-type">
                          <span
                            className={`type-badge type-${(t.targetType ?? "other").toLowerCase()}`}
                          >
                            {typeInfo.icon}
                            {typeInfo.label}
                          </span>
                        </div>
                        <div className="col col-date">
                          <div className="date-main">
                            {new Date(t.paymentAt).toLocaleDateString("vi-VN")}
                          </div>
                          <div className="date-sub">
                            {new Date(t.paymentAt).toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                        <div className="col col-provider">
                          <div className="provider-badge">
                            <CreditCard size={14} />
                            {t.paymentProvider}
                          </div>
                        </div>
                        <div className="col col-amount highlight">
                          {formatCurrency(t.amount)}
                        </div>
                        <div className="col col-status">
                          <span
                            className={`status-badge ${t.transactionStatus.toLowerCase()}`}
                          >
                            {t.transactionStatus.toLowerCase() === "success" ? (
                              <CheckCircle2 size={12} />
                            ) : t.transactionStatus.toLowerCase() === "pending" ? (
                              <Clock size={12} />
                            ) : (
                              <XCircle size={12} />
                            )}
                            {t.transactionStatus.toLowerCase() === "success"
                              ? "Thành công"
                              : t.transactionStatus.toLowerCase() === "pending"
                              ? "Đang xử lý"
                              : "Thất bại"}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            ) : (
              <div className="empty-state">
                <Clock size={48} />
                <h3>Không tìm thấy giao dịch nào</h3>
                <p>Bạn chưa có lịch sử giao dịch nào khớp với tìm kiếm.</p>
              </div>
            )
          ) : (
            filteredRevenues.length > 0 ? (
              <div className="transaction-table">
                <div className="table-header">
                  <div className="col col-id">Mã Giao Dịch</div>
                  <div className="col col-type">Loại</div>
                  <div className="col col-date">Ngày Bán</div>
                  <div className="col col-amount">Doanh Thu</div>
                  <div className="col col-status">Trạng Thái</div>
                </div>

                <AnimatePresence>
                  {filteredRevenues.map((r, index) => {
                    return (
                      <motion.div
                        key={r.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="table-row"
                      >
                        <div className="col col-id">
                          <span className="id-text">
                            #{r.paymentId.split("-")[0].toUpperCase()}
                          </span>
                        </div>
                        <div className="col col-type">
                          <span className="type-badge type-podcast" style={{background: "#e0e7ff", color: "#4f46e5", padding: "4px 8px", borderRadius: "20px", display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: 500}}>
                            <Headphones size={13} />
                            Bán Podcast
                          </span>
                        </div>
                        <div className="col col-date">
                          <div className="date-main">
                            {new Date(r.createdAt).toLocaleDateString("vi-VN")}
                          </div>
                          <div className="date-sub">
                            {new Date(r.createdAt).toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                        <div className="col col-amount highlight" style={{ color: "#10b981" }}>
                          +{formatCurrency(r.amount)}
                        </div>
                        <div className="col col-status">
                          <span className={`status-badge success`}>
                            <CheckCircle2 size={12} />
                            Đã hoàn thành
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            ) : (
              <div className="empty-state">
                <TrendingUp size={48} />
                <h3>Chưa có doanh thu</h3>
                <p>Bạn chưa có giao dịch bán podcast nào thành công.</p>
              </div>
            )
          )}
        </div>

        <div className="pagination-area">
          <p className="pagination-info">
            Hiển thị 1 - {activeTab === "transactions" ? filteredTransactions.length : filteredRevenues.length} 
            của {activeTab === "transactions" ? transactions.length : revenues.length}{" "}
            {activeTab === "transactions" ? "giao dịch" : "doanh thu"}
          </p>
          <div className="pagination-btns">
            <button disabled className="page-btn">
              <ChevronLeft size={18} />
            </button>
            <button className="page-btn active">1</button>
            <button disabled className="page-btn">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionHistory;
