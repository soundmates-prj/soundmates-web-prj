import React, { useEffect, useState } from "react";
import {
  CreditCard,
  Search,
  Filter,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  CreditCard as CardIcon,
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
}

const TransactionHistory: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await api.get("/transaction");
      if (response.data?.success) {
        setTransactions(response.data.data.items || []);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

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
    return matchesSearch && matchesFilter;
  });

  const totalAmount = transactions
    .filter((t) => t.transactionStatus.toLowerCase() === "success")
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="transaction-history-container">
      <div className="transaction-header-section">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="transaction-title-area"
        >
          <h1 className="transaction-title">Lịch sử giao dịch</h1>
          <p className="transaction-subtitle">
            Quản lý và theo dõi các giao dịch thanh toán của bạn
          </p>
        </motion.div>

        <div className="transaction-stats-grid">
          <motion.div whileHover={{ y: -5 }} className="stat-card total-spent">
            <div className="stat-icon-wrapper">
              <TrendingUp size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Tổng chi tiêu</span>
              <span className="stat-value">{formatCurrency(totalAmount)}</span>
            </div>
          </motion.div>

          <motion.div whileHover={{ y: -5 }} className="stat-card active-plan">
            <div className="stat-icon-wrapper blue">
              <CardIcon size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Giao dịch gần nhất</span>
              <span className="stat-value">
                {transactions[0] ? formatCurrency(transactions[0].amount) : "—"}
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
            placeholder="Tìm kiếm mã giao dịch hoặc nhà cung cấp..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <div className="filter-item">
            <Filter size={16} />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="success">Thành công</option>
              <option value="failed">Thất bại</option>
              <option value="pending">Đang xử lý</option>
            </select>
          </div>
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
            <p>Đang tải dữ liệu giao dịch...</p>
          </div>
        ) : filteredTransactions.length > 0 ? (
          <div className="transaction-table">
            <div className="table-header">
              <div className="col col-id">Mã Giao Dịch</div>
              <div className="col col-date">Ngày Giao Dịch</div>
              <div className="col col-provider">Cổng Thanh Toán</div>
              <div className="col col-amount">Số Tiền</div>
              <div className="col col-status">Trạng Thái</div>
              <div className="col col-action"></div>
            </div>

            <AnimatePresence>
              {filteredTransactions.map((t, index) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="table-row"
                >
                  <div className="col col-id">
                    <span className="id-text">
                      #{t.paymentId.split("-")[0]}
                    </span>
                    <span className="method-tag">{t.paymentMethod}</span>
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
                      ) : (
                        <XCircle size={12} />
                      )}
                      {t.transactionStatus}
                    </span>
                  </div>
                  <div className="col col-action">
                    <button className="row-action-btn">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="empty-state">
            <Clock size={48} />
            <h3>Không tìm thấy giao dịch nào</h3>
            <p>Bạn chưa có lịch sử giao dịch nào khớp với tìm kiếm.</p>
          </div>
        )}
      </div>

      <div className="pagination-area">
        <p className="pagination-info">
          Hiển thị 1 - {filteredTransactions.length} của {transactions.length}{" "}
          giao dịch
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
  );
};

export default TransactionHistory;
