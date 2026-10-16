import { useEffect, useRef, useState } from "react"
import { Game, type GameOptions, type HudState } from "../game/engine"
import Hud from "./Hud"

const asset = (p: string) => import.meta.env.BASE_URL + "tt/" + p

type Props = { options: GameOptions; onRematch: () => void; onMenu: () => void }

export default function GameView({ options, onRematch, onMenu }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<Game | null>(null)
  const [hud, setHud] = useState<HudState | null>(null)
  const [progress, setProgress] = useState("Building level")
  const [error, setError] = useState<string | null>(null)
  const [scores, setScores] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current!
    let cancelled = false
    const game = new Game(canvas, options, (s) => !cancelled && setHud(s))
    gameRef.current = game
    game
      .init((m) => !cancelled && setProgress(m))
      .then(() => {
        if (cancelled) return
        game.start()
        game.emitHud()
      })
      .catch((e: unknown) => {
        if (cancelled) return
        console.error(e)
        setError(e instanceof Error ? e.message : String(e))
      })
    return () => {
      cancelled = true
      game.dispose()
      gameRef.current = null
    }
  }, [options])

  useEffect(() => {
    const down = (e: KeyboardEvent) => e.code === "Tab" && setScores(true)
    const up = (e: KeyboardEvent) => e.code === "Tab" && setScores(false)
    window.addEventListener("keydown", down)
    window.addEventListener("keyup", up)
    return () => {
      window.removeEventListener("keydown", down)
      window.removeEventListener("keyup", up)
    }
  }, [])

  return (
    <div className="relative h-full w-full bg-black">
      <canvas ref={canvasRef} className="block h-full w-full" />
      {hud && (
        <Hud
          s={hud}
          map={options.map.id}
          showScores={scores}
          onLock={() => gameRef.current?.requestLock()}
          onToggleCamera={() => gameRef.current?.toggleCameraMode()}
          onRematch={onRematch}
          onMenu={onMenu}
        />
      )}
      {!hud && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-gunmetal">
          <img
            src={asset(`maps/${options.map.id}tex.png`)}
            alt=""
            className="pixelated h-40 w-40 rounded-md border border-white/10 shadow-2xl"
          />
          <div className="text-center">
            <div className="font-display text-3xl">{options.map.name}</div>
            <div className="mt-2 text-sm text-white/55">
              {error ? `Could not start: ${error}` : `${progress}…`}
            </div>
          </div>
          {!error && (
            <div className="h-1.5 w-64 overflow-hidden rounded-full bg-white/10">
              <div className="hazard-stripe h-full w-1/2 animate-[pulse_1s_ease-in-out_infinite]" />
            </div>
          )}
          {error && (
            <button
              type="button"
              onClick={onMenu}
              className="rounded-md border border-white/20 px-6 py-2 font-semibold hover:bg-white/10"
            >
              Back to menu
            </button>
          )}
        </div>
      )}
      {hud && !hud.over && (
        <button
          type="button"
          onClick={onMenu}
          className="absolute bottom-[7.5rem] right-4 rounded-md border border-white/15 bg-black/50 px-3 py-1.5 text-[12px] font-semibold text-white/70 backdrop-blur-sm transition-colors hover:text-white"
        >
          Quit to menu
        </button>
      )}
    </div>
  )
}
