import { useEffect, useState } from "react"
import { MAPS } from "./game/data"
import type { GameOptions } from "./game/engine"
import GameView from "./ui/GameView"
import Menu from "./ui/Menu"
import { syncUrlParams } from "./utils/url"

function getOrCreateCallsign(): string {
  try {
    const saved = localStorage.getItem("tt_callsign")
    if (saved && saved.trim()) return saved.trim()
    const prefixes = [
      "vanguard", "striker", "phantom", "reaper", "apex",
      "titan", "havoc", "specter", "blaze", "hunter",
      "viper", "falcon", "saber", "razor", "shadow"
    ]
    const pick = `${prefixes[Math.floor(Math.random() * prefixes.length)]}${Math.floor(10 + Math.random() * 90)}`
    localStorage.setItem("tt_callsign", pick)
    return pick
  } catch {
    return `commander${Math.floor(10 + Math.random() * 90)}`
  }
}

const DEFAULTS: GameOptions = {
  map: MAPS[0],
  minutes: 5,
  teamSize: 5,
  difficulty: "regular",
  playerName: "tankcommander",
  playerTeam: "blue",
  proMode: true,
  roomCode: "",
}

// Deep link: ?room=<code> sets P2P room, ?play starts it immediately.
function fromUrl(): { options: GameOptions; play: boolean } {
  const q = new URLSearchParams(window.location.search)
  const roomCode = q.get("room")?.trim().toUpperCase() ?? ""
  const callsign = getOrCreateCallsign()
  const joinAsClient = q.has("join") || (roomCode.length > 0 && !q.has("host"))
  return {
    options: {
      ...DEFAULTS,
      playerName: callsign,
      roomCode,
      joinAsClient,
    },
    play: q.has("play"),
  }
}

export default function App() {
  const [initial] = useState(fromUrl)
  const [options, setOptions] = useState<GameOptions>(initial.options)
  const [playing, setPlaying] = useState<GameOptions | null>(
    initial.play ? initial.options : null,
  )

  useEffect(() => {
    syncUrlParams(options.roomCode)
  }, [options.roomCode])

  const handleMenu = () => {
    setOptions((prev) => ({
      ...prev,
      roomCode: "",
      joinAsClient: false,
    }))
    syncUrlParams("")
    setPlaying(null)
  }

  if (playing) {
    const roundNum = (playing as GameOptions & { n?: number }).n ?? 0
    return (
      <GameView
        key={`${playing.map.id}_${playing.roomCode ?? ""}_${roundNum}`}
        options={playing}
        onLoadoutChange={(callsign, team) => {
          setOptions((prev) => ({ ...prev, playerName: callsign, playerTeam: team }))
          setPlaying((prev) =>
            prev ? { ...prev, playerName: callsign, playerTeam: team } : null,
          )
        }}
        onNextRound={(nextMap) =>
          setPlaying((prev) =>
            prev
              ? ({
                  ...prev,
                  map: nextMap,
                  n: ((prev as GameOptions & { n?: number }).n ?? 0) + 1,
                } as GameOptions)
              : null,
          )
        }
        onRematch={() =>
          setPlaying((prev) =>
            prev
              ? ({
                  ...prev,
                  n: ((prev as GameOptions & { n?: number }).n ?? 0) + 1,
                } as GameOptions)
              : null,
          )
        }
        onMenu={handleMenu}
      />
    )
  }
  return (
    <Menu
      initial={options}
      onStart={(o) => {
        const callsign = o.playerName?.trim() || getOrCreateCallsign()
        try {
          localStorage.setItem("tt_callsign", callsign)
        } catch {}
        const fixed = { ...o, playerName: callsign }
        setOptions(fixed)
        syncUrlParams(fixed.roomCode)
        setPlaying(fixed)
      }}
    />
  )
}
