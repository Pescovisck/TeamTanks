import { MAX_HEALTH, WEAPONS } from "../game/data"
import type { HudState, Team } from "../game/engine"

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
        <div className="mt-1.5 flex items-center justify-between px-1 text-[10px] font-semibold text-white/65">
          <span>Room: {s.netStatus.roomCode}</span>
          <span className="text-hazard">
            {s.netStatus.peers} {s.netStatus.peers === 1 ? "peer" : "peers"}
          </span>
        </div>
      )}
    </div>
  )
}

function Feed({ s }: { s: HudState }) {
  return (
    <div className="pointer-events-none absolute left-4 top-4 flex w-80 flex-col gap-1">
      {s.feed.map((f) => (
        <div
          key={f.id}
          className="anim-feed rounded bg-black/55 px-3 py-1.5 text-[13px] font-semibold backdrop-blur-sm"
        >
          <span className={teamText(f.team)}>{f.text}</span>
        </div>
      ))}
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

function WeaponPanel({ s }: { s: HudState }) {
  const w = s.weapon ? WEAPONS[s.weapon] : null
  return (
    <div className="plate pointer-events-none absolute bottom-4 right-4 flex items-center gap-4 rounded-lg p-3 pl-5">
      <div className="text-right">
        <div className="flex items-center justify-end gap-1.5 text-[10px] font-semibold text-white/50">
          <span>{s.proMode ? "Pro" : "Casual"}</span>
          <span className="rounded bg-white/10 px-1 py-0.5 text-[9px] text-hazard">V</span>
        </div>
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

export function Scoreboard({ s, title }: { s: HudState; title?: string }) {
  const teams: Team[] = ["red", "blue"]
  return (
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
  )
}

type HudProps = {
  s: HudState
  map: string
  showScores: boolean
  onLock: () => void
  onRematch: () => void
  onMenu: () => void
}

export default function Hud({
  s,
  map,
  showScores,
  onLock,
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
      <div className="absolute inset-0 flex items-center justify-center bg-black/55 p-6 backdrop-blur-[2px]">
        <div className="w-full max-w-3xl">
          <div className="mb-2 text-center text-[11px] font-semibold text-white/50">
            Round Over
          </div>
          <h2 className={`mb-2 text-center font-display text-7xl ${tone}`}>
            {label}
          </h2>
          <div className="mx-auto mb-6 h-3 w-80 overflow-hidden rounded-sm bg-team-red">
            <div
              className="ml-auto h-full bg-team-blue"
              style={{ width: `${s.over.blueShare * 100}%` }}
            />
          </div>
          <Scoreboard s={s} title="final" />
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
              Change Map
            </button>
          </div>
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
      <WeaponPanel s={s} />
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
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 p-6">
          <div className="w-full max-w-3xl">
            <Scoreboard s={s} />
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
