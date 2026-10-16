import { useState } from "react"
import { MAPS, type MapDef } from "../game/data"
import type { Difficulty, GameOptions, Team } from "../game/engine"
import type { LobbyInfo } from "../game/lobby"
import { copyInviteLink, generateRoomCode, syncUrlParams } from "../utils/url"
import DeployModal from "./DeployModal"
import RoomBrowser from "./RoomBrowser"

const asset = (p: string) => import.meta.env.BASE_URL + "tt/" + p

type Props = { initial: GameOptions; onStart: (o: GameOptions) => void }

function Segmented<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: string; tone?: "red" | "blue" }[]
  onChange: (v: T) => void
}) {
  return (
    <div>
      <div className="mb-2 text-[12px] font-semibold text-white/50">
        {label}
      </div>
      <div className="flex gap-1 rounded-md bg-black/40 p-1">
        {options.map((o) => {
          const active = o.value === value
          const tone =
            o.tone === "red"
              ? "bg-team-red text-white"
              : o.tone === "blue"
                ? "bg-team-blue text-white"
                : "bg-hazard text-gunmetal"
          return (
            <button
              key={String(o.value)}
              type="button"
              onClick={() => onChange(o.value)}
              className={`flex-1 rounded px-3 py-2 text-sm font-semibold transition-colors ${
                active
                  ? tone
                  : "text-white/65 hover:bg-white/5 hover:text-white"
              }`}
            >
              {o.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function MapCard({
  map,
  active,
  onClick,
}: {
  map: MapDef
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative overflow-hidden rounded-md border text-left transition-all ${
        active
          ? "border-hazard ring-2 ring-hazard/40"
          : "border-white/10 hover:border-white/30"
      }`}
    >
      <img
        src={asset(`maps/${map.id}tex.png`)}
        alt=""
        className="pixelated aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-2 pb-1.5 pt-6">
        <div className="text-[13px] font-semibold leading-tight">
          {map.name}
        </div>
        <div className="text-[11px] text-white/50">{map.tile}</div>
      </div>
      {active && <div className="hazard-stripe absolute inset-x-0 top-0 h-1" />}
    </button>
  )
}

const CONTROLS: [string, string][] = [
  ["W A S D", "Drive / steer"],
  ["Mouse", "Aim turret (Pro) / Steer RC"],
  ["Left Click", "Fire"],
  ["Right Click", "Aim zoom (Pro) / Detonate RC"],
  ["V", "Toggle Casual / Pro camera"],
  ["Space", "Jump (+W/S flip, +A/D roll)"],
  ["R", "Respawn"],
  ["Tab", "Scores"],
  ["M", "Mute"],
]

export default function Menu({ initial, onStart }: Props) {
  const [o, setO] = useState<GameOptions>(initial)
  const [copied, setCopied] = useState(false)
  const [manualCode, setManualCode] = useState("")

  // Deploy Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [modalTarget, setModalTarget] = useState<{
    roomCode: string
    isHost: boolean
    map: MapDef
    hostTeam?: Team
  }>({
    roomCode: initial.roomCode || generateRoomCode(),
    isHost: !initial.roomCode,
    map: initial.map,
  })

  const set = <K extends keyof GameOptions>(k: K, v: GameOptions[K]) =>
    setO((s) => ({ ...s, [k]: v }))

  // Open deploy modal for hosting
  const handleHostBattle = () => {
    const room = o.roomCode?.trim() || generateRoomCode()
    set("roomCode", room)
    syncUrlParams(room, o.map.id)
    setModalTarget({
      roomCode: room,
      isHost: true,
      map: o.map,
    })
    setModalOpen(true)
  }

  // Open deploy modal for joining via direct room code
  const handleJoinWithCode = (e?: React.FormEvent) => {
    e?.preventDefault()
    const code = manualCode.trim().toUpperCase()
    if (!code) return
    set("roomCode", code)
    syncUrlParams(code, o.map.id)
    setModalTarget({
      roomCode: code,
      isHost: false,
      map: o.map,
    })
    setModalOpen(true)
  }

  // Open deploy modal for joining via room browser
  const handleJoinLobby = (lobby: LobbyInfo) => {
    const targetMap = MAPS.find((m) => m.id === lobby.mapId) ?? o.map
    const autoTeam: Team =
      lobby.hostTeam === "red"
        ? "blue"
        : lobby.hostTeam === "blue"
          ? "red"
          : o.playerTeam

    set("map", targetMap)
    set("roomCode", lobby.roomCode)
    set("playerTeam", autoTeam)
    syncUrlParams(lobby.roomCode, targetMap.id)

    setModalTarget({
      roomCode: lobby.roomCode,
      isHost: false,
      map: targetMap,
      hostTeam: lobby.hostTeam,
    })
    setModalOpen(true)
  }

  const handleCopyLink = async () => {
    const code = o.roomCode?.trim() || generateRoomCode()
    set("roomCode", code)
    syncUrlParams(code, o.map.id)
    await copyInviteLink(code, o.map.id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Called from DeployModal to launch match
  const handleFinalDeploy = (callsign: string, team: Team) => {
    const finalOpts: GameOptions = {
      ...o,
      map: modalTarget.map,
      playerName: callsign,
      playerTeam: team,
      roomCode: modalTarget.roomCode,
      joinAsClient: !modalTarget.isHost,
      teamSize: 5, // 5v5 default squads
    }
    setO(finalOpts)
    syncUrlParams(finalOpts.roomCode, finalOpts.map.id)
    setModalOpen(false)
    onStart(finalOpts)
  }

  return (
    <div className="relative h-full w-full overflow-y-auto">
      <img
        src={asset(`maps/${o.map.id}tex.png`)}
        alt=""
        className="pixelated fixed inset-0 h-full w-full scale-110 object-cover opacity-30 blur-[2px]"
      />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(11,13,16,0.55),rgba(11,13,16,0.96)_70%)]" />

      <div className="relative mx-auto flex min-h-full max-w-6xl flex-col px-6 py-10 lg:py-14">
        {/* Header */}
        <header className="mb-8 flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <div className="hazard-stripe h-2 w-14 rounded-sm" />
              <span className="text-[12px] font-semibold text-hazard">
                GameVial · Shockwave 3D · Remade
              </span>
            </div>
            <h1 className="font-display text-6xl leading-none tracking-tight sm:text-7xl">
              <span className="text-team-red">Team</span>{" "}
              <span className="text-team-blue">Tanks</span>
            </h1>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/65">
              Rebuilt in the browser from the original projector: levels
              generated from its heightmaps, all 66 original W3D 3D meshes and
              textures, weapons and capture rules from its decompiled Lingo, and
              serverless P2P multiplayer.
            </p>
          </div>
          <button
            type="button"
            onClick={handleHostBattle}
            className="group relative overflow-hidden rounded-md bg-hazard px-10 py-5 font-sans text-2xl font-bold tracking-wide text-gunmetal shadow-[0_10px_40px_rgba(242,194,48,0.35)] transition-transform hover:-translate-y-0.5 active:translate-y-0"
          >
            Host Battle
            <span className="ml-3 inline-block transition-transform group-hover:translate-x-1">
              ›
            </span>
          </button>
        </header>

        {/* Invite link detection banner */}
        {o.roomCode && !modalOpen && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-hazard bg-hazard/10 px-5 py-4 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <span className="text-3xl">⚔️</span>
              <div>
                <div className="text-[15px] font-bold text-white">
                  Room Invite:{" "}
                  <span className="font-mono text-hazard">{o.roomCode}</span>
                </div>
                <div className="text-[12px] text-white/70">
                  Battlefield:{" "}
                  <span className="font-semibold text-white">{o.map.name}</span>{" "}
                  · Ready to join squad
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCopyLink}
                className="rounded border border-white/20 bg-black/40 px-3 py-2 text-xs font-semibold text-white/80 transition-colors hover:bg-black/60 hover:text-white"
              >
                {copied ? "✓ Copied!" : "Copy Link"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setModalTarget({
                    roomCode: o.roomCode!,
                    isHost: false,
                    map: o.map,
                  })
                  setModalOpen(true)
                }}
                className="rounded bg-hazard px-6 py-2.5 font-sans text-base font-bold text-gunmetal shadow transition-transform hover:scale-105 active:scale-95"
              >
                Join Battle Now ›
              </button>
            </div>
          </div>
        )}

        {/* Room Discovery & Direct Join Row */}
        <div className="mb-6 grid gap-6 md:grid-cols-[1fr_2fr]">
          {/* Direct Code Join Card */}
          <div className="plate flex flex-col justify-between rounded-lg p-5">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <span className="font-display text-lg tracking-wide text-white">
                  Join by Room Code
                </span>
              </div>
              <p className="text-[12px] text-white/50">
                Have a 4-6 character code from a friend? Enter it below to join.
              </p>
            </div>

            <form onSubmit={handleJoinWithCode} className="mt-4 flex gap-2">
              <input
                type="text"
                value={manualCode}
                maxLength={8}
                onChange={(e) =>
                  setManualCode(
                    e.target.value.replace(/[^a-z0-9_-]/gi, "").toUpperCase(),
                  )
                }
                placeholder="e.g. HAWK42"
                className="flex-1 rounded-md border border-white/15 bg-black/40 px-3 py-2 font-mono text-sm font-bold uppercase text-white outline-none transition-colors placeholder:text-white/25 focus:border-hazard"
              />
              <button
                type="submit"
                disabled={!manualCode.trim()}
                className="rounded-md bg-hazard px-4 py-2 font-sans text-sm font-bold text-gunmetal transition-transform hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
              >
                Join ›
              </button>
            </form>
          </div>

          {/* Live Battles (Room Browser) */}
          <RoomBrowser currentRoom={o.roomCode} onJoin={handleJoinLobby} />
        </div>

        {/* Room Creation Configuration */}
        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          {/* Battlefield Selection */}
          <section className="plate rounded-lg p-5">
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="font-display text-lg tracking-wide">
                Battlefield
              </h2>
              <span className="text-xs text-white/45">
                {o.map.name} · grid {o.map.size}u · friction {o.map.friction}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {MAPS.map((m) => (
                <MapCard
                  key={m.id}
                  map={m}
                  active={m.id === o.map.id}
                  onClick={() => {
                    set("map", m)
                    syncUrlParams(o.roomCode, m.id)
                  }}
                />
              ))}
            </div>
          </section>

          {/* Match Configuration */}
          <section className="plate flex flex-col justify-between rounded-lg p-5">
            <div>
              <div className="mb-4 flex items-baseline justify-between">
                <h2 className="font-display text-lg tracking-wide">
                  Match Rules
                </h2>
                <span className="text-xs text-hazard font-semibold">
                  5v5 Squads
                </span>
              </div>

              <div className="flex flex-col gap-5">
                <Segmented<Difficulty>
                  label="Bot Skill"
                  value={o.difficulty}
                  onChange={(v) => set("difficulty", v)}
                  options={[
                    { value: "rookie", label: "Rookie" },
                    { value: "regular", label: "Regular" },
                    { value: "veteran", label: "Veteran" },
                  ]}
                />

                <Segmented<number>
                  label="Round Length"
                  value={o.minutes}
                  onChange={(v) => set("minutes", v)}
                  options={[
                    { value: 3, label: "3 min" },
                    { value: 5, label: "5 min" },
                    { value: 10, label: "10 min" },
                  ]}
                />

                <div className="rounded-md border border-white/10 bg-black/30 p-3.5 text-[12px] text-white/60">
                  <div className="mb-1 font-semibold text-white/80">
                    Squad Dynamic Balancing
                  </div>
                  <div>
                    Matches start with 5 tanks on each side. When human players
                    join, they take the place of bots to keep teams balanced.
                    More players can join anytime with no player limit!
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleHostBattle}
              className="mt-6 w-full rounded-md bg-hazard py-3.5 font-sans text-lg font-bold text-gunmetal shadow transition-transform hover:scale-[1.02] active:scale-100"
            >
              Host Match on {o.map.name} ›
            </button>
          </section>
        </div>

        {/* Mission & Controls Reference */}
        <section className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="plate rounded-lg p-5">
            <h2 className="mb-3 font-display text-lg tracking-wide">Mission</h2>
            <p className="text-[14px] leading-relaxed text-white/70">
              Each capture point glows from red to blue. Park inside its ring to
              pull it toward your colour. When the clock runs out, the team with
              more total glow wins. Grab icons for nooks, rockets, lasers and
              airstrikes. Land flips to fill your uber meter and get
              supercharged. Toggle camera modes anytime in-game with{" "}
              <kbd className="rounded border border-white/20 bg-black/40 px-1 py-0.5 font-mono text-xs font-bold text-hazard">
                V
              </kbd>
              .
            </p>
          </div>
          <div className="plate rounded-lg p-5">
            <h2 className="mb-3 font-display text-lg tracking-wide">
              Controls
            </h2>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[13px]">
              {CONTROLS.map(([k, v]) => (
                <div key={k} className="contents">
                  <dt>
                    <kbd className="rounded border border-white/15 bg-black/40 px-1.5 py-0.5 font-sans text-[11px] font-semibold text-hazard">
                      {k}
                    </kbd>
                  </dt>
                  <dd className="text-white/70">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <footer className="mt-auto pt-10 text-[11px] text-white/35">
          Fan remake for preservation. TeamTanks © Game Vial · All 66 original
          W3D 3D models, textures, and sounds restored.
        </footer>
      </div>

      {/* Deployment Modal (Tag & Team Selection) */}
      <DeployModal
        isOpen={modalOpen}
        roomCode={modalTarget.roomCode}
        isHost={modalTarget.isHost}
        mapName={modalTarget.map.name}
        mapId={modalTarget.map.id}
        initialCallsign={o.playerName}
        initialTeam={o.playerTeam}
        hostTeam={modalTarget.hostTeam}
        onClose={() => setModalOpen(false)}
        onDeploy={handleFinalDeploy}
      />
    </div>
  )
}
