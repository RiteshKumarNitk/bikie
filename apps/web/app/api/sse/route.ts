import { getServerSession } from "@/lib/get-session";
import { addClient, removeClient } from "@/lib/sse-manager";

export async function GET() {
  const session = await getServerSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  let clientId: string | null = null;
  let interval: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      clientId = addClient(session.user.id, controller);
      controller.enqueue(new TextEncoder().encode("event: connected\ndata: {}\n\n"));
      interval = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode("event: heartbeat\ndata: {}\n\n"));
        } catch {
          if (interval) clearInterval(interval);
          if (clientId) removeClient(session.user.id, clientId);
        }
      }, 30000);
    },
    cancel() {
      if (interval) clearInterval(interval);
      if (clientId) removeClient(session.user.id, clientId);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}