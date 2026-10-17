import Peer, { type DataConnection } from 'peerjs';
import { type Team, type WeaponId } from './data';
import { lobbyService } from './lobby';

export interface NetTankState {
  name: string;
  team: Team;
  pos: [number, number, number];
  quat: [number, number, number, number];
  vel: [number, number, number];
  turretYaw: number;
  gunPitch: number;
  weapon: WeaponId;
  hp: number;
  score: number;
  superActive: boolean;
  stealthActive: boolean;
  thrustActive: boolean;
  rcState?: {
    active: boolean;
    kind: 'rcbomb' | 'rcrocket';
    pos: [number, number, number];
    quat: [number, number, number, number];
  };
}

export type NetMessage =
  | { subject: 'where'; sender: string; state: NetTankState }
  | {
      subject: 'fire';
      sender: string;
      team: Team;
      weapon: WeaponId;
      pid: string;
      pos: [number, number, number];
      dir: [number, number, number];
      endPos?: [number, number, number];
      targetName?: string;
    }
  | { subject: 'detonate'; sender: string; pid: string }
  | { subject: 'hurt'; sender: string; target: string; amount: number; weapon: WeaponId }
  | {
      subject: 'dead';
      sender: string;
      victim: string;
      killer: string;
      weapon: WeaponId;
      pos: [number, number, number];
    }
  | { subject: 'cappoint'; sender: string; id: number; team: Team; val: number; tarGlow: [number, number, number] }
  | { subject: 'talk'; sender: string; team: Team; text: string }
  | { subject: 'mapvote'; sender: string; mapId: string }
  | { subject: 'nextmap'; sender: string; mapId: string }
  | {
      subject: 'roundstate';
      sender: string;
      timeLeft: number;
      over: null | { winner: Team | 'draw'; blueShare: number };
      voteSecondsLeft?: number;
      candidates?: string[];
      votes?: Record<string, string>;
      enabledWeapons?: WeaponId[];
    }
  | { subject: 'left'; sender: string };

export interface RoomMeta {
  roomCode: string;
  mapId: string;
  mapName: string;
  joinAsClient?: boolean;
}

function sanitizeRoomSlug(roomId: string): string {
  return roomId.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
}

export class MultiplayerSession {
  public readonly roomId: string;
  public playerName: string;
  public team: Team;
  public readonly sessionId: string;
  public isConnected = false;
  public isHost = false;
  public peerCount = 0;

  private bc: BroadcastChannel | null = null;
  private peer: Peer | null = null;
  private hostConn: DataConnection | null = null;
  private clientConns = new Map<string, DataConnection>();
  private seenMsgIds = new Set<string>();
  private onMessage: (msg: NetMessage) => void;
  private onStatusChange?: (status: { connected: boolean; isHost: boolean; peers: number }) => void;
  private meta?: RoomMeta;
  private destroyed = false;
  private clientTimeoutTimer: any = null;

  constructor(
    roomId: string,
    playerName: string,
    team: Team,
    onMessage: (msg: NetMessage) => void,
    onStatusChange?: (status: { connected: boolean; isHost: boolean; peers: number }) => void,
    meta?: RoomMeta
  ) {
    this.roomId = roomId;
    this.playerName = playerName;
    this.team = team;
    this.sessionId = `${playerName}_${Math.random().toString(36).slice(2, 9)}`;
    this.onMessage = onMessage;
    this.onStatusChange = onStatusChange;
    this.meta = meta;

    this.initBroadcastChannel();
    this.initWebRTC();
  }

  public updatePlayerIdentity(name: string, team: Team) {
    this.playerName = name;
    this.team = team;
  }

  private notifyStatus() {
    this.onStatusChange?.({
      connected: this.isConnected,
      isHost: this.isHost,
      peers: this.peerCount,
    });
  }

  private handleIncomingPacket(packet: any) {
    if (!packet || !packet.id || !packet.msg) return;
    if (this.seenMsgIds.has(packet.id)) return;
    this.seenMsgIds.add(packet.id);
    if (this.seenMsgIds.size > 2000) {
      const first = this.seenMsgIds.values().next().value;
      if (first) this.seenMsgIds.delete(first);
    }

    // Drop self packets (identified by unique sessionId)
    if (packet.sessionId && packet.sessionId === this.sessionId) return;
    if (!packet.sessionId && packet.msg.sender === this.playerName) return;

    this.onMessage(packet.msg as NetMessage);
  }

  private initBroadcastChannel() {
    try {
      const slug = sanitizeRoomSlug(this.roomId);
      this.bc = new BroadcastChannel(`tt2006_room_${slug}`);
      this.bc.onmessage = (ev) => {
        if (this.destroyed) return;
        this.handleIncomingPacket(ev.data);
      };
    } catch {
      // BroadcastChannel unsupported
    }
  }

  private initWebRTC() {
    const slug = sanitizeRoomSlug(this.roomId);
    const hostPeerId = `tt2006-room-${slug}`;

    if (this.meta?.joinAsClient) {
      this.connectAsClient(hostPeerId, true);
      return;
    }

    try {
      const hostPeer = new Peer(hostPeerId);

      hostPeer.on('open', () => {
        if (this.destroyed) {
          hostPeer.destroy();
          return;
        }
        this.peer = hostPeer;
        this.isHost = true;
        this.isConnected = true;
        this.notifyStatus();

        if (this.meta) {
          lobbyService.startHosting({
            id: this.roomId,
            roomCode: this.meta.roomCode,
            mapId: this.meta.mapId,
            mapName: this.meta.mapName,
            hostName: this.playerName,
            hostTeam: this.team,
            hostPeerId,
            players: 1,
            maxPlayers: 8,
          });
        }

        hostPeer.on('connection', (conn) => {
          this.setupHostClientConnection(conn);
        });
      });

      hostPeer.on('error', (err: any) => {
        if (this.destroyed) return;
        if (err?.type === 'unavailable-id') {
          // Room host already exists! Connect as client
          try {
            hostPeer.destroy();
          } catch {}
          this.connectAsClient(hostPeerId, false);
        } else {
          // Public broker unreachable or socket error
          this.isConnected = true;
          this.notifyStatus();
        }
      });
    } catch {
      this.isConnected = true;
      this.notifyStatus();
    }
  }

  private setupHostClientConnection(conn: DataConnection) {
    conn.on('open', () => {
      if (this.destroyed) return;
      this.clientConns.set(conn.peer, conn);
      this.peerCount = this.clientConns.size;
      this.notifyStatus();
      lobbyService.updatePlayerCount(this.peerCount + 1);
    });

    conn.on('data', (raw: any) => {
      if (this.destroyed) return;
      this.handleIncomingPacket(raw);

      // Relay to all other WebRTC clients in this room
      for (const [peerId, other] of this.clientConns.entries()) {
        if (peerId !== conn.peer && other.open) {
          try {
            other.send(raw);
          } catch {}
        }
      }
    });

    const cleanup = () => {
      this.clientConns.delete(conn.peer);
      this.peerCount = this.clientConns.size;
      this.notifyStatus();
      lobbyService.updatePlayerCount(this.peerCount + 1);
    };
    conn.on('close', cleanup);
    conn.on('error', cleanup);
  }

  private connectAsClient(hostPeerId: string, fallbackToHost: boolean) {
    try {
      const clientPeer = new Peer();
      this.peer = clientPeer;

      clientPeer.on('open', () => {
        if (this.destroyed) {
          clientPeer.destroy();
          return;
        }

        const conn = clientPeer.connect(hostPeerId, { reliable: true });
        this.hostConn = conn;

        if (fallbackToHost) {
          this.clientTimeoutTimer = setTimeout(() => {
            if (!this.isConnected && !this.destroyed) {
              // Host did not respond, promote this peer to host
              try {
                conn.close();
                clientPeer.destroy();
              } catch {}
              this.meta = { ...this.meta!, joinAsClient: false };
              this.initWebRTC();
            }
          }, 3500);
        }

        conn.on('open', () => {
          if (this.destroyed) return;
          if (this.clientTimeoutTimer) {
            clearTimeout(this.clientTimeoutTimer);
            this.clientTimeoutTimer = null;
          }
          this.isConnected = true;
          this.isHost = false;
          this.peerCount = 1;
          this.notifyStatus();
        });

        conn.on('data', (raw: any) => {
          if (this.destroyed) return;
          this.handleIncomingPacket(raw);
        });

        conn.on('close', () => {
          if (this.destroyed) return;
          this.peerCount = 0;
          this.notifyStatus();
        });

        conn.on('error', () => {
          if (this.destroyed) return;
          this.isConnected = true;
          this.notifyStatus();
        });
      });

      clientPeer.on('error', () => {
        this.isConnected = true;
        this.notifyStatus();
      });
    } catch {
      this.isConnected = true;
      this.notifyStatus();
    }
  }

  public send(msg: NetMessage) {
    if (this.destroyed) return;
    const id = `${this.playerName}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    this.seenMsgIds.add(id);
    if (this.seenMsgIds.size > 2000) {
      const first = this.seenMsgIds.values().next().value;
      if (first) this.seenMsgIds.delete(first);
    }

    const packet = { id, sessionId: this.sessionId, msg };

    // 1. Send via BroadcastChannel (same-machine browser tabs)
    try {
      this.bc?.postMessage(packet);
    } catch {}

    // 2. Send via WebRTC DataChannels
    if (this.isHost) {
      for (const conn of this.clientConns.values()) {
        if (conn.open) {
          try {
            conn.send(packet);
          } catch {}
        }
      }
    } else if (this.hostConn && this.hostConn.open) {
      try {
        this.hostConn.send(packet);
      } catch {}
    }
  }

  public dispose() {
    if (this.destroyed) return;
    if (this.clientTimeoutTimer) {
      clearTimeout(this.clientTimeoutTimer);
      this.clientTimeoutTimer = null;
    }
    this.send({ subject: 'left', sender: this.playerName });
    this.destroyed = true;

    if (this.isHost) {
      lobbyService.stopHosting();
    }

    try {
      this.bc?.close();
    } catch {}
    try {
      this.hostConn?.close();
    } catch {}
    for (const c of this.clientConns.values()) {
      try {
        c.close();
      } catch {}
    }
    try {
      this.peer?.destroy();
    } catch {}
  }
}
