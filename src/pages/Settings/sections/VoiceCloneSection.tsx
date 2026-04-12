import { useState, useEffect, useCallback, useRef } from "react";
import {
  Mic,
  Upload,
  Trash2,
  Play,
  Pause,
  Loader2,
  Info,
  Volume2,
  X,
  Waves,
  FileText,
  Wand2,
  Music,
  Pencil,
  Check,
} from "lucide-react";
import { voiceCloneService, type ClonedVoice, type SubscriptionPlan } from "../../../services/voiceCloneService";
import { showToast } from "../../../utils/toast";
import podcastService from "../../../services/podcastService";
import "./VoiceCloneSection.css";

interface VoiceCloneSectionProps {
  onUpgradeClick?: () => void;
}

const ALLOWED_TYPES = ["audio/wav", "audio/mpeg", "audio/mp3", "audio/m4a", "audio/flac", "audio/ogg"];
const ALLOWED_EXTENSIONS = [".wav", ".mp3", ".m4a", ".flac", ".ogg"];
const MAX_FILE_SIZE_MB = 10;
const MIN_REF_TEXT_CHARS = 5;

/* ─── Helpers ───────────────────────────────────────────────────────────── */

function formatFileSize(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function getScriptDisplayTitle(script: any): string {
  if (script.title && script.title.trim()) return script.title.trim();
  const content = script.contentText ?? script.content ?? "";
  const firstLine = content.split("\n").find((l: string) => l.trim().length > 5);
  if (firstLine) return firstLine.trim().slice(0, 80);
  return `Script ${((script.scriptId ?? script.id) as string)?.slice(0, 8)}`;
}

function validateFile(file: File): string | null {
  const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
  if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.includes(ext)) {
    return "Định dạng không được hỗ trợ. Vui lòng upload file WAV, MP3, M4A, FLAC, hoặc OGG.";
  }
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    return `File quá lớn (${formatFileSize(file.size)}). Tối đa ${MAX_FILE_SIZE_MB}MB.`;
  }
  return null;
}

/* ─── Delete Confirm Modal ───────────────────────────────────────────────── */

function DeleteConfirmModal({
  title,
  onConfirm,
  onCancel,
  loading,
}: {
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <>
      <div className="vc-overlay" onClick={onCancel} />
      <div className="vc-confirm-box">
        <div className="vc-confirm-icon vc-confirm-icon--danger">
          <Trash2 size={24} />
        </div>
        <h3>Xóa bỏ?</h3>
        <p>Xóa <strong>&quot;{title}&quot;</strong>. Hành động này không thể hoàn tác.</p>
        <div className="vc-confirm-actions">
          <button className="vc-btn vc-btn--ghost" onClick={onCancel} disabled={loading}>Hủy</button>
          <button className="vc-btn vc-btn--danger" onClick={onConfirm} disabled={loading}>
            {loading ? <Loader2 size={14} className="vc-spin" /> : <Trash2 size={14} />}
            Xóa
          </button>
        </div>
      </div>
    </>
  );
}

/* ─── Script View / Edit Modal ───────────────────────────────────────────── */

function ScriptModal({
  script,
  voices,
  pickedVoiceId,
  onVoiceChange,
  onGenerateAudio,
  generatingAudio,
  audioResultUrl,
  onClose,
  onDelete,
  onSave,
  loadingDelete,
  loadingSave,
}: {
  script: any;
  voices: ClonedVoice[];
  pickedVoiceId: string;
  onVoiceChange: (v: string) => void;
  onGenerateAudio: () => void;
  generatingAudio: boolean;
  audioResultUrl: string | null;
  onClose: () => void;
  onDelete: () => void;
  onSave: (title: string, content: string) => void;
  loadingDelete: boolean;
  loadingSave: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(script.title ?? "");
  const [editContent, setEditContent] = useState(script.contentText ?? script.content ?? "");
  const saveRef = useRef(onSave);

  useEffect(() => { saveRef.current = onSave; }, [onSave]);

  const handleSave = () => {
    onSave(editTitle, editContent);
    setEditing(false);
  };

  const content = script.contentText ?? script.content ?? "";

  return (
    <>
      <div className="vc-overlay" onClick={onClose} />
      <div className="vc-modal vc-modal--wide">
        <div className="vc-modal__header">
          <div className="vc-modal__title-row">
            {editing ? (
              <input
                className="vc-modal__title-input"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                placeholder="Tiêu đề script..."
                maxLength={200}
              />
            ) : (
              <h2 className="vc-modal__title">{getScriptDisplayTitle(script)}</h2>
            )}
            <span className="vc-modal__date">{formatDate(script.createdAt)}</span>
          </div>
          <button className="vc-modal__close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="vc-modal__body">
          {editing ? (
            <textarea
              className="vc-script-editor"
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              rows={18}
              placeholder="Nội dung script..."
            />
          ) : (
            <div className="vc-script-content">
              {(content || "").split("\n").map((line: string, i: number) => (
                <p key={i}>{line || "\u00A0"}</p>
              ))}
            </div>
          )}
        </div>

        {/* Audio result */}
        {audioResultUrl && (
          <div className="vc-modal__audio-result">
            <div className="vc-modal__audio-label">
              <Music size={14} /> Audio đã tạo
            </div>
            <audio controls src={audioResultUrl} className="vc-modal__audio-player" />
          </div>
        )}

        <div className="vc-modal__footer">
          <div className="vc-modal__footer-left">
            <button
              className={`vc-btn vc-btn--ghost vc-btn--sm ${editing ? "vc-btn--active" : ""}`}
              onClick={() => editing ? handleSave() : setEditing(true)}
              disabled={loadingSave}
            >
              {loadingSave ? (
                <Loader2 size={13} className="vc-spin" />
              ) : editing ? (
                <Check size={13} />
              ) : (
                <Pencil size={13} />
              )}
              {editing ? "Lưu" : "Sửa"}
            </button>
            <button
              className="vc-btn vc-btn--ghost vc-btn--sm vc-btn--danger-ghost"
              onClick={onDelete}
              disabled={loadingDelete}
            >
              {loadingDelete ? <Loader2 size={13} className="vc-spin" /> : <Trash2 size={13} />}
              Xóa
            </button>
          </div>

          <div className="vc-modal__footer-right">
            <select
              className="vc-modal__voice-select"
              value={pickedVoiceId}
              onChange={e => onVoiceChange(e.target.value)}
              disabled={generatingAudio}
            >
              <option value="">-- Chọn giọng --</option>
              {voices.map(v => (
                <option key={v.voiceCode} value={v.voiceCode}>{v.displayName}</option>
              ))}
            </select>
            <button
              className="vc-btn vc-btn--primary"
              onClick={onGenerateAudio}
              disabled={generatingAudio || !pickedVoiceId}
            >
              {generatingAudio ? (
                <><Loader2 size={14} className="vc-spin" /> Đang tạo...</>
              ) : (
                <><Music size={14} /> Tạo Audio</>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */

export default function VoiceCloneSection({ onUpgradeClick }: VoiceCloneSectionProps) {
  const [voices, setVoices] = useState<ClonedVoice[]>([]);
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Upload form
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [refText, setRefText] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [gender, setGender] = useState("Unknown");
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);

  const audioRef = useCallback((node: HTMLAudioElement | null) => {
    if (node && audioPreviewUrl) {
      node.src = audioPreviewUrl;
      node.onplay = () => setIsPlaying(true);
      node.onpause = () => setIsPlaying(false);
      node.onended = () => setIsPlaying(false);
    }
  }, [audioPreviewUrl]);

  // Delete voice
  const [deleteTarget, setDeleteTarget] = useState<ClonedVoice | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Script tabs
  const [scriptTab, setScriptTab] = useState<"create" | "mine">("create");
  const [scriptTopic, setScriptTopic] = useState("");
  const [scriptStyle, setScriptStyle] = useState("");
  const [generatingScript, setGeneratingScript] = useState(false);
  const [generatedScript, setGeneratedScript] = useState<string | null>(null);
  const [generatedScriptId, setGeneratedScriptId] = useState<string | null>(null);
  const [generatedScriptTitle, setGeneratedScriptTitle] = useState<string | null>(null);

  // My scripts
  const [myScripts, setMyScripts] = useState<any[]>([]);
  const [loadingScripts, setLoadingScripts] = useState(false);
  const [pickedVoiceId, setPickedVoiceId] = useState("");
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [audioResultUrl, setAudioResultUrl] = useState<string | null>(null);

  // Script modal
  const [viewScript, setViewScript] = useState<any | null>(null);
  const [deletingScript, setDeletingScript] = useState(false);
  const [savingScript, setSavingScript] = useState(false);

  /* ─── Load ─────────────────────────────────────────────────────────────── */

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [voicesData, planData] = await Promise.all([
        voiceCloneService.getMyVoices(),
        voiceCloneService.getMySubscriptionPlan(),
      ]);
      setVoices(voicesData);
      setPlan(planData);
    } catch {
      showToast.error("Không thể tải dữ liệu giọng đọc");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchData(); }, [fetchData]);

  useEffect(() => {
    return () => { if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl); };
  }, [audioPreviewUrl]);

  /* ─── Audio playback ─────────────────────────────────────────────────── */

  const togglePlayPause = () => {
    const audio = document.querySelector("audio") as HTMLAudioElement | null;
    if (!audio || !audioPreviewUrl) return;
    if (isPlaying) audio.pause();
    else audio.play().catch(() => showToast.error("Trình duyệt chặn phát tự động."));
  };

  /* ─── Drag & Drop ───────────────────────────────────────────────────── */

  const applyFile = (file: File) => {
    const err = validateFile(file);
    if (err) { showToast.error(err); return; }
    setAudioFile(file);
    if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    setAudioPreviewUrl(URL.createObjectURL(file));
  };

  /* ─── Voice clone upload ─────────────────────────────────────────────── */

  const validateForm = (): string | null => {
    if (!audioFile) return "Vui lòng chọn file audio mẫu.";
    if (!refText.trim() || refText.trim().length < MIN_REF_TEXT_CHARS)
      return `Nội dung bạn nhập quá ngắn (ít nhất ${MIN_REF_TEXT_CHARS} ký tự).`;
    if (!displayName.trim()) return "Vui lòng nhập tên cho giọng đọc.";
    return null;
  };

  const handleUpload = async () => {
    const err = validateForm();
    if (err) { showToast.error(err); return; }
    setUploading(true);
    const tid = showToast.loading("Đang clone giọng... Vui lòng chờ 10–30 giây.");
    try {
      await voiceCloneService.cloneVoice({
        displayName: displayName.trim(),
        refText: refText.trim(),
        gender,
        audioFile: audioFile!,
      });
      showToast.dismiss(tid);
      showToast.success("Clone giọng thành công!");
      setAudioFile(null);
      if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
      setAudioPreviewUrl(null);
      setRefText(""); setDisplayName(""); setGender("Unknown"); setIsPlaying(false);
      setShowUploadModal(false);
      void fetchData();
    } catch (err: any) {
      showToast.dismiss(tid);
      showToast.error(err?.response?.data?.message ?? err?.message ?? "Clone giọng thất bại.");
    } finally {
      setUploading(false);
    }
  };

  /* ─── Voice delete ───────────────────────────────────────────────────── */

  const myVoices = voices.filter(v => v.model === "custom" || v.model === "custom-cloned");
  const isVoiceCloneEnabled = plan != null && plan.voiceModelLimit > 0;
  const canCreateMoreVoices = !plan || myVoices.length < plan.voiceModelLimit;

  const handleDeleteVoice = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await voiceCloneService.deleteVoice(deleteTarget.voiceCode);
      setVoices(prev => prev.filter(v => v.voiceCode !== deleteTarget.voiceCode));
      setDeleteTarget(null);
      showToast.success("Đã xóa giọng đọc");
    } catch (err: any) {
      showToast.error(err?.response?.data?.message ?? err?.message ?? "Xóa thất bại");
    } finally {
      setDeleting(false);
    }
  };

  /* ─── Script handlers ─────────────────────────────────────────────────── */

  const handleGenerateScript = async () => {
    if (!scriptTopic.trim()) { showToast.error("Vui lòng nhập chủ đề"); return; }
    setGeneratingScript(true);
    const tid = showToast.loading("Đang tạo script...");
    try {
      const result = await podcastService.generateScript({
        topic: scriptTopic.trim(),
        editorInstruction: scriptStyle.trim() || undefined,
      });
      setGeneratedScript(result.scriptText);
      setGeneratedScriptId(result.scriptId);
      setGeneratedScriptTitle(result.title);
      showToast.dismiss(tid);
      showToast.success("Script đã tạo xong!");
    } catch (err: any) {
      showToast.dismiss(tid);
      showToast.error(err?.message ?? "Tạo script thất bại");
    } finally {
      setGeneratingScript(false);
    }
  };

  const handleLoadMyScripts = async () => {
    setLoadingScripts(true);
    try {
      setMyScripts(await podcastService.getMyScripts());
    } catch (err: any) {
      showToast.error(err?.message ?? "Không tải được scripts");
    } finally {
      setLoadingScripts(false);
    }
  };

  const handleDeleteScript = async (script: any) => {
    const id = script.scriptId ?? script.id;
    setDeletingScript(true);
    try {
      await podcastService.deleteScript(id);
      setMyScripts(prev => prev.filter(s => (s.scriptId ?? s.id) !== id));
      setViewScript(null);
      showToast.success("Đã xóa script");
    } catch (err: any) {
      showToast.error(err?.message ?? "Xóa script thất bại");
    } finally {
      setDeletingScript(false);
    }
  };

  const handleSaveScript = async (title: string, content: string) => {
    if (!viewScript) return;
    const id = viewScript.scriptId ?? viewScript.id;
    setSavingScript(true);
    try {
      await podcastService.updateScript(id, { title: title || undefined, contentText: content });
      setMyScripts(prev => prev.map(s =>
        (s.scriptId ?? s.id) === id ? { ...s, title, contentText: content } : s
      ));
      setViewScript({ ...viewScript, title, contentText: content });
      showToast.success("Đã lưu script");
    } catch (err: any) {
      showToast.error(err?.message ?? "Lưu script thất bại");
    } finally {
      setSavingScript(false);
    }
  };

  const handleGenerateAudio = async () => {
    if (!viewScript || !pickedVoiceId) return;
    const id = viewScript.scriptId ?? viewScript.id;
    setGeneratingAudio(true);
    const tid = showToast.loading("Đang tạo audio...");
    try {
      const result = await podcastService.generateAudioFromScript({ scriptId: id, voiceCode: pickedVoiceId });
      setAudioResultUrl(result.audioUrl);
      showToast.dismiss(tid);
      showToast.success("Audio đã tạo xong!");
    } catch (err: any) {
      showToast.dismiss(tid);
      showToast.error(err?.message ?? "Tạo audio thất bại");
    } finally {
      setGeneratingAudio(false);
    }
  };

  /* ─── Render ─────────────────────────────────────────────────────────── */

  if (loading) return (
    <div className="voice-clone-settings">
      <div className="settings-section-header">
        <h1>Voice Clone</h1>
        <p>Tạo giọng đọc AI từ giọng thật của bạn</p>
      </div>
      <div className="vc-center"><Loader2 size={28} className="vc-spin" /><p>Đang tải...</p></div>
    </div>
  );

  return (
    <div className="voice-clone-settings">

      {/* ── Header ── */}
      <div className="settings-section-header">
        <h1>Voice Clone</h1>
        <p>Tạo giọng đọc AI từ giọng thật của bạn để tạo podcast</p>
      </div>

      {!isVoiceCloneEnabled ? (
        <div className="vc-upgrade">
          <div className="vc-upgrade-icon"><Volume2 size={40} /></div>
          <h3>Tính năng Voice Clone</h3>
          <p>Nâng cấp lên <strong>Premium</strong> hoặc <strong>Elite</strong> để tạo giọng đọc AI từ chính giọng nói của bạn.</p>
          {onUpgradeClick && <button className="vc-btn vc-btn--primary" onClick={onUpgradeClick}>Nâng cấp ngay</button>}
        </div>
      ) : (
        <>

          {/* ── Voice section ── */}
          <div className="vc-section">
            <div className="vc-section__head">
              <h2 className="vc-section__title"><Mic size={16} /> Giọng đọc của tôi</h2>
              <span className="vc-section__badge">{myVoices.length} / {plan?.voiceModelLimit ?? 0}</span>
            </div>

            <div className="vc-tip">
              <Info size={14} />
              <span><strong>Cách clone đúng:</strong> Upload audio tiếng Việt cực ngắn <strong>(3–6 giây)</strong> không có tạp âm → Nhập <strong>CHÍNH XÁC 100%</strong> từng từ bạn đọc vào refText. Text phải khớp y hệt audio (kể cả tiếng "à", "ừm") thì AI mới clone thành công.</span>
            </div>

            {myVoices.length === 0 ? (
              <div className="vc-empty">
                <Mic size={36} />
                <p>Chưa có giọng đọc nào</p>
              </div>
            ) : (
              <div className="vc-card-list">
                {myVoices.map(voice => (
                  <div key={voice.id} className="vc-card">
                    <div className="vc-card__body">
                      <div className="vc-card__name">{voice.displayName}</div>
                      <div className="vc-card__meta">
                        <span className={`vc-tag vc-tag--${voice.gender?.toLowerCase() ?? "unk"}`}>{voice.gender ?? "Không rõ"}</span>
                        <span className="vc-card__date">{formatDate(voice.createdAt)}</span>
                      </div>
                    </div>
                    <button className="vc-icon-btn vc-icon-btn--danger" onClick={() => setDeleteTarget(voice)} title="Xóa giọng">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {canCreateMoreVoices && (
              <button className="vc-btn vc-btn--gradient" onClick={() => setShowUploadModal(true)}>
                <Mic size={16} /> Tạo giọng đọc mới
              </button>
            )}
          </div>

          {/* ── Script section ── */}
          <div className="vc-section">
            <div className="vc-section__head">
              <h2 className="vc-section__title"><FileText size={16} /> Script & Audio</h2>
            </div>

            <div className="vc-tabs">
              <button className={`vc-tab ${scriptTab === "create" ? "vc-tab--active" : ""}`} onClick={() => setScriptTab("create")}>
                <Wand2 size={14} /> Tạo Script
              </button>
              <button className={`vc-tab ${scriptTab === "mine" ? "vc-tab--active" : ""}`} onClick={() => { setScriptTab("mine"); void handleLoadMyScripts(); }}>
                <FileText size={14} /> Script của tôi
              </button>
            </div>

            {/* ── Tab: Create ── */}
            {scriptTab === "create" && (
              <div className="vc-tab-pane">
                <div className="vc-field">
                  <label className="vc-label">Chủ đề</label>
                  <input
                    className="vc-input"
                    value={scriptTopic}
                    onChange={e => setScriptTopic(e.target.value)}
                    placeholder="VD: Xu hướng công nghệ 2026, Câu chuyện khởi nghiệp..."
                    disabled={generatingScript}
                    maxLength={500}
                  />
                </div>
                <div className="vc-field">
                  <label className="vc-label">Phong cách <span className="vc-label-opt">(tùy chọn)</span></label>
                  <input
                    className="vc-input"
                    value={scriptStyle}
                    onChange={e => setScriptStyle(e.target.value)}
                    placeholder="VD: Chuyên sâu, đối thoại, tin tức..."
                    disabled={generatingScript}
                    maxLength={200}
                  />
                </div>
                <button
                  className="vc-btn vc-btn--gradient"
                  onClick={() => void handleGenerateScript()}
                  disabled={generatingScript || !scriptTopic.trim()}
                >
                  {generatingScript ? <><Loader2 size={16} className="vc-spin" /> Đang tạo...</> : <><Wand2 size={16} /> Tạo Script</>}
                </button>

                {generatedScript && (
                  <div className="vc-result-card">
                    <div className="vc-result-card__header">
                      <strong>{generatedScriptTitle ?? "Script mới"}</strong>
                      <button className="vc-btn vc-btn--ghost vc-btn--sm" onClick={() => setScriptTab("mine")}>
                        <FileText size={13} /> Xem trong Script của tôi
                      </button>
                    </div>
                    <div className="vc-result-card__body">
                      {generatedScript.split("\n").map((line, i) => (
                        <p key={i}>{line || "\u00A0"}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Tab: Mine ── */}
            {scriptTab === "mine" && (
              <div className="vc-tab-pane">
                {voices.length > 0 && (
                  <div className="vc-field">
                    <label className="vc-label">Giọng đọc</label>
                    <select className="vc-select" value={pickedVoiceId} onChange={e => setPickedVoiceId(e.target.value)}>
                      <option value="">-- Chọn giọng --</option>
                      {voices.map(v => <option key={v.voiceCode} value={v.voiceCode}>{v.displayName}</option>)}
                    </select>
                  </div>
                )}

                {loadingScripts ? (
                  <div className="vc-center"><Loader2 size={20} className="vc-spin" /><p>Đang tải...</p></div>
                ) : myScripts.length === 0 ? (
                  <div className="vc-empty">
                    <FileText size={32} />
                    <p>Chưa có script nào. Vào tab &quot;Tạo Script&quot; để tạo.</p>
                  </div>
                ) : (
                  <div className="vc-card-list">
                    {myScripts.map(script => {
                      const sid = script.scriptId ?? script.id;
                      const content = script.contentText ?? script.content ?? "";
                      return (
                        <div key={sid} className="vc-card vc-card--script">
                          <div className="vc-card__body">
                            <div className="vc-card__name">{getScriptDisplayTitle(script)}</div>
                            <p className="vc-card__excerpt">{content.slice(0, 100)}{content.length > 100 ? "..." : ""}</p>
                            <span className="vc-card__date">{formatDate(script.createdAt)}</span>
                          </div>
                          <div className="vc-card__actions">
                            <button className="vc-btn vc-btn--ghost vc-btn--sm" onClick={() => setViewScript({ ...script, sid })}>
                              <FileText size={13} /> Xem
                            </button>
                            <button
                              className="vc-btn vc-btn--primary vc-btn--sm"
                              disabled={!pickedVoiceId}
                              onClick={() => setViewScript({ ...script, sid })}
                              title={!pickedVoiceId ? "Chọn giọng trước" : "Tạo audio"}
                            >
                              <Music size={13} /> Audio
                            </button>
                            <button className="vc-icon-btn vc-icon-btn--danger" onClick={() => handleDeleteScript({ ...script, sid })}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {audioResultUrl && (
                  <div className="vc-result-card">
                    <div className="vc-result-card__header">
                      <Music size={14} /> Audio đã tạo
                    </div>
                    <audio controls src={audioResultUrl} className="vc-audio-player" />
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Script Modal ── */}
      {viewScript && (
        <ScriptModal
          script={viewScript}
          voices={voices}
          pickedVoiceId={pickedVoiceId}
          onVoiceChange={setPickedVoiceId}
          onGenerateAudio={handleGenerateAudio}
          generatingAudio={generatingAudio}
          audioResultUrl={audioResultUrl}
          onClose={() => setViewScript(null)}
          onDelete={() => handleDeleteScript(viewScript)}
          onSave={handleSaveScript}
          loadingDelete={deletingScript}
          loadingSave={savingScript}
        />
      )}

      {/* ── Voice Clone Modal ── */}
      {showUploadModal && (
        <>
          <div className="vc-overlay" onClick={() => !uploading && setShowUploadModal(false)} />
          <div className="vc-modal">
            <div className="vc-modal__header">
              <h2 className="vc-modal__title"><Mic size={18} /> Tạo giọng đọc AI</h2>
              {!uploading && (
                <button className="vc-modal__close" onClick={() => setShowUploadModal(false)}><X size={18} /></button>
              )}
            </div>

            <div className="vc-modal__body">
              <div className="vc-step">
                <div className="vc-step__num">1</div>
                <div className="vc-step__content">
                  <label className="vc-label">Upload audio thu âm cực ngắn (3–6 giây)</label>
                  <div
                    className={`vc-dropzone ${dragActive ? "vc-dropzone--active" : ""} ${audioFile ? "vc-dropzone--ok" : ""}`}
                    onDragEnter={e => { e.preventDefault(); setDragActive(true); }}
                    onDragLeave={e => { e.preventDefault(); setDragActive(false); }}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files?.[0]) applyFile(e.dataTransfer.files[0]); }}
                    onClick={() => !uploading && document.getElementById("vc-file-input")?.click()}
                  >
                    <input id="vc-file-input" type="file" accept=".wav,.mp3,.m4a,.flac,.ogg,audio/*" onChange={e => { if (e.target.files?.[0]) applyFile(e.target.files[0]); }} hidden />
                    {audioFile ? (
                      <div className="vc-file-row">
                        <div className="vc-file-icon"><Waves size={18} /></div>
                        <div>
                          <div className="vc-file-name">{audioFile.name}</div>
                          <div className="vc-file-size">{formatFileSize(audioFile.size)}</div>
                        </div>
                        <audio ref={audioRef} onEnded={() => setIsPlaying(false)} onError={() => { setIsPlaying(false); showToast.error("Không thể phát file này"); }} />
                        <button className={`vc-play-btn ${isPlaying ? "vc-play-btn--playing" : ""}`} onClick={e => { e.stopPropagation(); togglePlayPause(); }} disabled={uploading}>
                          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                        </button>
                      </div>
                    ) : (
                      <div className="vc-dropzone__inner">
                        <Upload size={28} />
                        <p>Kéo thả file audio hoặc click để chọn</p>
                        <span>WAV, MP3, M4A, FLAC, OGG · Tối đa {MAX_FILE_SIZE_MB}MB</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="vc-step">
                <div className="vc-step__num">2</div>
                <div className="vc-step__content">
                  <label className="vc-label">Gõ lại nội dung bạn đã nói trong Audio</label>
                  <textarea
                    className="vc-textarea"
                    value={refText}
                    onChange={e => setRefText(e.target.value)}
                    placeholder="VD: Xin chào, tôi đang thử nghiệm AI..."
                    rows={4}
                    disabled={uploading}
                    maxLength={1000}
                  />
                  <div className="vc-alert vc-alert--warn">
                    <Info size={14} />
                    <span>Nhập <strong>CHÍNH XÁC TỪNG CHỮ</strong> nội dung bạn đọc trong audio kể trên. Dư hoặc thiếu chữ so với audio sẽ làm AI không hiểu và sinh ra giọng bị rè hoặc tự bịa ra chữ.</span>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="vc-step">
                <div className="vc-step__num">3</div>
                <div className="vc-step__content">
                  <label className="vc-label">Tên giọng đọc</label>
                  <input
                    className="vc-input"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="VD: Giọng MC Báo, Giọng Bác sĩ..."
                    maxLength={100}
                    disabled={uploading}
                  />
                </div>
              </div>

              {/* Step 4 */}
              <div className="vc-step">
                <div className="vc-step__num">4</div>
                <div className="vc-step__content">
                  <label className="vc-label">Giới tính</label>
                  <div className="vc-gender-row">
                    {(["Male", "Female", "Unknown"] as const).map(g => (
                      <button
                        key={g}
                        type="button"
                        className={`vc-gender-btn ${gender === g ? "vc-gender-btn--active" : ""}`}
                        onClick={() => setGender(g)}
                        disabled={uploading}
                      >
                        {g === "Male" ? "Nam" : g === "Female" ? "Nữ" : "Không rõ"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="vc-modal__footer">
              <button className="vc-btn vc-btn--ghost" onClick={() => setShowUploadModal(false)} disabled={uploading}>Hủy</button>
              <button
                className="vc-btn vc-btn--gradient"
                onClick={() => void handleUpload()}
                disabled={uploading || !audioFile || refText.trim().length < MIN_REF_TEXT_CHARS || !displayName.trim()}
              >
                {uploading ? <><Loader2 size={16} className="vc-spin" /> Đang clone...</> : <><Mic size={16} /> Clone giọng</>}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Delete voice confirm ── */}
      {deleteTarget && (
        <DeleteConfirmModal
          title={deleteTarget.displayName}
          onConfirm={() => void handleDeleteVoice()}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
