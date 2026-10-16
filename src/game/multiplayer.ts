import Peer, { DataConnection } from 'peerjs';
import { Team, WeaponId } from './data';

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
  | { subject: 'left'; sender: string };

function sanitizeRoomSlug(roomId: string): string {
  return roomId.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
}

export class MultiplayerSession {
  public readonly roomId: string;
  public readonly playerName: string;
  public readonly team: Team;
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
  private destroyed = false;

  constructor(
    roomId: string,
    playerName: string,
    team: Team,
    onMessage: (msg: NetMessage) => void,
    onStatusChange?: (status: { connected: boolean; isHost: boolean; peers: number }) => void
  ) {
    this.roomId = roomId;
    this.playerName = playerName;
    this.team = team;
    this.onMessage = onMessage;
    this.onStatusChange = onStatusChange;

    this.initBroadcastChannel();
    this.initWebRTC();
  }

  private notifyStatus() {
    this.onStatusChange?.({
      connected: this.isConnected,
      isHost: this.isHost,
      peers: this.peerCount,
    });
  }

  private initBroadcastChannel() {
    try {
      const slug = sanitizeRoomSlug(this.roomId);
      this.bc = new BroadcastChannel(`tt2006_room_${slug}`);
      this.bc.onmessage = (ev) => {
        if (this.destroyed) return;
        const packet = ev.data;
        if (!packet || !packet.id || !packet.msg) return;
        if (this.seenMsgIds.has(packet.id)) return;
        this.seenMsgIds.add(packet.id);
        const msg = packet.msg as NetMessage;
        if (msg.sender !== this.playerName) {
          this.onMessage(msg);
        }
      };
    } catch {
      // BroadcastChannel unsupported
    }
  }

  private initWebRTC() {
    const slug = sanitizeRoomSlug(this.roomId);
    const hostPeerId = `tt2006-room-${slug}`;

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

        hostPeer.on('connection', (conn) => {
          this.setupHostClientConnection(conn);
        });
      });

      hostPeer.on('error', (err: any) => {
        if (this.destroyed) return;
        if (err?.type === 'unavailable-id') {
          // Room host already exists! Connect as client peer
          try {
            hostPeer.destroy();
          } catch {}
          this.connectAsClient(hostPeerId);
        } else {
          // Even if public broker is unreachable offline, BroadcastChannel still works locally
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
    });

    conn.on('data', (raw: any) => {
      if (this.destroyed) return;
      if (!raw || !raw.id || !raw.msg) return;
      if (this.seenMsgIds.has(raw.id)) return;
      this.seenMsgIds.add(raw.id);

      // Relay to all other WebRTC clients in the room
      for (const [peerId, other] of this.clientConns.entries()) {
        if (peerId !== conn.peer && other.open) {
          try {
            other.send(raw);
          } catch {}
        }
      }

      const msg = raw.msg as NetMessage;
      if (msg.sender !== this.playerName) {
        this.onMessage(msg);
      }
    });

    const cleanup = () => {
      this.clientConns.delete(conn.peer);
      this.peerCount = this.clientConns.size;
      this.notifyStatus();
    };
    conn.on('close', cleanup);
    conn.on('error', cleanup);
  }

  private connectAsClient(hostPeerId: string) {
    try {
      const clientPeer = new Peer();
      this.peer = clientPeer;

      clientPeer.on('open', () => {
        if (this.destroyed) {
          clientPeer.destroy();
          return;
        }
        const conn = clientPeer.connect(hostPeerId, { reliable: false });
        this.hostConn = conn;

        conn.on('open', () => {
          if (this.destroyed) return;
          this.isConnected = true;
          this.isHost = false;
          this.peerCount = 1;
          this.notifyStatus();
        });

        conn.on('data', (raw: any) => {
          if (this.destroyed) return;
          if (!raw || !raw.id || !raw.msg) return;
          if (this.seenMsgIds.has(raw.id)) return;
          this.seenMsgIds.add(raw.id);
          const msg = raw.msg as NetMessage;
          if (msg.sender !== this.playerName) {
            this.onMessage(msg);
          }
        });

        conn.on('close', () => {
          if (this.destroyed) return;
          this.peerCount = 0;
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

    const packet = { id, msg };

    // 1. Send via BroadcastChannel (same-machine tabs)
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
    this.send({ subject: 'left', sender: this.playerName });
    this.destroyed = true;
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
