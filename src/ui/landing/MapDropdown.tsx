import { useEffect, useId, useRef, useState } from "react"
import { MAPS, type MapDef } from "../../game/data"

const asset = (p: string) => import.meta.env.BASE_URL + "tt/" + p

type Props = {
  value: MapDef
  onChange: (m: MapDef) => void
  label?: string
}

/** Custom, keyboard-accessible battlefield picker with thumbnails (replaces the big map grid). */
export default function MapDropdown({ value, onChange, label = "Battlefield" }: Props) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(() => MAPS.findIndex((m) => m.id === value.id))
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const listId = useId()

  useEffect(() => {
    if (!open) return
    setActive(Math.max(0, MAPS.findIndex((m) => m.id === value.id)))
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [open, value.id])

  useEffect(() => {
    if (!open) return
    listRef.current
      ?.querySelector<HTMLElement>(`[data-idx="${active}"]`)
      ?.scrollIntoView({ block: "nearest" })
  }, [active, open])

  const choose = (m: MapDef) => {
    onChange(m)
    setOpen(false)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        setOpen(true)
      }
      return
    }
    if (e.key === "Escape") {
      e.preventDefault()
      e.stopPropagation()
      setOpen(false)
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      setActive((i) => Math.min(MAPS.length - 1, i + 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActive((i) => Math.max(0, i - 1))
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      choose(MAPS[active])
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <div className="mb-2 text-[12px] font-semibold text-white/50">{label}</div>
      <button
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-haspopup="listbox"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKeyDown}
        className={`group flex w-full items-center gap-3 rounded-md border bg-black/45 p-2 pr-3 text-left transition-colors ${
          open ? "border-hazard" : "border-white/15 hover:border-white/35"
        }`}
      >
        <img
          src={asset(`maps/${value.id}tex.png`)}
          alt=""
          className="pixelated h-11 w-11 shrink-0 rounded border border-white/15 object-cover"
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-bold text-white">{value.name}</span>
          <span className="block truncate text-[11px] capitalize text-white/50">
            {value.theme} · {value.tile} terrain
          </span>
        </span>
        <span
          className={`text-hazard transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          ▾
        </span>
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={label}
          className="tt-pop absolute inset-x-0 top-full z-30 mt-1.5 max-h-64 overflow-y-auto rounded-md border border-hazard/40 bg-[#0e1116] p-1 shadow-[0_18px_40px_rgba(0,0,0,0.7)]"
        >
          {MAPS.map((m, i) => {
            const selected = m.id === value.id
            return (
              <li
                key={m.id}
                role="option"
                aria-selected={selected}
                data-idx={i}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(m)}
                className={`flex cursor-pointer items-center gap-3 rounded px-2 py-1.5 transition-colors ${
                  i === active ? "bg-white/10" : ""
                }`}
              >
                <img
                  src={asset(`maps/${m.id}tex.png`)}
                  alt=""
                  className="pixelated h-9 w-9 shrink-0 rounded border border-white/10 object-cover"
                />
                <span className="min-w-0 flex-1">
                  <span
                    className={`block truncate text-[13px] font-semibold ${
                      selected ? "text-hazard" : "text-white"
                    }`}
                  >
                    {m.name}
                  </span>
                  <span className="block truncate text-[10px] capitalize text-white/40">
                    {m.theme} · friction {m.friction}
                  </span>
                </span>
                {selected && <span className="text-hazard">✓</span>}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

