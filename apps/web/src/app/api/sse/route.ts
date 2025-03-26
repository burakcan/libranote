import { NextRequest } from "next/server";
import { SSEServerService } from "@/lib/sync/sseServerService";
import { auth } from "@/features/auth/auth";
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const stream = new ReadableStream<string>({
    async start(controller) {
      const clientId = SSEServerService.addClient(session.user.id, controller);

      SSEServerService.sendInitEvent(session.user.id, clientId);

      req.signal.addEventListener("abort", () => {
        SSEServerService.removeClient(session.user.id, clientId);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
