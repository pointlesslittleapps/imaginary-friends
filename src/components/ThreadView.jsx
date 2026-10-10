import React, { useState } from 'react';
import { renderUserContent, renderAgentContent } from '../utils/formatters.js';
import '../styles/ThreadView.css';

export default function ThreadView({
  posts, onEditPost, onDeletePost,
  userAvatar, userStatus, username = 'You',
  agents = [], postAccent, buttonLabels = {},
}) {
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState([]);

  const handleEditClick = (post) => {
    setEditingId(post.id);
    setEditContent(post.content);
    setEditTags(post.tags);
  };

  const handleSaveEdit = (postId) => {
    onEditPost(postId, editContent, editTags);
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent('');
    setEditTags([]);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getAvatar = (post) => post.author === 'user'
    ? (userAvatar || '🧑')
    : (agents.find(a => a.name === post.author)?.avatar || '🤖');

  const getStatus = (post) => post.author === 'user'
    ? userStatus
    : agents.find(a => a.name === post.author)?.status;

  const getDisplayName = (post) => post.author === 'user' ? username : post.author;

  const isImageAvatar = (avatar) => typeof avatar === 'string' && avatar.startsWith('data:');

  return (
    <div className="thread-view">
      {posts.length === 0 ? (
        <p className="empty-state">No posts yet. Start a conversation!</p>
      ) : (
        posts.map(post => {
          const avatar = getAvatar(post);
          const status = getStatus(post);
          return (
            <div key={post.id} className={`post-row post-row-${post.author.toLowerCase().replace(/\s+/g, '-')}`}>
              <div className="post-avatar-col">
                <div className="post-avatar">
                  {isImageAvatar(avatar) ? <img src={avatar} alt="" /> : avatar}
                </div>
                {status && <div className="post-avatar-status">{status}</div>}
              </div>
              <div
                className="post"
                style={{ borderLeftColor: postAccent || '#28a745' }}
              >
                <div className="post-header">
                  <div className="post-author-time">
                    <strong className="post-author">{getDisplayName(post)}</strong>
                    <span className="post-time">{formatDate(post.created_at)}</span>
                  </div>
                  {post.is_edited && <span className="post-edited">(edited)</span>}
                </div>

                {editingId === post.id ? (
                  <div className="post-edit-form">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="edit-textarea"
                    />
                    <div className="edit-actions">
                      <button onClick={() => handleSaveEdit(post.id)}>
                        {buttonLabels.save || 'Save'}
                      </button>
                      <button onClick={handleCancelEdit} className="btn-secondary">
                        {buttonLabels.cancel || 'Cancel'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="post-content"
                    dangerouslySetInnerHTML={{
                      __html: post.author === 'user'
                        ? renderUserContent(post.content)
                        : renderAgentContent(post.content),
                    }}
                  />
                )}

                <div className="post-footer">
                  <div className="post-tags">
                    {post.tags.map(tag => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                  </div>
                  {post.author === 'user' && editingId !== post.id && (
                    <div className="post-actions">
                      <button onClick={() => handleEditClick(post)} className="btn-small">
                        {buttonLabels.edit || 'Edit'}
                      </button>
                      <button
                        onClick={() => onDeletePost(post.id)}
                        className="btn-small btn-danger"
                      >
                        {buttonLabels.delete || 'Delete'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
