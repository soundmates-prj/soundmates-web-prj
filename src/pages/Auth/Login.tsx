import React, { useState } from 'react';
import { api } from '../../services/api';
import './Login.css';

interface LoginProps {
    onLoginSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            await api.login({
                username,
                password,
                remember: rememberMe
            });
            onLoginSuccess();
        } catch (err: any) {
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            {/* Background Mascot (AzuraCast style) */}
            <div className="mascot-container">
                <img
                    src="https://raw.githubusercontent.com/AzuraCast/AzuraCast/main/frontend/assets/images/azura_mascot.png"
                    alt="AzuraCast Mascot"
                    className="mascot-image"
                    onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                    }}
                />
            </div>

            {/* Login Form Card */}
            <div className="login-form-container">
                <div className="login-card">
                    <h2 className="login-title">Welcome to SoundMates!</h2>

                    {error && (
                        <div className="login-alert">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="username" className="form-label">
                                <i className="material-icons-outlined">email</i> E-mail Address
                            </label>
                            <input
                                type="email"
                                id="username"
                                className="form-input"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="name@example.com"
                                required
                                autoFocus
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password" className="form-label">
                                <i className="material-icons-outlined">vpn_key</i> Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                className="form-input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                required
                            />
                        </div>

                        <div className="form-check">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                />
                                Remember me
                            </label>
                        </div>

                        <button
                            type="submit"
                            className="btn-submit"
                            disabled={isLoading}
                        >
                            {isLoading ? 'SIGNING IN...' : 'SIGN IN'}
                        </button>

                        <button type="button" className="btn-passkey">
                            SIGN IN WITH PASSKEY
                        </button>
                    </form>

                    <div className="login-footer">
                        Please log in to continue. <a href="#">Forgot your password?</a>
                    </div>
                </div>
            </div>
        </div>
    );
};
