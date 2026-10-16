/**
 * Utilities for URL query sync, deep linking, and invite sharing.
 */

export function generateRoomCode(): string {
  const words = [
    "HAWK", "APEX", "DUNE", "WOLF", "FURY", "IRON", "BOLT", "ECHO",
    "NOVA", "RUSH", "TITN", "COLT", "BEAR", "LION", "TANK", "FIRE",
    "ARES", "MARS", "THOR", "ACES", "RAID", "WARP", "DARK", "GRIT",
    "FROST", "VIPR", "SAGE", "ONYX", "RUBY", "JADE", "OPAL", "CORE"
  ]
  const word = words[Math.floor(Math.random() * words.length)]
  const num = Math.floor(10 + Math.random() * 90)
  return `${word}${num}`
}

export function getInviteUrl(roomCode: string, mapId?: string): string {
  const url = new URL(window.location.href)
  if (roomCode && roomCode.trim()) {
    url.searchParams.set("room", roomCode.trim().toLowerCase())
  } else {
    url.searchParams.delete("room")
  }
  if (mapId) {
    url.searchParams.set("map", mapId)
  }
  url.searchParams.delete("play")
  return url.toString()
}

export function syncUrlParams(roomCode?: string, mapId?: string) {
  try {
    const url = new URL(window.location.href)
    if (roomCode && roomCode.trim()) {
      url.searchParams.set("room", roomCode.trim().toLowerCase())
    } else {
      url.searchParams.delete("room")
    }
    if (mapId) {
      url.searchParams.set("map", mapId)
    }
    window.history.replaceState({}, "", url.toString())
  } catch {
    // Ignore in non-browser environments
  }
}

export async function copyInviteLink(
  roomCode: string,
  mapId?: string,
): Promise<boolean> {
  const link = getInviteUrl(roomCode, mapId)
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(link)
      return true
    }
  } catch {
    // Fallback below
  }
  try {
    const input = document.createElement("textarea")
    input.value = link
    input.style.position = "fixed"
    input.style.opacity = "0"
    document.body.appendChild(input)
    input.focus()
    input.select()
    const ok = document.execCommand("copy")
    document.body.removeChild(input)
    return ok
  } catch {
    return false
  }
}
