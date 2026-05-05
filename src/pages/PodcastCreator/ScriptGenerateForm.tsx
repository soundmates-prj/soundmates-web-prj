import { useState, useEffect } from 'react';
import { Loader2, Download, Volume2, Check, Wand2, PenLine, RefreshCw, Headphones, Trash2, FileText, PlusCircle } from 'lucide-react';
import scriptService from '../../services/scriptService';
import audioService from '../../services/audioService';
import podcastService from '../../services/podcastService';
import type { Script, GenerateScriptRequest, ScriptAudio } from '../../types/podcast';
import { showSuccess, showError } from '../../components/common/toastUtils';
import api from '../../services/axios';
import './ScriptGenerateForm.css';

type CreateMode = 'ai' | 'manual';
type TabId = 'create' | 'scripts' | 'audios';

export function ScriptGenerateForm() {
  const [activeTab, setActiveTab] = useState<TabId>('create');

  // Mode: AI generation or manual writing
  const [createMode, setCreateMode] = useState<CreateMode>('ai');

  // AI form
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

  // Manual form
  const [manualTitle, setManualTitle] = useState('');
  const [manualContent, setManualContent] = useState('');
  const [savingManual, setSavingManual] = useState(false);

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
  const [bgmUrl, setBgmUrl] = useState('');
  const [isDownloadingAudio, setIsDownloadingAudio] = useState(false);

  // Audio library
  const [myAudios, setMyAudios] = useState<any[]>([]);
  const [loadingAudios, setLoadingAudios] = useState(false);
  const [downloadingAudioId, setDownloadingAudioId] = useState<string | null>(null);
  const [deletingAudioId, setDeletingAudioId] = useState<string | null>(null);

  // Script library
  const [myScripts, setMyScripts] = useState<any[]>([]);
  const [loadingScripts, setLoadingScripts] = useState(false);
  const [deletingScriptId, setDeletingScriptId] = useState<string | null>(null);

  useEffect(() => {
    const loadVoices = async () => {
      try {
        const v = await audioService.getVoices();
        
        setVoices(v);
        if (v.length > 0) {
          setSelectedVoice(v[0].voiceCode || v[0].id || '');
        }
      } catch (err) {
        console.error('Failed to load voices', err);
      }
    };
    loadVoices();
  }, []);

  useEffect(() => {
    if (activeTab === 'audios') {
      handleLoadAudios();
    } else if (activeTab === 'scripts') {
      handleLoadScripts();
    }
  }, [activeTab]);

  /* ─── Scripts library ────────────────────────────────────────────────── */

  const handleLoadScripts = async () => {
    setLoadingScripts(true);
    try {
      setMyScripts(await podcastService.getMyScripts());
    } catch (err: any) {
      showError(err?.message || 'Không tải được script');
    } finally {
      setLoadingScripts(false);
    }
  };

  const handleDeleteScript = async (scriptId: string) => {
    if (!window.confirm('Xóa script này? Hành động này không thể hoàn tác.')) return;
    setDeletingScriptId(scriptId);
    try {
      await podcastService.deleteScript(scriptId);
      setMyScripts(prev => prev.filter(s => (s.id ?? s.scriptId) !== scriptId));
      if (generatedScript && (generatedScript.id === scriptId)) {
        setGeneratedScript(null);
      }
      showSuccess('Đã xóa script');
    } catch (err: any) {
      showError(err?.message || 'Xóa script thất bại');
    } finally {
      setDeletingScriptId(null);
    }
  };

  const handleSelectScript = (script: any) => {
    setGeneratedScript({
      id: script.id ?? script.scriptId,
      userId: script.userId,
      topic: script.topic ?? script.title ?? 'My Script',
      title: script.title,
      content: script.contentText ?? script.content ?? '',
      status: script.status,
      createdAt: script.createdAt,
    });
    setGeneratedAudio(null);
    setActiveTab('create');
  };

  /* ─── Audio library ─────────────────────────────────────────────────── */

  const handleLoadAudios = async () => {
    setLoadingAudios(true);
    try {
      setMyAudios(await podcastService.getMyAudios());
    } catch (err: any) {
      showError(err?.message || 'Không tải được audio');
    } finally {
      setLoadingAudios(false);
    }
  };

  const handleDeleteAudio = async (audioId: string) => {
    if (!window.confirm('Xóa audio này khỏi thư viện?')) return;
    setDeletingAudioId(audioId);
    try {
      await podcastService.deleteAudio(audioId);
      setMyAudios(prev => prev.filter(a => (a.id ?? a.audioId) !== audioId));
      showSuccess('Đã xóa audio');
    } catch (err: any) {
      showError(err?.message || 'Xóa audio thất bại');
    } finally {
      setDeletingAudioId(null);
    }
  };

  const getAudioFileUrl = (audioId: string) => {
    const base = api.defaults.baseURL ?? '';
    return `${base}audios/${audioId}/file`;
  };

  const handleDownloadAudio = async (audioId: string, fileName?: string) => {
    setDownloadingAudioId(audioId);
    try {
      const base = api.defaults.baseURL ?? '';
      const url = `${base}audios/${audioId}/download`;
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName ?? `audio-${audioId}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showSuccess('Đang tải file audio...');
    } catch (err: any) {
      showError(err?.message || 'Tải audio thất bại');
    } finally {
      setDownloadingAudioId(null);
    }
  };

  /* ─── Format content ─────────────────────────────────────────────────── */

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

  /* ─── Audio generation ──────────────────────────────────────────────── */

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
        bgmUrl: bgmUrl || undefined
      });
      setGeneratedAudio(audio);
      
      showSuccess('Tạo audio thành công! Đã lưu vào thư viện.');
    } catch (error: any) {
      console.error('Error generating audio:', error);
      showError(error.response?.data?.message || error.message || 'Lỗi khi tạo audio');
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handleDownloadGeneratedAudio = async () => {
    if (!generatedAudio) return;
    setIsDownloadingAudio(true);
    try {
      await audioService.downloadAudioFile(generatedAudio.id, generatedAudio.fileName);
      showSuccess('Đang tải file audio...');
    } catch (error: any) {
      showError(error.message || 'Lỗi khi tải file âm thanh');
    } finally {
      setIsDownloadingAudio(false);
    }
  };

  /* ─── AI Script generation ──────────────────────────────────────────── */

  const validateAIForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.topic.trim()) newErrors.topic = 'Vui lòng nhập chủ đề podcast';
    if (formData.temperature !== undefined && (formData.temperature < 0.2 || formData.temperature > 1.0))
      newErrors.temperature = 'Temperature phải từ 0.2 đến 1.0';
    if (formData.maxTokens !== undefined && formData.maxTokens < 100)
      newErrors.maxTokens = 'Max tokens phải lớn hơn 100';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAIForm()) { showError('Vui lòng kiểm tra lại thông tin'); return; }
    setIsGenerating(true);
    setErrors({});
    try {
      const script = await scriptService.generateScript(formData);
      setGeneratedScript(script);
      showSuccess('Tạo script thành công!');
    } catch (error: any) {
      showError(error.message || 'Lỗi khi tạo script');
    } finally {
      setIsGenerating(false);
    }
  };

  /* ─── Manual Script save ────────────────────────────────────────────── */

  const handleSaveManual = async () => {
    if (!manualContent.trim() || manualContent.trim().length < 20) {
      showError('Nội dung script phải có ít nhất 20 ký tự');
      return;
    }
    setSavingManual(true);
    try {
      const result = await podcastService.createScript({
        topic: manualTitle.trim() || 'Script thủ công',
        title: manualTitle.trim() || undefined,
        contentText: manualContent.trim(),
      });
      showSuccess('Đã lưu script!');
      setGeneratedScript({
        id: result.scriptId,
        userId: '',
        topic: manualTitle.trim() || 'Script thủ công',
        title: result.title,
        content: result.scriptText || manualContent.trim(),
        status: 'completed',
        createdAt: new Date().toISOString(),
      });
      setManualTitle('');
      setManualContent('');
    } catch (err: any) {
      showError(err?.message || 'Lưu script thất bại');
    } finally {
      setSavingManual(false);
    }
  };

  const handleReset = () => {
    setFormData({ topic: '', title: '', contextType: 'podcast', modelName: '', temperature: undefined, maxTokens: undefined, editorInstruction: '', useAutoContext: true, strictFactMode: false });
    setGeneratedScript(null);
    setGeneratedAudio(null);
    setErrors({});
    setManualTitle('');
    setManualContent('');
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
        <h2 className="script-generate-title">Voice Clone & Podcast Maker</h2>
        <p className="script-generate-subtitle">
          Tạo nội dung với AI, tự biên tập script và sinh audio giọng đọc của riêng bạn.
        </p>
      </div>

      <div className="sgf-tabs">
        <button
          className={`sgf-tab ${activeTab === 'create' ? 'sgf-tab--active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          <PlusCircle size={16} /> Tạo Podcast
        </button>
        <button
          className={`sgf-tab ${activeTab === 'scripts' ? 'sgf-tab--active' : ''}`}
          onClick={() => setActiveTab('scripts')}
        >
          <FileText size={16} /> Script của tôi
        </button>
        <button
          className={`sgf-tab ${activeTab === 'audios' ? 'sgf-tab--active' : ''}`}
          onClick={() => setActiveTab('audios')}
        >
          <Headphones size={16} /> Thư viện Audio
        </button>
      </div>

      {activeTab === 'create' && (
        <div className="sgf-tab-pane">
          {!generatedScript ? (
            <>
              {/* ── Mode Toggle ── */}
              <div className="sgf-mode-toggle">
                <button
                  type="button"
                  className={`sgf-mode-btn ${createMode === 'ai' ? 'sgf-mode-btn--active' : ''}`}
                  onClick={() => setCreateMode('ai')}
                >
                  <Wand2 size={15} /> AI Tạo Script
                </button>
                <button
                  type="button"
                  className={`sgf-mode-btn ${createMode === 'manual' ? 'sgf-mode-btn--active' : ''}`}
                  onClick={() => setCreateMode('manual')}
                >
                  <PenLine size={15} /> Tự Viết Script
                </button>
              </div>

              {/* ── AI Mode ── */}
              {createMode === 'ai' && (
                <form onSubmit={handleSubmitAI} className="script-form-content">
                  <div className="form-group">
                    <label htmlFor="topic" className="form-label">Chủ đề <span className="required">*</span></label>
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
                  <div className="form-group">
                    <label htmlFor="title" className="form-label">Tiêu đề (tùy chọn)</label>
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
                  <div className="form-group">
                    <label htmlFor="editorInstruction" className="form-label">Hướng dẫn tùy chỉnh</label>
                    <textarea
                      id="editorInstruction"
                      className="form-textarea"
                      value={formData.editorInstruction}
                      onChange={(e) => setFormData({ ...formData, editorInstruction: e.target.value })}
                      placeholder="Nhập hướng dẫn để tùy chỉnh phong cách, giọng điệu và cấu trúc..."
                      rows={3}
                      disabled={isGenerating}
                    />
                    <small className="form-hint">VD: "Viết theo phong cách chuyên nghiệp, sử dụng ngôn ngữ đơn giản, dễ hiểu"</small>
                  </div>
                  <details className="form-advanced">
                    <summary className="form-advanced-summary">Tùy chọn nâng cao</summary>
                    <div className="form-advanced-content">
                      <div className="form-group">
                        <label htmlFor="contextType" className="form-label">Loại nội dung</label>
                        <select id="contextType" className="form-select" value={formData.contextType} onChange={(e) => setFormData({ ...formData, contextType: e.target.value })} disabled={isGenerating}>
                          <option value="podcast">Podcast</option>
                          <option value="interview">Interview</option>
                          <option value="story">Story</option>
                          <option value="news">News</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label htmlFor="modelName" className="form-label">Model AI</label>
                        <input type="text" id="modelName" className="form-input" value={formData.modelName} onChange={(e) => setFormData({ ...formData, modelName: e.target.value })} placeholder="VD: gemini-2.5-flash" disabled={isGenerating} />
                        <small className="form-hint">Để trống để sử dụng model mặc định</small>
                      </div>
                      <div className="form-group">
                        <label className="form-checkbox-label">
                          <input type="checkbox" checked={formData.useAutoContext} onChange={(e) => setFormData({ ...formData, useAutoContext: e.target.checked })} disabled={isGenerating} />
                          <span>Sử dụng auto context</span>
                        </label>
                      </div>
                      <div className="form-group">
                        <label className="form-checkbox-label">
                          <input type="checkbox" checked={formData.strictFactMode} onChange={(e) => setFormData({ ...formData, strictFactMode: e.target.checked })} disabled={isGenerating} />
                          <span>Chế độ fact checking nghiêm ngặt</span>
                        </label>
                      </div>
                    </div>
                  </details>
                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={isGenerating}>
                      {isGenerating ? <><Loader2 size={18} className="spinner" /> Đang tạo script...</> : 'Tạo Script với AI'}
                    </button>
                  </div>
                </form>
              )}

              {/* ── Manual Mode ── */}
              {createMode === 'manual' && (
                <div className="script-form-content">
                  <div className="form-group">
                    <label htmlFor="manual-title" className="form-label">Tiêu đề (tùy chọn)</label>
                    <input
                      type="text"
                      id="manual-title"
                      className="form-input"
                      value={manualTitle}
                      onChange={(e) => setManualTitle(e.target.value)}
                      placeholder="VD: Tập 1 - Giới thiệu về AI..."
                      disabled={savingManual}
                      maxLength={200}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="manual-content" className="form-label">Nội dung Script <span className="required">*</span></label>
                    <textarea
                      id="manual-content"
                      className="form-textarea"
                      value={manualContent}
                      onChange={(e) => setManualContent(e.target.value)}
                      placeholder={"Nhập nội dung script của bạn tại đây...\n\nVD:\nXin chào các bạn! Hôm nay chúng ta sẽ cùng khám phá...\n\nĐoạn 1: ..."}
                      rows={16}
                      disabled={savingManual}
                      maxLength={20000}
                      style={{ fontFamily: 'inherit', lineHeight: 1.7 }}
                    />
                    <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--neutral-500)', marginTop: 4 }}>
                      {manualContent.length}/20000 ký tự
                    </div>
                  </div>
                  <div className="form-actions">
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => void handleSaveManual()}
                      disabled={savingManual || manualContent.trim().length < 20}
                    >
                      {savingManual ? <><Loader2 size={18} className="spinner" /> Đang lưu...</> : <><Check size={18} /> Lưu Script & Tiếp tục</>}
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* ── Script Result + Audio Generation ── */
            <div className="script-result">
              <div className="result-header">
                <h3 className="result-title">
                  {createMode === 'manual' ? '✅ Thông tin Script' : 'Script đã tạo thành công!'}
                </h3>
                <div className="result-actions">
                  <button type="button" className="btn btn-outline" onClick={handleCopyScript}>Copy Script</button>
                  <button type="button" className="btn btn-outline" onClick={handleReset}>Đóng</button>
                </div>
              </div>

              <div className="script-content-section" style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
                <div className="script-text-col">
                  <h4 className="script-content-title">{generatedScript.title ?? 'Nội dung'}</h4>
                  <div className="script-content-box" style={{ fontSize: '1rem', lineHeight: '1.8' }}>
                    {formatScriptContent(generatedScript.content)}
                  </div>
                </div>

                <div className="script-audio-col">
                  <h4 className="script-content-title">Tạo Audio</h4>
                  <div className="audio-control-panel" style={{ padding: '1.5rem', background: 'var(--neutral-100)', borderRadius: '12px' }}>
                    <div className="form-group">
                      <label className="form-label">Chọn giọng đọc</label>
                      <select className="form-select" value={selectedVoice} onChange={(e) => setSelectedVoice(e.target.value)} disabled={isGeneratingAudio || voices.length === 0}>
                        {(Array.isArray(voices) ? voices : []).map(v => (
                          <option key={v.id} value={v.voiceCode || v.id}>
                            {v.displayName} {v.region ? `(${v.region})` : ''} {v.gender ? `- ${v.gender}` : ''}
                          </option>
                        ))}
                        {voices.length === 0 && <option value="">Đang tải giọng đọc...</option>}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Tốc độ ({audioSpeed}x)</label>
                      <input type="range" min="0.5" max="2.0" step="0.1" value={audioSpeed} onChange={(e) => setAudioSpeed(parseFloat(e.target.value))} disabled={isGeneratingAudio} style={{ width: '100%' }} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Nhạc nền (Podcast BGM)</label>
                      <select className="form-select" value={bgmUrl} onChange={(e) => setBgmUrl(e.target.value)} disabled={isGeneratingAudio}>
                        <option value="">Không dùng nhạc nền</option>
                        <option value="https://res.cloudinary.com/soundmates/raw/upload/v1776600589/soundmates/live-session/audio/audio-a980f5b6e6334e0ca6bbb5103419e5eb_vnu5uk.mp3">Chill Lofi Beat</option>
                        <option value="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3">Piano Nhẹ Nhàng</option>
                        <option value="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3">Podcast Intro Năng Động</option>
                      </select>
                      <small className="form-hint" style={{ marginTop: 4, display: 'block' }}>Hệ thống tự động Ducking (Mix giảm âm lượng nhạc khi đọc).</small>
                    </div>
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                      <label className="form-label">Pitch ({audioPitch}x)</label>
                      <input type="range" min="0.5" max="2.0" step="0.1" value={audioPitch} onChange={(e) => setAudioPitch(parseFloat(e.target.value))} disabled={isGeneratingAudio} style={{ width: '100%' }} />
                    </div>
                    <button className="btn btn-primary" onClick={handleGenerateAudio} disabled={isGeneratingAudio || !selectedVoice} style={{ width: '100%', justifyContent: 'center' }}>
                      {isGeneratingAudio ? <><Loader2 size={18} className="spinner" /> Đang tạo audio...</> : <><Volume2 size={18} /> Tạo Audio từ Script</>}
                    </button>

                    {generatedAudio && (
                      <div className="audio-player-wrapper" style={{ marginTop: '2rem', padding: '1rem', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-medium)' }}>
                        <h5 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-600)' }}>
                          <Check size={16} /> Hoàn thành — Đã lưu vào thư viện
                        </h5>
                        <audio controls src={audioService.getAudioFileUrl(generatedAudio.id)} style={{ width: '100%', marginTop: '0.5rem' }} />
                        <button
                          type="button"
                          onClick={handleDownloadGeneratedAudio}
                          disabled={isDownloadingAudio}
                          className="btn btn-outline"
                          style={{ width: '100%', marginTop: '1rem', fontSize: '0.85rem', padding: '0.5rem', justifyContent: 'center' }}
                        >
                          {isDownloadingAudio ? <><Loader2 size={14} className="spinner" /> Đang tải...</> : <><Download size={14} /> Tải file âm thanh</>}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'scripts' && (
        <div className="sgf-tab-pane sgf-audio-library" style={{ marginBottom: 0 }}>
          <div className="sgf-audio-library__header">
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>📄 Thư viện Script của tôi</span>
            <button
              type="button"
              className="btn btn-outline"
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}
              onClick={handleLoadScripts}
              disabled={loadingScripts}
            >
              {loadingScripts ? <Loader2 size={14} className="spinner" /> : <RefreshCw size={14} />} Tải lại
            </button>
          </div>

          {loadingScripts ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--neutral-500)' }}>
              <Loader2 size={24} className="spinner" /> Đang tải...
            </div>
          ) : myScripts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)', background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border-medium)' }}>
              Chưa có script nào. Bạn có thể tạo script mới bằng AI hoặc viết thủ công.
            </div>
          ) : (
            <div className="sgf-audio-list" style={{ maxHeight: 'max-content' }}>
              {myScripts.map((s: any) => {
                const sid = s.id ?? s.scriptId;
                const title = s.title || s.topic || `Script ${sid?.slice(0, 8)}`;
                const contentText = s.contentText ?? s.content ?? '';
                const preview = contentText.length > 100 ? contentText.slice(0, 100) + '...' : contentText;
                const createdAt = s.createdAt ? new Date(s.createdAt).toLocaleDateString('vi-VN') : '';

                return (
                  <div key={sid} className="sgf-audio-item" style={{ alignItems: 'center' }}>
                    <div style={{ flex: 1, minWidth: '200px', paddingRight: '1rem' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {title || "Không có tiêu đề"}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {preview || "Không có preview"}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{createdAt || "Không có ngày"}</div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6, width: 'auto' }}
                        onClick={() => handleSelectScript(s)}
                      >
                        <Volume2 size={14} /> Tạo Audio
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)', width: '32px', height: '32px', flexShrink: 0, borderRadius: '8px' }}
                        onClick={() => void handleDeleteScript(sid)}
                        disabled={deletingScriptId === sid}
                        title="Xóa script"
                      >
                        {deletingScriptId === sid ? <Loader2 size={14} className="spinner" /> : <Trash2 size={16} />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'audios' && (
        <div className="sgf-tab-pane sgf-audio-library" style={{ marginBottom: 0 }}>
          <div className="sgf-audio-library__header">
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>🎵 Thư viện Audio của tôi</span>
            <button
              type="button"
              className="btn btn-outline"
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}
              onClick={handleLoadAudios}
              disabled={loadingAudios}
            >
              {loadingAudios ? <Loader2 size={14} className="spinner" /> : <RefreshCw size={14} />} Tải lại
            </button>
          </div>

          {loadingAudios ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--neutral-500)' }}>
              <Loader2 size={24} className="spinner" /> Đang tải...
            </div>
          ) : myAudios.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--neutral-500)', background: 'white', borderRadius: 8, border: '1px solid var(--neutral-200)' }}>
              Chưa có audio nào. Tạo script và generate audio để lưu ở đây.
            </div>
          ) : (
            <div className="sgf-audio-list" style={{ maxHeight: 'max-content' }}>
              {myAudios.map((audio: any) => {
                const aid = audio.id ?? audio.audioId;
                const title = audio.scriptTitle ?? audio.title ?? `Audio ${aid?.slice(0, 8)}`;
                const createdAt = audio.createdAt ? new Date(audio.createdAt).toLocaleDateString('vi-VN') : '';
                return (
                  <div key={aid} className="sgf-audio-item" style={{ alignItems: 'center' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', marginBottom: 8 }}>{createdAt}</div>
                      <audio controls src={getAudioFileUrl(aid)} style={{ width: '100%', height: 36 }} preload="metadata" />
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{ flexShrink: 0, padding: '0.4rem 0.8rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6 }}
                      onClick={() => void handleDownloadAudio(aid, audio.fileName)}
                      disabled={downloadingAudioId === aid}
                    >
                      {downloadingAudioId === aid ? <Loader2 size={14} className="spinner" /> : <Download size={14} />}
                      Tải
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{ flexShrink: 0, padding: '0.4rem 0.8rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6, color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}
                      onClick={() => void handleDeleteAudio(aid)}
                      disabled={deletingAudioId === aid}
                      title="Xóa audio"
                    >
                      {deletingAudioId === aid ? <Loader2 size={14} className="spinner" /> : <Trash2 size={14} />}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
