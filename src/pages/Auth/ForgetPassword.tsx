import React, { useEffect, useRef, useState } from "react";
import "./ForgetPassword.css";
import "./ForgetPassword-dark.css";
import logo from "../../assets/light_logo.png";
import { Mail, Lock, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";
import { maskEmail } from "../../utils/stringUtils";
import { Button } from "../../components/common";
import { useNavigate } from "react-router-dom";
import api from "../../services/axios";
import { showError, showSuccess, showInfo } from "../../components/common/toastUtils";

/* ── Password rules ──────────────────────────────────────────────────── */
const RULES = [
    { label: "Ít nhất 8 ký tự", test: (p: string) => p.length >= 8 },
    { label: "1 chữ in hoa (A-Z)", test: (p: string) => /[A-Z]/.test(p) },
    { label: "1 chữ số (0-9)", test: (p: string) => /\d/.test(p) },
    { label: "1 ký tự đặc biệt (@$!%*?&)", test: (p: string) => /[@$!%*?&]/.test(p) },
];
const isValidPassword = (p: string) => RULES.every((r) => r.test(p));

type Step = "email" | "otp" | "password";

const ForgetPassword: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState<Step>("email");
    const [animating, setAnimating] = useState(false);

    /* step: email */
    const [email, setEmail] = useState("");
    const [emailLoading, setEmailLoading] = useState(false);
    const [emailError, setEmailError] = useState("");

    /* step: otp */
    const [otp, setOtp] = useState("");
    const [resendLoading, setResendLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const otpInputRef = useRef<HTMLInputElement>(null);

    /* step: password */
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);
    const [touched, setTouched] = useState({ new: false, confirm: false });

    /* ── helpers ── */
    const goStep = (next: Step) => {
        setAnimating(true);
        setTimeout(() => { setStep(next); setAnimating(false); }, 250);
    };

    const startCooldown = () => {
        setResendCooldown(60);
        const id = setInterval(() =>
            setResendCooldown((p) => { if (p <= 1) { clearInterval(id); return 0; } return p - 1; }), 1000);
    };

    useEffect(() => {
        if (step === "otp") setTimeout(() => otpInputRef.current?.focus(), 300);
    }, [step]);

    /* ── Step 1: send OTP ── */
    const handleSendOtp = async () => {
        const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.trim()) { setEmailError("Vui lòng nhập địa chỉ email"); return; }
        if (!EMAIL_REGEX.test(email.trim())) { setEmailError("Email không đúng định dạng"); return; }
        setEmailError("");
        try {
            setEmailLoading(true);
            await api.post("/auth/forget-password", { email: email.trim() });
        } catch (err: any) {
            // Không phân biệt lỗi để tránh lộ thông tin tài khoản
            // Chỉ dừng lại nếu là lỗi mạng hoàn toàn (không có response)
            if (!err.response) {
                showError("Lỗi kết nối", "Vui lòng kiểm tra kết nối mạng");
                return;
            }
        } finally {
            setEmailLoading(false);
        }
        // Luôn chuyển sang bước OTP và hiện thông báo trung lập
        showInfo("Đã gửi yêu cầu", "Nếu email tồn tại, mã OTP sẽ được gửi tới hộp thư của bạn");
        startCooldown();
        goStep("otp");
    };

    /* ── Resend OTP ── */
    const handleResend = async () => {
        if (resendCooldown > 0) return;
        try {
            setResendLoading(true);
            await api.post("/auth/resend-otp", { email: email.trim() });
            showInfo("Đã gửi lại OTP", "Kiểm tra email của bạn");
            startCooldown();
        } catch (err: any) {
            if (err.response?.status === 429) {
                showInfo("Vui lòng chờ", "Bạn cần đợi ít nhất 1 phút trước khi gửi lại mã");
                startCooldown();
            } else {
                showError("Gửi thất bại", err.response?.data?.message || "Vui lòng thử lại sau");
            }
        } finally {
            setResendLoading(false);
        }
    };

    /* ── Step 2: check 6 digits then go to password step ── */
    const handleVerifyOtp = () => {
        if (otp.length !== 6) {
            showError("OTP chưa đủ", "Vui lòng nhập đủ 6 chữ số");
            return;
        }
        goStep("password");
    };

    /* ── Step 3: reset password ── */
    const confirmError = touched.confirm && confirmPassword && newPassword !== confirmPassword
        ? "Mật khẩu xác nhận không khớp" : "";

    const handleResetPassword = async () => {
        setTouched({ new: true, confirm: true });
        if (!isValidPassword(newPassword)) {
            showError("Mật khẩu không hợp lệ", "Vui lòng kiểm tra các yêu cầu mật khẩu");
            return;
        }
        if (newPassword !== confirmPassword) {
            showError("Mật khẩu không khớp", "Mật khẩu xác nhận chưa đúng");
            return;
        }
        try {
            setResetLoading(true);
            await api.post("/auth/reset-password", {
                email: email.trim(),
                otpCode: otp,
                newPassword,
            });
            showSuccess("Đặt lại mật khẩu thành công!", "Vui lòng đăng nhập lại");
            navigate("/login", { replace: true });
        } catch (err: any) {
            showError("Thất bại", err.response?.data?.message || "Mã OTP không đúng hoặc đã hết hạn");
            goStep("otp");
        } finally {
            setResetLoading(false);
        }
    };

    const stepNum = step === "email" ? 1 : step === "otp" ? 2 : 3;

    return (
        <div className="fp-container">
            {/* LEFT */}
            <div className="fp-left">
                <div className="fp-brand">
                    <img src={logo} alt="SoundMates" />
                    <h1>SoundMates</h1>
                    <p>Share feelings. Connect hearts.</p>
                </div>
            </div>

            {/* RIGHT */}
            <div className="fp-right">
                <div className="fp-card">

                    {/* Progress steps */}
                    <div className="fp-steps">
                        {["Email", "Xác thực", "Mật khẩu"].map((label, i) => (
                            <React.Fragment key={i}>
                                <div className={`fp-step-dot${stepNum > i + 1 ? " fp-step-done" : stepNum === i + 1 ? " fp-step-active" : ""}`}>
                                    {stepNum > i + 1 ? <CheckCircle2 size={15} /> : <span>{i + 1}</span>}
                                    <p>{label}</p>
                                </div>
                                {i < 2 && <div className={`fp-step-line${stepNum > i + 1 ? " fp-step-line-done" : ""}`} />}
                            </React.Fragment>
                        ))}
                    </div>

                    {/* Step content */}
                    <div className={`fp-step-body${animating ? " fp-fade-out" : " fp-fade-in"}`}>

                        {/* ── STEP 1: Email ── */}
                        {step === "email" && (
                            <>
                                <div className="fp-step-header">
                                    <div className="fp-icon-circle">
                                        <Mail size={24} />
                                    </div>
                                    <h2>Quên mật khẩu</h2>
                                    <p className="fp-subtitle">Nhập email đăng ký để nhận mã OTP</p>
                                </div>

                                <div className={`fp-input-wrapper${emailError ? " fp-input-error" : ""}`}>
                                    <Mail size={18} />
                                    <input
                                        type="text"
                                        placeholder="example@email.com"
                                        value={email}
                                        onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                                        onKeyDown={(e) => { if (e.key === "Enter") handleSendOtp(); }}
                                        autoFocus
                                    />
                                </div>
                                {emailError && <p className="fp-field-error">{emailError}</p>}

                                <Button className="fp-btn-primary" isLoading={emailLoading} onClick={handleSendOtp}>
                                    Gửi mã OTP
                                </Button>

                                <p className="fp-footer-link" onClick={() => navigate("/login")}>
                                    ← Quay lại đăng nhập
                                </p>
                            </>
                        )}

                        {/* ── STEP 2: OTP ── */}
                        {step === "otp" && (
                            <>
                                <div className="fp-step-header">
                                    <div className="fp-icon-circle fp-icon-otp">
                                        <CheckCircle2 size={24} />
                                    </div>
                                    <h2>Xác thực OTP</h2>
                                    <p className="fp-subtitle">
                                        Mã OTP đã gửi về{" "}
                                        <strong className="fp-email-highlight">{maskEmail(email)}</strong>
                                    </p>
                                </div>

                                <div className="fp-otp-group" onClick={() => otpInputRef.current?.focus()}>
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <div
                                            key={i}
                                            className={[
                                                "fp-otp-box",
                                                otp.length === i ? "fp-otp-active" : "",
                                                otp[i] ? "fp-otp-filled" : "",
                                            ].join(" ")}
                                        >
                                            {otp[i] || ""}
                                        </div>
                                    ))}
                                    <input
                                        ref={otpInputRef}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={6}
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                        onKeyDown={(e) => { if (e.key === "Enter") handleVerifyOtp(); }}
                                        className="fp-otp-hidden"
                                        autoFocus
                                    />
                                </div>

                                <div className="fp-resend-row">
                                    <span className="fp-resend-label">Không nhận được mã?</span>
                                    <button
                                        className="fp-resend-btn"
                                        onClick={handleResend}
                                        disabled={resendCooldown > 0 || resendLoading}
                                    >
                                        {resendCooldown > 0 ? `Gửi lại (${resendCooldown}s)` : resendLoading ? "Đang gửi..." : "Gửi lại"}
                                    </button>
                                </div>

                                <Button className="fp-btn-primary" onClick={handleVerifyOtp}>
                                    Xác nhận
                                </Button>

                                <p className="fp-footer-link" onClick={() => goStep("email")}>
                                    ← Thay đổi email
                                </p>
                            </>
                        )}

                        {/* ── STEP 3: New Password ── */}
                        {step === "password" && (
                            <>
                                <div className="fp-step-header">
                                    <div className="fp-icon-circle fp-icon-pw">
                                        <Lock size={24} />
                                    </div>
                                    <h2>Đặt mật khẩu mới</h2>
                                    <p className="fp-subtitle">Tạo mật khẩu mạnh cho tài khoản của bạn</p>
                                </div>

                                <label className="fp-label">Mật khẩu mới</label>
                                <div className={`fp-input-wrapper${touched.new && newPassword && !isValidPassword(newPassword) ? " fp-input-error" : ""}`}>
                                    <Lock size={18} />
                                    <input
                                        type={showNew ? "text" : "password"}
                                        placeholder="Nhập mật khẩu mới"
                                        value={newPassword}
                                        onBlur={() => setTouched((t) => ({ ...t, new: true }))}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                    />
                                    <span className="fp-toggle-pw" onClick={() => setShowNew(!showNew)}>
                                        {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </span>
                                </div>

                                {/* Live rules checklist */}
                                {newPassword.length > 0 && (
                                    <ul className="fp-rules">
                                        {RULES.map((r, i) => {
                                            const ok = r.test(newPassword);
                                            return (
                                                <li key={i} className={ok ? "fp-rule-ok" : "fp-rule-fail"}>
                                                    {ok ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                                                    {r.label}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}

                                <label className="fp-label fp-label-gap">Xác nhận mật khẩu</label>
                                <div className={`fp-input-wrapper${confirmError ? " fp-input-error" : touched.confirm && confirmPassword && confirmPassword === newPassword ? " fp-input-ok" : ""}`}>
                                    <Lock size={18} />
                                    <input
                                        type={showConfirm ? "text" : "password"}
                                        placeholder="Nhập lại mật khẩu"
                                        value={confirmPassword}
                                        onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === "Enter") handleResetPassword(); }}
                                    />
                                    <span className="fp-toggle-pw" onClick={() => setShowConfirm(!showConfirm)}>
                                        {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </span>
                                </div>
                                {confirmError && <p className="fp-field-error">{confirmError}</p>}
                                {!confirmError && touched.confirm && confirmPassword && confirmPassword === newPassword && (
                                    <p className="fp-field-ok">
                                        <CheckCircle2 size={13} /> Mật khẩu khớp
                                    </p>
                                )}

                                <Button
                                    className="fp-btn-primary fp-btn-gap"
                                    isLoading={resetLoading}
                                    onClick={handleResetPassword}
                                >
                                    Đặt lại mật khẩu
                                </Button>

                                <p className="fp-footer-link" onClick={() => goStep("otp")}>
                                    ← Nhập lại OTP
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgetPassword;
