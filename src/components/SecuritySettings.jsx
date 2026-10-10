import React, { useState } from 'react';
import '../styles/SecuritySettings.css';

export default function SecuritySettings({ passwordEnabled, onStatusChange }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSetPassword = async () => {
    setError(null);
    if (newPassword.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setSaving(true);
    try {
      await window.api.setPassword(newPassword);
      setNewPassword('');
      setConfirmPassword('');
      onStatusChange(true);
    } catch (err) {
      console.error('Error setting password:', err);
      setError('Could not set the password. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemovePassword = async () => {
    setSaving(true);
    try {
      await window.api.removePassword();
      onStatusChange(false);
    } catch (err) {
      console.error('Error removing password:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="security-settings">
      <p className="security-description">
        Lock the app with a password. Everything stays on this Mac either way — this
        just adds a screen before the diary opens.
      </p>

      {passwordEnabled ? (
        <div className="password-status enabled">
          <span>Password protection is on.</span>
          <button onClick={handleRemovePassword} className="btn-remove-password" disabled={saving}>
            {saving ? 'Removing...' : 'Turn off'}
          </button>
        </div>
      ) : (
        <div className="password-form">
          {error && <div className="form-error">{error}</div>}
          <div className="form-group">
            <label>New password:</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Confirm password:</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <button onClick={handleSetPassword} className="btn-save" disabled={saving}>
            {saving ? 'Saving...' : 'Enable password'}
          </button>
        </div>
      )}
    </div>
  );
}
