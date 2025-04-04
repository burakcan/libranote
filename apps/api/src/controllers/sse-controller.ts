import type { Request, Response } from "express";
import { Readable } from "stream";
import { SSEService } from "../services/sse-service.js";

/**
 * Handle SSE connection for real-time updates
 */
export async function connectSSE(req: Request, res: Response) {
  const { userId } = req;
  const clientId = req.query.clientId as string;

  if (!clientId) {
    res.status(400).json({
      error: "BadRequest",
      message: "clientId is required",
    });

    return;
  }

  // Set headers for SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // Disable buffering for nginx proxies

  // Create a readable stream
  const stream = new Readable({
    read() {}, // Implementation required but we'll push manually
  });

  // Create controller for the stream
  const controller = {
    enqueue: (chunk: string) => {
      stream.push(chunk);
    },
    close: () => {
      stream.push(null);
    },
  };

  // Add client to SSE service
  SSEService.addClient(userId, clientId, controller);

  // Send initial event
  SSEService.sendInitEvent(userId, clientId);

  // Handle client disconnect
  req.on("close", () => {
    SSEService.removeClient(userId, clientId);
    controller.close();
  });

  // Pipe the stream to the response
  stream.pipe(res);
}
