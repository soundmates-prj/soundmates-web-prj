import { useState } from 'react';
import { Flag, Search, AlertTriangle, CheckCircle, XCircle, Clock, Eye, Ban } from 'lucide-react';
import { showSuccess } from '../../../components/common/toastUtils';
import './SystemModerationScreen.css';

interface Report {
  id: string;
  type: 'spam' | 'harassment' | 'copyrighted' | 'inappropriate' | 'other';
  content: string;
  contentType: 'post' | 'comment' | 'chat' | 'profile';
  reporter: string;
  reportedUser: string;
  status: 'pending' | 'resolved' | 'escalated';
  createdAt: string;
  reason: string;
}

const mockReports: Report[] = [
  { id: '1', type: 'spam', content: 'BUY FOLLOWERS NOW!!! CLICK LINK BELOW!!!', contentType: 'comment', reporter: 'User123', reportedUser: 'Spammer99', status: 'pending', createdAt: new Date(Date.now() - 300000).toISOString(), reason: 'Spam content in comment section' },
  { id: '2', type: 'harassment', content: 'Nội dung quấy rối người khác trên profile', contentType: 'post', reporter: 'ConcernedUser', reportedUser: 'BadActor', status: 'pending', createdAt: new Date(Date.now() - 1200000).toISOString(), reason: 'Harassment directed at another user' },
  { id: '3', type: 'copyrighted', content: 'Bài hát không có bản quyền được phát trong session', contentType: 'chat', reporter: 'ContentOwner', reportedUser: 'StreamerX', status: 'pending', createdAt: new Date(Date.now() - 3600000).toISOString(), reason: 'Alleged copyrighted music in live session' },
  { id: '4', type: 'inappropriate', content: 'Nội dung không phù hợp với người nghe', contentType: 'post', reporter: 'ParentUser', reportedUser: 'RudeStreamer', status: 'pending', createdAt: new Date(Date.now() - 7200000).toISOString(), reason: 'Inappropriate language used during broadcast' },
];

const typeColors: Record<Report['type'], string> = {
  spam: '#f59e0b',
  harassment: '#dc2626',
  copyrighted: '#7c3aed',
  inappropriate: '#ea580c',
  other: '#64748b',
};

const typeLabels: Record<Report['type'], string> = {
  spam: 'Spam',
  harassment: 'Quấy rối',
  copyrighted: 'Bản quyền',
  inappropriate: 'Không phù hợp',
  other: 'Khác',
};

export function SystemModerationScreen() {
  const [reports, setReports] = useState<Report[]>(mockReports);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const filtered = reports.filter(r =>
    !searchQuery.trim() ||
    r.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.reportedUser.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.reporter.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (iso: string) => {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60) return `${diff} phút trước`;
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    return `${Math.floor(diff / 3600)} giờ trước`;
  };

  const handleDismiss = async (id: string) => {
    setActionLoading(id);
    await new Promise(r => setTimeout(r, 500));
    setReports(prev => prev.map(r => r.id === id ? { ...r, status: 'resolved' } : r));
    setActionLoading(null);
    showSuccess("Đã giải quyết", "Báo cáo đã được đánh dấu là đã giải quyết");
  };

  const handleWarn = async (report: Report) => {
    setActionLoading(report.id);
    await new Promise(r => setTimeout(r, 500));
    setReports(prev => prev.filter(r => r.id !== report.id));
    setActionLoading(null);
    showSuccess("Đã cảnh cáo", `Đã gửi cảnh cáo đến ${report.reportedUser}`);
  };

  const handleSuspend = async (report: Report) => {
    if (!window.confirm(`Tạm ngưng tài khoản "${report.reportedUser}" trong 7 ngày?`)) return;
    setActionLoading(report.id);
    await new Promise(r => setTimeout(r, 500));
    setReports(prev => prev.filter(r => r.id !== report.id));
    setActionLoading(null);
    showSuccess("Đã tạm ngưng", `${report.reportedUser} đã bị tạm ngưng 7 ngày`);
  };

  const handleBan = async (report: Report) => {
    if (!window.confirm(`BAN VĨNH VIỄN "${report.reportedUser}"? Hành động này không thể hoàn tác.`)) return;
    setActionLoading(report.id);
    await new Promise(r => setTimeout(r, 500));
    setReports(prev => prev.filter(r => r.id !== report.id));
    setActionLoading(null);
    showSuccess("Đã ban", `${report.reportedUser} đã bị ban vĩnh viễn khỏi hệ thống`);
  };

  return (
    <div className="sys-mod-page">
      <div className="sys-mod-header">
        <div>
          <h1 className="sys-mod-title">
            <Flag size={24} />
            Kiểm duyệt hệ thống
          </h1>
          <p className="sys-mod-subtitle">Xử lý báo cáo vi phạm từ người dùng trên toàn bộ nền tảng</p>
        </div>
        <div className="sys-mod-header-stats">
          <span className="sys-mod-badge sys-mod-badge--pending">
            <Clock size={14} />
            {reports.filter(r => r.status === 'pending').length} đang chờ
          </span>
        </div>
      </div>

      <div className="sys-mod-search">
        <Search size={16} />
        <input
          type="text"
          placeholder="Tìm báo cáo theo nội dung, người bị báo cáo..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="lm-empty">
          <CheckCircle size={40} />
          <p>Không có báo cáo nào cần xử lý</p>
        </div>
      ) : (
        <div className="sys-mod-list">
          {filtered.map(report => (
            <div key={report.id} className="sys-mod-item">
              <div className="sys-mod-item-left">
                <div className="sys-mod-type-badge" style={{ background: `${typeColors[report.type]}15`, color: typeColors[report.type] }}>
                  <AlertTriangle size={14} />
                  {typeLabels[report.type]}
                </div>

                <div className="sys-mod-content">
                  <div className="sys-mod-meta">
                    <span className="sys-mod-reported">@{report.reportedUser}</span>
                    <span className="sys-mod-content-type">{report.contentType}</span>
                    <span className="sys-mod-time">{formatTime(report.createdAt)}</span>
                  </div>
                  <p className="sys-mod-text">"{report.content}"</p>
                  <p className="sys-mod-reason">
                    <strong>Lý do:</strong> {report.reason}
                    <span className="sys-mod-reporter"> — Báo cáo bởi @{report.reporter}</span>
                  </p>
                </div>
              </div>

              <div className="sys-mod-actions">
                <button className="sys-mod-btn sys-mod-btn--view" onClick={() => setSelectedReport(report)}>
                  <Eye size={14} />
                  Chi tiết
                </button>
                <button
                  className="sys-mod-btn sys-mod-btn--dismiss"
                  disabled={actionLoading === report.id}
                  onClick={() => handleDismiss(report.id)}
                >
                  Bỏ qua
                </button>
                <button
                  className="sys-mod-btn sys-mod-btn--warn"
                  disabled={actionLoading === report.id}
                  onClick={() => handleWarn(report)}
                >
                  Cảnh cáo
                </button>
                <button
                  className="sys-mod-btn sys-mod-btn--suspend"
                  disabled={actionLoading === report.id}
                  onClick={() => handleSuspend(report)}
                >
                  Tạm ngưng
                </button>
                <button
                  className="sys-mod-btn sys-mod-btn--ban"
                  disabled={actionLoading === report.id}
                  onClick={() => handleBan(report)}
                >
                  <Ban size={13} />
                  Ban
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedReport && (
        <div className="sys-mod-modal-overlay" onClick={() => setSelectedReport(null)}>
          <div className="sys-mod-modal" onClick={e => e.stopPropagation()}>
            <div className="sys-mod-modal-header">
              <div>
                <h3>Chi tiết báo cáo</h3>
                <span className="sys-mod-modal-type" style={{ color: typeColors[selectedReport.type] }}>
                  {typeLabels[selectedReport.type]}
                </span>
              </div>
              <button onClick={() => setSelectedReport(null)}>×</button>
            </div>
            <div className="sys-mod-modal-body">
              <div className="sys-mod-detail-row"><span>Người bị báo cáo:</span><strong>@{selectedReport.reportedUser}</strong></div>
              <div className="sys-mod-detail-row"><span>Người báo cáo:</span><strong>@{selectedReport.reporter}</strong></div>
              <div className="sys-mod-detail-row"><span>Loại nội dung:</span><strong>{selectedReport.contentType}</strong></div>
              <div className="sys-mod-detail-row"><span>Thời gian:</span><strong>{new Date(selectedReport.createdAt).toLocaleString('vi-VN')}</strong></div>
              <div className="sys-mod-detail-message">
                <span>Nội dung vi phạm:</span>
                <p>"{selectedReport.content}"</p>
              </div>
              <div className="sys-mod-detail-row"><span>Lý do:</span><strong>{selectedReport.reason}</strong></div>
            </div>
            <div className="sys-mod-modal-footer">
              <button className="sys-mod-btn sys-mod-btn--dismiss" onClick={() => { handleDismiss(selectedReport.id); setSelectedReport(null); }}>Bỏ qua</button>
              <button className="sys-mod-btn sys-mod-btn--warn" onClick={() => { handleWarn(selectedReport); setSelectedReport(null); }}>Cảnh cáo</button>
              <button className="sys-mod-btn sys-mod-btn--suspend" onClick={() => { handleSuspend(selectedReport); setSelectedReport(null); }}>Tạm ngưng</button>
              <button className="sys-mod-btn sys-mod-btn--ban" onClick={() => { handleBan(selectedReport); setSelectedReport(null); }}>Ban vĩnh viễn</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
