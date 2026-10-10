import React, { useState } from 'react';
import '../styles/ContentFilters.css';

export default function ContentFilters({ words, onSave }) {
  const [list, setList] = useState(words);
  const [input, setInput] = useState('');
  const [saved, setSaved] = useState(false);

  const flashSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  };

  const commit = async (newList) => {
    setList(newList);
    await onSave(newList);
    flashSaved();
  };

  const handleAdd = () => {
    const term = input.trim();
    if (term && !list.includes(term)) {
      commit([...list, term]);
    }
    setInput('');
  };

  const handleRemove = (term) => {
    commit(list.filter(w => w !== term));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="content-filters">
      {saved && <div className="saved-toast">Saved</div>}

      <p className="filters-description">
        These words and topics are off-limits for every agent, no matter which one
        is active. Agents are instructed to avoid bringing them up entirely.
      </p>

      <div className="filter-input-group">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a forbidden word or topic..."
        />
        <button type="button" onClick={handleAdd}>Add</button>
      </div>

      {list.length === 0 ? (
        <p className="empty-hint">No restrictions set.</p>
      ) : (
        <div className="filter-list">
          {list.map(term => (
            <span key={term} className="filter-chip">
              {term}
              <button type="button" onClick={() => handleRemove(term)}>×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
