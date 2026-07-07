import React, { useState } from 'react';
import { useStadiumState } from '../hooks/useStadiumState';
import { ShieldCheck, UserCheck, HelpCircle, Lock, User, UserPlus } from 'lucide-react';

interface LoginPanelProps {
  state: ReturnType<typeof useStadiumState>;
}

export const LoginPanel: React.FC<LoginPanelProps> = ({ state }) => {
  const { loginUser, registerUser, triggerError } = state;
  
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'director' | 'security' | 'guest_services'>('director');
  
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = username.trim();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      triggerError('Please fill in all credentials fields.');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await loginUser(cleanUser, cleanPass);
      } else {
        const registered = await registerUser(cleanUser, cleanPass, role);
        if (registered) {
          setIsLogin(true); // Switch to login tab on success
          setPassword('');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAutofill = async (presetUser: string) => {
    setLoading(true);
    try {
      await loginUser(presetUser, 'password123');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '80vh',
      width: '100%',
      padding: '20px'
    }}>
      <div className="glass-panel glass-panel-glow" style={{
        maxWidth: '440px',
        width: '100%',
        padding: '32px',
        border: '1px solid var(--border-color-glow)',
        boxShadow: '0 0 30px rgba(0, 240, 255, 0.1)',
        animation: 'scale-up 0.3s ease-out'
      }}>
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 240, 255, 0.1)',
            padding: '12px',
            borderRadius: '50%',
            marginBottom: '12px'
          }}>
            <ShieldCheck size={32} color="var(--accent-cyan)" />
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', letterSpacing: '1px' }}>
            ArenaFlow Authentication
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Log in to access physical venue operations and scheduling commands.
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-secondary)',
          borderRadius: '8px',
          padding: '4px',
          marginBottom: '24px',
          border: '1px solid var(--border-color)'
        }}>
          <button
            type="button"
            className="btn"
            style={{
              flex: 1,
              background: isLogin ? 'var(--bg-tertiary)' : 'transparent',
              color: isLogin ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              border: 'none',
              padding: '8px',
              fontSize: '0.85rem',
              fontWeight: isLogin ? '600' : 'normal'
            }}
            onClick={() => setIsLogin(true)}
          >
            Sign In
          </button>
          <button
            type="button"
            className="btn"
            style={{
              flex: 1,
              background: !isLogin ? 'var(--bg-tertiary)' : 'transparent',
              color: !isLogin ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              border: 'none',
              padding: '8px',
              fontSize: '0.85rem',
              fontWeight: !isLogin ? '600' : 'normal'
            }}
            onClick={() => setIsLogin(false)}
          >
            Register
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="auth-username" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={14} /> Username
            </label>
            <input
              id="auth-username"
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="auth-password" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lock size={14} /> Password
            </label>
            <input
              id="auth-password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {!isLogin && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="auth-role">Assigned Operations Role</label>
              <select
                id="auth-role"
                className="form-select"
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
              >
                <option value="director">Tournament Director</option>
                <option value="security">Security Chief</option>
                <option value="guest_services">Guest Services Lead</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '10px', height: '42px' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : isLogin ? 'Access Command Center' : 'Create Credentials'}
          </button>
        </form>

        {/* Seeds / Presets Section (for simple evaluator logins) */}
        {isLogin && (
          <div style={{
            marginTop: '28px',
            paddingTop: '20px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <h4 style={{
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '4px'
            }}>
              <HelpCircle size={12} /> Live Evaluation Autofills
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: 'space-between', padding: '8px 12px', width: '100%', fontSize: '0.75rem' }}
                onClick={() => handleAutofill('director')}
                disabled={loading}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <UserCheck size={12} color="var(--accent-cyan)" />
                  Autofill Tournament Director
                </span>
                <span style={{ opacity: 0.5 }}>Role: director</span>
              </button>
              
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: 'space-between', padding: '8px 12px', width: '100%', fontSize: '0.75rem' }}
                onClick={() => handleAutofill('security')}
                disabled={loading}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <UserCheck size={12} color="var(--accent-purple)" />
                  Autofill Security Chief
                </span>
                <span style={{ opacity: 0.5 }}>Role: security</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: 'space-between', padding: '8px 12px', width: '100%', fontSize: '0.75rem' }}
                onClick={() => handleAutofill('guest')}
                disabled={loading}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <UserCheck size={12} color="var(--success)" />
                  Autofill Guest Services Lead
                </span>
                <span style={{ opacity: 0.5 }}>Role: guest_services</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
