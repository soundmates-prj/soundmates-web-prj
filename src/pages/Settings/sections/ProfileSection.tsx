import React, { useState, useRef, useEffect } from "react";
import {
  Calendar,
  Camera,
  ChevronDown,
  Phone,
  VenusAndMars,
} from "lucide-react";

import api from "../../../services/axios";
import { showSuccess, showError } from "../../../components/common/toastUtils";
import type { User } from "../../../types/user";
import { validateImageUrl } from "../../../utils/stringUtils";

import "./ProfileSection.css";

/* ---------------- HELPER: Upload ảnh lên Cloudinary ---------------- */

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

  if (!res.ok) {
    throw new Error("Upload ảnh thất bại");
  }

  const data = await res.json();
  return data.secure_url as string;
};

/* ---------------- HELPER: Validate số điện thoại Việt Nam ---------------- */

// Hợp lệ: 10 số, bắt đầu bằng 03x | 05x | 07x | 08x | 09x
const isValidVietnamPhone = (phone: string): boolean => {
  return /^(03|05|07|08|09)[0-9]{8}$/.test(phone);
};

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
  const [phoneError, setPhoneError] = useState<string>("");

  const avatarInput = useRef<HTMLInputElement>(null);
  const backgroundInput = useRef<HTMLInputElement>(null);

  /* ---------------- LOAD PROFILE ---------------- */

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

        // Validate and clean profile image URL
        const cleanProfileImageUrl = validateImageUrl(data.profileImageUrl);
        if (cleanProfileImageUrl) {
          setAvatarPreview(cleanProfileImageUrl);
        }

        // Validate and clean background image URL
        const cleanBackgroundImageUrl = validateImageUrl(data.backgroundImageUrl);
        if (cleanBackgroundImageUrl) {
          setBackgroundPreview(cleanBackgroundImageUrl);
        }
      } catch (error) {
        console.error("Load profile failed", error);
      }
    };

    fetchProfile();
  }, []);

  /* ---------------- HANDLE INPUT ---------------- */

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;

    // Validate realtime khi người dùng nhập số điện thoại
    if (name === "phone") {
      if (value === "") {
        setPhoneError("");
      } else if (!/^[0-9]*$/.test(value)) {
        setPhoneError("Số điện thoại chỉ được chứa chữ số");
      } else if (value.length > 10) {
        setPhoneError("Số điện thoại không được quá 10 số");
      } else if (value.length === 10 && !isValidVietnamPhone(value)) {
        setPhoneError("Số điện thoại không hợp lệ (VD: 0912345678)");
      } else {
        setPhoneError("");
      }
    }

    setForm({ ...form, [name]: value });
  };

  /* ---------------- HANDLE AVATAR ---------------- */

  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setAvatarFile(file);

    const reader = new FileReader();

    reader.onload = () => {
      setAvatarPreview(reader.result as string);
    };

    reader.readAsDataURL(file);
  };

  /* ---------------- HANDLE BACKGROUND ---------------- */

  const handleBackground = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setBackgroundFile(file);

    const reader = new FileReader();

    reader.onload = () => {
      setBackgroundPreview(reader.result as string);
    };

    reader.readAsDataURL(file);
  };

  /* ---------------- SAVE PROFILE ---------------- */

  const handleSave = async () => {
    // Validate trước khi lưu
    if (form.phone && !isValidVietnamPhone(form.phone)) {
      setPhoneError("Số điện thoại không hợp lệ (VD: 0912345678)");
      return;
    }

    try {
      setLoading(true);

      let profileImageUrl: string | undefined =
        user?.profileImageUrl ?? undefined;
      let backgroundImageUrl: string | undefined =
        user?.backgroundImageUrl ?? undefined;

      // Upload ảnh mới lên Cloudinary, nhận về URL
      if (avatarFile) {
        console.log("Uploading avatar to Cloudinary...");
        profileImageUrl = await uploadToCloudinary(avatarFile);
        console.log("Avatar uploaded:", profileImageUrl);
      }

      if (backgroundFile) {
        console.log("Uploading background to Cloudinary...");
        backgroundImageUrl = await uploadToCloudinary(backgroundFile);
        console.log("Background uploaded:", backgroundImageUrl);
      }

      // Clean và validate URLs trước khi gửi
      const cleanProfileImageUrl = validateImageUrl(profileImageUrl);
      const cleanBackgroundImageUrl = validateImageUrl(backgroundImageUrl);

      // Prepare payload
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        bio: form.bio || null,
        phone: form.phone || null,
        gender: form.gender ? form.gender.charAt(0).toUpperCase() + form.gender.slice(1).toLowerCase() : null,
        dateOfBirth: form.dateOfBirth
          ? new Date(form.dateOfBirth).toISOString()
          : null,
        profileImageUrl: cleanProfileImageUrl || null,
        backgroundImageUrl: cleanBackgroundImageUrl || null,
      };

      console.log("Sending profile update:", payload);

      // Gửi URL string vào backend
      const response = await api.put("/auth/profile", payload);
      
      console.log("Profile update response:", response.data);

      showSuccess("Đã lưu", "Thông tin hồ sơ đã được cập nhật!");

      // Reload profile data
      const res = await api.get("/users/me/profile/full");
      const updatedUser = res.data.data;
      
      console.log("Updated user data:", updatedUser);
      
      setUser(updatedUser);
      
      // Update localStorage userInfo with new avatar
      const storedUserInfo = localStorage.getItem("userInfo");
      if (storedUserInfo) {
        const userInfo = JSON.parse(storedUserInfo);
        userInfo.avatarUrl = updatedUser.profileImageUrl;
        localStorage.setItem("userInfo", JSON.stringify(userInfo));
        window.dispatchEvent(new Event("authChange"));
      }
    } catch (error: any) {
      console.error("Update profile failed:", error);
      console.error("Error response:", error.response?.data);
      
      const errorMessage = error.response?.data?.message || error.message || "Có lỗi xảy ra khi cập nhật profile";
      showError("Lỗi", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- CANCEL ---------------- */

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
    setAvatarFile(null);
    setBackgroundFile(null);
    
    // Validate URLs when canceling
    setAvatarPreview(validateImageUrl(user.profileImageUrl));
    setBackgroundPreview(validateImageUrl(user.backgroundImageUrl));
  };

  if (!user) {
    return <div className="profile-page">Loading profile...</div>;
  }

  return (
    <div className="profile-page">
      <div className="profile-card">
        {/* BANNER */}

        <div
          className="profile-banner"
          style={{
            backgroundImage: backgroundPreview
              ? `url(${backgroundPreview})`
              : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <button
            className="banner-upload"
            onClick={() => backgroundInput.current?.click()}
          >
            Thêm ảnh bìa
          </button>

          <input
            ref={backgroundInput}
            type="file"
            accept="image/*"
            hidden
            onChange={handleBackground}
          />

          <div className="avatar-wrapper">
            <img
              src={avatarPreview || "https://via.placeholder.com/150?text=Avatar"}
              className="avatar"
              alt="Profile avatar"
            />

            <button
              className="avatar-edit"
              onClick={() => avatarInput.current?.click()}
            >
              <Camera size={14} />
            </button>

            <input
              ref={avatarInput}
              type="file"
              accept="image/*"
              hidden
              onChange={handleAvatar}
            />
          </div>
        </div>

        {/* FORM */}

        <div className="profile-form">
          <div className="form-grid">
            <div className="form-group">
              <label>Họ</label>

              <input
                name="firstName"
                value={form.firstName || ""}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Tên</label>

              <input
                name="lastName"
                value={form.lastName || ""}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Tiểu sử</label>

            <textarea
              name="bio"
              rows={3}
              placeholder="Viết vài dòng giới thiệu..."
              value={form.bio || ""}
              onChange={handleChange}
            />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Số điện thoại</label>

              <div className={`input-icon ${phoneError ? "input-error" : ""}`}>
                <Phone size={16} />

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
                <VenusAndMars size={16} />

                <select
                  name="gender"
                  value={form.gender || ""}
                  onChange={handleChange}
                >
                  <option value="">Chọn</option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>

                <ChevronDown size={16} className="chevron" />
              </div>
            </div>
          </div>

          <div className="form-group small">
            <label>Ngày sinh</label>

            <div className="input-icon">
              <Calendar size={16} />

              <input
                type="date"
                name="dateOfBirth"
                value={form.dateOfBirth || ""}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* ACTIONS */}

          <div className="form-actions">
            <button className="btn ghost" onClick={handleCancel}>
              Huỷ
            </button>

            <button
              className="btn primary"
              onClick={handleSave}
              disabled={loading || !!phoneError}
            >
              {loading ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>

          <div className="privacy-box">
            <span>ℹ️</span>

            <p>
              Thông tin của bạn được bảo mật và chỉ dùng để cải thiện trải
              nghiệm cá nhân.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSection;
