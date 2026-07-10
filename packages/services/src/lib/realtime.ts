import { Redis } from "@upstash/redis";

const INBOX_MAX_LENGTH = 200;
const INBOX_TTL_SECONDS = 120;
const TYPING_TTL_SECONDS = 4;
const BROADCAST_MAX_LENGTH = 200;
const BROADCAST_TTL_SECONDS = 3600;

let client: Redis | null | undefined;

function getClient(): Redis | null {
  if (client !== undefined) return client;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    console.log("[Realtime][DEV] UPSTASH_REDIS_REST_URL/TOKEN not set — realtime events are no-ops.");
    client = null;
    return client;
  }
  client = new Redis({ url, token });
  return client;
}

export interface RealtimeEvent {
  event: string;
  data: unknown;
  ts: number;
}

function inboxKey(userId: string): string {
  return `inbox:${userId}`;
}

function typingKey(conversationId: string, userId: string): string {
  return `typing:${conversationId}:${userId}`;
}

function broadcastKey(channel: string): string {
  return `broadcast:${channel}`;
}

/**
 * `inbox:<userId>` is a destructive single-reader queue — fine for the common case of one
 * active session draining its own inbox. `broadcast:<channel>` (global/admin) is multi-reader
 * (many admins, many anonymous connections), so it uses a capped, non-destructive list with a
 * per-connection cursor instead — deleting on read there would starve every reader but the
 * first to poll.
 */
export const RealtimeService = {
  async publishToUser(userId: string, event: string, data: unknown): Promise<void> {
    const redis = getClient();
    if (!redis) return;
    const key = inboxKey(userId);
    const payload: RealtimeEvent = { event, data, ts: Date.now() };
    await redis.rpush(key, JSON.stringify(payload));
    await redis.ltrim(key, -INBOX_MAX_LENGTH, -1);
    await redis.expire(key, INBOX_TTL_SECONDS);
  },

  async publishToUsers(userIds: string[], event: string, data: unknown): Promise<void> {
    await Promise.all(userIds.map((userId) => RealtimeService.publishToUser(userId, event, data)));
  },

  async drainInbox(userId: string): Promise<RealtimeEvent[]> {
    const redis = getClient();
    if (!redis) return [];
    const key = inboxKey(userId);
    const raw = await redis.lrange<string>(key, 0, -1);
    if (raw.length === 0) return [];
    await redis.del(key);
    return raw.map((item) => (typeof item === "string" ? JSON.parse(item) : (item as RealtimeEvent)));
  },

  async publishToAdmins(event: string, data: unknown): Promise<void> {
    await RealtimeService.publishBroadcast("admin", event, data);
  },

  async publishGlobal(event: string, data: unknown): Promise<void> {
    await RealtimeService.publishBroadcast("global", event, data);
  },

  async publishBroadcast(channel: string, event: string, data: unknown): Promise<void> {
    const redis = getClient();
    if (!redis) return;
    const key = broadcastKey(channel);
    const payload: RealtimeEvent = { event, data, ts: Date.now() };
    await redis.rpush(key, JSON.stringify(payload));
    await redis.ltrim(key, -BROADCAST_MAX_LENGTH, -1);
    await redis.expire(key, BROADCAST_TTL_SECONDS);
  },

  /** Cursor = current list length. Call once at connection start so new connections don't replay old backlog. */
  async getBroadcastCursor(channel: string): Promise<number> {
    const redis = getClient();
    if (!redis) return 0;
    return redis.llen(broadcastKey(channel));
  },

  async drainBroadcastSince(channel: string, cursor: number): Promise<{ events: RealtimeEvent[]; cursor: number }> {
    const redis = getClient();
    if (!redis) return { events: [], cursor };
    const key = broadcastKey(channel);
    const length = await redis.llen(key);
    if (length <= cursor) return { events: [], cursor };
    const raw = await redis.lrange<string>(key, cursor, length - 1);
    const events = raw.map((item) => (typeof item === "string" ? JSON.parse(item) : (item as RealtimeEvent)));
    return { events, cursor: length };
  },

  async publishTyping(conversationId: string, userId: string, isTyping: boolean): Promise<void> {
    const redis = getClient();
    if (!redis) return;
    const key = typingKey(conversationId, userId);
    if (isTyping) {
      await redis.set(key, "1", { ex: TYPING_TTL_SECONDS });
    } else {
      await redis.del(key);
    }
  },

  async getTypingUsers(conversationId: string, candidateUserIds: string[]): Promise<string[]> {
    const redis = getClient();
    if (!redis || candidateUserIds.length === 0) return [];
    const results = await Promise.all(
      candidateUserIds.map(async (userId) => ({
        userId,
        isTyping: (await redis.exists(typingKey(conversationId, userId))) === 1,
      })),
    );
    return results.filter((r) => r.isTyping).map((r) => r.userId);
  },
};
