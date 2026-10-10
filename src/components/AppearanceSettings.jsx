import React, { useState, useEffect, useRef } from 'react';
import ColorField from './ColorField.jsx';
import { detectInstalledFonts } from '../utils/fontDetector.js';
import '../styles/AppearanceSettings.css';

const COLOR_FIELDS = [
  { key: 'primary', label: 'Primary (buttons, links)' },
  { key: 'accent', label: 'Accent (send button)' },
  { key: 'background', label: 'Page background' },
  { key: 'surface', label: 'Cards and panels' },
  { key: 'text', label: 'Body text' },
];

const MAX_AVATAR_DIMENSION = 72;

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function AppearanceSettings({ settings, onUpdate }) {
  const [appName, setAppName] = useState(settings.appName);
  const [username, setUsername] = useState(settings.username);
  const [userStatus, setUserStatus] = useState(settings.userStatus);
  const [userSignature, setUserSignature] = useState(settings.userSignature);
  const [theme, setTheme] = useState(settings.theme);
  const [userAvatar, setUserAvatar] = useState(settings.userAvatar);
  const [fontFamily, setFontFamily] = useState(settings.fontFamily);
  const [availableFonts, setAvailableFonts] = useState([]);
  const [detectingFonts, setDetectingFonts] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setAppName(settings.appName);
    setUsername(settings.username);
    setUserStatus(settings.userStatus);
    setUserSignature(settings.userSignature);
    setTheme(settings.theme);
    setUserAvatar(settings.userAvatar);
    setFontFamily(settings.fontFamily);
  }, [settings]);

  const flashSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  };

  const handleDetectFonts = () => {
    setDetectingFonts(true);
    // Run on next tick so the "Detecting..." label paints first
    setTimeout(() => {
      const fonts = detectInstalledFonts();
      setAvailableFonts(fonts);
      setDetectingFonts(false);
    }, 50);
  };

  const handleColorChange = async (key, value) => {
    const newTheme = { ...theme, [key]: value };
    setTheme(newTheme);
    await onUpdate({ theme: newTheme });
    flashSaved();
  };

  const handleTextBlur = async (field, value, setter) => {
    const trimmed = value.trim();
    setter(trimmed);
    await onUpdate({ [field]: trimmed });
    flashSaved();
  };

  const handleFontChange = async (e) => {
    const value = e.target.value;
    setFontFamily(value);
    await onUpdate({ fontFamily: value });
    flashSaved();
  };

  const handleAvatarFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please choose an image or GIF file.');
      return;
    }
    const dataUrl = await readFileAsDataUrl(file);
    setUserAvatar(dataUrl);
    await onUpdate({ userAvatar: dataUrl });
    flashSaved();
  };

  const isImageAvatar = userAvatar && userAvatar.startsWith('data:');

  return (
    <div className="appearance-settings">
      {saved && <div className="saved-toast">Saved</div>}

      <div className="form-group">
        <label>App name:</label>
        <input
          type="text"
          value={appName}
          onChange={(e) => setAppName(e.target.value)}
          onBlur={() => handleTextBlur('appName', appName, setAppName)}
          maxLength={30}
        />
      </div>

      <div className="form-group">
        <label>Your username:</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onBlur={() => handleTextBlur('username', username, setUsername)}
          maxLength={30}
        />
      </div>

      <div className="form-group">
        <label>Your avatar:</label>
        <div className="avatar-upload-row">
          <div className="avatar-preview">
            {isImageAvatar ? (
              <img src={userAvatar} alt="Your avatar" />
            ) : (
              <span>{userAvatar}</span>
            )}
          </div>
          <button
            type="button"
            className="btn-upload"
            onClick={() => fileInputRef.current?.click()}
          >
            Upload image or GIF
          </button>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleAvatarFile}
          />
        </div>
        <p className="field-hint">Displayed at {MAX_AVATAR_DIMENSION}×{MAX_AVATAR_DIMENSION}px. GIF animation is preserved.</p>
      </div>

      <div className="form-group">
        <label>Your status (shown under your avatar):</label>
        <input
          type="text"
          value={userStatus}
          onChange={(e) => setUserStatus(e.target.value)}
          onBlur={() => handleTextBlur('userStatus', userStatus, setUserStatus)}
          placeholder="e.g. writing my morning pages"
          maxLength={60}
        />
      </div>

      <div className="form-group">
        <label>Your signature:</label>
        <input
          type="text"
          value={userSignature}
          onChange={(e) => setUserSignature(e.target.value)}
          onBlur={() => handleTextBlur('userSignature', userSignature, setUserSignature)}
          placeholder="e.g. — sent from my journal"
          maxLength={100}
        />
        <p className="field-hint">Added to a post only when you check "Add signature" in the composer.</p>
      </div>

      <div className="form-group">
        <label>Font:</label>
        {availableFonts.length === 0 ? (
          <button type="button" className="btn-detect-fonts" onClick={handleDetectFonts} disabled={detectingFonts}>
            {detectingFonts ? 'Detecting installed fonts...' : 'Detect fonts on this Mac'}
          </button>
        ) : (
          <select value={fontFamily} onChange={handleFontChange}>
            <option value="">System default</option>
            {availableFonts.map(f => (
              <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
            ))}
          </select>
        )}
      </div>

      <div className="form-group">
        <label>Color palette:</label>
        <div className="color-grid">
          {COLOR_FIELDS.map(field => (
            <ColorField
              key={field.key}
              label={field.label}
              value={theme[field.key]}
              onChange={(val) => handleColorChange(field.key, val)}
            />
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>Post accent (left border color):</label>
        <ColorField
          value={theme.postAccent}
          onChange={(val) => handleColorChange('postAccent', val)}
        />
      </div>
    </div>
  );
}
