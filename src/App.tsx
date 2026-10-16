import { useState } from "react"
import { MAPS } from "./game/data"
import type { GameOptions } from "./game/engine"
import GameView from "./ui/GameView"
import Menu from "./ui/Menu"

const DEFAULTS: GameOptions = {
  map: MAPS[0],
  minutes: 5,
  teamSize: 4,
  difficulty: "regular",
  playerName: "tankcommander",
  playerTeam: "blue",
  proMode: true,
  roomCode: "",
}

// Deep link: ?map=<id> preselects a battlefield, ?room=<code> sets P2P room, ?play starts it immediately.
function fromUrl(): { options: GameOptions; play: boolean } {
  const q = new URLSearchParams(window.location.search)
  const map = MAPS.find((m) => m.id === q.get("map")) ?? DEFAULTS.map
  const roomCode = q.get("room") ?? ""
  return {
    options: { ...DEFAULTS, map, roomCode },
    play: q.has("play"),
  }
}

export default function App() {
  const [initial] = useState(fromUrl)
  const [options, setOptions] = useState<GameOptions>(initial.options)
  const [playing, setPlaying] = useState<GameOptions | null>(
    initial.play ? initial.options : null,
  )

  if (playing) {
    return (
      <GameView
        key={
          JSON.stringify(playing) +
          String((playing as GameOptions & { n?: number }).n ?? 0)
        }
        options={playing}
        onRematch={() =>
          setPlaying({
            ...playing,
            n: ((playing as GameOptions & { n?: number }).n ?? 0) + 1,
          } as GameOptions)
        }
        onMenu={() => setPlaying(null)}
      />
    )
  }
  return (
    <Menu
      initial={options}
      onStart={(o) => {
        const fixed = { ...o, playerName: o.playerName || "tankcommander" }
        setOptions(fixed)
        setPlaying(fixed)
      }}
    />
  )
}
