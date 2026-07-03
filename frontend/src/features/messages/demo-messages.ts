/**
 * Demo messaging data and sessionStorage persistence (V4-104).
 * Provides realistic demo conversations when the backend is unavailable,
 * and persists user-sent messages in sessionStorage so they survive
 * page navigation within a session.
 */

import { DEMO_USERS } from '@/demo';

// --- Types ---

export interface DemoMessageUser {
  id: string;
  name: string;
  yorubaName?: string;
  avatar?: string;
}

export interface DemoMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  createdAt: string;
  readAt?: string;
  attachments?: [];
  sender: DemoMessageUser;
  receiver: DemoMessageUser;
}

export interface DemoConversation {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  createdAt: string;
  sender: DemoMessageUser;
  receiver: DemoMessageUser;
  otherUser: DemoMessageUser;
  unreadCount: number;
}

// --- Helpers ---

function demoUser(id: string): DemoMessageUser {
  const u = DEMO_USERS[id];
  if (!u) return { id, name: 'Unknown User' };
  return { id: u.id, name: u.name, yorubaName: u.yorubaName, avatar: u.avatar };
}

function daysAgo(days: number, hours = 10): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hours, 0, 0, 0);
  return d.toISOString();
}

// --- Seed Conversations ---

const SEED_THREADS: Record<string, { participants: [string, string]; messages: { from: 0 | 1; text: string; daysAgo: number; hours: number }[] }> = {
  'demo-client-1::demo-baba-1': {
    participants: ['demo-client-1', 'demo-baba-1'],
    messages: [
      { from: 0, text: 'Good morning Baba Ifatunde. I wanted to follow up on my last reading. The dreams have become more vivid since our session.', daysAgo: 3, hours: 9 },
      { from: 1, text: 'Alaafia, Amina. This is a positive sign. The Odu that appeared in your reading — Ogbe Meji — speaks of clarity arriving through dreams. Can you describe what you are seeing?', daysAgo: 3, hours: 10 },
      { from: 0, text: 'I keep seeing a river with white cloth flowing in it, and my late grandmother is standing on the other side, smiling. It feels peaceful but I wake up with questions.', daysAgo: 3, hours: 11 },
      { from: 1, text: 'This is very meaningful. The white cloth and river are connected to Obatala and the ancestral waters. Your grandmother is affirming your path. We should discuss this more in our upcoming session on the 25th.', daysAgo: 3, hours: 12 },
      { from: 0, text: 'Thank you, Baba. I will write down everything I remember before then. See you on the 25th.', daysAgo: 3, hours: 13 },
      { from: 1, text: 'Very good. Also, try placing a glass of cool water beside your bed before sleeping — this will strengthen the connection. Ase.', daysAgo: 3, hours: 14 },
    ],
  },
  'demo-client-1::demo-vendor-1': {
    participants: ['demo-client-1', 'demo-vendor-1'],
    messages: [
      { from: 0, text: 'Hello Iya Omitonade! I saw the Ide Ifá bracelet on your shop. Is it handmade?', daysAgo: 5, hours: 15 },
      { from: 1, text: 'Kaabo, Amina! Yes, every bracelet is hand-woven by artisans in Osogbo using traditional green and brown beads. Each one is consecrated at the river before shipping.', daysAgo: 5, hours: 16 },
      { from: 0, text: 'That is beautiful. I would like to order one. How long does delivery take to Lagos?', daysAgo: 5, hours: 17 },
      { from: 1, text: 'About 3-5 days within Nigeria. I will include a small pouch of herbs as a gift for your first order. Just place the order through the marketplace and I will prepare it personally.', daysAgo: 4, hours: 10 },
    ],
  },
  'demo-client-2::demo-baba-1': {
    participants: ['demo-client-2', 'demo-baba-1'],
    messages: [
      { from: 0, text: 'Baba, I have a question about the dream interpretation consultation. What should I prepare beforehand?', daysAgo: 2, hours: 8 },
      { from: 1, text: 'Welcome, Chioma. Before our session, please write down any recurring dreams you have had in the past month. Also note the time you woke up and your emotions during each dream.', daysAgo: 2, hours: 9 },
      { from: 0, text: 'I will do that. Should I fast before the session?', daysAgo: 2, hours: 10 },
      { from: 1, text: 'Fasting is not required for a dream consultation, but it is good to avoid heavy food 3 hours before. Come with an open heart and clear mind. Ase.', daysAgo: 1, hours: 11 },
    ],
  },
};

// --- Simulated Reply Templates ---

const REPLY_TEMPLATES: Record<string, string[]> = {
  'demo-baba-1': [
    'Thank you for sharing this. Let me reflect on it and we can discuss further during our next session. Ase.',
    'This is an important observation. The Odu teaches us that patience reveals understanding. I will prepare guidance for you.',
    'Alaafia. I have received your message. Let us explore this together when we next meet.',
    'Your spiritual awareness is growing. Continue with the practices we discussed and note any changes.',
  ],
  'demo-baba-2': [
    'Blessings to you. I will review this and respond with guidance shortly.',
    'Thank you for reaching out. The ancestors smile on those who seek knowledge.',
    'This is noted. We will address this in our next consultation. Stay in peace.',
  ],
  'demo-vendor-1': [
    'Thank you for your interest! I will check availability and get back to you shortly.',
    'Kaabo! Yes, that item is available. Would you like me to set it aside for you?',
    'Your order is being prepared with care. I will send you a tracking update soon.',
  ],
};

// --- SessionStorage Persistence ---

const STORAGE_KEY = 'ile-ase-demo-messages';

interface StoredMessages {
  [threadKey: string]: DemoMessage[];
}

function getStoredMessages(): StoredMessages {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStoredMessages(data: StoredMessages): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // sessionStorage full or unavailable — silently ignore
  }
}

function threadKey(userA: string, userB: string): string {
  return [userA, userB].sort().join('::');
}

// --- Public API ---

/**
 * Get demo inbox conversations for a given user.
 * Merges seed data with any session-persisted messages.
 */
export function getDemoInbox(userId: string): DemoConversation[] {
  const stored = getStoredMessages();
  const conversations: DemoConversation[] = [];
  const seenKeys = new Set<string>();

  // Collect all thread keys relevant to this user
  const relevantKeys = new Set<string>();

  // From seed threads
  for (const [key, thread] of Object.entries(SEED_THREADS)) {
    if (thread.participants.includes(userId)) {
      relevantKeys.add(key);
    }
  }

  // From stored messages
  for (const key of Object.keys(stored)) {
    if (key.includes(userId)) {
      relevantKeys.add(key);
    }
  }

  for (const key of relevantKeys) {
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);

    const allMessages = getDemoThread(userId, key.replace(`${userId}::`, '').replace(`::${userId}`, ''));
    if (allMessages.length === 0) continue;

    const lastMsg = allMessages[allMessages.length - 1];
    const otherUserId = lastMsg.senderId === userId ? lastMsg.receiverId : lastMsg.senderId;
    const unreadCount = allMessages.filter(m => m.receiverId === userId && !m.read).length;

    conversations.push({
      id: key,
      senderId: lastMsg.senderId,
      receiverId: lastMsg.receiverId,
      content: lastMsg.content,
      read: unreadCount === 0,
      createdAt: lastMsg.createdAt,
      sender: lastMsg.sender,
      receiver: lastMsg.receiver,
      otherUser: demoUser(otherUserId),
      unreadCount,
    });
  }

  // Sort by most recent first
  conversations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return conversations;
}

/**
 * Get all messages in a conversation thread between userId and otherUserId.
 * Merges seed messages with session-persisted messages, sorted chronologically.
 */
export function getDemoThread(userId: string, otherUserId: string): DemoMessage[] {
  const key = threadKey(userId, otherUserId);
  const seed = SEED_THREADS[key];
  const stored = getStoredMessages()[key] || [];

  const seedMessages: DemoMessage[] = seed
    ? seed.messages.map((msg, i) => {
        const senderId = seed.participants[msg.from];
        const receiverId = seed.participants[msg.from === 0 ? 1 : 0];
        return {
          id: `seed-${key}-${i}`,
          senderId,
          receiverId,
          content: msg.text,
          read: true,
          createdAt: daysAgo(msg.daysAgo, msg.hours),
          sender: demoUser(senderId),
          receiver: demoUser(receiverId),
        };
      })
    : [];

  const allMessages = [...seedMessages, ...stored];
  allMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  return allMessages;
}

/**
 * Persist a user-sent message to sessionStorage and return the created message.
 */
export function saveDemoMessage(userId: string, otherUserId: string, content: string): DemoMessage {
  const key = threadKey(userId, otherUserId);
  const stored = getStoredMessages();
  const thread = stored[key] || [];

  const message: DemoMessage = {
    id: `demo-msg-${Date.now()}`,
    senderId: userId,
    receiverId: otherUserId,
    content,
    read: false,
    createdAt: new Date().toISOString(),
    sender: demoUser(userId),
    receiver: demoUser(otherUserId),
  };

  thread.push(message);
  stored[key] = thread;
  saveStoredMessages(stored);
  return message;
}

/**
 * Generate a simulated reply from the other user after a short delay.
 * Returns the reply message, or null if no template exists.
 */
export function generateSimulatedReply(userId: string, otherUserId: string): DemoMessage | null {
  const templates = REPLY_TEMPLATES[otherUserId];
  if (!templates || templates.length === 0) return null;

  const key = threadKey(userId, otherUserId);
  const stored = getStoredMessages();
  const thread = stored[key] || [];

  // Pick a reply deterministically based on how many stored messages exist
  const replyIndex = thread.length % templates.length;

  const reply: DemoMessage = {
    id: `demo-reply-${Date.now()}`,
    senderId: otherUserId,
    receiverId: userId,
    content: templates[replyIndex],
    read: false,
    createdAt: new Date().toISOString(),
    sender: demoUser(otherUserId),
    receiver: demoUser(userId),
  };

  thread.push(reply);
  stored[key] = thread;
  saveStoredMessages(stored);
  return reply;
}
