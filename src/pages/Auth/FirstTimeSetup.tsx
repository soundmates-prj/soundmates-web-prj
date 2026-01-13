import { useState, useCallback } from 'react';
import { api } from '../../services/api';
import type { ApiError } from '../../services/api';
import './FirstTimeSetup.css';

interface FirstTimeSetupProps {
    onComplete?: (email: string, password: string) => void;
}

interface FormErrors {
    email?: string;
    password?: string;
}

export function FirstTimeSetup({ onComplete }: FirstTimeSetupProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Email validation
    const validateEmail = useCallback((value: string): string | undefined => {
        if (!value) {
            return 'Email is required.';
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            return 'Please enter a valid email address.';
        }
        return undefined;
    }, []);

    // Password validation based on AzuraCast requirements
    const validatePassword = useCallback((value: string): string | undefined => {
        if (!value) {
            return 'Password is required.';
        }
        if (value.length < 8) {
            return 'Password must be at least 8 characters.';
        }
        // Additional security checks
        if (!/[a-z]/.test(value)) {
            return 'Password must contain at least one lowercase letter.';
        }
        if (!/[A-Z]/.test(value)) {
            return 'Password must contain at least one uppercase letter.';
        }
        if (!/[0-9]/.test(value)) {
            return 'Password must contain at least one number.';
        }
        return undefined;
    }, []);

    // Real-time field validation
    const handleEmailChange = (value: string) => {
        setEmail(value);
        const err = validateEmail(value);
        setFieldErrors(prev => ({ ...prev, email: err }));
        if (error) setError('');
    };

    const handlePasswordChange = (value: string) => {
        setPassword(value);
        const err = validatePassword(value);
        setFieldErrors(prev => ({ ...prev, password: err }));
        if (error) setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validate all fields
        const emailError = validateEmail(email);
        const passwordError = validatePassword(password);

        if (emailError || passwordError) {
            setFieldErrors({ email: emailError, password: passwordError });
            return;
        }

        // Check password confirmation
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setIsLoading(true);

        try {
            // Call API to register super admin
            const response = await api.registerSuperAdmin({
                username: email,
                password: password,
            });

            if (response.success) {
                // After successful registration, login to establish session
                // AzuraCast auto-logins after registration, but we need to ensure
                // the session is established for our SPA
                try {
                    await api.login({
                        username: email,
                        password: password,
                    });
                } catch (loginError) {
                    // If login fails, it might be because we're already logged in
                    // (AzuraCast auto-login on register), so continue anyway
                    console.log('Auto-login after registration:', loginError);
                }

                // Call onComplete callback
                onComplete?.(email, password);
            } else {
                setError(response.message || 'Failed to create account. Please try again.');
            }
        } catch (err) {
            const apiError = err as ApiError;
            if (apiError.type === 'network') {
                setError('Unable to connect to server. Please check your connection.');
            } else {
                setError(apiError.message || 'Failed to create account. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Password strength indicator
    const getPasswordStrength = (pwd: string): { level: number; label: string; color: string } => {
        if (!pwd) return { level: 0, label: '', color: '' };

        let score = 0;
        if (pwd.length >= 8) score++;
        if (pwd.length >= 12) score++;
        if (/[a-z]/.test(pwd)) score++;
        if (/[A-Z]/.test(pwd)) score++;
        if (/[0-9]/.test(pwd)) score++;
        if (/[^a-zA-Z0-9]/.test(pwd)) score++;

        if (score <= 2) return { level: 1, label: 'Weak', color: '#ef4444' };
        if (score <= 4) return { level: 2, label: 'Medium', color: '#f59e0b' };
        return { level: 3, label: 'Strong', color: '#22c55e' };
    };

    const passwordStrength = getPasswordStrength(password);

    return (
        <div className="first-time-setup">
            {/* Background with mascot */}
            <div className="setup-background">
                <div className="mascot-container">
                    <img
                        src="https://raw.githubusercontent.com/AzuraCast/AzuraCast/main/frontend/assets/images/azura_mascot.png"
                        alt="AzuraCast Mascot"
                        className="mascot-image"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                        }}
                    />
                </div>
                <div className="background-wave"></div>
                <div className="background-accent"></div>
            </div>

            {/* Setup Form */}
            <div className="setup-form-container animate-fade-in">
                <div className="setup-form-card">
                    <div className="setup-form-header">
                        <h1 className="setup-title">SoundMates First-Time Setup</h1>
                        <h2 className="setup-subtitle">Welcome to SoundMates!</h2>
                    </div>

                    <div className="setup-form-body">
                        <div className="setup-intro">
                            <p className="intro-highlight">
                                Let's get started by creating your <span className="text-highlight">Super Administrator</span> account.
                            </p>
                            <p className="intro-description">
                                This account will have full access to the system, and you'll automatically
                                be logged in to it for the rest of setup.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="setup-form">
                            {error && (
                                <div className="form-error animate-fade-in">
                                    <svg className="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="15" y1="9" x2="9" y2="15" />
                                        <line x1="9" y1="9" x2="15" y2="15" />
                                    </svg>
                                    {error}
                                </div>
                            )}

                            <div className="form-group">
                                <label className="form-label">
                                    <svg className="label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="4" width="18" height="16" rx="2" />
                                        <path d="M3 8l9 6 9-6" />
                                    </svg>
                                    E-mail Address<span className="required">*</span>
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    className={`form-input setup-input ${fieldErrors.email ? 'input-error' : ''}`}
                                    placeholder="your-email@example.com"
                                    value={email}
                                    onChange={(e) => handleEmailChange(e.target.value)}
                                    required
                                    disabled={isLoading}
                                    autoFocus
                                    autoComplete="email"
                                />
                                {fieldErrors.email && (
                                    <span className="field-error">{fieldErrors.email}</span>
                                )}
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    <svg className="label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="11" width="18" height="11" rx="2" />
                                        <path d="M7 11V7a5 5 0 0110 0v4" />
                                    </svg>
                                    Password<span className="required">*</span>
                                </label>
                                <div className="password-input-wrapper">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id="password"
                                        className={`form-input setup-input ${fieldErrors.password ? 'input-error' : ''}`}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => handlePasswordChange(e.target.value)}
                                        required
                                        disabled={isLoading}
                                        minLength={8}
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        className="toggle-password-btn"
                                        onClick={() => setShowPassword(!showPassword)}
                                        tabIndex={-1}
                                    >
                                        {showPassword ? (
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                                <line x1="1" y1="1" x2="23" y2="23" />
                                            </svg>
                                        ) : (
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                <circle cx="12" cy="12" r="3" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                {password && (
                                    <div className="password-strength">
                                        <div className="strength-bar">
                                            <div
                                                className="strength-fill"
                                                style={{
                                                    width: `${(passwordStrength.level / 3) * 100}%`,
                                                    backgroundColor: passwordStrength.color,
                                                }}
                                            />
                                        </div>
                                        <span className="strength-label" style={{ color: passwordStrength.color }}>
                                            {passwordStrength.label}
                                        </span>
                                    </div>
                                )}
                                {fieldErrors.password && (
                                    <span className="field-error">{fieldErrors.password}</span>
                                )}
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    <svg className="label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                        <path d="M9 12l2 2 4-4" />
                                    </svg>
                                    Confirm Password<span className="required">*</span>
                                </label>
                                <div className="password-input-wrapper">
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        id="confirm-password"
                                        className={`form-input setup-input ${confirmPassword && password !== confirmPassword ? 'input-error' : ''}`}
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => {
                                            setConfirmPassword(e.target.value);
                                            if (error) setError('');
                                        }}
                                        required
                                        disabled={isLoading}
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        className="toggle-password-btn"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        tabIndex={-1}
                                    >
                                        {showConfirmPassword ? (
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                                <line x1="1" y1="1" x2="23" y2="23" />
                                            </svg>
                                        ) : (
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                <circle cx="12" cy="12" r="3" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                {confirmPassword && password !== confirmPassword && (
                                    <span className="field-error">Passwords do not match.</span>
                                )}
                                {confirmPassword && password === confirmPassword && confirmPassword.length > 0 && (
                                    <span className="field-success">✓ Passwords match</span>
                                )}
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary setup-submit-btn"
                                disabled={isLoading || !!fieldErrors.email || !!fieldErrors.password || password !== confirmPassword}
                            >
                                {isLoading ? (
                                    <>
                                        <span className="spinner"></span>
                                        Creating Account...
                                    </>
                                ) : (
                                    <>
                                        <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                            <circle cx="8.5" cy="7" r="4" />
                                            <line x1="20" y1="8" x2="20" y2="14" />
                                            <line x1="23" y1="11" x2="17" y2="11" />
                                        </svg>
                                        CREATE ACCOUNT
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FirstTimeSetup;
