import React, { useState, useRef } from "react";
import {
  Calendar,
  Camera,
  ChevronDown,
  Phone,
  VenusAndMars,
} from "lucide-react";
import { showSuccess } from "../../../components/common/toastUtils";
import "./ProfileSection.css";

interface ProfileForm {
  firstName: string;
  lastName: string;
  bio: string;
  phone: string;
  gender: string;
  dob: string;
}

const DEFAULT_FORM: ProfileForm = {
  firstName: "Quoc Anh",
  lastName: "Tran Ho",
  bio: "",
  phone: "+84 906178691",
  gender: "",
  dob: "1995-08-15",
};

const ProfileSection: React.FC = () => {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [avatarPreview, setAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const avatarInput = useRef<HTMLInputElement>(null);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setLoading(true);

    await new Promise((r) => setTimeout(r, 900));

    setLoading(false);

    showSuccess("Đã lưu", "Thông tin hồ sơ đã được cập nhật!");
  };

  const handleCancel = () => {
    setForm(DEFAULT_FORM);
    setAvatar(null);
  };

  const isDirty =
    JSON.stringify(form) !== JSON.stringify(DEFAULT_FORM) || avatarPreview;

  return (
    <div className="profile-page">
      <div className="profile-card">
        {/* Banner */}
        <div className="profile-banner">
          <button className="banner-upload">Thêm ảnh bìa</button>

          <div className="avatar-wrapper">
            <img
              src={avatarPreview ?? "https://i.pravatar.cc/120"}
              className="avatar"
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

        {/* Form */}
        <div className="profile-form">
          <div className="form-grid">
            <div className="form-group">
              <label>Tên</label>
              <input
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Họ</label>
              <input
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Tiểu sử</label>
            <textarea
              name="bio"
              rows={3}
              placeholder="Viết vài dòng giới thiệu về bạn..."
              value={form.bio}
              onChange={handleChange}
            />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Số điện thoại</label>

              <div className="input-icon">
                <Phone size={16} />

                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Giới tính</label>

              <div className="input-icon select">
                <VenusAndMars size={16} />

                <select
                  name="gender"
                  value={form.gender}
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
                name="dob"
                value={form.dob}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="form-actions">
            <button className="btn ghost" onClick={handleCancel}>
              Huỷ
            </button>

            <button className="btn ghost">Xem trước</button>

            <button
              className="btn primary"
              onClick={handleSave}
              disabled={!isDirty || loading}
            >
              {loading ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>

          <div className="privacy-box">
            <span>ℹ️</span>
            <p>
              Thông tin của bạn được bảo mật và chỉ sử dụng để cải thiện trải
              nghiệm cá nhân trên hệ thống.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSection;
