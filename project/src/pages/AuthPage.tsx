import { useState } from 'react';
import { useAuth } from '../hooks/AuthContext';

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) setError(error.message);
    } else {
      const { error } = await signUp(email, password);
      if (error) setError(error.message);
      else setMessage('Check your email to confirm your account!');
    }

    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#141010',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{
        backgroundColor: '#1e1a1a',
        borderRadius: '16px',
        padding: '40px',
        width: '100%',
        maxWidth: '400px',
      }}>
        <h1 style={{ color: '#e2ddd5', textAlign: 'center', marginBottom: '8px', fontSize: '28px' }}>
          BookVibe
        </h1>
        <p style={{ color: '#9e9a94', textAlign: 'center', marginBottom: '32px' }}>
          {isLogin ? 'Welcome back!' : 'Create your account'}
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: '#2a2525',
                border: '1px solid #3a3535',
                borderRadius: '8px',
                color: '#e2ddd5',
                fontSize: '16px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: '#2a2525',
                border: '1px solid #3a3535',
                borderRadius: '8px',
                color: '#e2ddd5',
                fontSize: '16px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <p style={{ color: '#ff6b6b', marginBottom: '16px', textAlign: 'center', fontSize: '14px' }}>
              {error}
            </p>
          )}

          {message && (
            <p style={{ color: '#6bff9e', marginBottom: '16px', textAlign: 'center', fontSize: '14px' }}>
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#c4a35a',
              border: 'none',
              borderRadius: '8px',
              color: '#141010',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Loading...' : isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <p style={{ color: '#9e9a94', textAlign: 'center', marginTop: '24px', fontSize: '14px' }}>
          {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
          <span
            onClick={() => { setIsLogin(!isLogin); setError(''); setMessage(''); }}
            style={{ color: '#c4a35a', cursor: 'pointer' }}
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </span>
        </p>
      </div>
    </div>
  );
}
