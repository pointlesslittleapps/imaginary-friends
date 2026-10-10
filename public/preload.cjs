const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Agent management
  getAgents: () => ipcRenderer.invoke('agent:getAll'),
  createAgent: (data) => ipcRenderer.invoke('agent:create', data),
  updateAgent: (id, data) => ipcRenderer.invoke('agent:update', id, data),
  setActiveAgent: (id) => ipcRenderer.invoke('agent:setActive', id),
  getActiveAgent: () => ipcRenderer.invoke('agent:getActive'),

  // Conversations
  getConversations: () => ipcRenderer.invoke('conversation:getAll'),
  createConversation: (data) => ipcRenderer.invoke('conversation:create', data),

  // Posts
  createPost: (data) => ipcRenderer.invoke('post:create', data),
  getAgentReply: (data) => ipcRenderer.invoke('post:getAgentReply', data),
  editPost: (id, data) => ipcRenderer.invoke('post:edit', id, data),
  deletePost: (id) => ipcRenderer.invoke('post:delete', id),
  getPosts: (conversationId, options) =>
    ipcRenderer.invoke('post:getAll', conversationId, options),

  // Ollama
  ollamaStatus: () => ipcRenderer.invoke('ollama:status'),

  // Search
  search: (query, filters) => ipcRenderer.invoke('search:execute', query, filters),
  getTags: () => ipcRenderer.invoke('tags:getAll'),

  // App settings (name, colors, avatar)
  getAppSettings: () => ipcRenderer.invoke('appSettings:get'),
  updateAppSettings: (partial) => ipcRenderer.invoke('appSettings:update', partial),

  // Forbidden words
  getForbiddenWords: () => ipcRenderer.invoke('forbiddenWords:get'),
  setForbiddenWords: (words) => ipcRenderer.invoke('forbiddenWords:set', words),

  // Password protection
  isPasswordEnabled: () => ipcRenderer.invoke('auth:isEnabled'),
  setPassword: (password) => ipcRenderer.invoke('auth:setPassword', password),
  removePassword: () => ipcRenderer.invoke('auth:removePassword'),
  verifyPassword: (password) => ipcRenderer.invoke('auth:verify', password),
});
