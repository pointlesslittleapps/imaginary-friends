const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'mistral';

/**
 * Send a chat message to Ollama and get the agent's response.
 *
 * @param {string} systemPrompt - The agent's personality/instructions
 * @param {Array} history - Conversation history: [{ role: 'user'|'assistant', content: '...' }]
 * @returns {Promise<string>} The agent's response text
 */
export async function sendChatMessage(systemPrompt, history) {
  const response = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
      ],
      stream: false,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Ollama error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return data.message.content;
}

/**
 * Check if Ollama is running and reachable.
 * @returns {Promise<boolean>}
 */
export async function isOllamaAvailable() {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * List models available in the local Ollama install.
 * @returns {Promise<Array<{name: string, size: number}>>}
 */
export async function listAvailableModels() {
  const response = await fetch(`${OLLAMA_URL}/api/tags`);
  if (!response.ok) return [];
  const data = await response.json();
  return (data.models || []).map(m => ({ name: m.name, size: m.size }));
}

/**
 * Build the system prompt for an agent, combining personality and topics.
 * @param {object} agent - Agent record from the database
 * @returns {string}
 */
export function buildSystemPrompt(agent, forbiddenWords = []) {
  const topics = Array.isArray(agent.topics) ? agent.topics : JSON.parse(agent.topics || '[]');
  let prompt = agent.system_prompt || `You are ${agent.name}. ${agent.personality}`;

  if (topics.length > 0) {
    prompt += `\n\nYou are knowledgeable about and enjoy discussing: ${topics.join(', ')}.`;
  }

  prompt += `\n\nYou are a supportive companion in the user's private journal. Reply like a friend in conversation: 2-4 sentences, warm and natural. Never use bullet points, numbered lists, or headers unless the user explicitly asks for a list. One thoughtful follow-up question at most.`;

  if (forbiddenWords.length > 0) {
    prompt += `\n\nImportant: never bring up or discuss the following topics/words, even if the user mentions them: ${forbiddenWords.join(', ')}. Gently steer the conversation elsewhere if they come up.`;
  }

  return prompt;
}
