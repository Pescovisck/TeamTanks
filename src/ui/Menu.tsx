import { useState } from "react"
import { MAPS, type MapDef } from "../game/data"
import type { Difficulty, GameOptions, Team } from "../game/engine"
import type { LobbyInfo } from "../game/lobby"
import { copyInviteLink, syncUrlParams } from "../utils/url"
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
        <div className="text-[11px] text-white/50">
          {map.tile}
        </div>
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
  const set = <K extends keyof GameOptions>(k: K, v: GameOptions[K]) =>
    setO((s) => ({ ...s, [k]: v }))

  const handleCopyLink = async () => {
    let code = o.roomCode?.trim()
    if (!code) {
      code = `room${Math.floor(100 + Math.random() * 900)}`
      set("roomCode", code)
      syncUrlParams(code, o.map.id)
    }
    await copyInviteLink(code, o.map.id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleJoinLobby = (lobby: LobbyInfo) => {
    const targetMap = MAPS.find((m) => m.id === lobby.mapId) ?? o.map
    const autoTeam: Team = lobby.hostTeam === "red" ? "blue" : lobby.hostTeam === "blue" ? "red" : o.playerTeam
    const nextOpts: GameOptions = {
      ...o,
      map: targetMap,
      playerTeam: autoTeam,
      roomCode: lobby.roomCode,
      joinAsClient: true,
    }
    setO(nextOpts)
    syncUrlParams(lobby.roomCode, targetMap.id)
    onStart(nextOpts)
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
        <header className="mb-10 flex flex-wrap items-end justify-between gap-6">
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
            onClick={() => onStart(o)}
            className="group relative overflow-hidden rounded-md bg-hazard px-10 py-5 font-sans font-bold text-2xl tracking-wide text-gunmetal shadow-[0_10px_40px_rgba(242,194,48,0.35)] transition-transform hover:-translate-y-0.5 active:translate-y-0"
          >
            Deploy
            <span className="ml-3 inline-block transition-transform group-hover:translate-x-1">
              ›
            </span>
          </button>
        </header>

        {o.roomCode && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-hazard bg-hazard/10 px-5 py-4 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <span className="text-3xl">⚔️</span>
              <div>
                <div className="text-[15px] font-bold text-white">
                  Room Invite: <span className="font-mono text-hazard">{o.roomCode}</span>
                </div>
                <div className="text-[12px] text-white/70">
                  Battlefield: <span className="font-semibold text-white">{o.map.name}</span> · Ready to connect as peer
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
                onClick={() => onStart({ ...o, joinAsClient: true })}
                className="rounded bg-hazard px-6 py-2.5 font-sans text-base font-bold text-gunmetal shadow transition-transform hover:scale-105 active:scale-95"
              >
                Join Battle Now ›
              </button>
            </div>
          </div>
        )}

        <div className="mb-6">
          <RoomBrowser currentRoom={o.roomCode} onJoin={handleJoinLobby} />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
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

          <section className="plate flex flex-col gap-5 rounded-lg p-5">
            <h2 className="font-display text-lg tracking-wide">Deployment</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="callsign"
                  className="mb-2 block text-[12px] font-semibold text-white/50"
                >
                  Tag
                </label>
                <input
                  id="callsign"
                  value={o.playerName}
                  maxLength={14}
                  onChange={(e) =>
                    set(
                      "playerName",
                      e.target.value.replace(/[^a-z0-9]/gi, "").toLowerCase() ||
                        "",
                    )
                  }
                  placeholder="tankcommander"
                  className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 font-semibold outline-none transition-colors placeholder:text-white/25 focus:border-hazard"
                />
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="roomcode"
                    className="block text-[12px] font-semibold text-white/50"
                  >
                    P2P Room (Optional)
                  </label>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex items-center gap-1 text-[11px] font-semibold text-hazard transition-colors hover:text-white"
                  >
                    {copied ? (
                      <span className="text-[#6fd36a]">✓ Copied!</span>
                    ) : (
                      <span>{o.roomCode ? "Copy Link" : "Create Link"}</span>
                    )}
                  </button>
                </div>
                <div className="relative flex items-center">
                  <input
                    id="roomcode"
                    value={o.roomCode ?? ""}
                    maxLength={16}
                    onChange={(e) => {
                      const v = e.target.value
                        .replace(/[^a-z0-9_-]/gi, "")
                        .toLowerCase()
                      set("roomCode", v)
                      syncUrlParams(v, o.map.id)
                    }}
                    placeholder="solo / room1"
                    className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 pr-8 font-semibold outline-none transition-colors placeholder:text-white/25 focus:border-hazard"
                  />
                  {o.roomCode && (
                    <button
                      type="button"
                      onClick={() => {
                        set("roomCode", "")
                        syncUrlParams("", o.map.id)
                      }}
                      title="Clear room"
                      className="absolute right-2.5 text-xs text-white/35 hover:text-white/80"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>
            <Segmented<Team>
              label="Team"
              value={o.playerTeam}
              onChange={(v) => set("playerTeam", v)}
              options={[
                { value: "red", label: "Red", tone: "red" },
                { value: "blue", label: "Blue", tone: "blue" },
              ]}
            />
            <Segmented<number>
              label="Tanks per team"
              value={o.teamSize}
              onChange={(v) => set("teamSize", v)}
              options={[2, 3, 4, 5].map((n) => ({
                value: n,
                label: `${n}v${n}`,
              }))}
            />
            <Segmented<Difficulty>
              label="Enemy skill"
              value={o.difficulty}
              onChange={(v) => set("difficulty", v)}
              options={[
                { value: "rookie", label: "Rookie" },
                { value: "regular", label: "Regular" },
                { value: "veteran", label: "Veteran" },
              ]}
            />
            <Segmented<number>
              label="Round length"
              value={o.minutes}
              onChange={(v) => set("minutes", v)}
              options={[
                { value: 3, label: "3 min" },
                { value: 5, label: "5 min" },
                { value: 10, label: "10 min" },
              ]}
            />
            <Segmented<boolean>
              label="Camera & Turret Mode"
              value={o.proMode ?? true}
              onChange={(v) => set("proMode", v)}
              options={[
                { value: true, label: "Pro (Mouse Aim + Zoom)" },
                { value: false, label: "Casual (Auto-Aim + Chase)" },
              ]}
            />
          </section>
        </div>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="plate rounded-lg p-5">
            <h2 className="mb-3 font-display text-lg tracking-wide">Mission</h2>
            <p className="text-[14px] leading-relaxed text-white/70">
              Each capture point glows from red to blue. Park inside its ring to
              pull it toward your colour. When the clock runs out, the team with
              more total glow wins. Grab icons for nooks, rockets, lasers and
              airstrikes. Land flips to fill your uber meter and get
              supercharged. Enter a Room Code to battle friends over WebRTC P2P
              or across browser tabs.
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
    </div>
  )
}
