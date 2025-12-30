import { useState } from 'react';
import './FirstTimeSetup.css';

interface FirstTimeSetupProps {
    onComplete?: (email: string, password: string) => void;
}

export function FirstTimeSetup({ onComplete }: FirstTimeSetupProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Please fill in all required fields.');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        setIsLoading(true);

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            onComplete?.(email, password);
        } catch (err) {
            setError('Failed to create account. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

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
                            // Fallback if image doesn't load
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
                                    className="form-input setup-input"
                                    placeholder="your-email@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={isLoading}
                                    autoFocus
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    <svg className="label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="11" width="18" height="11" rx="2" />
                                        <path d="M7 11V7a5 5 0 0110 0v4" />
                                    </svg>
                                    Password<span className="required">*</span>
                                </label>
                                <input
                                    type="password"
                                    className="form-input setup-input"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={isLoading}
                                    minLength={6}
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary setup-submit-btn"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <span className="spinner"></span>
                                        Creating Account...
                                    </>
                                ) : (
                                    'CREATE ACCOUNT'
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
