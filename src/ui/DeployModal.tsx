import { useState, useEffect } from "react"
import type { Team } from "../game/engine"

const asset = (p: string) => import.meta.env.BASE_URL + "tt/" + p

type Props = {
  isOpen: boolean
  roomCode: string
  isHost: boolean
  mapName: string
  mapId: string
  initialCallsign: string
  initialTeam: Team
  hostTeam?: Team
  onClose: () => void
  onDeploy: (callsign: string, team: Team) => void
}

export default function DeployModal({
  isOpen,
  roomCode,
  isHost,
  mapName,
  mapId,
  initialCallsign,
  initialTeam,
  hostTeam,
  onClose,
  onDeploy,
}: Props) {
  const [callsign, setCallsign] = useState(initialCallsign)
  const [team, setTeam] = useState<Team>(initialTeam)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setCallsign(initialCallsign)
  }, [initialCallsign])

  useEffect(() => {
    setTeam(initialTeam)
  }, [initialTeam])

  if (!isOpen) return null

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(roomCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const finalTag = callsign.trim().toLowerCase() || initialCallsign || "commander"
    onDeploy(finalTag, team)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md overflow-hidden rounded-xl border border-hazard/40 bg-[#111419] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
        {/* Hazard stripe accent at top */}
        <div className="hazard-stripe absolute inset-x-0 top-0 h-1.5" />

        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-hazard">
                {isHost ? "Host Setup" : "Join Battle"}
              </span>
              <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/60">
                5v5 Squads
              </span>
            </div>
            <h2 className="mt-1 font-display text-2xl font-bold tracking-wide text-white">
              Deploy Call Sign & Team
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Room & Map summary card */}
        <div className="mb-5 flex items-center gap-3 rounded-lg border border-white/10 bg-black/40 p-3">
          <img
            src={asset(`maps/${mapId}tex.png`)}
            alt=""
            className="pixelated h-12 w-12 rounded border border-white/15 object-cover"
          />
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-white truncate">
              {mapName}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-white/50">
              <span>Room:</span>
              <span className="font-mono font-bold text-hazard text-[13px]">
                {roomCode}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[10px] text-white/40 hover:text-white"
              >
                {copied ? "✓ Copied" : "Copy"}
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Tag / Callsign */}
          <div>
            <label
              htmlFor="modal-callsign"
              className="mb-1.5 block text-[12px] font-semibold text-white/60"
            >
              Call Sign (Tag)
            </label>
            <input
              id="modal-callsign"
              type="text"
              value={callsign}
              maxLength={14}
              onChange={(e) =>
                setCallsign(
                  e.target.value.replace(/[^a-z0-9_-]/gi, "").toLowerCase(),
                )
              }
              placeholder="e.g. vanguard42"
              className="w-full rounded-md border border-white/15 bg-black/60 px-3.5 py-2.5 font-sans font-bold text-white outline-none transition-colors focus:border-hazard focus:ring-1 focus:ring-hazard/40"
              autoFocus
            />
          </div>

          {/* Team Selection */}
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-white/60">
              Select Team
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTeam("blue")}
                className={`flex flex-col items-center gap-1.5 rounded-lg border p-3.5 transition-all ${
                  team === "blue"
                    ? "border-team-blue bg-team-blue/20 ring-2 ring-team-blue shadow-[0_0_20px_rgba(77,159,255,0.25)]"
                    : "border-white/10 bg-black/40 hover:border-white/30"
                }`}
              >
                <div className="h-4 w-4 rounded-full bg-team-blue" />
                <span className="font-display text-sm font-bold tracking-wide text-team-blue">
                  Blue Team
                </span>
                {hostTeam === "blue" && !isHost && (
                  <span className="text-[10px] text-white/40">Host Team</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setTeam("red")}
                className={`flex flex-col items-center gap-1.5 rounded-lg border p-3.5 transition-all ${
                  team === "red"
                    ? "border-team-red bg-team-red/20 ring-2 ring-team-red shadow-[0_0_20px_rgba(255,77,77,0.25)]"
                    : "border-white/10 bg-black/40 hover:border-white/30"
                }`}
              >
                <div className="h-4 w-4 rounded-full bg-team-red" />
                <span className="font-display text-sm font-bold tracking-wide text-team-red">
                  Red Team
                </span>
                {hostTeam === "red" && !isHost && (
                  <span className="text-[10px] text-white/40">Host Team</span>
                )}
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-3 flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm font-semibold text-white/60 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-hazard px-6 py-2.5 font-sans text-base font-bold text-gunmetal shadow-[0_6px_25px_rgba(242,194,48,0.35)] transition-transform hover:scale-105 active:scale-95"
            >
              Deploy Tank ›
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
