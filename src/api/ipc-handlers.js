import { ipcMain } from 'electron';
import * as db from './db.js';
import * as ollama from './ollama.js';

export function registerIpcHandlers() {
  // Agents
  ipcMain.handle('agent:getAll', async () => {
    return await db.getAgents();
  });

  ipcMain.handle('agent:create', async (event, data) => {
    return await db.createAgent(data);
  });

  ipcMain.handle('agent:update', async (event, id, data) => {
    await db.updateAgent(id, data);
    const agents = await db.getAgents();
    return agents.find(a => a.id === id);
  });

  ipcMain.handle('agent:setActive', async (event, agentId) => {
    await db.setActiveAgent(agentId);
    return await db.getActiveAgent();
  });

  ipcMain.handle('agent:getActive', async () => {
    return await db.getActiveAgent();
  });

  // Conversations
  ipcMain.handle('conversation:getAll', async () => {
    return await db.getConversations();
  });

  ipcMain.handle('conversation:create', async (event, data) => {
    return await db.createConversation(data);
  });

  // Posts
  ipcMain.handle('post:create', async (event, data) => {
    return await db.createPost(data);
  });

  // Generate an agent reply for the current conversation state.
  // The user's post should already be saved before calling this.
  ipcMain.handle('post:getAgentReply', async (event, data) => {
    const { conversationId, agentId } = data;

    const agents = await db.getAgents();
    const agent = agents.find(a => a.id === agentId);
    if (!agent) {
      return { agentPost: null, error: 'Agent not found' };
    }
    const forbiddenWords = await db.getForbiddenWords();
    const systemPrompt = ollama.buildSystemPrompt(agent, forbiddenWords);

    // Conversation history (last 20 posts, which includes the new user post)
    const allPosts = await db.getPosts(conversationId);
    const history = allPosts.slice(-20).map(post => ({
      role: post.author === 'user' ? 'user' : 'assistant',
      content: post.content,
    }));

    try {
      const replyText = await ollama.sendChatMessage(systemPrompt, history);
      const finalText = agent.signature
        ? `${replyText}\n\n— ${agent.signature}`
        : replyText;
      const agentPost = await db.createPost({
        conversationId,
        author: agent.name,
        content: finalText,
        tags: [],
      });

      // Occasionally let the agent's status/signature drift on its own
      await db.maybeDriftAgentPersona(agentId);

      return { agentPost, error: null };
    } catch (err) {
      console.error('Ollama error:', err);
      return {
        agentPost: null,
        error: 'Could not reach Ollama. Is it running? (ollama serve)',
      };
    }
  });

  // Ollama status
  ipcMain.handle('ollama:status', async () => {
    return await ollama.isOllamaAvailable();
  });

  ipcMain.handle('post:edit', async (event, postId, data) => {
    await db.editPost(postId, data);
  });

  ipcMain.handle('post:delete', async (event, postId) => {
    await db.deletePost(postId);
  });

  ipcMain.handle('post:getAll', async (event, conversationId) => {
    return await db.getPosts(conversationId);
  });

  // Tags
  ipcMain.handle('tags:getAll', async () => {
    return await db.getTags();
  });

  // App settings (appearance, name, avatar)
  ipcMain.handle('appSettings:get', async () => {
    return await db.getAppSettings();
  });

  ipcMain.handle('appSettings:update', async (event, partial) => {
    return await db.updateAppSettings(partial);
  });

  // Forbidden words (universal content filter)
  ipcMain.handle('forbiddenWords:get', async () => {
    return await db.getForbiddenWords();
  });

  ipcMain.handle('forbiddenWords:set', async (event, words) => {
    return await db.setForbiddenWords(words);
  });

  // Password protection
  ipcMain.handle('auth:isEnabled', async () => {
    return await db.isPasswordEnabled();
  });

  ipcMain.handle('auth:setPassword', async (event, password) => {
    await db.setPassword(password);
  });

  ipcMain.handle('auth:removePassword', async () => {
    await db.removePassword();
  });

  ipcMain.handle('auth:verify', async (event, password) => {
    return await db.verifyPassword(password);
  });
}
