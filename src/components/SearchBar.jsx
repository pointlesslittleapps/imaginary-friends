import React, { useState } from 'react';
import '../styles/SearchBar.css';

export default function SearchBar({ onSearch, buttonLabels = {} }) {
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const triggerSearch = (selectedTags, searchKeyword, from, to) => {
    const hasAny = selectedTags.length > 0 || searchKeyword || from || to;
    if (!hasAny) {
      onSearch(null);
      return;
    }
    onSearch({
      tags: selectedTags,
      keyword: searchKeyword,
      dateRange: {
        from: from ? new Date(from) : null,
        to: to ? new Date(to + 'T23:59:59') : null,
      },
    });
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      const newTags = [...tags, tagInput.trim()];
      setTags(newTags);
      setTagInput('');
      triggerSearch(newTags, keyword, fromDate, toDate);
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    setTags(newTags);
    triggerSearch(newTags, keyword, fromDate, toDate);
  };

  const handleClearAll = () => {
    setTags([]);
    setKeyword('');
    setFromDate('');
    setToDate('');
    onSearch(null);
  };

  const handleKeywordChange = (value) => {
    setKeyword(value);
    triggerSearch(tags, value, fromDate, toDate);
  };

  const handleFromDateChange = (value) => {
    setFromDate(value);
    triggerSearch(tags, keyword, value, toDate);
  };

  const handleToDateChange = (value) => {
    setToDate(value);
    triggerSearch(tags, keyword, fromDate, value);
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const hasFilters = tags.length > 0 || keyword || fromDate || toDate;

  return (
    <div className="search-bar">
      <h3>Filter</h3>

      <div className="search-section">
        <label>Search:</label>
        <input
          type="text"
          value={keyword}
          onChange={(e) => handleKeywordChange(e.target.value)}
          placeholder="Search posts..."
          className="search-input"
        />
      </div>

      <div className="search-section">
        <label>Tags:</label>
        <div className="tag-input-group">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder="Filter by tag..."
            className="tag-input"
          />
          <button type="button" onClick={handleAddTag} className="btn-add-tag">
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
      </div>

      <div className="search-section">
        <label>Date range:</label>
        <div className="date-inputs">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => handleFromDateChange(e.target.value)}
            className="date-input"
          />
          <span className="date-separator">to</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => handleToDateChange(e.target.value)}
            className="date-input"
          />
        </div>
      </div>

      {hasFilters && (
        <button onClick={handleClearAll} className="btn-clear">
          {buttonLabels.clearFilters || 'Clear filters'}
        </button>
      )}
    </div>
  );
}
