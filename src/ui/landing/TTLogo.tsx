/**
 * Team Tanks: Armageddon logo lockup, rebuilt from the original title screen:
 * blue/red chevrons, big black type with oversized "T"s, a shell arc,
 * and the orange "armageddon" tag. White outlines/drop shadows keep it readable on grunge.
 */
export default function TTLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`tt-logo relative inline-block select-none ${className}`}>
      {/* shell arc (animated draw), fired from the tank below like in the original art */}
      <svg
        className="pointer-events-none absolute -top-[62%] left-[41%] w-[19%] overflow-visible"
        viewBox="0 0 100 130"
        fill="none"
        aria-hidden="true"
      >
        <path
          className="tt-arc"
          d="M6 130 C 6 6, 94 -14, 94 80"
          stroke="#f59e0b"
          strokeWidth="9"
          strokeLinecap="round"
          pathLength="1"
        />
      </svg>

      <h1 className="relative m-0 flex items-end gap-[0.18em] leading-none">
        <img
          src={import.meta.env.BASE_URL + "tt/ui/chevrons_emblem.png"}
          alt=""
          aria-hidden="true"
          className="tt-chevrons mb-[0.25em] w-[1.05em] shrink-0"
        />
        <span className="tt-title flex items-end gap-[0.22em]">
          <span className="tt-word">
            <span className="tt-cap">T</span>eam
          </span>
          <span className="tt-word">
            <span className="tt-cap">T</span>anks
          </span>
        </span>
      </h1>
      <span className="tt-armageddon absolute -bottom-[0.7em] right-[1%]">armageddon</span>
      <span className="sr-only">Team Tanks: Armageddon</span>
    </div>
  )
}
