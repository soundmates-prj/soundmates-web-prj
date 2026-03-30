import { useState, useEffect } from 'react';
import { MessageSquare, AlertTriangle, Trash2, Search, RefreshCw, Clock, User } from 'lucide-react';
import { liveHubService, type ChatMessage } from '../../../services/liveHubService';
import { showSuccess, showError } from '../../../components/common/toastUtils';
import './ChatModerationScreen.css';

interface FlaggedMessage {
  id: string;
  sessionId: string;
  userId: string;
  username: string;
  message: string;
  createdAt: string;
  flagCount: number;
  sessionName: string;
}

export function ChatModerationScreen() {
  const [messages, setMessages] = useState<FlaggedMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMsg, setSelectedMsg] = useState<FlaggedMessage | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Mock data — TODO: wire to real API
  useEffect(() => {
    setMessages([
      { id: '1', sessionId: 's1', userId: 'u1', username: 'BadUser123', message: 'This is inappropriate content', createdAt: new Date(Date.now() - 120000).toISOString(), flagCount: 5, sessionName: 'Chill Night Radio' },
      { id: '2', sessionId: 's1', userId: 'u2', username: 'Spammer99', message: 'BUY FOLLOWERS NOW!!! CLICK HERE!!!', createdAt: new Date(Date.now() - 300000).toISOString(), flagCount: 12, sessionName: 'Chill Night Radio' },
      { id: '3', sessionId: 's2', userId: 'u3', username: 'TrollGuy', message: 'Stop streaming this garbage', createdAt: new Date(Date.now() - 600000).toISOString(), flagCount: 3, sessionName: 'Morning Jazz' },
    ]);
    setLoading(false);
  }, []);

  // Poll every 10s
  useEffect(() => {
    const interval = setInterval(() => {
      // TODO: poll getFlaggedMessages() API
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (id: string) => {
    setActionLoading(id);
    // TODO: call deleteMessage API
    await new Promise(r => setTimeout(r, 500)); // simulate
    setMessages(prev => prev.filter(m => m.id !== id));
    setActionLoading(null);
    showSuccess("Đã xoá", "Tin nhắn đã được xoá khỏi chat");
  };

  const handleWarn = async (msg: FlaggedMessage) => {
    setActionLoading(msg.id);
    // TODO: call warnUser API
    await new Promise(r => setTimeout(r, 500));
    setActionLoading(null);
    showSuccess("Đã cảnh cáo", `Đã gửi cảnh cáo đến ${msg.username}`);
  };

  const handleBan = async (msg: FlaggedMessage) => {
    const confirm = window.confirm(`Ban user "${msg.username}"? Hành động này không thể hoàn tác.`);
    if (!confirm) return;
    setActionLoading(msg.id);
    // TODO: call banUser API
    await new Promise(r => setTimeout(r, 500));
    setMessages(prev => prev.filter(m => m.id !== msg.id));
    setActionLoading(null);
    showSuccess("Đã ban", `${msg.username} đã bị ban khỏi hệ thống`);
  };

  const filtered = messages.filter(m =>
    !searchQuery.trim() ||
    m.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (iso: string) => {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60) return `${diff} giây trước`;
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    return `${Math.floor(diff / 3600)} giờ trước`;
  };

  return (
    <div className="chat-mod-page">
      <div className="chat-mod-header">
        <div>
          <h1 className="chat-mod-title">Kiểm duyệt Chat</h1>
          <p className="chat-mod-subtitle">Giám sát và xử lý nội dung chat không phù hợp trong các phiên phát sóng</p>
        </div>
        <div className="chat-mod-header-stats">
          <span className="chat-mod-total-badge">
            <AlertTriangle size={14} />
            {messages.length} tin nhắn bị báo cáo
          </span>
          <button className="lm-btn lm-btn--outline" onClick={() => window.location.reload()}>
            <RefreshCw size={14} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="chat-mod-search">
        <Search size={16} />
        <input
          type="text"
          placeholder="Tìm tin nhắn hoặc username..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Messages List */}
      {loading ? (
        <div className="lm-loading">
          <RefreshCw size={28} className="lm-spin" />
          <p>Đang tải tin nhắn...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="lm-empty">
          <MessageSquare size={40} />
          <p>Không có tin nhắn nào bị báo cáo</p>
        </div>
      ) : (
        <div className="chat-mod-list">
          {filtered.map(msg => (
            <div key={msg.id} className="chat-mod-item">
              <div className="chat-mod-item-left">
                <div className="chat-mod-avatar">
                  <User size={20} />
                </div>
                <div className="chat-mod-content">
                  <div className="chat-mod-meta">
                    <span className="chat-mod-username">{msg.username}</span>
                    <span className="chat-mod-session">{msg.sessionName}</span>
                    <span className="chat-mod-flags">
                      <AlertTriangle size={12} />
                      {msg.flagCount} báo cáo
                    </span>
                    <span className="chat-mod-time">
                      <Clock size={11} />
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>
                  <p className="chat-mod-message">"{msg.message}"</p>
                </div>
              </div>

              <div className="chat-mod-actions">
                <button
                  className="chat-mod-btn chat-mod-btn--view"
                  onClick={() => setSelectedMsg(msg)}
                  title="Xem chi tiết"
                >
                  Chi tiết
                </button>
                <button
                  className="chat-mod-btn chat-mod-btn--warn"
                  disabled={actionLoading === msg.id}
                  onClick={() => handleWarn(msg)}
                  title="Cảnh cáo user"
                >
                  Cảnh cáo
                </button>
                <button
                  className="chat-mod-btn chat-mod-btn--delete"
                  disabled={actionLoading === msg.id}
                  onClick={() => handleDelete(msg.id)}
                  title="Xoá tin nhắn"
                >
                  <Trash2 size={14} />
                </button>
                <button
                  className="chat-mod-btn chat-mod-btn--ban"
                  disabled={actionLoading === msg.id}
                  onClick={() => handleBan(msg)}
                  title="Ban user"
                >
                  Ban
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedMsg && (
        <div className="chat-mod-modal-overlay" onClick={() => setSelectedMsg(null)}>
          <div className="chat-mod-modal" onClick={e => e.stopPropagation()}>
            <div className="chat-mod-modal-header">
              <h3>Chi tiết tin nhắn</h3>
              <button onClick={() => setSelectedMsg(null)}>×</button>
            </div>
            <div className="chat-mod-modal-body">
              <div className="chat-mod-detail-row">
                <span>User:</span>
                <strong>{selectedMsg.username}</strong>
              </div>
              <div className="chat-mod-detail-row">
                <span>User ID:</span>
                <code>{selectedMsg.userId}</code>
              </div>
              <div className="chat-mod-detail-row">
                <span>Phiên:</span>
                <strong>{selectedMsg.sessionName}</strong>
              </div>
              <div className="chat-mod-detail-row">
                <span>Số báo cáo:</span>
                <strong style={{ color: '#dc2626' }}>{selectedMsg.flagCount}</strong>
              </div>
              <div className="chat-mod-detail-row">
                <span>Thời gian:</span>
                <strong>{new Date(selectedMsg.createdAt).toLocaleString('vi-VN')}</strong>
              </div>
              <div className="chat-mod-detail-message">
                <span>Nội dung:</span>
                <p>"{selectedMsg.message}"</p>
              </div>
            </div>
            <div className="chat-mod-modal-footer">
              <button className="chat-mod-btn chat-mod-btn--warn" onClick={() => { handleWarn(selectedMsg); setSelectedMsg(null); }}>
                Cảnh cáo
              </button>
              <button className="chat-mod-btn chat-mod-btn--delete" onClick={() => { handleDelete(selectedMsg.id); setSelectedMsg(null); }}>
                Xoá
              </button>
              <button className="chat-mod-btn chat-mod-btn--ban" onClick={() => { handleBan(selectedMsg); setSelectedMsg(null); }}>
                Ban User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
