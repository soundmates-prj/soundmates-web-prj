import { useState, useEffect } from 'react';
import { Loader2, Download, Volume2, Check } from 'lucide-react';
import scriptService from '../../services/scriptService';
import audioService from '../../services/audioService';
import type { Script, GenerateScriptRequest, ScriptAudio } from '../../types/podcast';
import { showSuccess, showError } from '../../components/common/toastUtils';
import './ScriptGenerateForm.css';

export function ScriptGenerateForm() {
  const [formData, setFormData] = useState<GenerateScriptRequest>({
    topic: '',
    title: '',
    contextType: 'podcast',
    modelName: '',
    temperature: undefined,
    maxTokens: undefined,
    editorInstruction: '',
    useAutoContext: true,
    strictFactMode: false,
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedScript, setGeneratedScript] = useState<Script | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Audio generation state
  const [voices, setVoices] = useState<any[]>([]);
  const [selectedVoice, setSelectedVoice] = useState('');
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [generatedAudio, setGeneratedAudio] = useState<ScriptAudio | null>(null);
  const [audioSpeed, setAudioSpeed] = useState(1.0);
  const [audioPitch, setAudioPitch] = useState(1.0);
  const [isDownloadingAudio, setIsDownloadingAudio] = useState(false);

  useEffect(() => {
    const loadVoices = async () => {
      try {
        const v = await audioService.getVoices();
        setVoices(v);
        // Auto-select first voice
        if (v.length > 0) {
          // Support both voiceId (from VieNeu TTS) and id (from other services)
          const firstVoice = v[0];
          setSelectedVoice(firstVoice.voiceId || firstVoice.id || '');
        }
      } catch (err) {
        console.error('Failed to load voices', err);
      }
    };
    loadVoices();
  }, []);

  const formatScriptContent = (content: unknown) => {
    const safeContent = typeof content === 'string' ? content : '';
    const paragraphs = safeContent.split('\n\n').filter(Boolean);

    if (paragraphs.length === 0) {
      return <p className="script-paragraph">Script chưa có nội dung hiển thị.</p>;
    }

    return paragraphs.map((p, idx) => {
      const lines = p.split('\n');
      return (
        <p key={idx} className="script-paragraph" style={{ marginBottom: '1rem' }}>
          {lines.map((line, lineIdx) => (
            <span key={lineIdx}>
              <span dangerouslySetInnerHTML={{ 
                __html: line.replace(/\*\*(.*?)\*\*/g, '<strong style="color: var(--primary-600)">$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>') 
              }} />
              {lineIdx < lines.length - 1 && <br />}
            </span>
          ))}
        </p>
      );
    });
  };

  const handleGenerateAudio = async () => {
    if (!generatedScript || !selectedVoice) {
      showError('Vui lòng tạo script và chọn giọng đọc trước');
      return;
    }

    setIsGeneratingAudio(true);
    setGeneratedAudio(null);

    try {
      const audio = await audioService.generateAudio(generatedScript.id, {
        voiceId: selectedVoice,
        speed: audioSpeed,
        pitch: audioPitch,
      });
      setGeneratedAudio(audio);
      showSuccess('Tạo audio thành công!');
    } catch (error: any) {
      console.error('Error generating audio:', error);
      showError(error.response?.data?.message || error.message || 'Lỗi khi tạo audio');
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handleDownloadAudio = async () => {
    if (!generatedAudio) return;

    setIsDownloadingAudio(true);
    try {
      await audioService.downloadAudioFile(generatedAudio.id, generatedAudio.fileName);
      showSuccess('Đang tải file audio...');
    } catch (error: any) {
      console.error('Error downloading audio:', error);
      showError(error.message || 'Lỗi khi tải file âm thanh');
    } finally {
      setIsDownloadingAudio(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.topic.trim()) {
      newErrors.topic = 'Vui lòng nhập chủ đề podcast';
    }

    if (formData.temperature !== undefined && (formData.temperature < 0.2 || formData.temperature > 1.0)) {
      newErrors.temperature = 'Temperature phải từ 0.2 đến 1.0';
    }

    if (formData.maxTokens !== undefined && formData.maxTokens < 100) {
      newErrors.maxTokens = 'Max tokens phải lớn hơn 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showError('Vui lòng kiểm tra lại thông tin');
      return;
    }

    setIsGenerating(true);
    setErrors({});

    try {
      const script = await scriptService.generateScript(formData);
      setGeneratedScript(script);
      showSuccess('Tạo script thành công!');
    } catch (error: any) {
      console.error('Error generating script:', error);
      showError(error.message || 'Lỗi khi tạo script');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setFormData({
      topic: '',
      title: '',
      contextType: 'podcast',
      modelName: '',
      temperature: undefined,
      maxTokens: undefined,
      editorInstruction: '',
      useAutoContext: true,
      strictFactMode: false,
    });
    setGeneratedScript(null);
    setGeneratedAudio(null);
    setErrors({});
  };

  const handleCopyScript = () => {
    if (generatedScript) {
      navigator.clipboard.writeText(generatedScript.content);
      showSuccess('Đã copy script vào clipboard');
    }
  };

  return (
    <div className="script-generate-form">
      <div className="script-generate-header">
        <h2 className="script-generate-title">Tạo Script Podcast</h2>
        <p className="script-generate-subtitle">
          Tạo nội dung script podcast với AI từ chủ đề và tùy chọn prompt
        </p>
      </div>

      {!generatedScript ? (
        <form onSubmit={handleSubmit} className="script-form-content">
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

          {/* Title */}
          <div className="form-group">
            <label htmlFor="title" className="form-label">
              Tiêu đề (tùy chọn)
            </label>
            <input
              type="text"
              id="title"
              className="form-input"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Tiêu đề cho script podcast..."
              disabled={isGenerating}
            />
          </div>

          {/* Editor Instruction */}
          <div className="form-group">
            <label htmlFor="editorInstruction" className="form-label">
              Hướng dẫn tùy chỉnh
            </label>
            <textarea
              id="editorInstruction"
              className="form-textarea"
              value={formData.editorInstruction}
              onChange={(e) => setFormData({ ...formData, editorInstruction: e.target.value })}
              placeholder="Nhập hướng dẫn để tùy chỉnh phong cách, giọng điệu và cấu trúc..."
              rows={3}
              disabled={isGenerating}
            />
            <small className="form-hint">
              VD: "Viết theo phong cách chuyên nghiệp, sử dụng ngôn ngữ đơn giản, dễ hiểu"
            </small>
          </div>

          {/* Advanced Options */}
          <details className="form-advanced">
            <summary className="form-advanced-summary">Tùy chọn nâng cao</summary>
            
            <div className="form-advanced-content">
              {/* Context Type */}
              <div className="form-group">
                <label htmlFor="contextType" className="form-label">
                  Loại nội dung
                </label>
                <select
                  id="contextType"
                  className="form-select"
                  value={formData.contextType}
                  onChange={(e) => setFormData({ ...formData, contextType: e.target.value })}
                  disabled={isGenerating}
                >
                  <option value="podcast">Podcast</option>
                  <option value="interview">Interview</option>
                  <option value="story">Story</option>
                  <option value="news">News</option>
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
                  placeholder="VD: gemini-2.5-flash"
                  disabled={isGenerating}
                />
                <small className="form-hint">
                  Để trống để sử dụng model mặc định
                </small>
              </div>

              {/* Temperature */}
              <div className="form-group">
                <label htmlFor="temperature" className="form-label">
                  Temperature (Độ sáng tạo)
                </label>
                <input
                  type="number"
                  id="temperature"
                  className={`form-input ${errors.temperature ? 'form-input-error' : ''}`}
                  value={formData.temperature ?? ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    temperature: e.target.value ? parseFloat(e.target.value) : undefined 
                  })}
                  placeholder="0.2 - 1.0"
                  step="0.1"
                  min="0.2"
                  max="1.0"
                  disabled={isGenerating}
                />
                {errors.temperature && <span className="form-error-text">{errors.temperature}</span>}
                <small className="form-hint">
                  Giá trị từ 0.2 (bảo thủ) đến 1.0 (sáng tạo)
                </small>
              </div>

              {/* Max Tokens */}
              <div className="form-group">
                <label htmlFor="maxTokens" className="form-label">
                  Max Tokens
                </label>
                <input
                  type="number"
                  id="maxTokens"
                  className={`form-input ${errors.maxTokens ? 'form-input-error' : ''}`}
                  value={formData.maxTokens ?? ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    maxTokens: e.target.value ? parseInt(e.target.value) : undefined 
                  })}
                  placeholder="VD: 2000"
                  min="100"
                  disabled={isGenerating}
                />
                {errors.maxTokens && <span className="form-error-text">{errors.maxTokens}</span>}
                <small className="form-hint">
                  Số lượng token tối đa cho output
                </small>
              </div>

              {/* Use Auto Context */}
              <div className="form-group form-checkbox-group">
                <label className="form-checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.useAutoContext}
                    onChange={(e) => setFormData({ ...formData, useAutoContext: e.target.checked })}
                    disabled={isGenerating}
                  />
                  <span>Sử dụng auto context</span>
                </label>
                <small className="form-hint">
                  Kết hợp system context với hướng dẫn của bạn
                </small>
              </div>

              {/* Strict Fact Mode */}
              <div className="form-group form-checkbox-group">
                <label className="form-checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.strictFactMode}
                    onChange={(e) => setFormData({ ...formData, strictFactMode: e.target.checked })}
                    disabled={isGenerating}
                  />
                  <span>Chế độ fact checking nghiêm ngặt</span>
                </label>
                <small className="form-hint">
                  Tránh các tuyên bố không có căn cứ
                </small>
              </div>
            </div>
          </details>

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
                  Đang tạo script...
                </>
              ) : (
                'Tạo Script'
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="script-result">
          <div className="result-header">
            <h3 className="result-title">Script đã tạo thành công!</h3>
            <div className="result-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleCopyScript}
              >
                Copy Script
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleReset}
              >
                Tạo script mới
              </button>
            </div>
          </div>

          {/* Script Info */}
          <div className="script-info">
            <div className="script-info-item">
              <span className="script-info-label">ID:</span>
              <span className="script-info-value">{generatedScript.id}</span>
            </div>
            {generatedScript.title && (
              <div className="script-info-item">
                <span className="script-info-label">Tiêu đề:</span>
                <span className="script-info-value">{generatedScript.title}</span>
              </div>
            )}
            <div className="script-info-item">
              <span className="script-info-label">Chủ đề:</span>
              <span className="script-info-value">{generatedScript.topic}</span>
            </div>
            <div className="script-info-item">
              <span className="script-info-label">Trạng thái:</span>
              <span className={`script-status script-status-${generatedScript.status}`}>
                {generatedScript.status}
              </span>
            </div>
            {generatedScript.modelName && (
              <div className="script-info-item">
                <span className="script-info-label">Model:</span>
                <span className="script-info-value">{generatedScript.modelName}</span>
              </div>
            )}
          </div>

          {/* Script Content */}
          <div className="script-content-section" style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
            <div className="script-text-col">
              <h4 className="script-content-title">Nội dung</h4>
              <div className="script-content-box" style={{ fontSize: '1rem', lineHeight: '1.8' }}>
                {formatScriptContent(generatedScript.content)}
              </div>
            </div>

            <div className="script-audio-col">
              <h4 className="script-content-title">Tạo Audio</h4>
              <div className="audio-control-panel" style={{ padding: '1.5rem', background: 'var(--neutral-100)', borderRadius: '12px' }}>
                
                <div className="form-group">
                  <label className="form-label">Chọn giọng đọc</label>
                  <select
                    className="form-select"
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    disabled={isGeneratingAudio || voices.length === 0}
                  >
                    {(Array.isArray(voices) ? voices : []).map(v => (
                      <option key={v.voiceId || v.id} value={v.voiceId || v.id}>
                        {v.displayName} {v.region ? `(${v.region})` : ''} {v.gender ? `- ${v.gender}` : ''}
                      </option>
                    ))}
                    {voices.length === 0 && <option value="">Đang tải giọng đọc...</option>}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Tốc độ ({audioSpeed}x)</label>
                  <input 
                    type="range" 
                    min="0.5" max="2.0" step="0.1" 
                    value={audioSpeed} 
                    onChange={(e) => setAudioSpeed(parseFloat(e.target.value))}
                    disabled={isGeneratingAudio}
                    style={{ width: '100%' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--neutral-500)' }}>
                    <span>Chậm</span><span>Bình thường</span><span>Nhanh</span>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label">Độ cao - Pitch ({audioPitch}x)</label>
                  <input 
                    type="range" 
                    min="0.5" max="2.0" step="0.1" 
                    value={audioPitch} 
                    onChange={(e) => setAudioPitch(parseFloat(e.target.value))}
                    disabled={isGeneratingAudio}
                    style={{ width: '100%' }}
                  />
                </div>

                <button
                  className="btn btn-primary"
                  onClick={handleGenerateAudio}
                  disabled={isGeneratingAudio || !selectedVoice}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {isGeneratingAudio ? (
                    <><Loader2 size={18} className="spinner" /> Đang tạo audio...</>
                  ) : (
                    <><Volume2 size={18} /> Tạo Audio từ Script</>
                  )}
                </button>

                {generatedAudio && (
                  <div className="audio-player-wrapper" style={{ marginTop: '2rem', padding: '1rem', background: 'white', borderRadius: '8px', border: '1px solid var(--neutral-200)' }}>
                    <h5 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-600)' }}>
                      <Check size={16} /> Hoàn thành
                    </h5>
                    <audio
                      controls
                      src={audioService.getAudioFileUrl(generatedAudio.id)}
                      style={{ width: '100%', marginTop: '0.5rem' }}
                    />
                    <button
                      type="button"
                      onClick={handleDownloadAudio}
                      disabled={isDownloadingAudio}
                      className="btn btn-outline"
                      style={{ width: '100%', marginTop: '1rem', fontSize: '0.85rem', padding: '0.5rem', justifyContent: 'center' }}
                    >
                      {isDownloadingAudio ? (
                        <><Loader2 size={14} className="spinner" /> Đang tải...</>
                      ) : (
                        <><Download size={14} /> Tải file âm thanh</>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
