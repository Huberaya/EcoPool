import { Response } from 'express';

// ============================================================================
// PHASE 1.3 : MOTEUR TEMPS RÉEL SERVER-SENT EVENTS (SSE)
// ============================================================================

export interface SSEClient {
  id: string;
  res: Response;
  connectedAt: string;
  ip: string;
}

class SSEBroker {
  private clients: Map<string, SSEClient> = new Map();
  private totalEventsBroadcast: number = 0;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startHeartbeat();
  }

  private startHeartbeat(): void {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    // Ping toutes les 25 secondes pour maintenir les sockets ouverts (traversée proxy/Load Balancer)
    this.heartbeatInterval = setInterval(() => {
      this.broadcast('ping', { timestamp: new Date().toISOString() });
    }, 25000);
  }

  addClient(id: string, res: Response, ip: string = '127.0.0.1'): void {
    // Configuration des en-têtes SSE standards
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Désactive le buffering Nginx

    res.flushHeaders?.();

    // Message d'accueil de bienvenue
    const initPayload = JSON.stringify({
      type: 'INIT_CONNECTED',
      clientId: id,
      message: 'Connexion SSE EcoPool établie avec succès.',
      activeListeners: this.clients.size + 1,
      timestamp: new Date().toISOString()
    });
    res.write(`event: connected\ndata: ${initPayload}\n\n`);

    this.clients.set(id, { id, res, connectedAt: new Date().toISOString(), ip });
    console.log(`[EcoPool SSE] Client ${id} connecté (${this.clients.size} clients actifs).`);

    res.on('close', () => {
      this.clients.delete(id);
      console.log(`[EcoPool SSE] Client ${id} déconnecté (${this.clients.size} clients restants).`);
    });
  }

  broadcast(eventType: string, data: any): void {
    this.totalEventsBroadcast++;
    const payload = JSON.stringify({
      event: eventType,
      data,
      serverTime: new Date().toISOString()
    });

    const message = `event: ${eventType}\ndata: ${payload}\n\n`;

    for (const [id, client] of this.clients.entries()) {
      try {
        client.res.write(message);
      } catch (err) {
        console.warn(`[EcoPool SSE] Erreur d’envoi au client ${id}, suppression:`, err);
        this.clients.delete(id);
      }
    }
  }

  getClientCount(): number {
    return this.clients.size;
  }

  getTotalBroadcasts(): number {
    return this.totalEventsBroadcast;
  }
}

export const sseBroker = new SSEBroker();
