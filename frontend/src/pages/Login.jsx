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
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [requireCaptcha, setRequireCaptcha] = useState(false);
  const [captchaQuestion, setCaptchaQuestion] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaExpected, setCaptchaExpected] = useState('');
  const [otp, setOtp] = useState('');
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false); // false | 'request' | 'reset'
  const [newPassword, setNewPassword] = useState('');
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
      ? { email: form.email.trim(), password: form.password, captchaAnswer, captchaExpected }
      : { name: form.name, email: form.email.trim(), password: form.password, role: form.role, companyName: form.role === 'company' ? form.companyName : undefined };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');

      if (isLogin) {
        login(data.user);
        setFailedAttempts(0);
        setRequireCaptcha(false);
        navigate(data.user.role === 'customer' ? '/user-home' : '/dashboard');
      } else {
        setSuccess('Registration successful! Please sign in.');
        setIsLogin(true);
        setForm(f => ({ ...f, password: '' }));
      }
    } catch (err) {
      setError(err.message);
      // Check if CAPTCHA is required from response
      // Note: We need to parse the response even if not OK to get custom fields
    } finally {
      setLoading(false);
    }
  };

  // Modified fetch to handle CAPTCHA from error responses
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email.trim(), password: form.password, captchaAnswer, captchaExpected }),
        credentials: 'include'
      });
      const data = await res.json();
      
      if (!res.ok) {
        if (data.requireCaptcha) {
          setRequireCaptcha(true);
          setCaptchaQuestion(data.captchaQuestion);
          setCaptchaExpected(data.captchaExpected);
          setCaptchaAnswer('');
        }
        throw new Error(data.error || 'Login failed');
      }

      login(data.user);
      setFailedAttempts(0);
      setRequireCaptcha(false);
      navigate(data.user.role === 'customer' ? '/user-home' : '/dashboard');
    } catch (err) {
      setError(err.message);
      if (isLogin) setFailedAttempts(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  };



  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send reset OTP');
      setSuccess(data.message);
      setForgotPasswordMode('reset');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email.trim(), otp, newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');
      setSuccess(data.message);
      setForgotPasswordMode(false);
      setOtp('');
      setNewPassword('');
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
            {forgotPasswordMode === 'request' ? 'Reset Password' : forgotPasswordMode === 'reset' ? 'Set New Password' : isLogin ? 'Welcome back' : 'Create an account'}
          </h1>
          {forgotPasswordMode === 'request' && <p style={{ fontSize: '.85rem', color: 'var(--slate-500)', marginTop: 8 }}>Enter your email to receive a password reset OTP.</p>}
        </div>

        {error && <div className="error-box" style={{ marginBottom: 16 }}>{error}</div>}
        {success && <div className="success-box" style={{ marginBottom: 16 }}>{success}</div>}
        {isLogin && failedAttempts >= 3 && !error.includes('Too many') && (
          <div style={{ padding: '12px', background: 'var(--amber-50)', border: '1px solid var(--amber-200)', borderRadius: '8px', color: 'var(--amber-700)', fontSize: '.85rem', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
            <span>⚠️ <strong>Warning:</strong> {failedAttempts} incorrect attempts. Too many failed logins will lock your account for 8 minutes and 23 seconds.</span>
          </div>
        )}

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
          
          {!forgotPasswordMode && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Password</label>
                {isLogin && (
                  <button type="button" onClick={() => { setForgotPasswordMode('request'); setError(''); setSuccess(''); }} style={{ fontSize: '.75rem', color: 'var(--teal-600)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                    Forgot password?
                  </button>
                )}
              </div>
              <input className="form-input" style={{ marginTop: 8 }} type="password" required value={form.password} onChange={update('password')} placeholder="••••••••" />
            </div>
          )}

          {!forgotPasswordMode && isLogin && requireCaptcha && (
            <div style={{ padding: '16px', background: 'var(--slate-50)', borderRadius: '12px', border: '1px solid var(--slate-200)', marginTop: 12 }}>
              <label className="form-label" style={{ color: 'var(--teal-700)', fontWeight: 800 }}>Security Verification</label>
              <p style={{ fontSize: '.85rem', color: 'var(--slate-600)', marginBottom: 12 }}>{captchaQuestion}</p>
              <input 
                className="form-input" 
                type="number" 
                required 
                value={captchaAnswer} 
                onChange={(e) => setCaptchaAnswer(e.target.value)} 
                placeholder="Enter answer" 
                style={{ background: '#fff' }}
              />
            </div>
          )}



          {forgotPasswordMode === 'reset' && (
            <>
              <div style={{ padding: '16px', background: 'var(--teal-50)', borderRadius: '12px', border: '1px solid var(--teal-200)', marginTop: 12 }}>
                <label className="form-label" style={{ color: 'var(--teal-700)', fontWeight: 800 }}>Enter Reset OTP</label>
                <input 
                  className="form-input" 
                  type="text" 
                  required 
                  value={otp} 
                  onChange={(e) => setOtp(e.target.value)} 
                  placeholder="000000" 
                  maxLength={6}
                  style={{ background: '#fff', fontSize: '1.25rem', letterSpacing: '0.2em', textAlign: 'center' }}
                />
              </div>
              <div style={{ marginTop: 16 }}>
                <label className="form-label">New Password</label>
                <input className="form-input" type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password (min 6 chars)" minLength={6} />
              </div>
            </>
          )}

          <button type="submit" className="btn-submit" disabled={loading} onClick={
            forgotPasswordMode === 'request' ? handleForgotPassword : 
            forgotPasswordMode === 'reset' ? handleResetPassword : 
            isLogin ? handleLoginSubmit : handleSubmit
          }>
            {loading ? 'Please wait...' : 
             forgotPasswordMode === 'request' ? 'Send Reset OTP' : 
             forgotPasswordMode === 'reset' ? 'Confirm New Password' : 
             (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="login-toggle">
          {forgotPasswordMode ? (
            <button onClick={() => { setForgotPasswordMode(false); setError(''); setSuccess(''); }}>
              Back to Login
            </button>
          ) : (
            <button onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess(''); setFailedAttempts(0); }}>
              {isLogin ? "Don't have an account? Register" : 'Already have an account? Sign in'}
            </button>
          )}
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
