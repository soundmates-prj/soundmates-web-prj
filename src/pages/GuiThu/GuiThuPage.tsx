import { useState } from "react";
import {
  Mail, Send, Mic2, Radio,
  CheckCircle, ArrowLeft, Headphones, ChevronDown,
} from "lucide-react";
import { Link } from "react-router-dom";
import "./GuiThuPage.css";

const PODCAST_TOPICS = [
  { id: "music", label: "Đề xuất nhạc" },
  { id: "live", label: "Yêu cầu Live" },
  { id: "podcast", label: "Yêu cầu Podcast" },
  { id: "ads", label: "Hợp tác quảng cáo" },
  { id: "support", label: "Hỗ Trợ" },
  { id: "other", label: "Khác" },
];

const TARGET_EMAIL = "anhthqse182634@fpt.edu.vn";

export default function GuiThuPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    topic: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.topic || !form.message) return;

    setSending(true);

    const topicLabel = PODCAST_TOPICS.find(t => t.id === form.topic)?.label ?? form.topic;
    // Xoá emoji khỏi nhãn chủ đề cho email gọn hơn
    const topicClean = topicLabel.replace(/[\u{1F300}-\u{1FFFF}\u{2600}-\u{27BF}]/gu, "").trim();

    const subject = `[SoundMates] ${form.subject || "Thư gửi chương trình - " + form.name}`;

    const divider = "=".repeat(50);
    const thin = "-".repeat(50);

    const body =
      `${divider}\n` +
      `  THƯ GỬI CHƯƠNG TRÌNH SOUNDMATES\n` +
      `${divider}\n\n` +

      `THÔNG TIN NGƯỜI GỬI\n` +
      `${thin}\n` +
      `Họ tên          : ${form.name}\n` +
      `Email phản hồi  : ${form.email}\n` +
      `Loại yêu cầu    : ${topicClean}\n` +
      (form.subject ? `Tiêu đề         : ${form.subject}\n` : "") +
      `Ngày gửi        : ${new Date().toLocaleDateString("vi-VN")}\n\n` +

      `NỘI DUNG THƯ\n` +
      `${thin}\n` +
      `${form.message}\n\n` +

      `THÔNG TIN BỔ SUNG (nếu có — vui lòng điền vào các trường dưới đây)\n` +
      `${thin}\n` +
      `Tên nghệ sĩ / Ban nhạc   : [Điền tên nghệ sĩ hoặc ban nhạc]\n` +
      `Tên bài hát / Album       : [Điền tên bài hát hoặc album]\n` +
      `Thể loại âm nhạc          : [VD: Pop, Jazz, Lo-fi, EDM, Acoustic...]\n` +
      `Link bài hát / YouTube    : [Dán link bài hát nếu có]\n\n` +

      `TỆP ĐÍNH KÈM (nếu có)\n` +
      `${thin}\n` +
      `Link file audio / podcast : [Dán link Google Drive, Dropbox hoặc Zalo...]\n` +
      `Mô tả tệp                 : [Mô tả ngắn về tệp đính kèm nếu cần]\n\n` +

      `* Lưu ý: Để đính kèm tệp trực tiếp (mp3, wav, aac...) vui lòng\n` +
      `  nhấn nút "Đính kèm" trong Gmail và chọn tệp từ máy tính.\n\n` +

      `${divider}\n` +
      `Gửi qua trang SoundMates | soundmates.vn\n` +
      `${divider}`;

    const gmailUrl =
      `https://mail.google.com/mail/?view=cm` +
      `&to=${encodeURIComponent(TARGET_EMAIL)}` +
      `&su=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}`;

    window.open(gmailUrl, "_blank", "noopener,noreferrer");

    await new Promise(res => setTimeout(res, 800));
    setSending(false);
    setSubmitted(true);
  };

  const handleReset = () => {
    setSubmitted(false);
    setForm({ name: "", email: "", topic: "", subject: "", message: "" });
  };

  return (
    <div className="gt-page">
      <div className="gt-bg-orb gt-bg-orb--1" />
      <div className="gt-bg-orb gt-bg-orb--2" />
      <div className="gt-bg-grid" />

      <div className="gt-container">
        <Link to="/" className="gt-back">
          <ArrowLeft size={16} />
          Quay về trang chủ
        </Link>

        <div className="gt-layout">

          {/* ── Left: Info panel ── */}
          <div className="gt-info">
            <div className="gt-info-badge">
              <Headphones size={14} />
              SoundMates Studio
            </div>

            <h1 className="gt-info-title">
              Gửi thư<br />
              <span className="gt-info-accent">đến chương trình</span>
            </h1>

            <p className="gt-info-desc">
              Bạn có ý tưởng cho một tập podcast thú vị? Muốn đề xuất bài nhạc cho
              buổi live? Hay đơn giản muốn chia sẻ cảm xúc với đội ngũ SoundMates?
              Hãy gửi thư cho chúng mình — mọi thư đều được đọc!
            </p>

            <div className="gt-info-items">
              <div className="gt-info-item">
                <div className="gt-info-item-icon"><Mail size={18} /></div>
                <div>
                  <p className="gt-info-item-label">Email Hỗ Trợ</p>
                  <p className="gt-info-item-value">{TARGET_EMAIL}</p>
                </div>
              </div>
              <div className="gt-info-item">
                <div className="gt-info-item-icon"><Radio size={18} /></div>
                <div>
                  <p className="gt-info-item-label">Thời gian phản hồi</p>
                  <p className="gt-info-item-value">1–3 ngày làm việc</p>
                </div>
              </div>
              <div className="gt-info-item">

              </div>
            </div>

            <div className="gt-eq" aria-hidden="true">
              {Array.from({ length: 14 }).map((_, i) => (
                <span key={i} className="gt-eq-bar" style={{ animationDelay: `${i * 0.09}s` }} />
              ))}
            </div>
          </div>

          {/* ── Right: Form ── */}
          <div className="gt-form-card">
            {submitted ? (
              <div className="gt-success">
                <div className="gt-success-icon">
                  <CheckCircle size={36} />
                </div>
                <h2 className="gt-success-title">Gmail đã được mở! 🎉</h2>
                <p className="gt-success-desc">
                  Một tab Gmail mới đã mở với nội dung thư được điền sẵn.
                  Hãy kiểm tra và nhấn <strong>Gửi</strong> trong Gmail để hoàn tất.
                </p>
                <p className="gt-success-email">→ {TARGET_EMAIL}</p>
                <button onClick={handleReset} className="gt-btn gt-btn--primary gt-success-btn">
                  Gửi thêm thư
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="gt-form">
                <div className="gt-form-header">
                  <h2 className="gt-form-title">
                    <Mail size={20} />
                    Soạn thư
                  </h2>
                  <p className="gt-form-subtitle">
                    Điền thông tin — nhấn Gửi sẽ mở <strong>Gmail</strong> với nội dung sẵn
                  </p>
                </div>

                {/* Dropdown loại yêu cầu */}
                <div className="gt-field">
                  <label className="gt-label" htmlFor="gt-topic">
                    Loại yêu cầu <span className="gt-required">*</span>
                  </label>
                  <div className="gt-select-wrapper">
                    <select
                      id="gt-topic"
                      name="topic"
                      className="gt-select"
                      value={form.topic}
                      onChange={handleChange}
                      required
                    >
                      <option value="" disabled>-- Chọn loại yêu cầu --</option>
                      {PODCAST_TOPICS.map(t => (
                        <option key={t.id} value={t.id}>{t.label}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="gt-select-icon" />
                  </div>
                </div>

                {/* Name + Email */}
                <div className="gt-row">
                  <div className="gt-field">
                    <label className="gt-label" htmlFor="gt-name">
                      Họ tên <span className="gt-required">*</span>
                    </label>
                    <input
                      id="gt-name" className="gt-input" type="text" name="name"
                      placeholder="Nguyễn Văn A"
                      value={form.name} onChange={handleChange} required
                    />
                  </div>
                  <div className="gt-field">
                    <label className="gt-label" htmlFor="gt-email">
                      Email phản hồi <span className="gt-required">*</span>
                    </label>
                    <input
                      id="gt-email" className="gt-input" type="email" name="email"
                      placeholder="ban@email.com"
                      value={form.email} onChange={handleChange} required
                    />
                  </div>
                </div>

                {/* Subject */}
                <div className="gt-field">
                  <label className="gt-label" htmlFor="gt-subject">Tiêu đề (tuỳ chọn)</label>
                  <input
                    id="gt-subject" className="gt-input" type="text" name="subject"
                    placeholder="VD: Đề xuất bài hát cho buổi live Jazz tối thứ 6..."
                    value={form.subject} onChange={handleChange}
                  />
                </div>

                {/* Message */}
                <div className="gt-field">
                  <label className="gt-label" htmlFor="gt-message">
                    Nội dung thư <span className="gt-required">*</span>
                  </label>
                  <textarea
                    id="gt-message" className="gt-textarea" name="message"
                    placeholder="Chia sẻ ý tưởng, yêu cầu hoặc cảm nhận của bạn với đội ngũ SoundMates..."
                    rows={6} value={form.message} onChange={handleChange} required
                  />
                  <span className="gt-char-count">{form.message.length} ký tự</span>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="gt-btn gt-btn--primary gt-submit"
                  disabled={sending || !form.name || !form.email || !form.topic || !form.message}
                >
                  {sending ? (
                    <><span className="gt-spinner" />Đang mở Gmail...</>
                  ) : (
                    <><Send size={16} />Gửi qua Gmail</>
                  )}
                </button>

                <p className="gt-note">
                  Nhấn Gửi sẽ mở <strong>Gmail</strong> trên trình duyệt với nội dung được điền sẵn.
                  Email tới <strong>{TARGET_EMAIL}</strong>.
                </p>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
