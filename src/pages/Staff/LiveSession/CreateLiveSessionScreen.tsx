import { useState, useEffect } from 'react';
import { Radio, Disc3, Users, Calendar, X, Plus } from 'lucide-react';
import { liveSessionApiService } from "../../../services/liveSessionApiService";
import { userService } from "../../../services/staffService";
import type { StationResult, LiveSessionResult } from "../../../services/liveSessionApiService";
import { showSuccess, showError } from "../../../components/common/toastUtils";
import './CreateLiveSessionScreen.css';

export function CreateLiveSessionScreen() {
  const [stations, setStations] = useState<StationResult[]>([]);
  const [hosts, setHosts] = useState<Awaited<ReturnType<typeof userService.getHosts>>['items']>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [stationId, setStationId] = useState('');
  const [hostUserId, setHostUserId] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [stationsRes, hostsRes] = await Promise.allSettled([
        liveSessionApiService.getStations(),
        userService.getHosts(),
      ]);
      if (stationsRes.status === 'fulfilled') setStations(stationsRes.value);
      if (hostsRes.status === 'fulfilled') setHosts(hostsRes.value.items);
    } catch {
      showError("Lỗi", "Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { showError("Lỗi", "Vui lòng nhập tên phiên phát sóng"); return; }
    if (!stationId) { showError("Lỗi", "Vui lòng chọn đài phát"); return; }

    setCreating(true);
    try {
      await liveSessionApiService.createLiveSession({
        stationId,
        hostUserId: hostUserId || '',
        sessionName: name.trim(),
        description: description.trim() || undefined,
      });
      showSuccess("Thành công!", "Phiên phát sóng đã được tạo");
      // Reset form
      setName('');
      setDescription('');
      setHostUserId('');
      setScheduledDate('');
      setScheduledTime('');
    } catch (err: any) {
      showError("Lỗi", err?.response?.data?.message || "Không thể tạo phiên phát sóng");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="create-ls-page">
      <div className="create-ls-header">
        <div>
          <h1>Tạo phiên phát sóng mới</h1>
          <p>Điền thông tin để tạo một phiên phát sóng mới</p>
        </div>
      </div>

      <form className="create-ls-form" onSubmit={handleSubmit}>
        <div className="create-ls-card">
          <h3 className="create-ls-card-title">Thông tin phiên phát sóng</h3>

          <div className="create-ls-field">
            <label className="create-ls-label">Tên phiên phát sóng *</label>
            <input
              className="create-ls-input"
              type="text"
              placeholder="VD: Chill Night Radio"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div className="create-ls-field">
            <label className="create-ls-label">Mô tả</label>
            <textarea
              className="create-ls-textarea"
              placeholder="Mô tả ngắn về nội dung phiên phát sóng..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="create-ls-field">
            <label className="create-ls-label">
              <Disc3 size={14} />
              Đài phát *
            </label>
            <select
              className="create-ls-select"
              value={stationId}
              onChange={e => setStationId(e.target.value)}
              required
            >
              <option value="">-- Chọn đài phát --</option>
              {stations.map(s => (
                <option key={s.id} value={s.id}>{s.stationName}</option>
              ))}
            </select>
          </div>

          <div className="create-ls-field">
            <label className="create-ls-label">
              <Users size={14} />
              MC / Host (tuỳ chọn)
            </label>
            <select
              className="create-ls-select"
              value={hostUserId}
              onChange={e => setHostUserId(e.target.value)}
            >
              <option value="">-- Chọn MC --</option>
              {hosts.map(h => (
                <option key={h.id} value={h.id}>
                  {h.firstName && h.lastName ? `${h.firstName} ${h.lastName}` : h.username || h.id}
                </option>
              ))}
            </select>
          </div>

          <div className="create-ls-field-row">
            <div className="create-ls-field">
              <label className="create-ls-label">
                <Calendar size={14} />
                Ngày lên lịch (tuỳ chọn)
              </label>
              <input
                className="create-ls-input"
                type="date"
                value={scheduledDate}
                min={new Date().toISOString().slice(0, 10)}
                onChange={e => setScheduledDate(e.target.value)}
              />
            </div>
            <div className="create-ls-field">
              <label className="create-ls-label">Giờ bắt đầu</label>
              <input
                className="create-ls-input"
                type="time"
                value={scheduledTime}
                onChange={e => setScheduledTime(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="create-ls-actions">
          <button type="button" className="create-ls-btn create-ls-btn--cancel"
            onClick={() => window.history.back()}>
            Huỷ
          </button>
          <button type="submit" className="create-ls-btn create-ls-btn--submit" disabled={creating}>
            {creating ? 'Đang tạo...' : 'Tạo phiên phát sóng'}
          </button>
        </div>
      </form>
    </div>
  );
}
