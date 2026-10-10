import React, { useState, useEffect, useRef, useCallback } from 'react';
import ThreadView from '../components/ThreadView.jsx';
import PostForm from '../components/PostForm.jsx';
import SearchBar from '../components/SearchBar.jsx';
import SettingsPanel from '../components/SettingsPanel.jsx';
import LockScreen from '../components/LockScreen.jsx';
import '../styles/App.css';

const REFRESH_INTERVAL_MS = 30000;

function applyTheme(theme, fontFamily) {
  const root = document.documentElement;
  root.style.setProperty('--app-primary', theme.primary);
  root.style.setProperty('--app-accent', theme.accent);
  root.style.setProperty('--app-background', theme.background);
  root.style.setProperty('--app-surface', theme.surface);
  root.style.setProperty('--app-text', theme.text);
  root.style.setProperty('--app-font', fontFamily ? `'${fontFamily}', system-ui, sans-serif` : 'system-ui, sans-serif');
}

export default function App() {
  const [agents, setAgents] = useState([]);
  const [activeAgent, setActiveAgent] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [posts, setPosts] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [searchFilters, setSearchFilters] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ollamaOnline, setOllamaOnline] = useState(true);

  const [appSettings, setAppSettings] = useState(null);
  const [forbiddenWords, setForbiddenWordsState] = useState([]);
  const [passwordEnabled, setPasswordEnabled] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  const threadEndRef = useRef(null);
  const conversationRef = useRef(null);
  conversationRef.current = conversation;

  const refreshPosts = useCallback(async () => {
    const conv = conversationRef.current;
    if (!conv) return;
    try {
      const allPosts = await window.api.getPosts(conv.id);
      setPosts(allPosts);
    } catch (err) {
      console.error('Error refreshing posts:', err);
    }
  }, []);

  const refreshTags = useCallback(async () => {
    try {
      const tags = await window.api.getTags();
      setAvailableTags(tags);
    } catch (err) {
      console.error('Error loading tags:', err);
    }
  }, []);

  const refreshAgents = useCallback(async () => {
    try {
      const allAgents = await window.api.getAgents();
      setAgents(allAgents);
      return allAgents;
    } catch (err) {
      console.error('Error refreshing agents:', err);
      return [];
    }
  }, []);

  // Load data on startup
  useEffect(() => {
    const loadData = async () => {
      try {
        const passEnabled = await window.api.isPasswordEnabled();
        setPasswordEnabled(passEnabled);

        const settings = await window.api.getAppSettings();
        setAppSettings(settings);
        applyTheme(settings.theme, settings.fontFamily);

        const words = await window.api.getForbiddenWords();
        setForbiddenWordsState(words);

        // If locked, stop here — rest loads after unlock
        if (passEnabled) {
          setLoading(false);
          return;
        }

        await loadAppData();
      } catch (err) {
        console.error('Error loading data:', err);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const loadAppData = async () => {
    try {
      const online = await window.api.ollamaStatus();
      setOllamaOnline(online);

      const allAgents = await refreshAgents();

      let active = await window.api.getActiveAgent();
      if (!active && allAgents.length > 0) {
        active = allAgents[0];
        await window.api.setActiveAgent(active.id);
      }
      setActiveAgent(active);

      if (active) {
        const conversations = await window.api.getConversations();
        let conv = conversations.find(c => c.agent_id === active.id);
        if (!conv) {
          conv = await window.api.createConversation({ agent_id: active.id });
        }
        setConversation(conv);

        const allPosts = await window.api.getPosts(conv.id);
        setPosts(allPosts);
      }

      await refreshTags();
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async () => {
    setUnlocked(true);
    setLoading(true);
    await loadAppData();
  };

  // Silent auto-refresh
  useEffect(() => {
    const interval = setInterval(() => {
      refreshPosts();
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refreshPosts]);

  // Auto-scroll to newest post
  useEffect(() => {
    if (threadEndRef.current) {
      threadEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [posts]);

  const handleSendPost = async (content, tags) => {
    if (!conversation || !activeAgent) return;

    try {
      const userPost = await window.api.createPost({
        conversationId: conversation.id,
        author: 'user',
        content,
        tags,
      });
      setPosts(prev => [...prev, userPost]);
      refreshTags();

      window.api.getAgentReply({
        conversationId: conversation.id,
        agentId: activeAgent.id,
      }).then(result => {
        if (result.agentPost) {
          setPosts(prev => [...prev, result.agentPost]);
        } else if (result.error) {
          console.error('Agent reply failed:', result.error);
          setOllamaOnline(false);
        }
      }).catch(err => {
        console.error('Agent reply error:', err);
      });
    } catch (err) {
      console.error('Error sending post:', err);
    }
  };

  const handleEditPost = async (postId, newContent, newTags) => {
    try {
      await window.api.editPost(postId, { content: newContent, tags: newTags });
      setPosts(prev => prev.map(post =>
        post.id === postId
          ? { ...post, content: newContent, tags: newTags, is_edited: true, edited_at: new Date() }
          : post
      ));
      refreshTags();
    } catch (err) {
      console.error('Error editing post:', err);
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      await window.api.deletePost(postId);
      setPosts(prev => prev.filter(post => post.id !== postId));
    } catch (err) {
      console.error('Error deleting post:', err);
    }
  };

  const handleSelectAgent = async (agent) => {
    try {
      await window.api.setActiveAgent(agent.id);
      setActiveAgent(agent);

      const conversations = await window.api.getConversations();
      let conv = conversations.find(c => c.agent_id === agent.id);
      if (!conv) {
        conv = await window.api.createConversation({ agent_id: agent.id });
      }
      setConversation(conv);

      const allPosts = await window.api.getPosts(conv.id);
      setPosts(allPosts);
    } catch (err) {
      console.error('Error selecting agent:', err);
    }
  };

  const handleUpdateAppSettings = async (partial) => {
    const merged = await window.api.updateAppSettings(partial);
    setAppSettings(merged);
    applyTheme(merged.theme, merged.fontFamily);
  };

  const handleSaveForbiddenWords = async (words) => {
    const saved = await window.api.setForbiddenWords(words);
    setForbiddenWordsState(saved);
  };

  const handleSearch = (filters) => {
    setSearchFilters(filters);
  };

  const applyFilters = (allPosts) => {
    if (!searchFilters) return allPosts;

    return allPosts.filter(post => {
      if (searchFilters.tags && searchFilters.tags.length > 0) {
        if (!searchFilters.tags.some(tag => post.tags.includes(tag))) return false;
      }
      if (searchFilters.keyword) {
        if (!post.content.toLowerCase().includes(searchFilters.keyword.toLowerCase())) return false;
      }
      if (searchFilters.dateRange) {
        const created = new Date(post.created_at);
        if (searchFilters.dateRange.from && created < searchFilters.dateRange.from) return false;
        if (searchFilters.dateRange.to && created > searchFilters.dateRange.to) return false;
      }
      return true;
    });
  };

  const displayPosts = applyFilters(posts);

  if (loading) {
    return (
      <div className="app-container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
          Loading...
        </div>
      </div>
    );
  }

  if (passwordEnabled && !unlocked) {
    return <LockScreen appName={appSettings?.appName || 'Diary'} onUnlock={handleUnlock} />;
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>{appSettings?.appName || 'Diary'}</h1>
        <div className="header-right">
          <span className="agent-name">
            {activeAgent?.avatar && activeAgent.avatar.startsWith('data:') ? (
              <img className="header-agent-avatar" src={activeAgent.avatar} alt="" />
            ) : (
              activeAgent?.avatar
            )}
            {' '}{activeAgent?.name}
          </span>
          <button onClick={() => setShowSettings(!showSettings)}>
            {showSettings ? 'Back' : 'Settings'}
          </button>
        </div>
      </header>

      <main className="app-main">
        {showSettings ? (
          <SettingsPanel
            onClose={() => setShowSettings(false)}
            appSettings={appSettings}
            onUpdateAppSettings={handleUpdateAppSettings}
            agents={agents}
            activeAgent={activeAgent}
            onSelectAgent={handleSelectAgent}
            onAgentsChanged={refreshAgents}
            forbiddenWords={forbiddenWords}
            onSaveForbiddenWords={handleSaveForbiddenWords}
            passwordEnabled={passwordEnabled}
            onPasswordStatusChange={setPasswordEnabled}
          />
        ) : (
          <>
            <div className="content-column">
              <div className="thread-container">
                {!ollamaOnline && (
                  <div className="ollama-warning">
                    Ollama isn't reachable. Your posts still save, but the agent can't reply.
                    Start it with <code>ollama serve</code> and restart the app.
                  </div>
                )}
                <ThreadView
                  posts={displayPosts}
                  onEditPost={handleEditPost}
                  onDeletePost={handleDeletePost}
                  userAvatar={appSettings?.userAvatar}
                  userStatus={appSettings?.userStatus}
                  username={appSettings?.username}
                  agents={agents}
                  postAccent={appSettings?.theme?.postAccent}
                  buttonLabels={appSettings?.buttonLabels}
                />
                <div ref={threadEndRef} />
              </div>
              <div className="composer-container">
                <PostForm
                  onSubmit={handleSendPost}
                  availableTags={availableTags}
                  buttonLabels={appSettings?.buttonLabels}
                  userSignature={appSettings?.userSignature}
                />
              </div>
            </div>
            <aside className="sidebar">
              <SearchBar onSearch={handleSearch} buttonLabels={appSettings?.buttonLabels} />
            </aside>
          </>
        )}
      </main>
    </div>
  );
}
