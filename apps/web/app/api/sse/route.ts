import { getServerSession } from "@/lib/get-session";
import { RealtimeService } from "@bikie/services";

const DRAIN_INTERVAL_MS = 2000;
const HEARTBEAT_INTERVAL_MS = 30000;

export async function GET() {
  const session = await getServerSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const userId = session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  let drainInterval: ReturnType<typeof setInterval> | null = null;
  let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const emit = (event: string, data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {
          if (drainInterval) clearInterval(drainInterval);
          if (heartbeatInterval) clearInterval(heartbeatInterval);
        }
      };

      let globalCursor = await RealtimeService.getBroadcastCursor("global");
      let adminCursor = isAdmin ? await RealtimeService.getBroadcastCursor("admin") : 0;

      emit("connected", {});

      drainInterval = setInterval(async () => {
        const inboxEvents = await RealtimeService.drainInbox(userId);
        const global = await RealtimeService.drainBroadcastSince("global", globalCursor);
        globalCursor = global.cursor;
        let adminEvents: typeof global.events = [];
        if (isAdmin) {
          const admin = await RealtimeService.drainBroadcastSince("admin", adminCursor);
          adminCursor = admin.cursor;
          adminEvents = admin.events;
        }
        for (const { event, data } of [...inboxEvents, ...global.events, ...adminEvents]) {
          emit(event, data);
        }
      }, DRAIN_INTERVAL_MS);

      heartbeatInterval = setInterval(() => emit("heartbeat", {}), HEARTBEAT_INTERVAL_MS);
    },
    cancel() {
      if (drainInterval) clearInterval(drainInterval);
      if (heartbeatInterval) clearInterval(heartbeatInterval);
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
