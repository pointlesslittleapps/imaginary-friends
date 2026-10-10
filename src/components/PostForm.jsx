import React, { useState, useRef } from 'react';
import '../styles/PostForm.css';

const TOOLBAR_BUTTONS = [
  { label: 'B', title: 'Bold', before: '[b]', after: '[/b]', style: { fontWeight: 700 } },
  { label: 'I', title: 'Italic', before: '[i]', after: '[/i]', style: { fontStyle: 'italic' } },
  { label: 'U', title: 'Underline', before: '[u]', after: '[/u]', style: { textDecoration: 'underline' } },
  { label: '</>', title: 'Code', before: '[code]', after: '[/code]', style: { fontFamily: 'monospace', fontSize: '11px' } },
  { label: '"', title: 'Quote', before: '[quote]', after: '[/quote]', style: { fontSize: '15px' } },
  { label: '🔗', title: 'Link', before: '[url=https://]', after: '[/url]', style: {} },
];

export default function PostForm({ onSubmit, availableTags = [], buttonLabels = {}, userSignature = '' }) {
  const [content, setContent] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [includeSignature, setIncludeSignature] = useState(false);
  const textareaRef = useRef(null);

  const handleAddTag = (tagName) => {
    const tag = (tagName || tagInput).trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const submitPost = () => {
    if (content.trim()) {
      const finalContent = includeSignature && userSignature
        ? `${content}\n\n— ${userSignature}`
        : content;
      onSubmit(finalContent, tags);
      setContent('');
      setTags([]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    submitPost();
  };

  const handleContentKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitPost();
    }
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const applyFormat = (before, after) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.slice(start, end);
    const newText = content.slice(0, start) + before + selected + after + content.slice(end);

    setContent(newText);

    requestAnimationFrame(() => {
      textarea.focus();
      const cursorStart = start + before.length;
      const cursorEnd = cursorStart + selected.length;
      textarea.setSelectionRange(cursorStart, cursorEnd);
    });
  };

  const suggestions = availableTags
    .filter(t => !tags.includes(t.name))
    .slice(0, 8);

  return (
    <form className="post-form" onSubmit={handleSubmit}>
      <div className="composer-toolbar">
        {TOOLBAR_BUTTONS.map(btn => (
          <button
            key={btn.label}
            type="button"
            className="toolbar-btn"
            title={btn.title}
            style={btn.style}
            onClick={() => applyFormat(btn.before, btn.after)}
          >
            {btn.label}
          </button>
        ))}
      </div>

      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleContentKeyDown}
        placeholder="Share your thoughts... (Enter to post, Shift+Enter for a new line)"
        className="post-textarea"
      />

      <div className="post-form-bottom">
        <div className="tags-section">
          <div className="tag-input-group">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder="Add a tag..."
              className="tag-input"
            />
            <button type="button" onClick={() => handleAddTag()} className="btn-add-tag">
              +
            </button>
          </div>

          {tags.length > 0 && (
            <div className="tags-display">
              {tags.map(tag => (
                <span key={tag} className="tag-chip">
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="tag-remove"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="tag-suggestions">
              {suggestions.map(t => (
                <button
                  key={t.name}
                  type="button"
                  className="tag-suggestion"
                  onClick={() => handleAddTag(t.name)}
                  title={'Used ' + t.usage_count + ' time' + (t.usage_count === 1 ? '' : 's')}
                >
                  {t.name}
                </button>
              ))}
            </div>
          )}

          {userSignature && (
            <label className="signature-toggle">
              <input
                type="checkbox"
                checked={includeSignature}
                onChange={(e) => setIncludeSignature(e.target.checked)}
              />
              Add signature
            </label>
          )}
        </div>

        <button type="submit" className="btn-submit">
          {buttonLabels.post || 'Post'}
        </button>
      </div>
    </form>
  );
}
