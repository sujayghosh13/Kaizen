import { useState } from 'react';
import './AuthModal.css';

/**
 * AuthModal — Simple sign-in / sign-up form.
 * Shown when user is not authenticated.
 * Can be dismissed to continue using localStorage-only mode.
 */
export function AuthModal({ onSignIn, onSignUp, onDismiss, error }) {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [localError, setLocalError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim() || !password.trim()) {
            setLocalError('Please fill in all fields');
            return;
        }
        if (password.length < 6) {
            setLocalError('Password must be at least 6 characters');
            return;
        }

        setLocalError('');
        setLoading(true);
        try {
            if (isSignUp) {
                await onSignUp(email, password);
            } else {
                await onSignIn(email, password);
            }
        } catch (err) {
            setLocalError(err.message);
        }
        setLoading(false);
    };

    const displayError = localError || error;

    return (
        <div className="auth-overlay">
            <div className="auth-modal">
                <h2 className="auth-title">
                    {isSignUp ? '✨ Create Account' : '🔑 Sign In'}
                </h2>
                <p className="auth-subtitle">
                    {isSignUp
                        ? 'Create an account to sync your tasks across devices'
                        : 'Sign in to access your synced tasks'}
                </p>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="auth-field">
                        <label htmlFor="auth-email">Email</label>
                        <input
                            id="auth-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            autoFocus
                        />
                    </div>
                    <div className="auth-field">
                        <label htmlFor="auth-password">Password</label>
                        <input
                            id="auth-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                    </div>

                    {displayError && <p className="auth-error">{displayError}</p>}

                    <button type="submit" className="auth-btn primary" disabled={loading}>
                        {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
                    </button>
                </form>

                <p className="auth-toggle">
                    {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                    <button
                        className="auth-link"
                        onClick={() => { setIsSignUp(!isSignUp); setLocalError(''); }}
                    >
                        {isSignUp ? 'Sign In' : 'Sign Up'}
                    </button>
                </p>

                <button className="auth-btn secondary" onClick={onDismiss}>
                    Skip — use offline mode
                </button>
            </div>
        </div>
    );
}
