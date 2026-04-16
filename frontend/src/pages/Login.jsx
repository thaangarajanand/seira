import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL as API } from '../api';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'customer', companyName: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const update = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const url = isLogin ? `${API}/api/auth/login` : `${API}/api/auth/register`;
    const payload = isLogin
      ? { email: form.email.trim(), password: form.password }
      : { name: form.name, email: form.email.trim(), password: form.password, role: form.role, companyName: form.role === 'company' ? form.companyName : undefined };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');

      if (isLogin) {
        login(data.user, data.token);
        navigate(data.user.role === 'customer' ? '/user-home' : '/dashboard');
      } else {
        setSuccess('Registration successful! Please sign in.');
        setIsLogin(true);
        setForm(f => ({ ...f, password: '' }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
            <img src="/logo.jpeg" alt="SEIRA" style={{ height: '48px', borderRadius: '8px' }} />
            <span style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--slate-900)' }}>SEIRA</span>
          </div>
          <h1 className="login-title">
            {isLogin ? 'Welcome back' : 'Create an account'}
          </h1>
        </div>

        {error && <div className="error-box" style={{ marginBottom: 16 }}>{error}</div>}
        {success && <div className="success-box" style={{ marginBottom: 16 }}>{success}</div>}

        <form className="login-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <div>
                <label className="form-label">Full Name</label>
                <input className="form-input" type="text" required value={form.name} onChange={update('name')} placeholder="Your full name" />
              </div>
              <div>
                <label className="form-label">I am a</label>
                <select className="form-input" value={form.role} onChange={update('role')}>
                  <option value="customer">Customer (Buyer)</option>
                  <option value="company">Manufacturing Company (Seller)</option>
                </select>
              </div>
              {form.role === 'company' && (
                <div>
                  <label className="form-label">Company Name</label>
                  <input className="form-input" type="text" required value={form.companyName} onChange={update('companyName')} placeholder="Your company name" />
                </div>
              )}
            </>
          )}

          <div>
            <label className="form-label">Email</label>
            <input className="form-input" type="email" required value={form.email} onChange={update('email')} placeholder="you@example.com" />
          </div>
          <div>
            <label className="form-label">Password</label>
            <input className="form-input" type="password" required value={form.password} onChange={update('password')} placeholder="••••••••" />
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="login-toggle">
          <button onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess(''); }}>
            {isLogin ? "Don't have an account? Register" : 'Already have an account? Sign in'}
          </button>
        </div>

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: '.75rem', color: 'var(--slate-400)' }}>
          By continuing you agree to our{' '}
          <Link to="/terms" style={{ color: 'var(--teal-600)' }}>Terms</Link> &{' '}
          <Link to="/privacy" style={{ color: 'var(--teal-600)' }}>Privacy Policy</Link>
        </div>
      </div>
    </div>
  );
}
