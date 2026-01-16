import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ChevronLeft, X } from 'lucide-react';
import { api } from '../../services/api';
import logo from '../../assets/light_logo.png';
import './Login.css';

interface LoginProps {
    onLoginSuccess?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
    const navigate = useNavigate();
    const [emailOrUsername, setEmailOrUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const response = await api.newLogin({
                emailOrUsername,
                password
            });

            if (response.success && response.data) {
                // Store login state
                localStorage.setItem('azuracast_is_logged_in', 'true');
                localStorage.setItem('azuracast_user_email', response.data.email);
                localStorage.setItem('azuracast_user_name', `${response.data.firstName} ${response.data.lastName}`);
                localStorage.setItem('azuracast_user_role', response.data.roleName);
                localStorage.setItem('azuracast_login_success', 'true');
                
                // Callback if provided
                if (onLoginSuccess) {
                    onLoginSuccess();
                }
                
                // Redirect based on role
                const role = response.data.roleName;
                if (role === 'MEMBER') {
                    navigate('/home');
                } else if (role === 'STAFF' || role === 'HOST' || role === 'ADMIN') {
                    navigate('/dashboard');
                } else {
                    navigate('/home');
                }
            } else {
                setError(response.message || 'Login failed. Please try again.');
            }
        } catch (err: any) {
            setError(err.message || 'Login failed. Please check your connection.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = () => {
        navigate('/register');
    };

    return (
        <div className="login-container">
            <button className="btn-back" onClick={() => navigate('/home')}>
                <ChevronLeft size={24} />
            </button>
            <div className="login-box">
                <div className="login-left">
                    <div className="logo-section">
                        <img src={logo} alt="Soundmate Logo" className="logo-image" />
                        <h1 className="brand-title">Soundmate</h1>
                        <p className="brand-tagline">Your music, your way</p>
                    </div>
                </div>

                <div className="login-right">

                    <div className="form-container">
                        <h2 className="form-title">Đăng nhập</h2>
                        <p className="form-subtitle">Chào mừng bạn trở lại với SoundMates</p>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Email hoặc Username</label>
                                <div className="input-wrapper">
                                    <Mail className="input-icon" size={20} />
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="Nhập email hoặc username"
                                        value={emailOrUsername}
                                        onChange={(e) => setEmailOrUsername(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Mật khẩu</label>
                                <div className="input-wrapper">
                                    <Lock className="input-icon" size={20} />
                                    <input
                                        type="password"
                                        className="input-field"
                                        placeholder="Nhập mật khẩu"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-actions">
                                <a href="/forgot-password" className="forgot-link">
                                    Quên mật khẩu?
                                </a>
                            </div>

                            <button
                                type="submit"
                                className="btn-login"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                            </button>
                        </form>

                        {error && (
                            <div className="error-message">
                                {error}
                                <button 
                                    className="close-message-btn" 
                                    onClick={() => setError(null)}
                                    aria-label="Close"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        )}

                        <div className="divider">
                            <span className="divider-line"></span>
                            <span className="divider-text">hoặc</span>
                            <span className="divider-line"></span>
                        </div>

                        <div className="social-login">
                            <button className="social-btn" type="button">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                        </button>
                        <button className="social-btn" type="button">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="#000">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                        </button>
                        </div>

                        <div className="register-section">
                            <p className="register-text">
                                Chưa có tài khoản? <a href="/register" className="register-link">Đăng ký ngay</a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
