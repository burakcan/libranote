type UserId = string;
type ClientId = string;

export class SSEServerService {
  private static clients = new Map<
    UserId,
    Map<ClientId, ReadableStreamDefaultController<string>>
  >();

  static addClient(
    userId: UserId,
    controller: ReadableStreamDefaultController<string>
  ): ClientId {
    const clientId = crypto.randomUUID();

    if (!SSEServerService.clients.has(userId)) {
      SSEServerService.clients.set(userId, new Map());
    }

    SSEServerService.clients.get(userId)?.set(clientId, controller);

    return clientId;
  }

  static removeClient(userId: UserId, clientId: ClientId) {
    SSEServerService.clients.get(userId)?.delete(clientId);
  }

  static broadcastSSE(
    userId: UserId,
    senderClientId: ClientId,
    event: SSE.Event
  ) {
    SSEServerService.clients.get(userId)?.forEach((controller, clientId) => {
      if (clientId === senderClientId) {
        console.log("Skipping self");
        return;
      }

      controller.enqueue(`data: ${JSON.stringify(event)}\n\n`);
    });
  }

  static sendInitEvent(userId: UserId, clientId: ClientId) {
    SSEServerService.clients
      .get(userId)
      ?.get(clientId)
      ?.enqueue(`data: ${JSON.stringify({ type: "INIT", clientId })}\n\n`);
  }
}
