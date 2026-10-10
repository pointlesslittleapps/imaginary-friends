import React, { useState, useEffect } from 'react';
import '../styles/ButtonLabelsSettings.css';

const LABEL_FIELDS = [
  { key: 'post', label: 'Post button (composer)', placeholder: 'Post' },
  { key: 'edit', label: 'Edit button (on your posts)', placeholder: 'Edit' },
  { key: 'delete', label: 'Delete button (on your posts)', placeholder: 'Delete' },
  { key: 'save', label: 'Save button (editing a post)', placeholder: 'Save' },
  { key: 'cancel', label: 'Cancel button (editing a post)', placeholder: 'Cancel' },
  { key: 'createAgent', label: 'Create agent button', placeholder: '+ Create agent' },
  { key: 'clearFilters', label: 'Clear filters button', placeholder: 'Clear filters' },
];

export default function ButtonLabelsSettings({ buttonLabels, onUpdate }) {
  const [labels, setLabels] = useState(buttonLabels);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLabels(buttonLabels);
  }, [buttonLabels]);

  const flashSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  };

  const handleChange = (key, value) => {
    setLabels(prev => ({ ...prev, [key]: value }));
  };

  const handleBlur = async (key) => {
    const value = (labels[key] || '').trim() || LABEL_FIELDS.find(f => f.key === key).placeholder;
    const updated = { ...labels, [key]: value };
    setLabels(updated);
    await onUpdate({ buttonLabels: updated });
    flashSaved();
  };

  return (
    <div className="button-labels-settings">
      {saved && <div className="saved-toast">Saved</div>}
      <p className="labels-description">
        Rename any button in the app. The behavior stays the same — only the text changes.
      </p>
      {LABEL_FIELDS.map(field => (
        <div key={field.key} className="form-group">
          <label>{field.label}:</label>
          <input
            type="text"
            value={labels[field.key] ?? ''}
            onChange={(e) => handleChange(field.key, e.target.value)}
            onBlur={() => handleBlur(field.key)}
            placeholder={field.placeholder}
            maxLength={24}
          />
        </div>
      ))}
    </div>
  );
}
