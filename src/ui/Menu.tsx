import { useEffect, useRef, useState } from "react"
import {
  BASE_WEAPONS,
  DAILY_WEAPONS,
  getDailyWeapon,
  MAPS,
  WEAPON_BLURBS,
  WEAPONS,
  type WeaponId,
} from "../game/data"
import type { Difficulty, GameOptions, Team } from "../game/engine"
import { lobbyService, type LobbyInfo } from "../game/lobby"
import { copyInviteLink, generateRoomCode, syncUrlParams } from "../utils/url"
import MapDropdown from "./landing/MapDropdown"
import TankShowcase from "./landing/TankShowcase"
import TTLogo from "./landing/TTLogo"
import RoomBrowser from "./RoomBrowser"

const GITHUB_URL = "https://github.com/Pescovisck/TeamTanks"

type Props = { initial: GameOptions; onStart: (o: GameOptions) => void }

function Segmented<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div>
      <div className="mb-2 text-[12px] font-semibold text-white/50">{label}</div>
      <div className="flex gap-1 rounded-md bg-black/45 p-1" role="radiogroup" aria-label={label}>
        {options.map((o) => {
          const active = o.value === value
          return (
            <button
              key={String(o.value)}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(o.value)}
              className={`flex-1 rounded px-3 py-2 text-sm font-semibold transition-colors ${
                active
                  ? "bg-hazard text-gunmetal"
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

function Modal({
  title,
  eyebrow,
  onClose,
  wide = false,
  children,
}: {
  title: string
  eyebrow: string
  onClose: () => void
  wide?: boolean
  children: React.ReactNode
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`tt-pop relative max-h-[90svh] w-full overflow-y-auto rounded-xl border border-hazard/40 bg-[#111419] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_40px_rgba(255,255,255,0.06)] ${
          wide ? "max-w-xl" : "max-w-md"
        }`}
      >
        <div className="hazard-stripe absolute inset-x-0 top-0 h-1.5 rounded-t-xl" />
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-hazard">
              {eyebrow}
            </div>
            <h2 className="mt-1 font-display text-2xl font-bold tracking-wide text-white">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function MenuButton({
  label,
  badge,
  onClick,
  delay,
}: {
  label: string
  badge?: string
  onClick: () => void
  delay: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="tt-btn-wrap tt-slide w-full text-left"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="tt-btn">
        <span>{label}</span>
        {badge && <span className="tt-btn-badge">{badge}</span>}
      </span>
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

const STATS: { value: string; label: string; tone: "red" | "blue" | "gold" }[] = [
  { value: "66", label: "original 3D models, extracted from the W3D files", tone: "red" },
  { value: String(MAPS.length), label: "battlefields built from the original heightmaps", tone: "blue" },
  { value: "19", label: "weapons & power-ups with the original Lingo stats", tone: "gold" },
  { value: "0", label: "servers: matches run peer-to-peer in your browser", tone: "red" },
]

const toneBorder = {
  red: "border-team-red/60 shadow-[0_0_24px_rgba(224,68,46,0.18)]",
  blue: "border-team-blue/60 shadow-[0_0_24px_rgba(59,123,240,0.18)]",
  gold: "border-hazard/60 shadow-[0_0_24px_rgba(242,194,48,0.18)]",
}
const toneText = { red: "text-team-red", blue: "text-team-blue", gold: "text-hazard" }

export default function Menu({ initial, onStart }: Props) {
  const dailyGun = getDailyWeapon()
  const [o, setO] = useState<GameOptions>(() => ({
    ...initial,
    enabledWeapons: initial.enabledWeapons ?? [dailyGun],
  }))
  const [previewWeapon, setPreviewWeapon] = useState<WeaponId>(
    initial.enabledWeapons?.[0] ?? dailyGun,
  )
  const [copied, setCopied] = useState(false)
  const [manualCode, setManualCode] = useState("")
  const [modal, setModal] = useState<"host" | "join" | "arsenal" | null>(null)
  const [liveCount, setLiveCount] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)

  const set = <K extends keyof GameOptions>(k: K, v: GameOptions[K]) =>
    setO((s) => ({ ...s, [k]: v }))

  const activeSpecialWeapons = o.enabledWeapons ?? [dailyGun]

  const toggleSpecialWeapon = (w: WeaponId) => {
    setPreviewWeapon(w)
    setO((prev) => {
      const cur = prev.enabledWeapons ?? [dailyGun]
      const exists = cur.includes(w)
      const next = exists ? cur.filter((id) => id !== w) : [...cur, w]
      return { ...prev, enabledWeapons: next }
    })
  }

  const selectOnlyDaily = () => {
    setPreviewWeapon(dailyGun)
    set("enabledWeapons", [dailyGun])
  }

  const selectAllWeapons = () => {
    set("enabledWeapons", [...DAILY_WEAPONS])
  }

  const clearSpecialWeapons = () => {
    setPreviewWeapon("mgun")
    set("enabledWeapons", [])
  }

  // Sync menu state if initial options change (e.g. returning to menu clears roomCode)
  useEffect(() => {
    setO((prev) => ({
      ...initial,
      enabledWeapons: prev.enabledWeapons ?? initial.enabledWeapons ?? [dailyGun],
    }))
  }, [initial, dailyGun])

  const handleDismissInvite = () => {
    set("roomCode", "")
    syncUrlParams("")
  }

  // Automatically resolve the map from active lobby announcements if roomCode is set
  useEffect(() => {
    if (!o.roomCode) return
    const updateFromLobbies = (lobbies: LobbyInfo[]) => {
      const match = lobbies.find(
        (l) => l.roomCode.toLowerCase() === o.roomCode!.toLowerCase(),
      )
      if (match) {
        const foundMap = MAPS.find((m) => m.id === match.mapId)
        if (foundMap && foundMap.id !== o.map.id) {
          setO((prev) => ({ ...prev, map: foundMap }))
        }
      }
    }
    updateFromLobbies(lobbyService.getActiveLobbies())
    const unsub = lobbyService.subscribe(updateFromLobbies)
    return unsub
  }, [o.roomCode, o.map.id])

  // Live room count for the "Live Battles" button badge
  useEffect(() => {
    setLiveCount(lobbyService.getActiveLobbies().length)
    return lobbyService.subscribe((l) => setLiveCount(l.length))
  }, [])

  // Scroll reveal for sections
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const els = root.querySelectorAll<HTMLElement>("[data-reveal]")
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-in"))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in")
            io.unobserve(e.target)
          }
        }
      },
      { root, threshold: 0.12 },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  const scrollToId = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })

  // Launch directly into 3D game as Host (In-Game Deploy Modal appears on load)
  const handleHostBattle = () => {
    const room = generateRoomCode()
    const nextOpts: GameOptions = {
      ...o,
      roomCode: room,
      joinAsClient: false,
      teamSize: 5,
    }
    setO(nextOpts)
    syncUrlParams(room)
    onStart(nextOpts)
  }

  // Launch directly into 3D game as Client with custom room code
  const handleJoinWithCode = (e?: React.FormEvent) => {
    e?.preventDefault()
    const code = manualCode.trim().toUpperCase()
    if (!code) return
    const existing = lobbyService
      .getActiveLobbies()
      .find((l) => l.roomCode.toLowerCase() === code.toLowerCase())
    const targetMap = existing
      ? MAPS.find((m) => m.id === existing.mapId) ?? o.map
      : o.map

    const nextOpts: GameOptions = {
      ...o,
      map: targetMap,
      roomCode: code,
      joinAsClient: true,
      teamSize: 5,
    }
    setO(nextOpts)
    syncUrlParams(code)
    onStart(nextOpts)
  }

  // Launch directly into 3D game via Room Browser
  const handleJoinLobby = (lobby: LobbyInfo) => {
    const targetMap = MAPS.find((m) => m.id === lobby.mapId) ?? o.map
    const autoTeam: Team =
      lobby.hostTeam === "red"
        ? "blue"
        : lobby.hostTeam === "blue"
          ? "red"
          : o.playerTeam

    const nextOpts: GameOptions = {
      ...o,
      map: targetMap,
      roomCode: lobby.roomCode,
      playerTeam: autoTeam,
      joinAsClient: true,
      teamSize: 5,
    }
    setO(nextOpts)
    syncUrlParams(lobby.roomCode)
    onStart(nextOpts)
  }

  const handleCopyLink = async () => {
    const code = o.roomCode?.trim() || generateRoomCode()
    set("roomCode", code)
    syncUrlParams(code)
    await copyInviteLink(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div ref={rootRef} className="relative h-full w-full overflow-x-hidden overflow-y-auto scroll-smooth">
      <div className="tt-bg" aria-hidden="true" />

      {/* drifting embers */}
      <div className="pointer-events-none fixed inset-0 z-[1] overflow-hidden" aria-hidden="true">
        {Array.from({ length: 16 }, (_, i) => (
          <span
            key={i}
            className="tt-dust"
            style={
              {
                left: `${(i * 37 + 11) % 100}%`,
                "--dur": `${12 + (i % 6) * 2.5}s`,
                "--delay": `${-(i * 1.7)}s`,
                "--dx": `${(i % 2 ? 1 : -1) * (30 + (i % 5) * 18)}px`,
                transform: "translate3d(0,0,0)",
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      <div className="relative z-10 flex min-h-full flex-col">
        {/* top bar */}
        <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 pt-5 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="rounded bg-black/55 px-2 py-0.5 font-display text-sm tracking-wider text-white/90 ring-1 ring-white/20">
              TT 3.0
            </span>
            <span className="hidden text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70 sm:inline">
              Fan preservation project
            </span>
          </div>
          <div className="flex items-center gap-1 text-[13px] font-semibold text-white/75">
            {[
              ["about", "The Project"],
              ["battles", "Live Battles"],
              ["how", "How to Play"],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => scrollToId(id)}
                className="hidden rounded px-3 py-1.5 transition-colors hover:bg-white/10 hover:text-white sm:block"
              >
                {label}
              </button>
            ))}
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="rounded border border-white/25 px-3 py-1.5 transition-colors hover:bg-white/10 hover:text-white"
            >
              GitHub ↗
            </a>
          </div>
        </nav>

        {/* hero */}
        <section className="mx-auto grid w-full max-w-7xl flex-1 items-center gap-6 px-5 pb-16 pt-6 sm:px-8 lg:min-h-[calc(100svh-4rem)] lg:grid-cols-[1.45fr_1fr] lg:gap-10">
          <div className="flex flex-col items-center lg:items-start">
            <div className="relative w-full max-w-[760px]">
              {/* roundel emblem, same target disc as the original title art */}
              <img
                src={import.meta.env.BASE_URL + "tt/ui/target_roundel_disc.png"}
                alt=""
                aria-hidden="true"
                className="tt-roundel pointer-events-none absolute left-1/2 top-[56%] z-0 w-[62%] max-w-none -translate-x-1/2 -translate-y-1/2 opacity-95 [filter:drop-shadow(0_0_26px_rgba(255,255,255,0.28))]"
              />

              <div className="tt-slam relative z-10 flex justify-center pt-[6%]" style={{ animationDelay: "120ms" }}>
                <TTLogo />
              </div>

              <div className="pointer-events-none relative z-20 -mt-[4%] h-[300px] w-full sm:h-[400px] lg:h-[430px]">
                <TankShowcase
                  weapon={previewWeapon}
                  className="tt-rise h-full w-full [filter:drop-shadow(0_0_14px_rgba(255,255,255,0.3))_drop-shadow(0_22px_18px_rgba(0,0,0,0.55))]"
                />
              </div>
            </div>

            <p
              className="tt-rise relative z-10 -mt-2 max-w-xl text-balance text-center text-[17px] font-semibold leading-snug text-white [text-shadow:0_2px_0_rgba(0,0,0,0.6),0_0_18px_rgba(0,0,0,0.7)] sm:text-[19px] lg:text-left"
              style={{ animationDelay: "500ms" }}
            >
              The 2006 browser tank battle, brought back.{" "}
              <span className="text-hazard">Made by fans, for fans.</span>
            </p>
          </div>

          <div className="mx-auto flex w-full max-w-sm flex-col gap-4 lg:mx-0 lg:ml-auto">
            {o.roomCode && (
              <div
                className="tt-rise rounded-lg border border-hazard bg-black/70 p-4 backdrop-blur-md [box-shadow:0_0_0_1px_rgba(255,255,255,0.15),0_0_28px_rgba(255,255,255,0.12)]"
                style={{ animationDelay: "200ms" }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-hazard">
                      Room invite
                    </div>
                    <div className="font-mono text-2xl font-bold text-white">{o.roomCode}</div>
                    <div className="text-[12px] text-white/65">
                      {o.map.name} · ready to join the squad
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleDismissInvite}
                    title="Dismiss invite"
                    aria-label="Dismiss invite"
                    className="rounded p-1 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => onStart({ ...o, joinAsClient: true, teamSize: 5 })}
                    className="flex-1 rounded bg-hazard px-4 py-2 text-sm font-bold text-gunmetal transition-transform hover:scale-[1.03] active:scale-95"
                  >
                    Join Battle Now ›
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="rounded border border-white/20 bg-black/40 px-3 py-2 text-xs font-semibold text-white/80 transition-colors hover:bg-black/60 hover:text-white"
                  >
                    {copied ? "✓ Copied" : "Copy link"}
                  </button>
                </div>
              </div>
            )}

            <MenuButton label="Host Battle" onClick={() => setModal("host")} delay={350} />
            <MenuButton label="Join by Code" onClick={() => setModal("join")} delay={470} />
            <MenuButton
              label="Live Battles"
              badge={liveCount ? `${liveCount} live` : undefined}
              onClick={() => scrollToId("battles")}
              delay={590}
            />

            {/* Daily Gun / Custom Arsenal quick card */}
            <button
              type="button"
              onClick={() => setModal("arsenal")}
              style={{ animationDelay: "700ms" }}
              className="tt-rise group relative flex items-center gap-3.5 rounded-lg border border-white/20 bg-black/65 p-3 text-left backdrop-blur-md transition-all hover:border-hazard/70 hover:bg-black/80 [box-shadow:0_0_20px_rgba(0,0,0,0.5)]"
            >
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-hazard/40 bg-hazard/10 p-1.5">
                <img
                  src={`${import.meta.env.BASE_URL}tt/ui/icon_${WEAPONS[previewWeapon]?.icon ?? WEAPONS[dailyGun].icon}.png`}
                  alt=""
                  className="h-full w-full object-contain [filter:drop-shadow(0_2px_6px_rgba(0,0,0,0.8))]"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-hazard">
                    {activeSpecialWeapons.length === 1 && activeSpecialWeapons[0] === dailyGun
                      ? "Today's Daily Gun"
                      : activeSpecialWeapons.length === DAILY_WEAPONS.length
                        ? "Full Arsenal Unlocked"
                        : activeSpecialWeapons.length === 0
                          ? "Classic Base 6 Only"
                          : `Custom Arsenal (${activeSpecialWeapons.length} Special)`}
                  </span>
                  <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-white/80 transition-colors group-hover:bg-hazard group-hover:text-gunmetal">
                    Change ›
                  </span>
                </div>
                <div className="truncate font-display text-base font-bold tracking-wide text-white">
                  {activeSpecialWeapons.length === 1
                    ? WEAPONS[activeSpecialWeapons[0]].label
                    : activeSpecialWeapons.length === DAILY_WEAPONS.length
                      ? `All 13 Special Guns + ${WEAPONS[dailyGun].label}`
                      : activeSpecialWeapons.length === 0
                        ? "Standard 6 Weapons"
                        : activeSpecialWeapons.map((id) => WEAPONS[id].label).join(", ")}
                </div>
                <div className="truncate text-[11px] text-white/55">
                  Daily rotation: <span className="text-white/80">{WEAPONS[dailyGun].label}</span> · pick 1 or as many as you want
                </div>
              </div>
            </button>

            <p
              className="tt-rise text-center text-[12px] text-white/60 [text-shadow:0_1px_6px_rgba(0,0,0,0.9)] lg:text-right"
              style={{ animationDelay: "800ms" }}
            >
              No account. No download. Share a short room code and drive.
            </p>
          </div>
        </section>

        {/* about / preservation */}
        <section id="about" className="relative border-t border-white/10 bg-black/60 backdrop-blur-sm">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:py-24">
            <div data-reveal className="tt-reveal">
              <div className="mb-3 flex items-center gap-3">
                <div className="hazard-stripe h-2 w-14 rounded-sm" />
                <span className="text-[12px] font-semibold uppercase tracking-[0.2em] text-hazard">
                  The project
                </span>
              </div>
              <h2 className="tt-h text-4xl leading-[1.05] text-white [text-shadow:0_0_24px_rgba(255,255,255,0.25)] sm:text-5xl">
                Keeping a classic{" "}
                <span className="text-team-red">on the</span>{" "}
                <span className="text-team-blue">grid</span>.
              </h2>
              <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-white/75">
                <p>
                  Team Tanks was a fast, chaotic 3D tank game by GameVial, built for Shockwave.
                  When Shockwave left the web, the game went with it. This is a fan-made project
                  to bring it back and make sure it can still be played.
                </p>
                <p>
                  Nothing here is guesswork. Levels are generated from the original heightmaps,
                  every tank, ramp and weapon is the original W3D mesh and texture, and capture
                  rules, weapon stats and bot behaviour follow the decompiled Lingo scripts. We
                  added serverless peer-to-peer multiplayer so you can share a room code and play
                  with friends.
                </p>
                <p className="text-white/55">
                  Unofficial and non-commercial. Team Tanks and its original assets belong to their
                  creators at GameVial. This project exists out of love for the game.
                </p>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md bg-white px-5 py-2.5 text-sm font-bold text-gunmetal transition-transform hover:scale-[1.03] active:scale-95"
                >
                  Contribute on GitHub ↗
                </a>
                <button
                  type="button"
                  onClick={() => setModal("host")}
                  className="rounded-md border border-white/30 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white/10"
                >
                  Play now
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 self-center">
              {STATS.map((s, i) => (
                <div
                  key={s.label}
                  data-reveal
                  style={{ transitionDelay: `${i * 90}ms` }}
                  className={`tt-reveal rounded-xl border bg-black/55 p-5 ${toneBorder[s.tone]}`}
                >
                  <div
                    className={`tt-h text-5xl leading-none [text-shadow:0_0_20px_currentColor] ${toneText[s.tone]}`}
                  >
                    {s.value}
                  </div>
                  <div className="mt-2 text-[13px] leading-snug text-white/70">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* live battles */}
        <section id="battles" className="border-t border-white/10 bg-[#0b0d10]/85 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
            <div data-reveal className="tt-reveal mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="tt-h text-3xl text-white sm:text-4xl">Find a battle</h2>
                <p className="mt-1 text-[14px] text-white/60">
                  Jump into a public room, or start your own and send the code to a friend.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setModal("join")}
                  className="rounded-md border border-white/25 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-white/10"
                >
                  Join by code
                </button>
                <button
                  type="button"
                  onClick={() => setModal("host")}
                  className="rounded-md bg-hazard px-4 py-2 text-sm font-bold text-gunmetal transition-transform hover:scale-105 active:scale-95"
                >
                  Host battle ›
                </button>
              </div>
            </div>
            <div data-reveal className="tt-reveal">
              <RoomBrowser currentRoom={o.roomCode} onJoin={handleJoinLobby} />
            </div>
          </div>
        </section>

        {/* how to play */}
        <section id="how" className="border-t border-white/10 bg-black/60 backdrop-blur-sm">
          <div className="mx-auto grid max-w-7xl gap-6 px-5 py-16 sm:px-8 lg:grid-cols-[1.4fr_1fr]">
            <div data-reveal className="tt-reveal plate rounded-lg p-6">
              <h2 className="tt-h mb-3 text-2xl tracking-wide">The mission</h2>
              <p className="text-[14px] leading-relaxed text-white/70">
                Each capture point glows from red to blue. Park inside its ring to pull it toward
                your colour. When the clock runs out, the team with more total glow wins. Grab icons
                for nooks, rockets, lasers and airstrikes. Land flips to fill your uber meter and get
                supercharged. Toggle camera modes anytime in-game with{" "}
                <kbd className="rounded border border-white/20 bg-black/40 px-1 py-0.5 font-mono text-xs font-bold text-hazard">
                  V
                </kbd>
                .
              </p>
              <p className="mt-3 text-[13px] text-white/50">
                Matches are 5v5. When friends join they take the place of bots, so both sides stay
                balanced, with no player limit.
              </p>
            </div>
            <div data-reveal className="tt-reveal plate rounded-lg p-6" style={{ transitionDelay: "100ms" }}>
              <h2 className="tt-h mb-3 text-2xl tracking-wide">Controls</h2>
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
          </div>
        </section>

        <footer className="border-t border-white/10 bg-black/80 px-5 py-8 text-center text-[12px] leading-relaxed text-white/45 sm:px-8">
          <div className="mb-2 flex items-center justify-center gap-2">
            <img
              src={import.meta.env.BASE_URL + "tt/ui/chevrons_emblem.png"}
              alt=""
              className="h-5 w-auto opacity-80"
            />
            <span className="font-display text-sm tracking-wider text-white/70">
              Team Tanks: Armageddon
            </span>
          </div>
          Unofficial fan remake made for preservation. Team Tanks © GameVial. All original W3D
          models, textures and sounds belong to their creators.
        </footer>
      </div>

      {/* host modal */}
      {modal === "host" && (
        <Modal title="Host a Battle" eyebrow="Room setup" wide onClose={() => setModal(null)}>
          <div className="flex flex-col gap-5">
            <MapDropdown value={o.map} onChange={(m) => set("map", m)} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            </div>

            {/* Daily Gun & Custom Arsenal selector inside Host modal */}
            <div className="rounded-lg border border-white/15 bg-black/40 p-3.5">
              <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-[12px] font-bold text-white/90">
                    Daily Gun & Special Arsenal{" "}
                    <span className="ml-1 rounded bg-hazard/20 px-1.5 py-0.5 text-[10px] font-bold text-hazard">
                      {activeSpecialWeapons.length} / {DAILY_WEAPONS.length} active
                    </span>
                  </div>
                  <div className="text-[11px] text-white/50">
                    Today's default is <span className="text-hazard">{WEAPONS[dailyGun].label}</span>. Click to swap or enable as many guns as you want.
                  </div>
                </div>
                <div className="flex gap-1.5 text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={selectOnlyDaily}
                    className="rounded border border-white/15 bg-white/5 px-2 py-1 text-white/80 transition-colors hover:border-hazard/60 hover:text-white"
                  >
                    Today's Gun
                  </button>
                  <button
                    type="button"
                    onClick={selectAllWeapons}
                    className="rounded border border-white/15 bg-white/5 px-2 py-1 text-white/80 transition-colors hover:border-hazard/60 hover:text-white"
                  >
                    All 13
                  </button>
                  <button
                    type="button"
                    onClick={clearSpecialWeapons}
                    className="rounded border border-white/15 bg-white/5 px-2 py-1 text-white/60 transition-colors hover:border-white/40 hover:text-white"
                  >
                    None
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5">
                {DAILY_WEAPONS.map((wId) => {
                  const w = WEAPONS[wId]
                  const selected = activeSpecialWeapons.includes(wId)
                  const isDaily = wId === dailyGun
                  return (
                    <button
                      key={wId}
                      type="button"
                      onClick={() => toggleSpecialWeapon(wId)}
                      title={WEAPON_BLURBS[wId]}
                      className={`relative flex flex-col items-center rounded-md border p-1.5 text-center transition-all ${
                        selected
                          ? "border-hazard bg-hazard/15 text-white shadow-[0_0_12px_rgba(242,194,48,0.2)]"
                          : "border-white/10 bg-black/40 text-white/45 opacity-60 hover:border-white/25 hover:opacity-90"
                      }`}
                    >
                      {isDaily && (
                        <span className="absolute -top-1.5 right-1 rounded bg-hazard px-1 py-[1px] text-[8px] font-extrabold uppercase tracking-wider text-gunmetal">
                          Today
                        </span>
                      )}
                      <img
                        src={`${import.meta.env.BASE_URL}tt/ui/icon_${w.icon}.png`}
                        alt={w.label}
                        className="h-7 w-7 object-contain"
                      />
                      <span className="mt-1 w-full truncate text-[10px] font-semibold leading-tight">
                        {w.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <p className="rounded-md border border-white/10 bg-black/30 p-3 text-[12px] text-white/55">
              5v5 squads. A random room code is generated, and friends who join take over bot slots.
              You choose your tag and team inside the arena.
            </p>
            <button
              type="button"
              onClick={handleHostBattle}
              className="w-full rounded-md bg-hazard py-3 font-sans text-base font-bold text-gunmetal shadow transition-transform hover:scale-[1.02] active:scale-100"
            >
              Launch on {o.map.name} ›
            </button>
          </div>
        </Modal>
      )}

      {/* dedicated daily gun & arsenal modal */}
      {modal === "arsenal" && (
        <Modal
          title="Daily Gun & Arsenal"
          eyebrow="Weapon Rotation & Loadout"
          wide
          onClose={() => setModal(null)}
        >
          <div className="flex flex-col gap-4">
            <p className="text-[13px] leading-relaxed text-white/70">
              In the original 2006 game, 6 core weapons spawned on every map alongside one rotating{" "}
              <span className="font-semibold text-hazard">Daily Gun</span> to keep every day fresh.
              Today's gun (<span className="font-semibold text-white">{WEAPONS[dailyGun].label}</span>)
              is selected by default—or click to swap and enable{" "}
              <span className="font-semibold text-white">as many guns as you want</span>!
            </p>

            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-hazard/30 bg-hazard/10 px-3.5 py-2.5">
              <div className="flex items-center gap-3">
                <img
                  src={`${import.meta.env.BASE_URL}tt/ui/icon_${WEAPONS[previewWeapon].icon}.png`}
                  alt=""
                  className="h-10 w-10 object-contain"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-base font-bold text-white">
                      {WEAPONS[previewWeapon].label}
                    </span>
                    {previewWeapon === dailyGun && (
                      <span className="rounded bg-hazard px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-gunmetal">
                        Today's Daily Gun
                      </span>
                    )}
                  </div>
                  <div className="text-[12px] text-white/75">{WEAPON_BLURBS[previewWeapon]}</div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/50">
                13 Special Weapons ({activeSpecialWeapons.length} selected)
              </span>
              <div className="flex gap-1.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={selectOnlyDaily}
                  className="rounded border border-white/20 bg-white/5 px-2.5 py-1 text-white/85 transition-colors hover:border-hazard hover:text-white"
                >
                  Today's Gun Only
                </button>
                <button
                  type="button"
                  onClick={selectAllWeapons}
                  className="rounded border border-white/20 bg-white/5 px-2.5 py-1 text-white/85 transition-colors hover:border-hazard hover:text-white"
                >
                  Select All (13)
                </button>
                <button
                  type="button"
                  onClick={clearSpecialWeapons}
                  className="rounded border border-white/15 bg-white/5 px-2.5 py-1 text-white/60 transition-colors hover:border-white/40 hover:text-white"
                >
                  Base 6 Only
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {DAILY_WEAPONS.map((wId) => {
                const w = WEAPONS[wId]
                const selected = activeSpecialWeapons.includes(wId)
                const isDaily = wId === dailyGun
                return (
                  <button
                    key={wId}
                    type="button"
                    onMouseEnter={() => setPreviewWeapon(wId)}
                    onClick={() => toggleSpecialWeapon(wId)}
                    className={`relative flex items-center gap-2.5 rounded-lg border p-2 text-left transition-all ${
                      selected
                        ? "border-hazard bg-hazard/15 text-white shadow-[0_0_16px_rgba(242,194,48,0.18)]"
                        : "border-white/10 bg-black/45 text-white/45 opacity-60 hover:border-white/25 hover:opacity-90"
                    }`}
                  >
                    {isDaily && (
                      <span className="absolute -top-2 right-1.5 rounded bg-hazard px-1.5 py-[1px] text-[8px] font-extrabold uppercase tracking-wider text-gunmetal">
                        Today
                      </span>
                    )}
                    <img
                      src={`${import.meta.env.BASE_URL}tt/ui/icon_${w.icon}.png`}
                      alt={w.label}
                      className="h-8 w-8 shrink-0 object-contain"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-bold leading-tight">{w.label}</div>
                      <div className="text-[10px] text-white/50">
                        {selected ? "✓ Enabled" : "Locked"}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="rounded-lg border border-white/10 bg-black/35 p-3">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-white/45">
                Always Active Core Weapons (Base 6)
              </div>
              <div className="flex flex-wrap gap-2">
                {BASE_WEAPONS.map((wId) => {
                  const w = WEAPONS[wId]
                  return (
                    <button
                      key={wId}
                      type="button"
                      onMouseEnter={() => setPreviewWeapon(wId)}
                      onClick={() => setPreviewWeapon(wId)}
                      className="flex items-center gap-1.5 rounded border border-white/15 bg-white/5 px-2 py-1 text-[11px] font-semibold text-white/80 transition-colors hover:border-white/35 hover:text-white"
                    >
                      <img
                        src={`${import.meta.env.BASE_URL}tt/ui/icon_${w.icon}.png`}
                        alt={w.label}
                        className="h-4 w-4 object-contain"
                      />
                      <span>{w.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="flex-1 rounded-md border border-white/20 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white/10"
              >
                Done
              </button>
              <button
                type="button"
                onClick={() => setModal("host")}
                className="flex-1 rounded-md bg-hazard py-2.5 text-sm font-bold text-gunmetal transition-transform hover:scale-[1.02] active:scale-100"
              >
                Host Battle with Loadout ›
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* join modal */}
      {modal === "join" && (
        <Modal title="Join by Room Code" eyebrow="Join a friend" onClose={() => setModal(null)}>
          <form onSubmit={handleJoinWithCode} className="flex flex-col gap-4">
            <p className="text-[13px] text-white/60">
              Enter the 4–6 character code your friend shared. You'll pick your tag and team once
              you're in.
            </p>
            <input
              autoFocus
              type="text"
              value={manualCode}
              maxLength={8}
              onChange={(e) =>
                setManualCode(e.target.value.replace(/[^a-z0-9_-]/gi, "").toUpperCase())
              }
              placeholder="e.g. HK4P7Q"
              aria-label="Room code"
              className="rounded-md border border-white/15 bg-black/45 px-4 py-3 text-center font-mono text-2xl font-bold uppercase tracking-[0.3em] text-white outline-none transition-colors placeholder:text-base placeholder:tracking-normal placeholder:text-white/25 focus:border-hazard"
            />
            <button
              type="submit"
              disabled={!manualCode.trim()}
              className="w-full rounded-md bg-hazard py-3 font-sans text-base font-bold text-gunmetal transition-transform hover:scale-[1.02] active:scale-100 disabled:opacity-40 disabled:hover:scale-100"
            >
              Join Battle ›
            </button>
          </form>
        </Modal>
      )}
    </div>
  )
}

