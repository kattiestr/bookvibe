import { useState } from 'react';
import { useAuth } from '../hooks/AuthContext';
import { getSupabase } from '../lib/supabaseClient';
import { LogOut, Lock, Mail } from 'lucide-react';

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChangePassword = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMessage(''); setError('');
    const { client } = getSupabase();
    if (!client) return;
    const { error } = await client.auth.updateUser({ password: newPassword });
    if (error) setError(error.message);
    else { setMessage('Password updated!'); setNewPassword(''); }
  };

  const handleChangeEmail = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMessage(''); setError('');
    const { client } = getSupabase();
    if (!client) return;
    const { error } = await client.auth.updateUser({ email: newEmail });
    if (error) setError(error.message);
    else { setMessage('Check your new email to confirm!'); setNewEmail(''); }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#141010',
      color: '#e2ddd5',
      padding: '40px 20px 100px',
      maxWidth: '500px',
      margin: '0 auto',
    }}>
      <h1 style={{ fontSize: '24px', marginBottom: '32px' }}>Settings</h1>

      <div style={{
        backgroundColor: '#1e1a1a',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '16px',
        fontSize: '14px',
        color: '#9e9a94',
      }}>
        Logged in as: <span style={{ color: '#e2ddd5' }}>{user?.email}</span>
      </div>

      {/* Сменить пароль */}
      <div style={{
        backgroundColor: '#1e1a1a',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Lock size={18} color='#c4a07c' />
          <span style={{ fontWeight: 'bold' }}>Change Password</span>
        </div>
        <input
          type="password"
          placeholder="New password"
          value={newPassword}
          autoComplete="new-password"
          onChange={(e) => setNewPassword(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 14px',
            backgroundColor: '#2a2525',
            border: '1px solid #3a3535',
            borderRadius: '8px',
            color: '#e2ddd5',
            fontSize: '15px',
            boxSizing: 'border-box',
            marginBottom: '10px',
          }}
        />
        <button
          onClick={handleChangePassword}
          disabled={!newPassword}
          style={{
            padding: '10px 20px',
            backgroundColor: '#c4a35a',
            border: 'none',
            borderRadius: '8px',
            color: '#141010',
            fontWeight: 'bold',
            cursor: 'pointer',
            opacity: newPassword ? 1 : 0.5,
          }}
        >
          Update Password
        </button>
      </div>

      {/* Сменить email */}
      <div style={{
        backgroundColor: '#1e1a1a',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Mail size={18} color='#c4a07c' />
          <span style={{ fontWeight: 'bold' }}>Change Email</span>
        </div>
        <input
          type="email"
          placeholder="New email"
          value={newEmail}
          autoComplete="off"
          onChange={(e) => setNewEmail(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 14px',
            backgroundColor: '#2a2525',
            border: '1px solid #3a3535',
            borderRadius: '8px',
            color: '#e2ddd5',
            fontSize: '15px',
            boxSizing: 'border-box',
            marginBottom: '10px',
          }}
        />
        <button
          onClick={handleChangeEmail}
          disabled={!newEmail}
          style={{
            padding: '10px 20px',
            backgroundColor: '#c4a35a',
            border: 'none',
            borderRadius: '8px',
            color: '#141010',
            fontWeight: 'bold',
            cursor: 'pointer',
            opacity: newEmail ? 1 : 0.5,
          }}
        >
          Update Email
        </button>
      </div>

      {message && <p style={{ color: '#6bff9e', marginBottom: '16px' }}>{message}</p>}
      {error && <p style={{ color: '#ff6b6b', marginBottom: '16px' }}>{error}</p>}

      {/* Выход */}
      <button
        onClick={signOut}
        style={{
          width: '100%',
          padding: '14px',
          backgroundColor: '#3a1a1a',
          border: '1px solid #ff4444',
          borderRadius: '12px',
          color: '#ff6b6b',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          marginTop: '8px',
        }}
      >
        <LogOut size={18} />
        Sign Out
      </button>
    </div>
  );
}
