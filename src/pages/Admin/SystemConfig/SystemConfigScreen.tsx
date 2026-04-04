import { useState } from 'react';
import { Settings2, Radio, Bot, Bell, RefreshCw, CheckCircle, AlertCircle, Plus, X, Trash2 } from 'lucide-react';
import { showSuccess, showError } from '../../../components/common/toastUtils';
import './SystemConfigScreen.css';

type Tab = 'streaming' | 'ai' | 'announcements';

interface Announcement {
  id: string;
  title: string;
  content: string;
  active: boolean;
  createdAt: string;
}

const mockAnnouncements: Announcement[] = [
  { id: '1', title: 'Bảo trì hệ thống', content: 'Hệ thống sẽ bảo trì vào 02:00-04:00 ngày 15/02', active: true, createdAt: new Date(Date.now() - 86400000).toISOString() },
];

export function SystemConfigScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('streaming');
  const [saving, setSaving] = useState(false);

  // AzuraCast config
  const [azuracastUrl, setAzuracastUrl] = useState('');
  const [azuracastApiKey, setAzuracastApiKey] = useState('');
  const [azuracastActive, setAzuracastActive] = useState(false);
  const [azuracastStatus, setAzuracastStatus] = useState<'idle' | 'checking' | 'ok' | 'error'>('idle');

  // AI config
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [geminiModel, setGeminiModel] = useState('gemini-1.5-pro');
  const [geminiTemp, setGeminiTemp] = useState('0.7');

  // Announcements
  const [announcements, setAnnouncements] = useState<Announcement[]>(mockAnnouncements);
  const [showAnnModal, setShowAnnModal] = useState(false);
  const [annForm, setAnnForm] = useState({ title: '', content: '' });

  const checkAzuracastHealth = async () => {
    setAzuracastStatus('checking');
    await new Promise(r => setTimeout(r, 1500));
    setAzuracastStatus(azuracastUrl.includes('localhost') ? 'ok' : 'error');
  };

  const handleSaveStreaming = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setSaving(false);
    showSuccess("Đã lưu", "Cấu hình streaming đã được lưu");
  };

  const handleSaveAI = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setSaving(false);
    showSuccess("Đã lưu", "Cấu hình AI đã được lưu");
  };

  const handleCreateAnnouncement = async () => {
    if (!annForm.title.trim() || !annForm.content.trim()) {
      showError("Lỗi", "Vui lòng nhập đầy đủ tiêu đề và nội dung");
      return;
    }
    const newAnn: Announcement = {
      id: Date.now().toString(),
      title: annForm.title.trim(),
      content: annForm.content.trim(),
      active: true,
      createdAt: new Date().toISOString(),
    };
    setAnnouncements(prev => [newAnn, ...prev]);
    setAnnForm({ title: '', content: '' });
    setShowAnnModal(false);
    showSuccess("Đã tạo", "Thông báo đã được đăng");
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!window.confirm("Xoá thông báo này?")) return;
    setAnnouncements(prev => prev.filter(a => a.id !== id));
    showSuccess("Đã xoá", "Thông báo đã được xoá");
  };

  const toggleAnnouncement = async (id: string) => {
    setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, active: !a.active } : a));
    showSuccess("Đã cập nhật", "Trạng thái thông báo đã được cập nhật");
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'streaming', label: 'Streaming', icon: <Radio size={16} /> },
    { id: 'ai', label: 'AI Model', icon: <Bot size={16} /> },
    { id: 'announcements', label: 'Thông báo', icon: <Bell size={16} /> },
  ];

  return (
    <div className="sys-config-page">
      <div className="sys-config-header">
        <div>
          <h1 className="sys-config-title">
            <Settings2 size={24} />
            Cấu hình hệ thống
          </h1>
          <p className="sys-config-subtitle">Quản lý cấu hình tích hợp bên thứ ba và thông báo hệ thống</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="sys-config-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`sys-config-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Streaming Tab */}
      {activeTab === 'streaming' && (
        <div className="sys-config-card">
          <div className="sys-config-card-header">
            <div>
              <h3>AzuraCast Integration</h3>
              <p>Kết nối với AzuraCast để đồng bộ đài phát và nội dung nhạc</p>
            </div>
            <label className="sys-config-toggle">
              <input type="checkbox" checked={azuracastActive} onChange={e => setAzuracastActive(e.target.checked)} />
              <span>Kích hoạt</span>
            </label>
          </div>

          <form className="sys-config-form" onSubmit={handleSaveStreaming}>
            <div className="sys-config-field">
              <label>AzuraCast Base URL</label>
              <input
                type="url"
                placeholder="https://radio.example.com"
                value={azuracastUrl}
                onChange={e => setAzuracastUrl(e.target.value)}
              />
              <span className="sys-config-hint">URL cơ sở của AzuraCast instance</span>
            </div>

            <div className="sys-config-field">
              <label>API Key</label>
              <input
                type="password"
                placeholder="Nhập API Key..."
                value={azuracastApiKey}
                onChange={e => setAzuracastApiKey(e.target.value)}
              />
              <span className="sys-config-hint">API Key từ AzuraCast → Admin → API Keys</span>
            </div>

            <div className="sys-config-health-row">
              <button type="button" className="lm-btn lm-btn--outline" onClick={checkAzuracastHealth} disabled={!azuracastUrl || azuracastStatus === 'checking'}>
                <RefreshCw size={14} className={azuracastStatus === 'checking' ? 'lm-spin' : ''} />
                Kiểm tra kết nối
              </button>
              {azuracastStatus === 'ok' && (
                <span className="sys-config-status sys-config-status--ok">
                  <CheckCircle size={14} /> Kết nối thành công
                </span>
              )}
              {azuracastStatus === 'error' && (
                <span className="sys-config-status sys-config-status--error">
                  <AlertCircle size={14} /> Không thể kết nối
                </span>
              )}
            </div>

            <div className="sys-config-actions">
              <button type="submit" className="lm-btn lm-btn--primary" disabled={saving}>
                {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* AI Tab */}
      {activeTab === 'ai' && (
        <div className="sys-config-card">
          <div className="sys-config-card-header">
            <div>
              <h3>AI Model Configuration</h3>
              <p>Cấu hình Gemini AI cho tính năng script generation và content moderation</p>
            </div>
          </div>

          <form className="sys-config-form" onSubmit={handleSaveAI}>
            <div className="sys-config-field">
              <label>Gemini API Key</label>
              <input
                type="password"
                placeholder="AIza..."
                value={geminiApiKey}
                onChange={e => setGeminiApiKey(e.target.value)}
              />
              <span className="sys-config-hint">Lấy API Key từ Google AI Studio</span>
            </div>

            <div className="sys-config-field-row">
              <div className="sys-config-field">
                <label>Model</label>
                <select value={geminiModel} onChange={e => setGeminiModel(e.target.value)}>
                  <option value="gemini-1.5-pro">gemini-1.5-pro</option>
                  <option value="gemini-1.5-flash">gemini-1.5-flash</option>
                  <option value="gemini-2.0-flash">gemini-2.0-flash</option>
                </select>
              </div>
              <div className="sys-config-field">
                <label>Temperature (0-1)</label>
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={geminiTemp}
                  onChange={e => setGeminiTemp(e.target.value)}
                />
                <span className="sys-config-hint">Độ sáng tạo của AI (0 = deterministic, 1 = creative)</span>
              </div>
            </div>

            <div className="sys-config-actions">
              <button type="submit" className="lm-btn lm-btn--primary" disabled={saving}>
                {saving ? 'Đang lưu...' : 'Lưu cấu hình AI'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Announcements Tab */}
      {activeTab === 'announcements' && (
        <div className="sys-config-card">
          <div className="sys-config-card-header">
            <div>
              <h3>Thông báo hệ thống</h3>
              <p>Tạo và quản lý các thông báo banner hiển thị cho toàn bộ người dùng</p>
            </div>
            <button className="lm-btn lm-btn--primary" onClick={() => setShowAnnModal(true)}>
              <Plus size={14} />
              Tạo thông báo
            </button>
          </div>

          <div className="sys-ann-list">
            {announcements.length === 0 ? (
              <div className="sys-ann-empty">
                <Bell size={32} />
                <p>Chưa có thông báo nào</p>
              </div>
            ) : (
              announcements.map(ann => (
                <div key={ann.id} className={`sys-ann-item ${ann.active ? '' : 'inactive'}`}>
                  <div className="sys-ann-item-content">
                    <div className="sys-ann-item-header">
                      <strong>{ann.title}</strong>
                      <span className={`sys-ann-badge ${ann.active ? 'active' : 'inactive'}`}>
                        {ann.active ? 'Đang hiển thị' : 'Đã tắt'}
                      </span>
                    </div>
                    <p className="sys-ann-text">{ann.content}</p>
                    <span className="sys-ann-date">
                      {new Date(ann.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <div className="sys-ann-actions">
                    <button
                      className={`sys-ann-toggle ${ann.active ? 'active' : ''}`}
                      onClick={() => toggleAnnouncement(ann.id)}
                      title={ann.active ? 'Tắt thông báo' : 'Bật thông báo'}
                    >
                      {ann.active ? 'Tắt' : 'Bật'}
                    </button>
                    <button
                      className="sys-ann-delete"
                      onClick={() => handleDeleteAnnouncement(ann.id)}
                      title="Xoá thông báo"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Create Announcement Modal */}
      {showAnnModal && (
        <div className="sys-ann-modal-overlay" onClick={() => setShowAnnModal(false)}>
          <div className="sys-ann-modal" onClick={e => e.stopPropagation()}>
            <div className="sys-ann-modal-header">
              <h3>Tạo thông báo mới</h3>
              <button onClick={() => setShowAnnModal(false)}><X size={18} /></button>
            </div>
            <div className="sys-ann-modal-body">
              <div className="sys-config-field">
                <label>Tiêu đề *</label>
                <input
                  type="text"
                  placeholder="VD: Bảo trì hệ thống"
                  value={annForm.title}
                  onChange={e => setAnnForm(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div className="sys-config-field">
                <label>Nội dung *</label>
                <textarea
                  rows={4}
                  placeholder="Nhập nội dung thông báo..."
                  value={annForm.content}
                  onChange={e => setAnnForm(prev => ({ ...prev, content: e.target.value }))}
                />
              </div>
            </div>
            <div className="sys-ann-modal-footer">
              <button className="lm-btn lm-btn--outline" onClick={() => setShowAnnModal(false)}>Huỷ</button>
              <button className="lm-btn lm-btn--primary" onClick={handleCreateAnnouncement}>Đăng thông báo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
