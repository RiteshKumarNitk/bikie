type SSEClient = {
  id: string;
  userId: string;
  controller: ReadableStreamDefaultController;
};

const clients = new Map<string, SSEClient[]>();

export function addClient(userId: string, controller: ReadableStreamDefaultController): string {
  const id = crypto.randomUUID();
  const client: SSEClient = { id, userId, controller };
  const existing = clients.get(userId) ?? [];
  existing.push(client);
  clients.set(userId, existing);
  return id;
}

export function removeClient(userId: string, clientId: string) {
  const existing = clients.get(userId) ?? [];
  const filtered = existing.filter((c) => c.id !== clientId);
  if (filtered.length === 0) {
    clients.delete(userId);
  } else {
    clients.set(userId, filtered);
  }
}

export function sendEvent(userId: string, event: string, data: unknown) {
  const userClients = clients.get(userId) ?? [];
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of userClients) {
    try {
      client.controller.enqueue(new TextEncoder().encode(message));
    } catch {
      removeClient(userId, client.id);
    }
  }
}

export function broadcastEvent(event: string, data: unknown) {
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  const toRemove: [string, string][] = [];
  for (const [userId, userClients] of clients) {
    for (const client of userClients) {
      try {
        client.controller.enqueue(new TextEncoder().encode(message));
      } catch {
        toRemove.push([userId, client.id]);
      }
    }
  }
  for (const [userId, clientId] of toRemove) {
    removeClient(userId, clientId);
  }
}