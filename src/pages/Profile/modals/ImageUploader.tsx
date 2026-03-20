import { useRef, useState } from "react";
import { ImagePlus, X, Upload, Loader2 } from "lucide-react";

interface ImageUploaderProps {
  preview: string | null;
  onChange: (url: string | null) => void;
}

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_MB = 10;

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string;

async function uploadToCloudinary(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", UPLOAD_PRESET);
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: fd },
  );
  if (!res.ok) throw new Error("Cloudinary upload failed");
  const data = await res.json();
  return data.secure_url as string;
}

export default function ImageUploader({
  preview,
  onChange,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");

  const processFile = async (file: File) => {
    setErr("");
    if (!ACCEPTED.includes(file.type)) {
      setErr("Chỉ hỗ trợ JPG, PNG, WEBP, GIF.");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setErr(`Ảnh tối đa ${MAX_MB}MB.`);
      return;
    }
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      onChange(url);
    } catch {
      setErr("Upload thất bại, thử lại nhé.");
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

  return (
    <div className="img-uploader">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        style={{ display: "none" }}
        onChange={handleInput}
      />

      {preview ? (
        <div className="img-uploader-preview">
          <img src={preview} alt="preview" />
          <button
            className="img-uploader-remove"
            onClick={() => onChange(null)}
            aria-label="Xoá ảnh"
          >
            <X size={14} />
          </button>
          <button
            className="img-uploader-change"
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 size={12} className="spin" />
            ) : (
              <Upload size={12} />
            )}
            Đổi ảnh
          </button>
        </div>
      ) : (
        <div
          className={`img-uploader-zone ${dragging ? "dragging" : ""} ${uploading ? "loading" : ""}`}
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
              <Loader2 size={22} className="img-uploader-icon spin" />
              <p className="img-uploader-hint">Đang tải lên Cloudinary...</p>
            </>
          ) : (
            <>
              <ImagePlus size={22} className="img-uploader-icon" />
              <p className="img-uploader-hint">
                Kéo thả hoặc <span>chọn ảnh từ máy tính</span>
              </p>
              <p className="img-uploader-sub">
                JPG, PNG, WEBP, GIF · tối đa {MAX_MB}MB
              </p>
            </>
          )}
        </div>
      )}
      {err && <p className="img-uploader-err">{err}</p>}
    </div>
  );
}
