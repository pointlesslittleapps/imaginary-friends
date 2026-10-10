import React, { useState, useEffect } from 'react';
import '../styles/ColorField.css';

const HEX_PATTERN = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

export default function ColorField({ label, value, onChange }) {
  const [hexInput, setHexInput] = useState(value);

  useEffect(() => {
    setHexInput(value);
  }, [value]);

  const commitIfValid = (val) => {
    if (HEX_PATTERN.test(val)) {
      onChange(val);
    }
  };

  const handleHexChange = (e) => {
    let val = e.target.value;
    if (val && !val.startsWith('#')) val = '#' + val;
    setHexInput(val);
    commitIfValid(val);
  };

  const handleHexBlur = () => {
    if (!HEX_PATTERN.test(hexInput)) {
      // Revert to last valid value
      setHexInput(value);
    }
  };

  const handleSwatchChange = (e) => {
    const val = e.target.value;
    setHexInput(val);
    onChange(val);
  };

  return (
    <div className="color-field">
      {label && <span className="color-field-label">{label}</span>}
      <div className="color-field-controls">
        <input
          type="text"
          className="color-field-hex"
          value={hexInput}
          onChange={handleHexChange}
          onBlur={handleHexBlur}
          spellCheck={false}
          maxLength={7}
        />
        <input
          type="color"
          className="color-field-swatch"
          value={HEX_PATTERN.test(hexInput) ? hexInput : value}
          onChange={handleSwatchChange}
          title="Pick visually"
        />
      </div>
    </div>
  );
}
