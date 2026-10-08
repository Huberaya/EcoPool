// ============================================================================
// CLIENT TEMPS RÉEL SERVER-SENT EVENTS (SSE) - ECOPOOL PHASE 1.3
// ============================================================================

export type SSEConnectionStatus = 'connected' | 'connecting' | 'disconnected';

export interface SSEMessageEvent {
  event: string;
  data: any;
  serverTime: string;
}

type SSEListener = (data: any) => void;

class SSEClientManager {
  private eventSource: EventSource | null = null;
  private listeners: Map<string, Set<SSEListener>> = new Map();
  private statusListeners: Set<(status: SSEConnectionStatus) => void> = new Set();
  private status: SSEConnectionStatus = 'disconnected';
  private reconnectTimer: NodeJS.Timeout | null = null;
  private recentEvents: SSEMessageEvent[] = [];

  constructor() {
    this.connect();
  }

  public connect(): void {
    if (typeof window === 'undefined') return;
    if (this.eventSource) {
      this.eventSource.close();
    }

    this.setStatus('connecting');

    try {
      this.eventSource = new EventSource('/api/events/sse');

      this.eventSource.onopen = () => {
        this.setStatus('connected');
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.eventSource.onerror = () => {
        this.setStatus('disconnected');
        this.eventSource?.close();
        this.eventSource = null;

        // Reconnexion automatique avec backoff après 4 secondes
        if (!this.reconnectTimer) {
          this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.connect();
          }, 4000);
        }
      };

      // Écouteur générique de messages
      this.eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          this.dispatch('message', parsed);
        } catch {
          // Message brut
        }
      };

      // Événements dédiés EcoPool
      const customEvents = [
        'connected',
        'ping',
        'ORDER_COMMITTED',
        'CAMPAIGN_PROGRESS',
        'TIER_UNLOCKED',
        'STRESS_TEST_COMPLETED'
      ];

      for (const evtName of customEvents) {
        this.eventSource.addEventListener(evtName, (event: any) => {
          try {
            const parsed = JSON.parse(event.data);
            const msgObj: SSEMessageEvent = {
              event: evtName,
              data: parsed.data || parsed,
              serverTime: parsed.serverTime || new Date().toISOString()
            };

            this.recentEvents.unshift(msgObj);
            if (this.recentEvents.length > 30) {
              this.recentEvents.pop();
            }

            this.dispatch(evtName, msgObj.data);
            this.dispatch('*', msgObj);
          } catch (err) {
            console.warn(`[SSE Client] Erreur parsing événement ${evtName}:`, err);
          }
        });
      }

    } catch (err) {
      console.warn('[SSE Client] Exception lors de la connexion:', err);
      this.setStatus('disconnected');
    }
  }

  private setStatus(newStatus: SSEConnectionStatus): void {
    this.status = newStatus;
    for (const listener of this.statusListeners) {
      try {
        listener(newStatus);
      } catch (err) {
        console.error(err);
      }
    }
  }

  public getStatus(): SSEConnectionStatus {
    return this.status;
  }

  public getRecentEvents(): SSEMessageEvent[] {
    return [...this.recentEvents];
  }

  public subscribe(eventType: string, callback: SSEListener): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);

    return () => {
      this.listeners.get(eventType)?.delete(callback);
    };
  }

  public onStatusChange(callback: (status: SSEConnectionStatus) => void): () => void {
    this.statusListeners.add(callback);
    callback(this.status);
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  private dispatch(eventType: string, data: any): void {
    const list = this.listeners.get(eventType);
    if (list) {
      for (const listener of list) {
        try {
          listener(data);
        } catch (err) {
          console.error(`[SSE Dispatch Error] ${eventType}:`, err);
        }
      }
    }
  }

  public disconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.setStatus('disconnected');
  }
}

export const sseClient = new SSEClientManager();
