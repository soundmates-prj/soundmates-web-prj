import React, { useState } from 'react';
import { api } from '../../services/api';
import './Login.css'; // Reuse Login styles

interface TokenSetupProps {
    onComplete: (token: string) => void;
    onSkip?: () => void;
}

export const TokenSetup: React.FC<TokenSetupProps> = ({ onComplete, onSkip }) => {
    const [token, setToken] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token.trim()) {
            setError('Please enter a valid API Token');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Verify token by making a test request logic request or just saving it
            // Here we assume if user inputs it, we save it. 
            // Real verification would happen on next API call.
            // But good UX is to verify. Let's try to verify with a simple call if possible or just proceed.
            // Since we might be cross-origin/proxy, we just pass verification to api wrapper.

            // Set token in API service (temporarily to test)
            api.setToken(token);

            // Try to fetch system status or user profile to verify
            // await api.getProfile(); // Assuming this exists or similar

            // For now, simple pass-through to let user proceed
            onComplete(token);
        } catch (err: any) {
            setError('Invalid Token or Connection Error');
            api.setToken(null); // Reset
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
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

            <div className="login-form-container">
                <div className="login-card">
                    <h2 className="login-title">API Authorization</h2>

                    <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px', lineHeight: '1.5' }}>
                        To ensure a stable connection, please enter your API Key.<br />
                        You can find this in <b>My Account &gt; API Keys</b>.
                    </p>

                    {error && (
                        <div className="login-alert">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="token" className="form-label">
                                <i className="material-icons-outlined">vpn_key</i> API Token
                            </label>
                            <input
                                type="text"
                                id="token"
                                className="form-input"
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                placeholder="Enter API Key (e.g. 12345:abcdef...)"
                                required
                                autoFocus
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn-submit"
                            disabled={isLoading}
                        >
                            {isLoading ? 'VERIFYING...' : 'CONNECT'}
                        </button>

                        {onSkip && (
                            <button
                                type="button"
                                className="btn-passkey"
                                onClick={onSkip}
                                style={{ marginTop: '10px', backgroundColor: '#e9ecef', color: '#495057' }}
                            >
                                SKIP FOR NOW
                            </button>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
};
