import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import podcastService from '../../services/podcastService';
import { VoiceSelector } from '../../components/common/VoiceSelector';
import { AudioPlayer } from '../../components/common/AudioPlayer';
import type { PodcastGenerateResult } from '../../types/podcast';
import { showSuccess, showError } from '../../components/common/toastUtils';
import './QuickGenerateForm.css';

export function QuickGenerateForm() {
  const [formData, setFormData] = useState({
    topic: '',
    style: '',
    duration: '',
    voiceId: '',
    language: 'vi',
    modelName: '',
    includeAudioBytes: true,
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<PodcastGenerateResult | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.topic.trim()) {
      newErrors.topic = 'Vui lòng nhập chủ đề podcast';
    }

    if (!formData.voiceId) {
      newErrors.voiceId = 'Vui lòng chọn giọng đọc';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showError('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    setIsGenerating(true);
    setErrors({});

    try {
      const result = await podcastService.generateFullPodcast({
        topic: formData.topic,
        style: formData.style || undefined,
        duration: formData.duration || undefined,
        voice: formData.voiceId,
        language: formData.language || undefined,
        modelName: formData.modelName || undefined,
        includeAudioBytes: formData.includeAudioBytes,
      });

      setResult(result);
      showSuccess('Tạo podcast thành công!');
    } catch (error: any) {
      console.error('Error generating podcast:', error);
      showError(error.message || 'Lỗi khi tạo podcast');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setFormData({
      topic: '',
      style: '',
      duration: '',
      voiceId: '',
      language: 'vi',
      modelName: '',
      includeAudioBytes: true,
    });
    setResult(null);
    setErrors({});
  };

  return (
    <div className="quick-generate-form">
      <div className="quick-generate-header">
        <h2 className="quick-generate-title">Tạo Podcast Nhanh</h2>
        <p className="quick-generate-subtitle">
          Tạo script và audio podcast trong một bước
        </p>
      </div>

      {!result ? (
        <form onSubmit={handleSubmit} className="quick-generate-form-content">
          {/* Topic */}
          <div className="form-group">
            <label htmlFor="topic" className="form-label">
              Chủ đề <span className="required">*</span>
            </label>
            <textarea
              id="topic"
              className={`form-textarea ${errors.topic ? 'form-input-error' : ''}`}
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              placeholder="Nhập chủ đề podcast của bạn..."
              rows={3}
              disabled={isGenerating}
            />
            {errors.topic && <span className="form-error-text">{errors.topic}</span>}
          </div>

          {/* Voice */}
          <div className="form-group">
            <label htmlFor="voice" className="form-label">
              Giọng đọc <span className="required">*</span>
            </label>
            <VoiceSelector
              value={formData.voiceId}
              onChange={(voiceId) => setFormData({ ...formData, voiceId })}
              disabled={isGenerating}
              required
              error={errors.voiceId}
            />
          </div>

          {/* Style */}
          <div className="form-group">
            <label htmlFor="style" className="form-label">
              Phong cách
            </label>
            <input
              type="text"
              id="style"
              className="form-input"
              value={formData.style}
              onChange={(e) => setFormData({ ...formData, style: e.target.value })}
              placeholder="VD: Chuyên nghiệp, Thân thiện, Hài hước..."
              disabled={isGenerating}
            />
          </div>

          {/* Duration */}
          <div className="form-group">
            <label htmlFor="duration" className="form-label">
              Thời lượng
            </label>
            <input
              type="text"
              id="duration"
              className="form-input"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              placeholder="VD: 5 phút, 10 phút..."
              disabled={isGenerating}
            />
          </div>

          {/* Language */}
          <div className="form-group">
            <label htmlFor="language" className="form-label">
              Ngôn ngữ
            </label>
            <select
              id="language"
              className="form-select"
              value={formData.language}
              onChange={(e) => setFormData({ ...formData, language: e.target.value })}
              disabled={isGenerating}
            >
              <option value="vi">Tiếng Việt</option>
              <option value="en">English</option>
            </select>
          </div>

          {/* Model Name */}
          <div className="form-group">
            <label htmlFor="modelName" className="form-label">
              Model AI
            </label>
            <input
              type="text"
              id="modelName"
              className="form-input"
              value={formData.modelName}
              onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
              placeholder="Để trống để sử dụng model mặc định"
              disabled={isGenerating}
            />
          </div>

          {/* Submit Button */}
          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 size={18} className="spinner" />
                  Đang tạo podcast...
                </>
              ) : (
                'Tạo Podcast'
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="quick-generate-result">
          <div className="result-header">
            <h3 className="result-title">Podcast đã tạo thành công!</h3>
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleReset}
            >
              Tạo podcast mới
            </button>
          </div>

          {/* Script Content */}
          <div className="result-section">
            <h4 className="result-section-title">Script</h4>
            <div className="script-content">
              <p className="script-topic">
                <strong>Chủ đề:</strong> {result.script.topic}
              </p>
              {result.script.title && (
                <p className="script-title-text">
                  <strong>Tiêu đề:</strong> {result.script.title}
                </p>
              )}
              <div className="script-text">{result.script.content}</div>
            </div>
          </div>

          {/* Audio Player */}
          <div className="result-section">
            <h4 className="result-section-title">Audio</h4>
            <AudioPlayer
              audioUrl={result.audio.publicUrl}
              title={result.script.title || result.script.topic}
              downloadUrl={result.audio.downloadUrl}
            />
          </div>
        </div>
      )}
    </div>
  );
}
