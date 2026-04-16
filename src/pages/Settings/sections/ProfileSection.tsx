import React, { useState, useRef, useEffect, useCallback } from "react";
import { showWarning } from "../../../components/common/toastUtils";
import {
  Calendar,
  Camera,
  ChevronDown,
  Phone,
  VenusAndMars,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Check,
  X as XIcon,
  ImagePlus,
  ShieldCheck,
} from "lucide-react";

import api from "../../../services/axios";
import { showSuccess, showError } from "../../../components/common/toastUtils";
import type { User } from "../../../types/user";
import { validateImageUrl } from "../../../utils/stringUtils";

import "./ProfileSection.css";

/* ─────────── Cloudinary Upload ─────────── */
const uploadToCloudinary = async (file: File): Promise<string> => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", uploadPreset);
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: fd },
  );
  if (!res.ok) throw new Error("Upload ảnh thất bại");
  const data = await res.json();
  return data.secure_url as string;
};

/* ─────────── Validation helpers (BR / EF rules) ─────────── */
const MAX_NAME_LENGTH = 50;
const MAX_BIO_LENGTH = 200;
const MAX_PHONE_DIGITS = 10;
const isValidVietnamPhone = (phone: string): boolean =>
  /^(03|05|07|08|09)[0-9]{8}$/.test(phone);

/* ─────────── Crop Modal ─────────── */
interface CropModalProps {
  src: string;
  aspect: number; // 1 for avatar, 16/5 for banner
  title: string;
  onDone: (croppedDataUrl: string, croppedFile: File) => void;
  onClose: () => void;
}

const CropModal: React.FC<CropModalProps> = ({
  src,
  aspect,
  title,
  onDone,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imgNaturalSize, setImgNaturalSize] = useState({ w: 0, h: 0 });
  const [ready, setReady] = useState(false);

  // Canvas display size (preview)
  const CANVAS_W = aspect >= 2 ? 560 : 320;
  const CANVAS_H = Math.round(CANVAS_W / aspect);

  // Draw preview
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const img = imageRef.current;
    if (!canvas || !ctx || !img || !ready) return;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Dark overlay outside crop
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Scaled image size
    const scaledW = imgNaturalSize.w * scale;
    const scaledH = imgNaturalSize.h * scale;

    // Clamp offset so image always covers canvas
    const minX = Math.min(0, CANVAS_W - scaledW);
    const minY = Math.min(0, CANVAS_H - scaledH);
    const clampedX = Math.max(minX, Math.min(0, offset.x));
    const clampedY = Math.max(minY, Math.min(0, offset.y));

    // Draw image (full, under the overlay)
    ctx.globalCompositeOperation = "destination-over";
    ctx.drawImage(img, clampedX, clampedY, scaledW, scaledH);
    ctx.globalCompositeOperation = "source-over";

    // Clear the crop area (show image clearly)
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.drawImage(img, clampedX, clampedY, scaledW, scaledH);

    // Draw semi-transparent overlay outside "crop" area (full canvas is the crop)
    // Border/guide
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, CANVAS_W - 2, CANVAS_H - 2);

    // Rule of thirds grid
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 1;
    for (let i = 1; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo((CANVAS_W / 3) * i, 0);
      ctx.lineTo((CANVAS_W / 3) * i, CANVAS_H);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, (CANVAS_H / 3) * i);
      ctx.lineTo(CANVAS_W, (CANVAS_H / 3) * i);
      ctx.stroke();
    }
  }, [scale, offset, imgNaturalSize, ready, CANVAS_W, CANVAS_H]);

  useEffect(() => {
    draw();
  }, [draw]);

  const handleImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImgNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
    // Initial scale: fit height to canvas
    const initScale = Math.max(
      CANVAS_W / img.naturalWidth,
      CANVAS_H / img.naturalHeight,
    );
    setScale(initScale);
    setOffset({ x: 0, y: 0 });
    setReady(true);
  };

  const onMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    const scaledW = imgNaturalSize.w * scale;
    const scaledH = imgNaturalSize.h * scale;
    const minX = Math.min(0, CANVAS_W - scaledW);
    const minY = Math.min(0, CANVAS_H - scaledH);
    setOffset({
      x: Math.max(minX, Math.min(0, e.clientX - dragStart.x)),
      y: Math.max(minY, Math.min(0, e.clientY - dragStart.y)),
    });
  };
  const onMouseUp = () => setDragging(false);

  // Touch support
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    setDragging(true);
    setDragStart({ x: t.clientX - offset.x, y: t.clientY - offset.y });
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragging) return;
    const t = e.touches[0];
    const scaledW = imgNaturalSize.w * scale;
    const scaledH = imgNaturalSize.h * scale;
    const minX = Math.min(0, CANVAS_W - scaledW);
    const minY = Math.min(0, CANVAS_H - scaledH);
    setOffset({
      x: Math.max(minX, Math.min(0, t.clientX - dragStart.x)),
      y: Math.max(minY, Math.min(0, t.clientY - dragStart.y)),
    });
  };

  const handleZoom = (delta: number) => {
    setScale((prev) => {
      const minScale = Math.max(
        CANVAS_W / imgNaturalSize.w,
        CANVAS_H / imgNaturalSize.h,
      );
      return Math.max(minScale, Math.min(4, prev + delta));
    });
  };

  const handleReset = () => {
    const minScale = Math.max(
      CANVAS_W / imgNaturalSize.w,
      CANVAS_H / imgNaturalSize.h,
    );
    setScale(minScale);
    setOffset({ x: 0, y: 0 });
  };

  // Export cropped image
  const handleCrop = () => {
    const img = imageRef.current;
    if (!img) return;

    // Output resolution
    const outW = aspect >= 2 ? 1400 : 600;
    const outH = Math.round(outW / aspect);

    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = outW;
    exportCanvas.height = outH;
    const ctx = exportCanvas.getContext("2d")!;

    const scaledW = imgNaturalSize.w * scale;
    const scaledH = imgNaturalSize.h * scale;
    const clampedX = Math.max(
      Math.min(0, CANVAS_W - scaledW),
      Math.min(0, offset.x),
    );
    const clampedY = Math.max(
      Math.min(0, CANVAS_H - scaledH),
      Math.min(0, offset.y),
    );

    // Scale up to output resolution
    const ratio = outW / CANVAS_W;
    ctx.drawImage(
      img,
      clampedX * ratio,
      clampedY * ratio,
      scaledW * ratio,
      scaledH * ratio,
    );

    exportCanvas.toBlob(
      (blob) => {
        if (!blob) return;
        const dataUrl = exportCanvas.toDataURL("image/jpeg", 0.92);
        const file = new File([blob], "cropped.jpg", { type: "image/jpeg" });
        onDone(dataUrl, file);
      },
      "image/jpeg",
      0.92,
    );
  };

  return (
    <div className="crop-overlay" onClick={onClose}>
      <div className="crop-modal" onClick={(e) => e.stopPropagation()}>
        <div className="crop-modal-header">
          <span>{title}</span>
          <button className="crop-close" onClick={onClose}>
            <XIcon size={18} />
          </button>
        </div>

        {/* Hidden img for natural size */}
        <img
          ref={imageRef}
          src={src}
          style={{ display: "none" }}
          onLoad={handleImgLoad}
          crossOrigin="anonymous"
        />

        <div
          ref={containerRef}
          className="crop-canvas-wrap"
          style={{ cursor: dragging ? "grabbing" : "grab" }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onMouseUp}
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            className="crop-canvas"
          />
        </div>

        <p className="crop-hint">
          Kéo để di chuyển • Dùng thanh zoom để phóng to/thu nhỏ
        </p>

        <div className="crop-controls">
          <div className="crop-zoom-row">
            <button className="crop-ctrl-btn" onClick={() => handleZoom(-0.1)}>
              <ZoomOut size={16} />
            </button>
            <input
              type="range"
              min={0.1}
              max={4}
              step={0.05}
              value={scale}
              className="crop-zoom-slider"
              onChange={(e) => setScale(Number(e.target.value))}
            />
            <button className="crop-ctrl-btn" onClick={() => handleZoom(0.1)}>
              <ZoomIn size={16} />
            </button>
            <button
              className="crop-ctrl-btn"
              onClick={handleReset}
              title="Reset"
            >
              <RotateCcw size={15} />
            </button>
          </div>

          <div className="crop-actions">
            <button className="crop-btn-cancel" onClick={onClose}>
              Hủy
            </button>
            <button className="crop-btn-apply" onClick={handleCrop}>
              <Check size={15} /> Áp dụng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   ProfileSection Component
───────────────────────────────────────────── */
const defaultAv = "https://ui-avatars.com/api/?name=User&background=55C5F1&color=fff";
const defaultCover = "https://images.unsplash.com/photo-1511376777868-611b54f68947?w=1200&q=80";

const ProfileSection: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [form, setForm] = useState<Partial<User>>({});

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [backgroundPreview, setBackgroundPreview] = useState<string | null>(
    null,
  );

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);

  // ── Field-level error messages ──
  const [firstNameError, setFirstNameError] = useState<string>("");
  const [lastNameError, setLastNameError] = useState<string>("");
  const [phoneError, setPhoneError] = useState<string>("");
  const [dobError, setDobError] = useState<string>("");
  const [bioError, setBioError] = useState<string>("");

  // Anti-spam: track last save timestamp
  const lastSaveRef = useRef<number>(0);
  const SAVE_COOLDOWN_MS = 3000;

  // Crop modal state
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropType, setCropType] = useState<"avatar" | "background" | null>(
    null,
  );

  const avatarInput = useRef<HTMLInputElement>(null);
  const backgroundInput = useRef<HTMLInputElement>(null);

  /* ── Load profile ── */
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/users/me/profile/full");
        const data: User = res.data.data;
        setUser(data);
        setForm({
          firstName: data.firstName,
          lastName: data.lastName,
          bio: data.bio || "",
          phone: data.phone || "",
          gender: data.gender || "",
          dateOfBirth: data.dateOfBirth ? data.dateOfBirth.slice(0, 10) : "",
        });
        const cleanProfile = validateImageUrl(data.profileImageUrl);
        if (cleanProfile) setAvatarPreview(cleanProfile);
        const cleanBg = validateImageUrl(data.backgroundImageUrl);
        if (cleanBg) setBackgroundPreview(cleanBg);
      } catch (error) {
        console.error("Load profile failed", error);
      }
    };
    fetchProfile();
  }, []);

  /* ── Check if form has unsaved changes ── */
  const hasChanges = (): boolean => {
    if (!user) return false;
    return (
      form.firstName !== user.firstName ||
      form.lastName !== user.lastName ||
      form.bio !== (user.bio || "") ||
      form.phone !== (user.phone || "") ||
      form.gender !== (user.gender || "") ||
      form.dateOfBirth !==
      (user.dateOfBirth ? user.dateOfBirth.slice(0, 10) : "") ||
      avatarFile !== null ||
      backgroundFile !== null
    );
  };

  /* ── Handle input ── */
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;

    // ── EF-01 + BR-01: Họ (lastName) required, 1–50 chars ──
  if (name === "lastName") {
    if (value === "")
      setLastNameError("Họ không được để trống!");
    else if (value.length > MAX_NAME_LENGTH)
      setLastNameError(`Họ không được quá ${MAX_NAME_LENGTH} ký tự!`);
    else
      setLastNameError("");
  }

  // ── EF-01 + BR-01: Tên (firstName) required, 1–50 chars ──
  if (name === "firstName") {
    if (value === "")
      setFirstNameError("Tên không được để trống!");
    else if (value.length > MAX_NAME_LENGTH)
      setFirstNameError(`Tên không được quá ${MAX_NAME_LENGTH} ký tự!`);
    else
      setFirstNameError("");
  }

    // ── EF-02 + EF-03 + BR-03: Phone — non-numeric, >10 digits ──
    if (name === "phone") {
      if (value === "") setPhoneError("");
      else if (!/^[0-9]*$/.test(value))
        setPhoneError("Vui lòng nhập số!");                          // EF-02
      else if (value.length > MAX_PHONE_DIGITS)
        setPhoneError("Số điện thoại không quá 10 số!");             // EF-03
      else if (value.length === MAX_PHONE_DIGITS && !isValidVietnamPhone(value))
        setPhoneError("Số điện thoại không hợp lệ (VD: 0912345678)");
      else setPhoneError("");
    }

    // ── Bio character limit (Usability + BR-02) ──
    if (name === "bio") {
      if (value.length > MAX_BIO_LENGTH)
        setBioError(`Tiểu sử không được quá ${MAX_BIO_LENGTH} ký tự!`);
      else setBioError("");
    }

    // ── EF-04: Date of birth cannot be in the future ──
    if (name === "dateOfBirth") {
      if (!value) {
        setDobError(""); // optional field
      } else {
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        const selected = new Date(value);
        if (selected > today) {
          setDobError("Không được nhập năm tương lai!");
        } else {
          setDobError("");
        }
      }
    }

    setForm({ ...form, [name]: value });
  };

  /* ── File → Crop modal ── */
  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCropSrc(reader.result as string);
      setCropType("avatar");
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const handleBgFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCropSrc(reader.result as string);
      setCropType("background");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  /* ── Crop done ── */
  const handleCropDone = (dataUrl: string, file: File) => {
    if (cropType === "avatar") {
      setAvatarPreview(dataUrl);
      setAvatarFile(file);
    } else {
      setBackgroundPreview(dataUrl);
      setBackgroundFile(file);
    }
    setCropSrc(null);
    setCropType(null);
  };

  /* ── Centralised pre-save validation ── */
  const validateAll = (): boolean => {
    let valid = true;

    // EF-01: required fields
    if (!form.firstName?.trim()) {
      setFirstNameError("Họ không được để trống!");
      valid = false;
    } else if (form.firstName.length > MAX_NAME_LENGTH) {
      setFirstNameError(`Họ không được quá ${MAX_NAME_LENGTH} ký tự!`);
      valid = false;
    }

    if (!form.lastName?.trim()) {
      setLastNameError("Tên không được để trống!");
      valid = false;
    } else if (form.lastName.length > MAX_NAME_LENGTH) {
      setLastNameError(`Tên không được quá ${MAX_NAME_LENGTH} ký tự!`);
      valid = false;
    }

    // EF-02 / EF-03: phone format + length
    if (form.phone) {
      if (!/^[0-9]+$/.test(form.phone)) {
        setPhoneError("Vui lòng nhập số!");
        valid = false;
      } else if (form.phone.length > MAX_PHONE_DIGITS) {
        setPhoneError("Số điện thoại không quá 10 số!");
        valid = false;
      } else if (form.phone.length === MAX_PHONE_DIGITS && !isValidVietnamPhone(form.phone)) {
        setPhoneError("Số điện thoại không hợp lệ (VD: 0912345678)");
        valid = false;
      }
    }

    // EF-04: future date of birth
    if (form.dateOfBirth) {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (new Date(form.dateOfBirth) > today) {
        setDobError("Không được nhập năm tương lai!");
        valid = false;
      }
    }

    // Bio length
    if (form.bio && form.bio.length > MAX_BIO_LENGTH) {
      setBioError(`Tiểu sử không được quá ${MAX_BIO_LENGTH} ký tự!`);
      valid = false;
    }

    return valid;
  };

  /* ── Save ── */
  const handleSave = async () => {
    // Anti-spam guard
    const now = Date.now();
    if (now - lastSaveRef.current < SAVE_COOLDOWN_MS) {
      const remaining = Math.ceil((SAVE_COOLDOWN_MS - (now - lastSaveRef.current)) / 1000);
      showWarning("Vui lòng chờ", `Bạn vừa lưu xong. Vui lòng chờ ${remaining}s trước khi lưu tiếp.`);
      return;
    }
    if (!validateAll()) return;
    try {
      setLoading(true);
      let profileImageUrl: string | undefined =
        user?.profileImageUrl ?? undefined;
      let backgroundImageUrl: string | undefined =
        user?.backgroundImageUrl ?? undefined;
      if (avatarFile) profileImageUrl = await uploadToCloudinary(avatarFile);
      if (backgroundFile)
        backgroundImageUrl = await uploadToCloudinary(backgroundFile);
      const cleanProfileImageUrl = validateImageUrl(profileImageUrl);
      const cleanBackgroundImageUrl = validateImageUrl(backgroundImageUrl);
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        bio: form.bio || null,
        phone: form.phone || null,
        gender: form.gender
          ? form.gender.charAt(0).toUpperCase() +
          form.gender.slice(1).toLowerCase()
          : null,
        dateOfBirth: form.dateOfBirth
          ? new Date(form.dateOfBirth).toISOString()
          : null,
        profileImageUrl: cleanProfileImageUrl || null,
        backgroundImageUrl: cleanBackgroundImageUrl || null,
      };
      await api.put("/auth/profile", payload);
      lastSaveRef.current = Date.now(); // Mark save timestamp after success
      showSuccess("Đã lưu", "Thông tin hồ sơ đã được cập nhật!");
      const res = await api.get("/users/me/profile/full");
      const updatedUser = res.data.data;
      setUser(updatedUser);
      const storedUserInfo = localStorage.getItem("userInfo");
      if (storedUserInfo) {
        const userInfo = JSON.parse(storedUserInfo);
        // Sync all core display fields to localStorage
        userInfo.firstName = updatedUser.firstName;
        userInfo.lastName = updatedUser.lastName;
        userInfo.username = updatedUser.username;
        userInfo.email = updatedUser.email;
        userInfo.avatarUrl = updatedUser.profileImageUrl;

        localStorage.setItem("userInfo", JSON.stringify(userInfo));
        window.dispatchEvent(new Event("authChange"));
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || error.message || "Có lỗi xảy ra";
      showError("Lỗi", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /* ── Cancel ── */
  const handleCancel = () => {
    if (!user) return;
    setForm({
      firstName: user.firstName,
      lastName: user.lastName,
      bio: user.bio || "",
      phone: user.phone || "",
      gender: user.gender || "",
      dateOfBirth: user.dateOfBirth ? user.dateOfBirth.slice(0, 10) : "",
    });
    setPhoneError("");
    setFirstNameError("");
    setLastNameError("");
    setDobError("");
    setBioError("");
    setAvatarFile(null);
    setBackgroundFile(null);
    setAvatarPreview(validateImageUrl(user.profileImageUrl));
    setBackgroundPreview(validateImageUrl(user.backgroundImageUrl));
  };

  if (!user) return <div className="profile-loading">Đang tải...</div>;

  return (
    <>
      {/* ── Crop Modal ── */}
      {cropSrc && cropType && (
        <CropModal
          src={cropSrc}
          aspect={cropType === "avatar" ? 1 : 16 / 5}
          title={cropType === "avatar" ? "Cắt ảnh đại diện" : "Cắt ảnh bìa"}
          onDone={handleCropDone}
          onClose={() => {
            setCropSrc(null);
            setCropType(null);
          }}
        />
      )}

      <div className="profile-page">
        <div className="profile-card">
          {/* ── BANNER ── */}
          <div
            className="profile-banner"
            style={{
              backgroundImage: backgroundPreview
                ? `url(${backgroundPreview})`
                : `url(${defaultCover})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {!backgroundPreview && (
              <div className="banner-empty-hint">
                <ImagePlus size={22} />
                <span>Thêm ảnh bìa</span>
              </div>
            )}

            <button
              className="banner-upload"
              onClick={() => backgroundInput.current?.click()}
            >
              <Camera size={13} />
              {backgroundPreview ? "Đổi ảnh bìa" : "Thêm ảnh bìa"}
            </button>

            <input
              ref={backgroundInput}
              type="file"
              accept="image/*"
              hidden
              onChange={handleBgFile}
            />

            <div className="avatar-wrapper">
              <img
                src={
                  avatarPreview || defaultAv
                }
                className="avatar"
                alt="Profile avatar"
              />
              <button
                className="avatar-edit"
                onClick={() => avatarInput.current?.click()}
                title="Đổi ảnh đại diện"
              >
                <Camera size={13} />
              </button>
              <input
                ref={avatarInput}
                type="file"
                accept="image/*"
                hidden
                onChange={handleAvatarFile}
              />
            </div>
          </div>

          {/* ── FORM ── */}
          <div className="profile-form">
            <div className="form-grid">
              {/* EF-01 + BR-01: Họ (firstName) required, 1–50 chars */}
              <div className="form-group">
                <label>Họ</label>
                <div className={firstNameError ? "input-icon input-error" : "input-icon"}>
                  <input
                    name="firstName"
                    value={form.firstName || ""}
                    onChange={handleChange}
                    placeholder="VD: Nguyễn"
                    maxLength={MAX_NAME_LENGTH}
                  />
                </div>
                {firstNameError && (
                  <span className="error-text">{firstNameError}</span>
                )}
              </div>

              {/* EF-01 + BR-01: Tên (lastName) required, 1–50 chars */}
              <div className="form-group">
                <label>Tên</label>
                <div className={lastNameError ? "input-icon input-error" : "input-icon"}>
                  <input
                    name="lastName"
                    value={form.lastName || ""}
                    onChange={handleChange}
                    placeholder="VD: Minh"
                    maxLength={MAX_NAME_LENGTH}
                  />
                </div>
                {lastNameError && (
                  <span className="error-text">{lastNameError}</span>
                )}
              </div>
            </div>

            {/* BR-02: Tiểu sử (Bio) optional, max 200 chars */}
            <div className="form-group">
              <label>
                Tiểu sử
                <span className="char-counter" style={{ marginLeft: 6 }}>
                  {form.bio?.length ?? 0}/{MAX_BIO_LENGTH}
                </span>
              </label>
              <div className={bioError ? "input-icon input-error" : "input-icon"}>
                <textarea
                  name="bio"
                  rows={3}
                  placeholder="Viết vài dòng giới thiệu..."
                  value={form.bio || ""}
                  onChange={handleChange}
                  maxLength={MAX_BIO_LENGTH}
                />
              </div>
              {bioError && <span className="error-text">{bioError}</span>}
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Số điện thoại</label>
                <div
                  className={`input-icon ${phoneError ? "input-error" : ""}`}
                >
                  <Phone size={15} />
                  <input
                    name="phone"
                    value={form.phone || ""}
                    onChange={handleChange}
                    placeholder="0912345678"
                    maxLength={10}
                  />
                </div>
                {phoneError && <span className="error-text">{phoneError}</span>}
              </div>

              <div className="form-group">
                <label>Giới tính</label>
                <div className="input-icon select">
                  <VenusAndMars size={15} />
                  <select
                    name="gender"
                    value={form.gender || ""}
                    onChange={handleChange}
                  >
                    <option value="">Chọn</option>
                    <option value="Male">Nam</option>
                    <option value="Female">Nữ</option>
                    <option value="Other">Khác</option>
                  </select>
                  <ChevronDown size={15} className="chevron" />
                </div>
              </div>
            </div>

            {/* BR-05: Ngày sinh optional; EF-04: cannot be a future date */}
            <div className="form-group small">
              <label>Ngày sinh</label>
              <div className={`input-icon${dobError ? " input-error" : ""}`}>
                <Calendar size={15} />
                <input
                  type="date"
                  name="dateOfBirth"
                  value={form.dateOfBirth || ""}
                  onChange={handleChange}
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>
              {dobError && <span className="error-text">{dobError}</span>}
            </div>

            <div className="form-actions">
              <button className="btn ghost" onClick={handleCancel}>
                Huỷ
              </button>
              <button
                className="btn primary"
                onClick={handleSave}
                disabled={
                  loading ||
                  !!phoneError ||
                  !!firstNameError ||
                  !!lastNameError ||
                  !!dobError ||
                  !!bioError ||
                  !hasChanges()
                }
              >
                {loading ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>

            <div className="privacy-box">
              <ShieldCheck size={15} className="privacy-icon" />
              <p>
                Thông tin cá nhân của bạn sẽ được bảo mật và chỉ sử dụng để
                tăng trải nghiệm cá nhân của bạn. Bạn có thể chỉnh sửa, xóa
                thông tin của mình bất cứ lúc nào.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileSection;
