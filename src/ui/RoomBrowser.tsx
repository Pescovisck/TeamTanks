import { useEffect, useState } from 'react';
import { lobbyService, type LobbyInfo } from '../game/lobby';

const asset = (p: string) => import.meta.env.BASE_URL + 'tt/' + p;

type Props = {
  currentRoom?: string;
  onJoin: (lobby: LobbyInfo) => void;
};

export default function RoomBrowser({ currentRoom, onJoin }: Props) {
  const [lobbies, setLobbies] = useState<LobbyInfo[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const unsub = lobbyService.subscribe((list) => {
      setLobbies(list);
    });
    return unsub;
  }, []);

  const handleManualRefresh = () => {
    setRefreshing(true);
    setLobbies(lobbyService.getActiveLobbies());
    setTimeout(() => setRefreshing(false), 600);
  };

  return (
    <div className="plate rounded-lg p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#6fd36a] opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#6fd36a]" />
          </div>
          <h2 className="font-display text-lg tracking-wide text-white">
            Live Battles
          </h2>
          <span className="rounded bg-black/40 px-2 py-0.5 text-[11px] font-semibold text-white/60">
            {lobbies.length} {lobbies.length === 1 ? 'room' : 'rooms'} active
          </span>
        </div>

        <button
          type="button"
          onClick={handleManualRefresh}
          className="text-[12px] font-semibold text-white/50 transition-colors hover:text-hazard"
        >
          {refreshing ? 'Refreshing...' : '↻ Refresh'}
        </button>
      </div>

      {lobbies.length === 0 ? (
        <div className="rounded-md border border-white/5 bg-black/30 px-4 py-6 text-center">
          <p className="text-[14px] text-white/60">
            No active public battles detected right now.
          </p>
          <p className="mt-1 text-[12px] text-white/40">
            Hit "Host Battle" to start a room, or use "Join by Code" to jump in with a friend!
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {lobbies.map((l) => {
            const isCurrent = currentRoom && currentRoom.toLowerCase() === l.roomCode.toLowerCase();
            return (
              <div
                key={l.id}
                className={`relative flex overflow-hidden rounded-md border p-3 transition-all ${
                  isCurrent
                    ? 'border-hazard bg-hazard/10 ring-1 ring-hazard/40'
                    : 'border-white/10 bg-black/40 hover:border-white/25 hover:bg-black/60'
                }`}
              >
                <img
                  src={asset(`maps/${l.mapId}tex.png`)}
                  alt=""
                  className="pixelated mr-3.5 h-16 w-16 rounded border border-white/10 object-cover"
                />
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display text-[15px] font-bold text-white tracking-wide">
                        {l.roomCode}
                      </span>
                      <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-hazard">
                        {l.players} / {l.maxPlayers || 8}
                      </span>
                    </div>
                    <div className="text-[12px] text-white/70">
                      {l.mapName} · Host: <span className="font-semibold text-white/90">{l.hostName}</span>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[10px] text-white/40">
                      P2P WebRTC
                    </span>
                    <button
                      type="button"
                      onClick={() => onJoin(l)}
                      className="rounded bg-hazard px-3 py-1 text-[12px] font-bold text-gunmetal shadow transition-transform hover:scale-105 active:scale-95"
                    >
                      {isCurrent ? 'Joined' : 'Join Battle ›'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
