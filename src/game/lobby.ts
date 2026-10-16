import mqtt, { type MqttClient } from 'mqtt';

export interface LobbyInfo {
  id: string; // unique slug e.g. "grass1_room102"
  roomCode: string;
  mapId: string;
  mapName: string;
  hostName: string;
  hostPeerId: string;
  players: number;
  maxPlayers: number;
  updatedAt: number;
}

const MQTT_BROKERS = [
  'wss://broker.emqx.io:8084/mqtt',
  'wss://broker.hivemq.com:8884/mqtt',
];

const LOBBY_TOPIC_PREFIX = 'teamtanks/v1/lobbies/';

class LobbyService {
  private client: MqttClient | null = null;
  private lobbies = new Map<string, LobbyInfo>();
  private listeners = new Set<(lobbies: LobbyInfo[]) => void>();
  private heartbeatTimer: any = null;
  private pruneTimer: any = null;
  private currentHostedLobby: LobbyInfo | null = null;
  private connecting = false;

  constructor() {
    this.startPruning();
  }

  private connect(): Promise<MqttClient> {
    if (this.client && this.client.connected) {
      return Promise.resolve(this.client);
    }
    if (this.connecting && this.client) {
      return new Promise((resolve) => {
        this.client?.once('connect', () => resolve(this.client!));
      });
    }

    this.connecting = true;
    const brokerUrl = MQTT_BROKERS[0];

    return new Promise((resolve) => {
      try {
        const client = mqtt.connect(brokerUrl, {
          clientId: `tt_web_${Math.random().toString(36).slice(2, 9)}`,
          clean: true,
          connectTimeout: 5000,
          reconnectPeriod: 4000,
        });

        this.client = client;

        client.on('connect', () => {
          this.connecting = false;
          client.subscribe(`${LOBBY_TOPIC_PREFIX}+`, { qos: 0 });
          if (this.currentHostedLobby) {
            this.publishHeartbeat();
          }
          resolve(client);
        });

        client.on('message', (topic, payload) => {
          try {
            const raw = JSON.parse(payload.toString());
            const id = topic.replace(LOBBY_TOPIC_PREFIX, '');
            if (raw.deleted) {
              this.lobbies.delete(id);
            } else {
              this.lobbies.set(id, {
                ...raw,
                id,
                updatedAt: Date.now(),
              });
            }
            this.notify();
          } catch {
            // Ignore malformed messages
          }
        });

        client.on('error', () => {
          // Fallback silently if offline or blocked
        });
      } catch {
        this.connecting = false;
      }
    });
  }

  public subscribe(listener: (lobbies: LobbyInfo[]) => void): () => void {
    this.listeners.add(listener);
    listener(this.getActiveLobbies());
    void this.connect();

    return () => {
      this.listeners.delete(listener);
    };
  }

  public getActiveLobbies(): LobbyInfo[] {
    const now = Date.now();
    const active: LobbyInfo[] = [];
    for (const [id, lobby] of this.lobbies.entries()) {
      if (now - lobby.updatedAt < 12000) {
        active.push(lobby);
      } else {
        this.lobbies.delete(id);
      }
    }
    return active.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  private notify() {
    const active = this.getActiveLobbies();
    for (const listener of this.listeners) {
      listener(active);
    }
  }

  private startPruning() {
    if (typeof window === 'undefined') return;
    this.pruneTimer = setInterval(() => {
      const now = Date.now();
      let changed = false;
      for (const [id, lobby] of this.lobbies.entries()) {
        if (now - lobby.updatedAt >= 12000) {
          this.lobbies.delete(id);
          changed = true;
        }
      }
      if (changed) this.notify();
    }, 3000);
  }

  public startHosting(lobby: Omit<LobbyInfo, 'updatedAt'>) {
    this.currentHostedLobby = {
      ...lobby,
      updatedAt: Date.now(),
    };
    this.lobbies.set(lobby.id, this.currentHostedLobby);
    this.notify();

    void this.connect().then(() => {
      this.publishHeartbeat();
    });

    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = setInterval(() => {
      if (this.currentHostedLobby) {
        this.currentHostedLobby.updatedAt = Date.now();
        this.publishHeartbeat();
      }
    }, 4000);
  }

  public updatePlayerCount(players: number) {
    if (this.currentHostedLobby) {
      this.currentHostedLobby.players = players;
      this.currentHostedLobby.updatedAt = Date.now();
      this.publishHeartbeat();
      this.notify();
    }
  }

  public stopHosting() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.currentHostedLobby && this.client && this.client.connected) {
      const topic = `${LOBBY_TOPIC_PREFIX}${this.currentHostedLobby.id}`;
      try {
        this.client.publish(topic, JSON.stringify({ deleted: true }), { qos: 0 });
      } catch {}
      this.lobbies.delete(this.currentHostedLobby.id);
      this.notify();
    }
    this.currentHostedLobby = null;
  }

  private publishHeartbeat() {
    if (!this.currentHostedLobby || !this.client || !this.client.connected) return;
    const topic = `${LOBBY_TOPIC_PREFIX}${this.currentHostedLobby.id}`;
    try {
      this.client.publish(
        topic,
        JSON.stringify({
          ...this.currentHostedLobby,
          updatedAt: Date.now(),
        }),
        { qos: 0 }
      );
    } catch {}
  }
}

export const lobbyService = new LobbyService();
