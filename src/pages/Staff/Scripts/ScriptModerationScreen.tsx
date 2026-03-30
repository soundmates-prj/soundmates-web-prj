import { useState } from 'react';
import { Bot, Search, CheckCircle, XCircle, Clock, FileText, Eye } from 'lucide-react';
import { showSuccess, showError } from '../../../components/common/toastUtils';
import './ScriptModerationScreen.css';

interface PendingScript {
  id: string;
  title: string;
  contextType: string;
  requestedBy: string;
  generatedAt: string;
  wordCount: number;
  content: string;
  modelUsed: string;
}

export function ScriptModerationScreen() {
  const [scripts, setScripts] = useState<PendingScript[]>([
    {
      id: '1',
      title: 'Script buổi sáng thứ 2 - Jazz Chill',
      contextType: 'Livestream',
      requestedBy: 'Admin User',
      generatedAt: new Date(Date.now() - 3600000).toISOString(),
      wordCount: 845,
      modelUsed: 'gemini-1.5-pro',
      content: `## INTRO (00:00 - 02:00)

Chào mừng đã đến với buổi sáng thứ 2 đầy năng lượng! Đây là Showbuzzy Radio...

## SEGMENT 1: Nhạc mới (02:00 - 15:00)
- Giới thiệu 5 bài nhạc mới ra mắt tuần này
- Chia sẻ câu chuyện đằng sau artist
- Tương tác với khán giả qua chat

## SEGMENT 2: Jazz Classics (15:00 - 30:00)
- Playlist nhạc Jazz kinh điển
- Kể chuyện về lịch sử Jazz
- Gọi điện tương tác

## OUTRO (30:00 - 32:00)
- Cảm ơn khán giả
- Preview buổi chiều
- Nhắc subscribe & follow`,
    },
    {
      id: '2',
      title: 'Script talk show công nghệ',
      contextType: 'Podcast',
      requestedBy: 'Staff Member',
      generatedAt: new Date(Date.now() - 7200000).toISOString(),
      wordCount: 1203,
      modelUsed: 'gemini-1.5-pro',
      content: `## OPENING (00:00 - 05:00)
Giới thiệu chủ đề: AI trong năm 2025...

## MAIN DISCUSSION (05:00 - 40:00)
Các điểm chính cần thảo luận...
1. breakthroughs in LLM
2. Ethical concerns
3. Future predictions

## CLOSING (40:00 - 45:00)
Tóm tắt và lời kêu gọi hành động...`,
    },
  ]);

  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScript, setSelectedScript] = useState<PendingScript | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const filtered = scripts.filter(s => {
    const matchFilter = filter === 'pending' || s.id === s.id; // simple filter
    const matchSearch = !searchQuery.trim() || s.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSearch;
  });

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    await new Promise(r => setTimeout(r, 500));
    // TODO: call API
    setScripts(prev => prev.filter(s => s.id !== id));
    setActionLoading(null);
    showSuccess("Đã duyệt", "Script đã được phê duyệt và sẵn sàng sử dụng");
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    await new Promise(r => setTimeout(r, 500));
    // TODO: call API
    setScripts(prev => prev.filter(s => s.id !== id));
    setActionLoading(null);
    showError("Đã từ chối", "Script đã bị từ chối");
  };

  return (
    <div className="script-mod-page">
      <div className="script-mod-header">
        <div>
          <h1 className="script-mod-title">
            <Bot size={24} />
            Script AI
          </h1>
          <p className="script-mod-subtitle">Duyệt và quản lý các script do AI tạo cho podcast và phát sóng</p>
        </div>
      </div>

      <div className="script-mod-filters">
        <div className="script-mod-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Tìm script..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filter-tabs">
          <button className={`filter-tab ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>
            <Clock size={14} />
            Chờ duyệt ({scripts.length})
          </button>
          <button className={`filter-tab ${filter === 'approved' ? 'active' : ''}`} onClick={() => setFilter('approved')}>
            <CheckCircle size={14} />
            Đã duyệt
          </button>
          <button className={`filter-tab ${filter === 'rejected' ? 'active' : ''}`} onClick={() => setFilter('rejected')}>
            <XCircle size={14} />
            Từ chối
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="lm-empty">
          <Bot size={40} />
          <p>Không có script nào cần duyệt</p>
        </div>
      ) : (
        <div className="script-mod-grid">
          {filtered.map(script => (
            <div key={script.id} className="script-mod-card">
              <div className="script-mod-card-header">
                <div className="script-mod-card-icon">
                  <FileText size={20} />
                </div>
                <span className="script-mod-type-badge">{script.contextType}</span>
              </div>

              <h3 className="script-mod-card-title">{script.title}</h3>

              <div className="script-mod-card-meta">
                <span>
                  <FileText size={12} />
                  {script.wordCount} từ
                </span>
                <span>
                  <Bot size={12} />
                  {script.modelUsed}
                </span>
                <span>
                  <Clock size={12} />
                  {new Date(script.generatedAt).toLocaleDateString('vi-VN')}
                </span>
              </div>

              <p className="script-mod-card-preview">
                {script.content.substring(0, 150)}...
              </p>

              <div className="script-mod-card-footer">
                <button
                  className="script-mod-btn script-mod-btn--view"
                  onClick={() => setSelectedScript(script)}
                >
                  <Eye size={14} />
                  Xem chi tiết
                </button>
                <div className="script-mod-card-actions">
                  <button
                    className="script-mod-btn script-mod-btn--reject"
                    disabled={actionLoading === script.id}
                    onClick={() => handleReject(script.id)}
                  >
                    <XCircle size={14} />
                  </button>
                  <button
                    className="script-mod-btn script-mod-btn--approve"
                    disabled={actionLoading === script.id}
                    onClick={() => handleApprove(script.id)}
                  >
                    <CheckCircle size={14} />
                    Duyệt
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Script Preview Modal */}
      {selectedScript && (
        <div className="script-mod-modal-overlay" onClick={() => setSelectedScript(null)}>
          <div className="script-mod-modal" onClick={e => e.stopPropagation()}>
            <div className="script-mod-modal-header">
              <div>
                <h3>{selectedScript.title}</h3>
                <span className="script-mod-modal-meta">
                  {selectedScript.contextType} • {selectedScript.wordCount} từ • {selectedScript.modelUsed}
                </span>
              </div>
              <button onClick={() => setSelectedScript(null)}>×</button>
            </div>
            <div className="script-mod-modal-body">
              <pre className="script-mod-content">{selectedScript.content}</pre>
            </div>
            <div className="script-mod-modal-footer">
              <button className="script-mod-btn script-mod-btn--reject" onClick={() => { handleReject(selectedScript.id); setSelectedScript(null); }}>
                Từ chối
              </button>
              <button className="script-mod-btn script-mod-btn--approve" onClick={() => { handleApprove(selectedScript.id); setSelectedScript(null); }}>
                Phê duyệt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
