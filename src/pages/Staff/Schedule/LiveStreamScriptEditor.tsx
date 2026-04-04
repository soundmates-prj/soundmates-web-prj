import { useState } from 'react';
import { FileText, Plus, Trash2, Save, Clock, RefreshCw } from 'lucide-react';
import { showSuccess } from '../../../components/common/toastUtils';
import './LiveStreamScriptEditor.css';

interface ScriptSegment {
  id: string;
  title: string;
  content: string;
  duration: string;
  notes: string;
}

interface Script {
  id: string;
  title: string;
  sessionId: string;
  intro: string;
  segments: ScriptSegment[];
  outro: string;
  estimatedDuration: number;
}

export function LiveStreamScriptEditor() {
  const [script, setScript] = useState<Script>({
    id: 'new',
    title: '',
    sessionId: '',
    intro: 'Chào mừng đã đến với [Tên phiên]! Hôm nay chúng ta sẽ có một buổi phát sóng tuyệt vời...\n\nHãy follow và để lại comment để tương tác cùng mình nhé!',
    segments: [
      { id: '1', title: 'Nhạc mở đầu', content: '', duration: '5:00', notes: '' },
      { id: '2', title: 'Giới thiệu chủ đề', content: '', duration: '3:00', notes: '' },
    ],
    outro: 'Cảm ơn các bạn đã theo dõi! Hẹn gặp lại trong buổi phát sóng tiếp theo.\n\nĐừng quên subscribe để không bỏ lỡ những nội dung thú vị tiếp theo!',
    estimatedDuration: 8,
  });

  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const markChanged = (updater: () => void) => {
    updater();
    setHasChanges(true);
  };

  const getWordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;
  const estimateReadTime = (words: number) => Math.ceil(words / 150); // 150 wpm

  const totalWords = getWordCount(script.intro) +
    script.segments.reduce((sum, s) => sum + getWordCount(s.content), 0) +
    getWordCount(script.outro);

  const handleSegmentChange = (id: string, field: keyof ScriptSegment, value: string) => {
    setScript(prev => ({
      ...prev,
      segments: prev.segments.map(seg =>
        seg.id === id ? { ...seg, [field]: value } : seg
      ),
    }));
    setHasChanges(true);
  };

  const addSegment = () => {
    const newSeg: ScriptSegment = {
      id: Date.now().toString(),
      title: 'Segment mới',
      content: '',
      duration: '5:00',
      notes: '',
    };
    setScript(prev => ({ ...prev, segments: [...prev.segments, newSeg] }));
    setHasChanges(true);
  };

  const removeSegment = (id: string) => {
    setScript(prev => ({ ...prev, segments: prev.segments.filter(s => s.id !== id) }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    // TODO: call API to save script
    await new Promise(r => setTimeout(r, 800));
    setSaving(false);
    setHasChanges(false);
    showSuccess("Đã lưu", "Kịch bản đã được lưu thành công");
  };

  return (
    <div className="script-editor-page">
      <div className="script-editor-header">
        <div>
          <h1 className="script-editor-title">
            <FileText size={24} />
            Viết kịch bản phát sóng
          </h1>
          <p className="script-editor-subtitle">Tạo và quản lý kịch bản chi tiết cho buổi phát sóng của bạn</p>
        </div>
        <div className="script-editor-header-actions">
          <button className="lm-btn lm-btn--outline" onClick={() => window.location.reload()}>
            <RefreshCw size={14} />
            Làm mới
          </button>
          <button
            className="lm-btn lm-btn--primary"
            onClick={handleSave}
            disabled={saving || !hasChanges}
          >
            <Save size={14} />
            {saving ? 'Đang lưu...' : 'Lưu kịch bản'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="script-editor-stats">
        <div className="script-stat-card">
          <span className="script-stat-label">Tổng từ</span>
          <span className="script-stat-value">{totalWords}</span>
        </div>
        <div className="script-stat-card">
          <span className="script-stat-label">Thời gian ước tính đọc</span>
          <span className="script-stat-value">{estimateReadTime(totalWords)} phút</span>
        </div>
        <div className="script-stat-card">
          <span className="script-stat-label">Số segment</span>
          <span className="script-stat-value">{script.segments.length}</span>
        </div>
      </div>

      <div className="script-editor-layout">
        {/* Left: Script Form */}
        <div className="script-editor-form">
          {/* Script Info */}
          <div className="script-section-card">
            <h3>Thông tin kịch bản</h3>
            <div className="script-field">
              <label>Tiêu đề kịch bản</label>
              <input
                type="text"
                placeholder="VD: Kịch bản buổi sáng thứ 2 - Jazz Chill"
                value={script.title}
                onChange={e => markChanged(() => setScript(prev => ({ ...prev, title: e.target.value })))}
              />
            </div>
            <div className="script-field">
              <label>Phiên phát sóng (tuỳ chọn)</label>
              <input
                type="text"
                placeholder="Liên kết với một phiên phát sóng..."
                value={script.sessionId}
                onChange={e => markChanged(() => setScript(prev => ({ ...prev, sessionId: e.target.value })))}
              />
            </div>
          </div>

          {/* Intro */}
          <div className="script-section-card">
            <h3>
              <span className="script-section-tag">INTRO</span>
              Giới thiệu mở đầu
            </h3>
            <textarea
              className="script-textarea"
              rows={6}
              placeholder="Nhập nội dung phần giới thiệu mở đầu..."
              value={script.intro}
              onChange={e => markChanged(() => setScript(prev => ({ ...prev, intro: e.target.value })))}
            />
            <div className="script-word-count">{getWordCount(script.intro)} từ</div>
          </div>

          {/* Segments */}
          {script.segments.map((seg, idx) => (
            <div key={seg.id} className="script-section-card script-segment-card">
              <div className="script-segment-header">
                <span className="script-section-tag">SEGMENT {idx + 1}</span>
                <div className="script-segment-controls">
                  <div className="script-duration-input">
                    <Clock size={12} />
                    <input
                      type="text"
                      value={seg.duration}
                      onChange={e => handleSegmentChange(seg.id, 'duration', e.target.value)}
                      placeholder="mm:ss"
                    />
                  </div>
                  <button
                    className="script-remove-btn"
                    onClick={() => removeSegment(seg.id)}
                    title="Xoá segment"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="script-field">
                <label>Tiêu đề segment</label>
                <input
                  type="text"
                  value={seg.title}
                  onChange={e => handleSegmentChange(seg.id, 'title', e.target.value)}
                  placeholder="VD: Nhạc mới tuần này"
                />
              </div>

              <div className="script-field">
                <label>Nội dung</label>
                <textarea
                  className="script-textarea"
                  rows={5}
                  placeholder="Nhập nội dung chi tiết cho segment này..."
                  value={seg.content}
                  onChange={e => handleSegmentChange(seg.id, 'content', e.target.value)}
                />
                <div className="script-word-count">{getWordCount(seg.content)} từ</div>
              </div>

              <div className="script-field">
                <label>Ghi chú cho MC (tuỳ chọn)</label>
                <input
                  type="text"
                  placeholder="VD: Nhắc khán giả like và subscribe..."
                  value={seg.notes}
                  onChange={e => handleSegmentChange(seg.id, 'notes', e.target.value)}
                />
              </div>
            </div>
          ))}

          <button className="script-add-segment-btn" onClick={addSegment}>
            <Plus size={16} />
            Thêm segment
          </button>

          {/* Outro */}
          <div className="script-section-card">
            <h3>
              <span className="script-section-tag">OUTRO</span>
              Kết thúc phát sóng
            </h3>
            <textarea
              className="script-textarea"
              rows={5}
              placeholder="Nhập nội dung kết thúc, cảm ơn khán giả..."
              value={script.outro}
              onChange={e => markChanged(() => setScript(prev => ({ ...prev, outro: e.target.value })))}
            />
            <div className="script-word-count">{getWordCount(script.outro)} từ</div>
          </div>
        </div>

        {/* Right: Preview */}
        <div className="script-preview-panel">
          <div className="script-preview-header">
            <h3>Xem trước</h3>
            <span className="script-preview-word-count">{totalWords} từ</span>
          </div>
          <div className="script-preview-body">
            {script.title && <h2 className="script-preview-title">{script.title}</h2>}

            <div className="script-preview-section">
              <span className="script-preview-tag">INTRO</span>
              <p className="script-preview-text">{script.intro || '...'}</p>
            </div>

            {script.segments.map((seg, idx) => (
              <div key={seg.id} className="script-preview-section">
                <div className="script-preview-segment-header">
                  <span className="script-preview-tag">SEGMENT {idx + 1}</span>
                  <span className="script-preview-duration">
                    <Clock size={11} />
                    {seg.duration}
                  </span>
                </div>
                <h4 className="script-preview-segment-title">{seg.title || '...'}</h4>
                <p className="script-preview-text">{seg.content || '...'}</p>
                {seg.notes && (
                  <p className="script-preview-notes">📝 {seg.notes}</p>
                )}
              </div>
            ))}

            <div className="script-preview-section">
              <span className="script-preview-tag">OUTRO</span>
              <p className="script-preview-text">{script.outro || '...'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
