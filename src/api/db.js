import sqlite3 from 'sqlite3';
import path from 'path';
import crypto from 'crypto';
import { app } from 'electron';
import { v4 as uuidv4 } from 'uuid';

let db;

export function initializeDatabase() {
  return new Promise((resolve, reject) => {
    const dbPath = path.join(app.getPath('userData'), 'diary.db');
    console.log('Database path:', dbPath);

    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Database connection error:', err);
        reject(err);
      } else {
        console.log('Connected to SQLite database');
        createTables()
          .then(() => runMigrations())
          .then(() => seedDefaultAgents())
          .then(() => resolve())
          .catch(reject);
      }
    });
  });
}

function runMigrations() {
  return new Promise((resolve) => {
    const alterations = [
      `ALTER TABLE agents ADD COLUMN avatar TEXT DEFAULT '🤖'`,
      `ALTER TABLE agents ADD COLUMN status TEXT DEFAULT ''`,
      `ALTER TABLE agents ADD COLUMN signature TEXT DEFAULT ''`,
      `ALTER TABLE agents ADD COLUMN status_options TEXT DEFAULT '[]'`,
      `ALTER TABLE agents ADD COLUMN signature_options TEXT DEFAULT '[]'`,
    ];
    let remaining = alterations.length;
    alterations.forEach(sql => {
      db.run(sql, () => {
        // Ignore errors here (column already exists is the common case)
        remaining--;
        if (remaining === 0) resolve();
      });
    });
  });
}

function createTables() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS agents (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        personality TEXT NOT NULL,
        topics TEXT NOT NULL,
        system_prompt TEXT,
        is_active BOOLEAN DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL REFERENCES agents(id),
        title TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL REFERENCES conversations(id),
        author TEXT NOT NULL,
        content TEXT NOT NULL,
        raw_input TEXT,
        tags TEXT DEFAULT '[]',
        is_edited BOOLEAN DEFAULT 0,
        edited_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        usage_count INTEGER DEFAULT 1,
        last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS app_metadata (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `, (err) => {
      if (err) {
        reject(err);
      } else {
        console.log('Database tables created');
        resolve();
      }
    });
    });
  });
}

function seedDefaultAgents() {
  return new Promise((resolve, reject) => {
    db.get(`SELECT COUNT(*) as count FROM agents`, (err, row) => {
      if (err) {
        console.error('Error checking agents:', err);
        reject(err);
        return;
      }
      if (row.count > 0) {
        resolve();
        return;
      }

      console.log('No agents found, seeding defaults...');
      const defaults = [
        {
          id: uuidv4(),
          name: 'Therapist',
          personality: 'A warm, empathetic listener who helps you process emotions.',
          topics: JSON.stringify(['therapy', 'mental health', 'reflection']),
          avatar: '🌿',
        },
        {
          id: uuidv4(),
          name: 'Creative Muse',
          personality: 'An encouraging creative collaborator who sparks ideas.',
          topics: JSON.stringify(['writing', 'art', 'brainstorming']),
          avatar: '🎨',
        },
      ];

      let completed = 0;
      defaults.forEach(agent => {
        const systemPrompt = `You are ${agent.name}. ${agent.personality}`;
        db.run(
          `INSERT INTO agents (id, name, personality, topics, system_prompt, avatar, status, signature, status_options, signature_options) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [agent.id, agent.name, agent.personality, agent.topics, systemPrompt, agent.avatar, '', '', '[]', '[]'],
          (err) => {
            if (err) console.error('Error seeding agent:', err);
            else console.log(`Seeded agent: ${agent.name}`);
            completed++;
            if (completed === defaults.length) resolve();
          }
        );
      });
    });
  });
}

// Agents
export function createAgent(agentData) {
  return new Promise((resolve, reject) => {
    const id = uuidv4();
    const {
      name, personality, topics, system_prompt, avatar,
      status = '', signature = '', statusOptions = [], signatureOptions = [],
    } = agentData;
    const topicsJson = JSON.stringify(topics || []);
    const systemPrompt = system_prompt || `You are ${name}. ${personality}`;
    const agentAvatar = avatar || '🤖';
    const statusOptionsJson = JSON.stringify(statusOptions);
    const signatureOptionsJson = JSON.stringify(signatureOptions);

    db.run(
      `INSERT INTO agents (id, name, personality, topics, system_prompt, avatar, status, signature, status_options, signature_options) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, personality, topicsJson, systemPrompt, agentAvatar, status, signature, statusOptionsJson, signatureOptionsJson],
      (err) => {
        if (err) reject(err);
        else resolve({ id, name, personality, topics, avatar: agentAvatar, status, signature, statusOptions, signatureOptions });
      }
    );
  });
}

export function updateAgent(id, agentData) {
  return new Promise((resolve, reject) => {
    const {
      name, personality, topics, avatar,
      status, signature, statusOptions, signatureOptions,
    } = agentData;

    db.run(
      `UPDATE agents SET name = ?, personality = ?, topics = ?, avatar = ?, status = ?, signature = ?, status_options = ?, signature_options = ? WHERE id = ?`,
      [
        name, personality, JSON.stringify(topics || []), avatar || '🤖',
        status || '', signature || '',
        JSON.stringify(statusOptions || []), JSON.stringify(signatureOptions || []),
        id,
      ],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

function parseAgentRow(row) {
  const safeParse = (val, fallback) => {
    try { return JSON.parse(val); } catch { return fallback; }
  };
  return {
    ...row,
    topics: safeParse(row.topics, []),
    avatar: row.avatar || '🤖',
    status: row.status || '',
    signature: row.signature || '',
    statusOptions: safeParse(row.status_options, []),
    signatureOptions: safeParse(row.signature_options, []),
  };
}

export function getAgents() {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM agents ORDER BY created_at DESC`, (err, rows) => {
      if (err) reject(err);
      else resolve(rows.map(parseAgentRow));
    });
  });
}

export function getActiveAgent() {
  return new Promise((resolve, reject) => {
    db.get(`SELECT value FROM app_metadata WHERE key = 'active_agent_id'`, (err, row) => {
      if (err) reject(err);
      else if (!row) resolve(null);
      else {
        db.get(`SELECT * FROM agents WHERE id = ?`, [row.value], (err, agent) => {
          if (err) reject(err);
          else resolve(agent ? parseAgentRow(agent) : null);
        });
      }
    });
  });
}

// Randomly refresh an agent's status/signature from its own option lists.
// Called occasionally after a reply so the agent feels a little alive.
export function maybeDriftAgentPersona(agentId) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM agents WHERE id = ?`, [agentId], (err, row) => {
      if (err || !row) { resolve(); return; }
      const agent = parseAgentRow(row);
      if (agent.statusOptions.length === 0 && agent.signatureOptions.length === 0) {
        resolve();
        return;
      }
      // ~30% chance to drift on any given reply
      if (Math.random() > 0.3) { resolve(); return; }

      const nextStatus = agent.statusOptions.length > 0
        ? agent.statusOptions[Math.floor(Math.random() * agent.statusOptions.length)]
        : agent.status;
      const nextSignature = agent.signatureOptions.length > 0
        ? agent.signatureOptions[Math.floor(Math.random() * agent.signatureOptions.length)]
        : agent.signature;

      db.run(
        `UPDATE agents SET status = ?, signature = ? WHERE id = ?`,
        [nextStatus, nextSignature, agentId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  });
}

export function setActiveAgent(agentId) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO app_metadata (key, value) VALUES (?, ?) 
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      ['active_agent_id', agentId],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

// Conversations
export function createConversation(data) {
  return new Promise((resolve, reject) => {
    const id = uuidv4();
    const agentId = data.agent_id;
    const title = data.title || `Chat`;

    db.run(
      `INSERT INTO conversations (id, agent_id, title) VALUES (?, ?, ?)`,
      [id, agentId, title],
      (err) => {
        if (err) reject(err);
        else resolve({ id, agent_id: agentId, title });
      }
    );
  });
}

export function getConversations(agentId = null) {
  return new Promise((resolve, reject) => {
    let sql = `SELECT * FROM conversations`;
    const params = [];

    if (agentId) {
      sql += ` WHERE agent_id = ?`;
      params.push(agentId);
    }

    sql += ` ORDER BY updated_at DESC`;

    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

// Posts
export function createPost(data) {
  return new Promise((resolve, reject) => {
    const id = uuidv4();
    const { conversationId, author, content, tags = [] } = data;
    const tagsJson = JSON.stringify(tags);

    db.run(
      `INSERT INTO posts (id, conversation_id, author, content, tags) 
       VALUES (?, ?, ?, ?, ?)`,
      [id, conversationId, author, content, tagsJson],
      (err) => {
        if (err) reject(err);
        else {
          addTagsToList(tags);
          resolve({ id, author, content, tags, created_at: new Date().toISOString(), is_edited: false });
        }
      }
    );
  });
}

export function editPost(postId, data) {
  return new Promise((resolve, reject) => {
    const { content, tags = [] } = data;
    const tagsJson = JSON.stringify(tags);

    db.run(
      `UPDATE posts SET content = ?, tags = ?, is_edited = 1, edited_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [content, tagsJson, postId],
      (err) => {
        if (err) reject(err);
        else {
          addTagsToList(tags);
          resolve();
        }
      }
    );
  });
}

export function deletePost(postId) {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM posts WHERE id = ?`, [postId], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export function getPosts(conversationId) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT * FROM posts WHERE conversation_id = ? ORDER BY created_at ASC`,
      [conversationId],
      (err, rows) => {
        if (err) reject(err);
        else {
          const posts = rows.map(row => ({
            ...row,
            tags: JSON.parse(row.tags || '[]'),
          }));
          resolve(posts);
        }
      }
    );
  });
}

// Tags
function addTagsToList(tags) {
  tags.forEach(tag => {
    db.run(
      `INSERT INTO tags (name, usage_count) VALUES (?, 1) 
       ON CONFLICT(name) DO UPDATE SET usage_count = usage_count + 1, last_used = CURRENT_TIMESTAMP`,
      [tag]
    );
  });
}

export function getTags() {
  return new Promise((resolve, reject) => {
    db.all(`SELECT name, usage_count FROM tags ORDER BY usage_count DESC`, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

export function closeDatabase() {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    } else {
      resolve();
    }
  });
}

// ---- App settings (appearance, name, avatar) ----

const DEFAULT_APP_SETTINGS = {
  appName: 'Diary',
  username: 'You',
  userAvatar: '🧑',
  userStatus: '',
  userSignature: '',
  fontFamily: '',
  theme: {
    primary: '#007bff',
    accent: '#28a745',
    background: '#f5f5f5',
    surface: '#ffffff',
    text: '#333333',
    postAccent: '#28a745',
  },
  buttonLabels: {
    post: 'Post',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    createAgent: '+ Create agent',
    clearFilters: 'Clear filters',
  },
};

function getMetadataValue(key) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT value FROM app_metadata WHERE key = ?`, [key], (err, row) => {
      if (err) reject(err);
      else resolve(row ? row.value : null);
    });
  });
}

function setMetadataValue(key, value) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO app_metadata (key, value) VALUES (?, ?) 
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      [key, value],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

export async function getAppSettings() {
  const raw = await getMetadataValue('app_settings');
  if (!raw) return DEFAULT_APP_SETTINGS;
  try {
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_APP_SETTINGS,
      ...parsed,
      theme: { ...DEFAULT_APP_SETTINGS.theme, ...(parsed.theme || {}) },
      buttonLabels: { ...DEFAULT_APP_SETTINGS.buttonLabels, ...(parsed.buttonLabels || {}) },
    };
  } catch {
    return DEFAULT_APP_SETTINGS;
  }
}

export async function updateAppSettings(partial) {
  const current = await getAppSettings();
  const merged = {
    ...current,
    ...partial,
    theme: { ...current.theme, ...(partial.theme || {}) },
    buttonLabels: { ...current.buttonLabels, ...(partial.buttonLabels || {}) },
  };
  await setMetadataValue('app_settings', JSON.stringify(merged));
  return merged;
}

// ---- Forbidden words (universal content filter for agents) ----

export async function getForbiddenWords() {
  const raw = await getMetadataValue('forbidden_words');
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function setForbiddenWords(words) {
  const clean = (words || [])
    .map(w => String(w).trim())
    .filter(w => w.length > 0);
  await setMetadataValue('forbidden_words', JSON.stringify(clean));
  return clean;
}

// ---- Password protection ----

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

export async function isPasswordEnabled() {
  const value = await getMetadataValue('password_enabled');
  return value === '1';
}

export async function setPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = hashPassword(password, salt);
  await setMetadataValue('password_salt', salt);
  await setMetadataValue('password_hash', hash);
  await setMetadataValue('password_enabled', '1');
}

export async function removePassword() {
  await setMetadataValue('password_enabled', '0');
}

export async function verifyPassword(password) {
  const salt = await getMetadataValue('password_salt');
  const storedHash = await getMetadataValue('password_hash');
  if (!salt || !storedHash) return false;
  const hash = hashPassword(password, salt);
  try {
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(storedHash, 'hex'));
  } catch {
    return false;
  }
}
