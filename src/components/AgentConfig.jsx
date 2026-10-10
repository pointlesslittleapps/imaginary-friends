import React, { useState, useRef } from 'react';
import '../styles/AgentConfig.css';

const AVATAR_CHOICES = ['🤖', '🌿', '🎨', '📚', '💡', '🧭', '🔥', '🌙', '⚡', '🦋', '🐢', '🧠'];

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function emptyForm() {
  return {
    name: '',
    personality: '',
    topics: '',
    avatar: '🤖',
    status: '',
    signature: '',
    statusOptions: '',
    signatureOptions: '',
  };
}

export default function AgentConfig({ agents, activeAgent, onSelectAgent, onAgentsChanged, onClose, embedded, buttonLabels = {} }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const openCreateForm = () => {
    setEditingId(null);
    setForm(emptyForm());
    setError(null);
    setShowForm(true);
  };

  const openEditForm = (agent) => {
    setEditingId(agent.id);
    setForm({
      name: agent.name,
      personality: agent.personality,
      topics: (agent.topics || []).join(', '),
      avatar: agent.avatar || '🤖',
      status: agent.status || '',
      signature: agent.signature || '',
      statusOptions: (agent.statusOptions || []).join('\n'),
      signatureOptions: (agent.signatureOptions || []).join('\n'),
    });
    setError(null);
    setShowForm(true);
  };

  const handleAvatarFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please choose an image or GIF file.');
      return;
    }
    const dataUrl = await readFileAsDataUrl(file);
    setForm(f => ({ ...f, avatar: dataUrl }));
  };

  const handleSave = async () => {
    setError(null);
    if (!form.name.trim() || !form.personality.trim()) {
      setError('Name and personality are required.');
      return;
    }

    const topics = form.topics.split(',').map(t => t.trim()).filter(Boolean);
    const statusOptions = form.statusOptions.split('\n').map(s => s.trim()).filter(Boolean);
    const signatureOptions = form.signatureOptions.split('\n').map(s => s.trim()).filter(Boolean);

    const payload = {
      name: form.name.trim(),
      personality: form.personality.trim(),
      topics,
      avatar: form.avatar,
      status: form.status.trim(),
      signature: form.signature.trim(),
      statusOptions,
      signatureOptions,
    };

    setSaving(true);
    try {
      if (editingId) {
        await window.api.updateAgent(editingId, payload);
      } else {
        await window.api.createAgent(payload);
      }
      setShowForm(false);
      setForm(emptyForm());
      setEditingId(null);
      if (onAgentsChanged) await onAgentsChanged();
    } catch (err) {
      console.error('Error saving agent:', err);
      setError('Could not save the agent. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const isImageAvatar = form.avatar && form.avatar.startsWith('data:');

  const renderCard = (agent, isActive) => (
    <div key={agent.id} className={`agent-card ${isActive ? 'active' : ''}`}>
      <div className="agent-card-top" onClick={() => !isActive && onSelectAgent(agent)}>
        <span className="agent-avatar-display">
          {agent.avatar && agent.avatar.startsWith('data:')
            ? <img src={agent.avatar} alt="" />
            : agent.avatar || '🤖'}
        </span>
        <div>
          <div className="agent-card-name">{agent.name}</div>
          {agent.status && <div className="agent-card-status">{agent.status}</div>}
        </div>
      </div>
      <div className="agent-personality">{agent.personality}</div>
      <div className="agent-topics">
        <strong>Topics:</strong>
        <div className="topics-list">
          {(agent.topics || []).map(topic => (
            <span key={topic} className="topic-badge">{topic}</span>
          ))}
        </div>
      </div>
      <button type="button" className="btn-edit-agent" onClick={() => openEditForm(agent)}>
        Edit
      </button>
    </div>
  );

  return (
    <div className="agent-config">
      {!embedded && (
        <div className="config-header">
          <h2>Agents</h2>
          <button onClick={onClose} className="btn-close">×</button>
        </div>
      )}

      <div className="config-content">
        <section className="section">
          <h3>Current agent</h3>
          {activeAgent && renderCard(activeAgent, true)}
        </section>

        <section className="section">
          <h3>Other agents</h3>
          <div className="agents-list">
            {agents.filter(a => a.id !== activeAgent?.id).map(a => renderCard(a, false))}
            {agents.length <= 1 && <p className="empty-hint">No other agents yet.</p>}
          </div>
        </section>

        <section className="section">
          {!showForm ? (
            <button onClick={openCreateForm} className="btn-create-agent">
              {buttonLabels.createAgent || '+ Create agent'}
            </button>
          ) : (
            <div className="new-agent-form">
              <h3>{editingId ? 'Edit agent' : 'Create new agent'}</h3>
              {error && <div className="form-error">{error}</div>}

              <div className="form-group">
                <label>Avatar:</label>
                <div className="avatar-picker-row">
                  <div className="avatar-picker">
                    {AVATAR_CHOICES.map(a => (
                      <button
                        type="button"
                        key={a}
                        className={`avatar-choice ${form.avatar === a ? 'selected' : ''}`}
                        onClick={() => setForm(f => ({ ...f, avatar: a }))}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                  <div className="avatar-upload-inline">
                    <div className="avatar-preview-small">
                      {isImageAvatar ? <img src={form.avatar} alt="" /> : <span>{form.avatar}</span>}
                    </div>
                    <button type="button" className="btn-upload" onClick={() => fileInputRef.current?.click()}>
                      Upload image
                    </button>
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                      onChange={handleAvatarFile}
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Agent name:</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Career Coach"
                />
              </div>

              <div className="form-group">
                <label>Personality and background:</label>
                <textarea
                  value={form.personality}
                  onChange={(e) => setForm(f => ({ ...f, personality: e.target.value }))}
                  placeholder="Describe the agent's personality and background..."
                  rows="4"
                />
              </div>

              <div className="form-group">
                <label>Topics (comma-separated):</label>
                <input
                  type="text"
                  value={form.topics}
                  onChange={(e) => setForm(f => ({ ...f, topics: e.target.value }))}
                  placeholder="career, goals, confidence"
                />
              </div>

              <div className="form-group">
                <label>Current status (shown under avatar):</label>
                <input
                  type="text"
                  value={form.status}
                  onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))}
                  placeholder="e.g. sipping tea"
                />
              </div>

              <div className="form-group">
                <label>Status options (one per line — the agent randomly picks from these over time):</label>
                <textarea
                  value={form.statusOptions}
                  onChange={(e) => setForm(f => ({ ...f, statusOptions: e.target.value }))}
                  placeholder={"sipping tea\nlost in thought\nfeeling curious"}
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Current signature:</label>
                <input
                  type="text"
                  value={form.signature}
                  onChange={(e) => setForm(f => ({ ...f, signature: e.target.value }))}
                  placeholder="e.g. — always here to listen"
                />
              </div>

              <div className="form-group">
                <label>Signature options (one per line):</label>
                <textarea
                  value={form.signatureOptions}
                  onChange={(e) => setForm(f => ({ ...f, signatureOptions: e.target.value }))}
                  placeholder={"— always here to listen\n— with warmth, always"}
                  rows="3"
                />
              </div>

              <div className="form-actions">
                <button onClick={handleSave} className="btn-save" disabled={saving}>
                  {saving ? 'Saving...' : editingId ? 'Save changes' : 'Create'}
                </button>
                <button
                  onClick={() => { setShowForm(false); setError(null); }}
                  className="btn-cancel"
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
