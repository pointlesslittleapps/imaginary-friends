import React, { useState } from 'react';
import '../styles/LockScreen.css';

export default function LockScreen({ appName, onUnlock }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(false);
    setChecking(true);
    try {
      const valid = await window.api.verifyPassword(password);
      if (valid) {
        onUnlock();
      } else {
        setError(true);
        setPassword('');
      }
    } catch (err) {
      console.error('Error verifying password:', err);
      setError(true);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="lock-screen">
      <form className="lock-card" onSubmit={handleSubmit}>
        <div className="lock-icon">🔒</div>
        <h2>{appName}</h2>
        <p>Enter your password to continue.</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          className={error ? 'input-error' : ''}
        />
        {error && <div className="lock-error">Incorrect password. Try again.</div>}
        <button type="submit" disabled={checking || !password}>
          {checking ? 'Checking...' : 'Unlock'}
        </button>
      </form>
    </div>
  );
}
