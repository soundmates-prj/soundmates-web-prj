import { useRef, useState } from "react";
import { Mic, X, Upload, Loader2 } from "lucide-react";

interface AudioUploaderProps {
  preview: string | null;
  onChange: (url: string | null) => void;
}

const MAX_MB = 20;
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string;

async function uploadToCloudinary(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", UPLOAD_PRESET);
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`, // Cloudinary dùng /video cho audio
    { method: "POST", body: fd },
  );
  if (!res.ok) throw new Error("Cloudinary upload failed");
  const data = await res.json();
  return data.secure_url as string;
}

export default function AudioUploader({
  preview,
  onChange,
}: AudioUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [err, setErr] = useState("");

  const processFile = async (file: File) => {
    setErr("");
    const isAudio = file.type.startsWith("audio/");
    if (!isAudio) {
      setErr("Chỉ hỗ trợ MP3, WAV, OGG, AAC, M4A.");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setErr(`Audio tối đa ${MAX_MB}MB.`);
      return;
    }
    setFileName(file.name);
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      onChange(url);
    } catch {
      setErr("Upload thất bại, thử lại nhé.");
      setFileName("");
    } finally {
      setUploading(false);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleRemove = () => {
    onChange(null);
    setFileName("");
    setErr("");
  };

  return (
    <div className="audio-uploader">
      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        style={{ display: "none" }}
        onChange={handleInput}
      />

      {preview ? (
        <div className="audio-uploader-preview">
          <div className="audio-uploader-info">
            <div className="audio-uploader-icon-wrap">
              {uploading ? (
                <Loader2 size={16} className="spin" />
              ) : (
                <Mic size={16} />
              )}
            </div>
            <div className="audio-uploader-meta">
              <span className="audio-uploader-name">
                {fileName || "Audio đã tải lên"}
              </span>
              <audio controls src={preview} className="audio-uploader-player" />
            </div>
          </div>
          <div className="audio-uploader-actions">
            <button
              className="audio-uploader-change-btn"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              <Upload size={11} /> Đổi file
            </button>
            <button
              className="audio-uploader-remove-btn"
              onClick={handleRemove}
              aria-label="Xoá audio"
              disabled={uploading}
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`audio-uploader-zone ${dragging ? "dragging" : ""} ${uploading ? "loading" : ""}`}
          onClick={() => !uploading && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          {uploading ? (
            <>
              <Loader2 size={18} className="audio-uploader-zone-icon spin" />
              <p className="audio-uploader-hint">Đang tải lên Cloudinary...</p>
            </>
          ) : (
            <>
              <Mic size={18} className="audio-uploader-zone-icon" />
              <p className="audio-uploader-hint">
                Kéo thả hoặc <span>chọn file âm thanh</span>
              </p>
              <p className="audio-uploader-sub">
                MP3, WAV, OGG, AAC · tối đa {MAX_MB}MB
              </p>
            </>
          )}
        </div>
      )}
      {err && <p className="audio-uploader-err">{err}</p>}
    </div>
  );
}
