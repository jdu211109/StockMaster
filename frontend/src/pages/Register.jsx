import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { UserPlus, Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react';

export default function Register() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        full_name: '',
        role: 'staff'
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { register } = useAuthStore();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await register(formData);
            setSuccess(true);
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="card" style={{ textAlign: 'center' }}>
                    <CheckCircle size={48} style={{ color: 'var(--color-success)', marginBottom: 'var(--space-md)' }} />
                    <h2>Registration Successful!</h2>
                    <p className="text-muted">Redirecting to login...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-lg)' }}>
            <div className="card slide-up" style={{ width: '100%', maxWidth: 400 }}>
                <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
                    <h1 style={{
                        fontSize: 'var(--font-size-2xl)',
                        fontWeight: 700,
                        background: 'var(--color-accent-gradient)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: 'var(--space-sm)'
                    }}>
                        Create Account
                    </h1>
                    <p className="text-muted">Join StockMaster today</p>
                </div>

                {error && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
                        padding: 'var(--space-md)', background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-md)',
                        color: 'var(--color-danger)', marginBottom: 'var(--space-lg)', fontSize: 'var(--font-size-sm)'
                    }}>
                        <AlertCircle size={18} />{error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <div style={{ position: 'relative' }}>
                            <User size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                            <input type="text" className="input" style={{ paddingLeft: 40 }} placeholder="John Doe"
                                value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} required />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                            <input type="email" className="input" style={{ paddingLeft: 40 }} placeholder="you@example.com"
                                value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                            <input type="password" className="input" style={{ paddingLeft: 40 }} placeholder="••••••••" minLength={8}
                                value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 'var(--space-lg)' }} disabled={isLoading}>
                        <UserPlus size={18} />{isLoading ? 'Creating account...' : 'Create Account'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: 'var(--space-lg)', fontSize: 'var(--font-size-sm)' }}>
                    Already have an account? <Link to="/login">Sign in</Link>
                </p>
            </div>
        </div>
    );
}
