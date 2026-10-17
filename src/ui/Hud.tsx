import { useEffect, useRef, useState } from "react"
import { MAX_HEALTH, WEAPONS, type MapDef } from "../game/data"
import type { HudState, Team } from "../game/engine"
import { copyInviteLink } from "../utils/url"

const asset = (p: string) => import.meta.env.BASE_URL + "tt/" + p
const teamText = (t?: Team) =>
  t === "red"
    ? "text-team-red"
    : t === "blue"
      ? "text-team-blue"
      : "text-white/80"

function fmt(s: number) {
  const m = Math.floor(s / 60)
  return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`
}

function CapBars({ caps, time }: { caps: number[]; time: number }) {
  const blue = caps.reduce((a, b) => a + b, 0) / Math.max(1, caps.length * 255)
  return (
    <div className="plate pointer-events-none absolute left-1/2 top-4 flex -translate-x-1/2 items-center gap-4 rounded-lg px-4 py-2.5">
      <div className="w-12 text-right font-display text-xl text-team-red">
        {Math.round((1 - blue) * 100)}
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <div
          className={`font-display text-2xl tabular-nums leading-none ${
            time < 30 ? "text-hazard" : ""
          }`}
        >
          {fmt(time)}
        </div>
        <div className="flex gap-1.5">
          {caps.map((v, i) => (
            <div
              key={i}
              className="relative h-2.5 w-12 overflow-hidden rounded-sm bg-team-red"
              title={`Point ${i + 1}`}
            >
              <div
                className="absolute inset-y-0 right-0 bg-team-blue transition-[width] duration-300"
                style={{ width: `${(v / 255) * 100}%` }}
              />
              <div className="absolute inset-y-0 left-1/2 w-px bg-black/50" />
            </div>
          ))}
        </div>
      </div>
      <div className="w-12 font-display text-xl text-team-blue">
        {Math.round(blue * 100)}
      </div>
    </div>
  )
}

function Minimap({ s, map }: { s: HudState; map: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!s.netStatus) return
    await copyInviteLink(s.netStatus.roomCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="plate pointer-events-none absolute right-4 top-4 rounded-lg p-2">
      <div className="relative h-40 w-40 overflow-hidden rounded">
        <img
          src={asset(`maps/${map}tex.png`)}
          alt=""
          className="pixelated h-full w-full opacity-80"
        />
        {s.minimapCaps.map((c, i) => (
          <div
            key={i}
            className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-white/70"
            style={{
              left: `${c.x * 100}%`,
              top: `${c.z * 100}%`,
              background: `rgb(${255 - c.v},0,${c.v})`,
            }}
          />
        ))}
        {s.minimap.map((t, i) => (
          <div
            key={i}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${t.x * 100}%`,
              top: `${t.z * 100}%`,
              transform: `translate(-50%,-50%) rotate(${t.yaw}rad)`,
            }}
          >
            <div
              className={`h-0 w-0 border-x-[4px] border-b-[9px] border-x-transparent ${
                t.isPlayer
                  ? "scale-125 border-b-hazard"
                  : t.team === "red"
                    ? "border-b-team-red"
                    : "border-b-team-blue"
              }`}
            />
          </div>
        ))}
      </div>
      {s.netStatus && (
        <button
          type="button"
          onClick={handleCopy}
          title="Click to copy invite link for friends"
          className="pointer-events-auto mt-1.5 flex w-full items-center justify-between rounded bg-white/5 px-2 py-1 text-[10px] font-semibold text-white/75 transition-colors hover:bg-white/15 hover:text-white"
        >
          <div className="flex items-center gap-1.5">
            <span className="text-white/40">Room:</span>
            <span className="text-hazard">{s.netStatus.roomCode}</span>
          </div>
          <span className={copied ? "text-[#6fd36a]" : "text-white/50"}>
            {copied ? "✓ Copied!" : "Copy Link"}
          </span>
        </button>
      )}
    </div>
  )
}

function Feed({ s }: { s: HudState }) {
  return (
    <div className="pointer-events-none absolute left-4 top-4 flex flex-col items-start gap-1 z-20 select-none">
      {s.feed.map((f) => {
        const isPlayerKiller = f.killer?.isPlayer
        const isPlayerVictim = f.victim?.isPlayer
        const isPlayerInvolved = isPlayerKiller || isPlayerVictim

        if (f.victim) {
          const isSelf = !f.killer || f.killer.name === f.victim.name
          return (
            <div
              key={f.id}
              className={`anim-feed flex w-fit items-center gap-1.5 rounded bg-black/75 px-2.5 py-1 text-xs font-semibold backdrop-blur-md shadow-md border transition-all ${
                isPlayerInvolved
                  ? "border-hazard/50 bg-black/85 shadow-[0_0_12px_rgba(242,194,48,0.25)] ring-1 ring-hazard/30"
                  : "border-white/10"
              }`}
            >
              {!isSelf && f.killer && (
                <>
                  <span
                    className={`font-bold ${
                      f.killer.team === "red"
                        ? "text-[#ff5c47]"
                        : "text-[#5294ff]"
                    }`}
                  >
                    {f.killer.name}
                    {f.killer.isPlayer && (
                      <span className="ml-1 text-[10px] font-bold text-hazard">
                        (You)
                      </span>
                    )}
                  </span>

                  <div className="flex shrink-0 items-center gap-1 rounded bg-white/5 border border-white/10 px-1.5 py-0.5">
                    {f.weaponIcon && (
                      <img
                        src={asset(`ui/icon_${f.weaponIcon}.png`)}
                        alt={f.weaponVerb ?? "weapon"}
                        className="h-3.5 w-5 object-contain filter drop-shadow"
                      />
                    )}
                    {f.weaponVerb && (
                      <span className="text-[9px] font-mono uppercase tracking-wider text-white/50">
                        {f.weaponVerb}
                      </span>
                    )}
                  </div>
                </>
              )}

              {isSelf && (
                <div className="flex shrink-0 items-center gap-1 rounded bg-white/5 border border-white/10 px-1.5 py-0.5">
                  <span className="text-xs">💀</span>
                  <span className="text-[9px] font-mono uppercase tracking-wider text-white/50">
                    {f.weaponVerb ?? "crashed"}
                  </span>
                </div>
              )}

              <span
                className={`font-bold ${
                  f.victim.team === "red"
                    ? "text-[#ff5c47]"
                    : "text-[#5294ff]"
                }`}
              >
                {f.victim.name}
                {f.victim.isPlayer && (
                  <span className="ml-1 text-[10px] font-bold text-hazard">
                    (You)
                  </span>
                )}
              </span>
            </div>
          )
        }

        // Standard / System message
        const isCapture = f.text?.includes("captured")
        const isSuper = f.text?.includes("supercharged")
        const isDeploy = f.text?.includes("deployed") || f.text?.includes("joined")

        return (
          <div
            key={f.id}
            className="anim-feed flex w-fit items-center gap-2 rounded bg-black/75 px-2.5 py-1 text-xs font-semibold backdrop-blur-md shadow-md border border-white/10"
          >
            <span className="text-sm">
              {isCapture ? "🚩" : isSuper ? "⚡" : isDeploy ? "⚔️" : "ℹ️"}
            </span>
            <span
              className={
                f.team === "red"
                  ? "text-[#ff5c47] font-semibold"
                  : f.team === "blue"
                    ? "text-[#5294ff] font-semibold"
                    : "text-white/80"
              }
            >
              {f.text}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function Meter({
  value,
  max,
  color,
  label,
}: {
  value: number
  max: number
  color: string
  label: string
}) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-[10px] font-semibold text-white/50">
        <span>{label}</span>
        <span className="tabular-nums text-white/80">{Math.round(value)}</span>
      </div>
      <div className="h-3 w-56 overflow-hidden rounded-sm bg-black/50">
        <div
          className="h-full transition-[width] duration-150"
          style={{
            width: `${Math.max(0, Math.min(1, value / max)) * 100}%`,
            background: color,
          }}
        />
      </div>
    </div>
  )
}

function Status({ s }: { s: HudState }) {
  const low = s.health < 30
  return (
    <div className="plate pointer-events-none absolute bottom-4 left-4 flex items-center gap-4 rounded-lg p-3 pr-5">
      <div
        className={`flex h-14 w-14 flex-col items-center justify-center rounded-md ${
          low ? "bg-team-red/80" : "bg-black/40"
        }`}
      >
        <div className="font-display text-2xl leading-none tabular-nums">
          {Math.round(s.health)}
        </div>
        <div className="mt-0.5 text-[8px] font-semibold tracking-wider text-white/55">
          Hp
        </div>
      </div>
      <div className="flex flex-col gap-2.5">
        <Meter
          label="Armour"
          value={s.health}
          max={MAX_HEALTH}
          color={low ? "#e0442e" : "linear-gradient(90deg,#6fd36a,#c6f26b)"}
        />
        <Meter
          label={s.superT > 0 ? "Supercharged" : "Uber"}
          value={s.superT > 0 ? s.superT / 6 : s.uber}
          max={100}
          color={
            s.superT > 0 ? "#fff27a" : "linear-gradient(90deg,#f2c230,#ff8a3d)"
          }
        />
      </div>
      <div className="ml-1 flex flex-col gap-1 text-[11px] font-semibold">
        {s.speedT > 0 && (
          <span className="rounded bg-hazard px-2 py-0.5 text-gunmetal">
            Speed {Math.ceil(s.speedT / 60)}
          </span>
        )}
        {s.stealthT > 0 && (
          <span className="rounded bg-white/15 px-2 py-0.5">
            Stealth {Math.ceil(s.stealthT / 60)}
          </span>
        )}
        {s.spawnProtect && (
          <span className="rounded bg-white/15 px-2 py-0.5">Shielded</span>
        )}
      </div>
    </div>
  )
}

function WeaponPanel({
  s,
  onToggleCamera,
}: {
  s: HudState
  onToggleCamera?: () => void
}) {
  const w = s.weapon ? WEAPONS[s.weapon] : null
  return (
    <div className="plate pointer-events-none absolute bottom-4 right-4 flex items-center gap-4 rounded-lg p-3 pl-5">
      <div className="text-right">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onToggleCamera?.()
          }}
          className="pointer-events-auto flex items-center justify-end gap-1.5 rounded px-1.5 py-0.5 text-[10px] font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          title="Click or press V to switch camera & aim mode"
        >
          <span>{s.proMode ? "Pro Camera" : "Casual Camera"}</span>
          <span className="rounded bg-white/10 px-1 py-0.5 font-mono text-[9px] font-bold text-hazard">
            V
          </span>
        </button>
        <div className="font-display text-xl leading-tight">
          {w ? w.label : "Unarmed"}
        </div>
        <div className="font-display text-3xl tabular-nums leading-none text-hazard">
          {w ? s.ammo : "—"}
        </div>
      </div>
      <div className="flex h-16 w-16 items-center justify-center rounded-md bg-black/40">
        <img
          src={asset(`ui/icon_${w ? w.icon : 1}.png`)}
          alt=""
          className="h-14 w-14 object-contain"
        />
      </div>
      <div className="w-14 text-right font-display text-sm tabular-nums text-white/55">
        {s.speed}
        <div className="text-[9px] tracking-widest">U/S</div>
      </div>
    </div>
  )
}

function WeaponSight({ s }: { s: HudState }) {
  if (!s.zoomed || s.siteIndex <= 0) return null
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <img
        src={asset(`tex/site_${s.siteIndex}.png`)}
        alt="Weapon Sight"
        className="pixelated h-56 w-56 object-contain opacity-95 drop-shadow-[0_0_12px_rgba(0,0,0,0.9)]"
      />
    </div>
  )
}

function Crosshair({ s }: { s: HudState }) {
  if (s.zoomed && s.siteIndex > 0) return null
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
      <div className="relative h-10 w-10">
        <div className="absolute left-1/2 top-0 h-3 w-0.5 -translate-x-1/2 bg-white/85" />
        <div className="absolute bottom-0 left-1/2 h-3 w-0.5 -translate-x-1/2 bg-white/85" />
        <div className="absolute left-0 top-1/2 h-0.5 w-3 -translate-y-1/2 bg-white/85" />
        <div className="absolute right-0 top-1/2 h-0.5 w-3 -translate-y-1/2 bg-white/85" />
        <div className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-hazard" />
        {s.hitMarker > 0 && (
          <div className="absolute -inset-2 rotate-45 rounded-sm border-2 border-team-red" />
        )}
      </div>
    </div>
  )
}

function HurtIndicator({ dir }: { dir: number | null }) {
  if (dir === null) return null
  return (
    <div
      className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2"
      style={{ transform: `translate(-50%,-50%) rotate(${-dir}rad)` }}
    >
      <div className="absolute left-1/2 top-0 h-10 w-24 -translate-x-1/2 rounded-[50%] border-t-4 border-team-red/90 blur-[1px]" />
    </div>
  )
}

function Popups({ s }: { s: HudState }) {
  return (
    <>
      {s.popups.map((p, i) => (
        <div
          key={p.id}
          className={`anim-pop pointer-events-none absolute left-1/2 whitespace-nowrap font-display ${
            p.kind === "trick"
              ? "text-4xl text-hazard drop-shadow-[0_3px_0_#000]"
              : p.kind === "damage"
                ? "text-2xl text-team-red drop-shadow-[0_2px_0_#000]"
                : "text-xl text-white drop-shadow-[0_2px_0_#000]"
          }`}
          style={{ top: `${p.kind === "damage" ? 44 : 64 + (i % 3) * 5}%` }}
        >
          {p.text}
        </div>
      ))}
    </>
  )
}

export function Scoreboard({
  s,
  map,
  title,
}: {
  s: HudState
  map?: string
  title?: string
}) {
  const [copied, setCopied] = useState(false)
  const teams: Team[] = ["red", "blue"]

  const handleCopy = async () => {
    if (!s.netStatus) return
    await copyInviteLink(s.netStatus.roomCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col gap-3">
      {s.netStatus && (
        <div className="pointer-events-auto flex items-center justify-between rounded-lg bg-black/55 border border-white/10 px-4 py-2.5 backdrop-blur-md">
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            <span className="text-white/50">P2P Room:</span>
            <span className="text-hazard font-mono">{s.netStatus.roomCode}</span>
            <span className="text-white/30">·</span>
            <span className="text-white/70">
              {s.netStatus.peers} {s.netStatus.peers === 1 ? "peer" : "peers"} connected
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded bg-hazard/20 border border-hazard/40 px-3 py-1 text-xs font-semibold text-hazard transition-all hover:bg-hazard hover:text-gunmetal active:scale-95"
          >
            {copied ? "✓ Link Copied!" : "Copy Invite Link"}
          </button>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {teams.map((t) => {
          const rows = s.scoreboard.filter((r) => r.team === t)
          const total = rows.reduce((a, r) => a + r.score, 0)
          return (
            <div key={t} className="plate overflow-hidden rounded-lg">
              <div
                className={`flex items-baseline justify-between px-4 py-2.5 ${
                  t === "red" ? "bg-team-red/85" : "bg-team-blue/85"
                }`}
              >
                <span className="font-display text-lg">
                  {t === "red" ? "Red" : "Blue"}
                  {title ? "" : " team"}
                </span>
                <span className="font-display text-lg tabular-nums">{total}</span>
              </div>
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-left text-[10px] text-white/40">
                    <th className="px-4 py-2 font-semibold">Tag</th>
                    <th className="px-2 py-2 text-right font-semibold">K</th>
                    <th className="px-2 py-2 text-right font-semibold">D</th>
                    <th className="px-4 py-2 text-right font-semibold">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr
                      key={r.name}
                      className={`border-t border-white/5 ${
                        r.isPlayer ? "bg-hazard/10 text-hazard" : ""
                      }`}
                    >
                      <td className="px-4 py-1.5 font-semibold">
                        {r.name}
                        {r.isRemote ? " (P2P)" : ""}
                      </td>
                      <td className="px-2 py-1.5 text-right tabular-nums">
                        {r.kills}
                      </td>
                      <td className="px-2 py-1.5 text-right tabular-nums">
                        {r.deaths}
                      </td>
                      <td className="px-4 py-1.5 text-right tabular-nums">
                        {r.score}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function MapVotePanel({
  mapVote,
  onVote,
  onConfirmNextMap,
  onMenu,
}: {
  mapVote: NonNullable<HudState["mapVote"]>
  onVote: (mapId: string) => void
  onConfirmNextMap: (mapId: string) => void
  onMenu: () => void
}) {
  const [secondsLeft, setSecondsLeft] = useState(15)
  const confirmedRef = useRef(false)

  // Determine current leading map (candidate 0 / current map wins ties)
  const getLeader = (): MapDef => {
    let best = mapVote.candidates[0]
    let maxVotes = -1
    for (const c of mapVote.candidates) {
      const count = Object.values(mapVote.votes).filter((v) => v === c.id).length
      if (count > maxVotes) {
        maxVotes = count
        best = c
      }
    }
    return best
  }

  const leader = getLeader()

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          if (!confirmedRef.current) {
            confirmedRef.current = true
            onConfirmNextMap(leader.id)
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [leader.id, onConfirmNextMap])

  const handleInstantDeploy = () => {
    if (!confirmedRef.current) {
      confirmedRef.current = true
      onConfirmNextMap(leader.id)
    }
  }

  return (
    <div className="mt-5 rounded-xl border border-hazard/30 bg-black/60 p-4 sm:p-5 backdrop-blur-md">
      {/* Header & Countdown Bar */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🗳️</span>
          <div>
            <div className="font-display text-lg tracking-wide text-white">
              VOTE FOR NEXT MAP
            </div>
            <div className="text-[11px] text-white/50">
              Lobby stays together · Next round starts automatically
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-md bg-hazard/15 border border-hazard/40 px-3 py-1 font-mono text-xs sm:text-sm font-bold text-hazard">
            <span>Next Round in</span>
            <span className="text-base text-white">{secondsLeft}s</span>
          </div>
          <button
            type="button"
            onClick={handleInstantDeploy}
            className="rounded-md bg-hazard px-4 py-1.5 text-xs font-bold text-gunmetal shadow transition-transform hover:scale-105 active:scale-95"
          >
            Deploy Now ›
          </button>
        </div>
      </div>

      {/* Countdown progress bar */}
      <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full bg-hazard transition-all duration-1000 ease-linear"
          style={{ width: `${(secondsLeft / 15) * 100}%` }}
        />
      </div>

      {/* Candidate Cards Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {mapVote.candidates.map((c, idx) => {
          const voteCount = Object.values(mapVote.votes).filter(
            (v) => v === c.id,
          ).length
          const isMyVote = mapVote.myVote === c.id
          const isLeader = leader.id === c.id

          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onVote(c.id)}
              className={`group relative flex flex-col overflow-hidden rounded-lg border text-left transition-all ${
                isMyVote
                  ? "border-hazard bg-hazard/15 ring-2 ring-hazard/50 shadow-[0_0_20px_rgba(242,194,48,0.25)]"
                  : "border-white/10 bg-black/40 hover:border-white/30 hover:bg-white/5"
              }`}
            >
              <div className="relative aspect-video w-full overflow-hidden bg-black/50">
                <img
                  src={asset(`maps/${c.id}tex.png`)}
                  alt=""
                  className="pixelated h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {idx === 0 && (
                  <div className="absolute left-1.5 top-1.5 rounded bg-black/80 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-hazard border border-hazard/40 backdrop-blur-xs">
                    Current Map
                  </div>
                )}
                {voteCount > 0 && (
                  <div className="absolute right-1.5 top-1.5 flex items-center gap-1 rounded bg-hazard px-2 py-0.5 text-[10px] font-bold text-gunmetal shadow">
                    <span>★</span>
                    <span>{voteCount} {voteCount === 1 ? "vote" : "votes"}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-1 flex-col justify-between p-2.5">
                <div>
                  <div className="font-semibold text-xs text-white group-hover:text-hazard transition-colors">
                    {c.name}
                  </div>
                  <div className="text-[10px] text-white/50 capitalize">
                    {c.tile} terrain
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between text-[10px]">
                  {isMyVote ? (
                    <span className="font-bold text-hazard">✓ Your Vote</span>
                  ) : (
                    <span className="text-white/40 group-hover:text-white/70">Click to Vote</span>
                  )}
                  {isLeader && (
                    <span className="font-semibold text-white/60 text-[9px]">Leading</span>
                  )}
                </div>
              </div>

              {isMyVote && (
                <div className="hazard-stripe absolute inset-x-0 bottom-0 h-1" />
              )}
            </button>
          )
        })}
      </div>

      {/* Footer info & Leave Match Button */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3 text-xs text-white/60">
        <div>
          Next battlefield:{" "}
          <span className="font-bold text-hazard">{leader.name}</span>
          {leader.id === mapVote.candidates[0].id ? " (Replay)" : ""}
        </div>
        <button
          type="button"
          onClick={onMenu}
          className="rounded border border-white/20 px-3 py-1 text-xs font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white"
        >
          Leave Match
        </button>
      </div>
    </div>
  )
}

type HudProps = {
  s: HudState
  map: string
  showScores: boolean
  onLock: () => void
  onToggleCamera?: () => void
  onVote?: (mapId: string) => void
  onConfirmNextMap?: (mapId: string) => void
  onRematch: () => void
  onMenu: () => void
}

export default function Hud({
  s,
  map,
  showScores,
  onLock,
  onToggleCamera,
  onVote,
  onConfirmNextMap,
  onRematch,
  onMenu,
}: HudProps) {
  if (s.over) {
    const label =
      s.over.winner === "draw"
        ? "Draw"
        : s.over.winner === "red"
          ? "Red Win"
          : "Blue Win"
    const tone =
      s.over.winner === "red"
        ? "text-team-red"
        : s.over.winner === "blue"
          ? "text-team-blue"
          : "text-hazard"
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/60 p-4 sm:p-6 backdrop-blur-[2px] overflow-y-auto">
        <div className="w-full max-w-4xl max-h-[95vh] overflow-y-auto pr-1">
          <div className="mb-1 text-center text-[11px] font-semibold text-white/50">
            Round Over
          </div>
          <h2 className={`mb-2 text-center font-display text-5xl sm:text-6xl ${tone}`}>
            {label}
          </h2>
          <div className="mx-auto mb-5 h-2.5 w-72 overflow-hidden rounded-sm bg-team-red">
            <div
              className="ml-auto h-full bg-team-blue"
              style={{ width: `${s.over.blueShare * 100}%` }}
            />
          </div>
          <Scoreboard s={s} map={map} title="final" />

          {s.mapVote ? (
            <MapVotePanel
              mapVote={s.mapVote}
              onVote={onVote ?? (() => {})}
              onConfirmNextMap={onConfirmNextMap ?? (() => {})}
              onMenu={onMenu}
            />
          ) : (
            <div className="mt-6 flex justify-center gap-4">
              <button
                type="button"
                onClick={onRematch}
                className="rounded-md bg-hazard px-8 py-3 text-lg font-semibold text-gunmetal shadow-[0_10px_30px_rgba(242,194,48,0.3)] transition-transform hover:-translate-y-0.5 active:translate-y-0"
              >
                Rematch
              </button>
              <button
                type="button"
                onClick={onMenu}
                className="rounded-md border border-white/20 px-8 py-3 text-lg font-semibold text-white transition-colors hover:bg-white/10"
              >
                Leave Match
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }
  return (
    <div className="pointer-events-none absolute inset-0 select-none">
      <CapBars caps={s.caps} time={s.timeLeft} />
      <Feed s={s} />
      <Minimap s={s} map={map} />
      {!s.dead && <Crosshair s={s} />}
      {!s.dead && <WeaponSight s={s} />}
      {s.isControllingRc && (
        <div className="pointer-events-none absolute left-1/2 top-20 flex -translate-x-1/2 items-center gap-2 rounded-md bg-team-red/80 px-4 py-1.5 text-sm font-semibold text-white shadow-lg backdrop-blur-sm animate-pulse">
          <span>Remote Control Active</span>
          <span className="text-white/60">·</span>
          <span className="text-xs text-hazard">Right-Click / Ctrl to Detonate</span>
        </div>
      )}
      <HurtIndicator dir={s.hurtDir} />
      <Popups s={s} />
      <Status s={s} />
      <WeaponPanel s={s} onToggleCamera={onToggleCamera} />
      {s.dead && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-team-red/10">
          <div className="font-display text-5xl text-team-red drop-shadow-[0_3px_0_#000]">
            Destroyed
          </div>
          <div className="mt-2 text-lg font-semibold text-white/80">
            Respawning in {s.respawnIn}
          </div>
        </div>
      )}
      {showScores && (
        <div className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-black/50 p-6 backdrop-blur-[2px]">
          <div className="w-full max-w-3xl">
            <Scoreboard s={s} map={map} />
          </div>
        </div>
      )}
      {!s.locked && !s.dead && (
        <div className="pointer-events-auto absolute inset-x-0 bottom-28 flex justify-center">
          <button
            type="button"
            onClick={onLock}
            className="plate rounded-lg px-6 py-3 text-[14px] font-semibold transition-colors hover:border-hazard/60"
          >
            <span className="text-hazard">Click</span> to take control of the
            turret ·{" "}
            <span className="text-white/50">Esc releases the mouse</span>
          </button>
        </div>
      )}
    </div>
  )
}
