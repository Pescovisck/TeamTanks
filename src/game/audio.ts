import { asset } from "./level"

const FILES: Record<string, string> = {
  airblast: "airblast.mp3",
  bgunbang: "bgunbang.mp3",
  crash: "crash.mp3",
  endwav: "endwav.mp3",
  gunfire: "gunfire.wav",
  reboom1: "reboom1.mp3",
  death: "redeath_explosion.mp3",
  grenade: "regrenade.mp3",
  laser: "relaser.mp3",
  reload: "reload.mp3",
  minedrop: "reminedrop.mp3",
  mortar: "remortar.mp3",
  nook: "renook.mp3",
  pickup: "repickup.mp3",
  rocket: "rerocket2.mp3",
  bangrocket: "rebangrocketx4.mp3",
  bangmortar: "rebangmortar.mp3",
  speed: "respeed.mp3",
  super: "super.mp3",
  powerup: "superpowerup.mp3",
  bugle: "bugle.mp3",
  c1: "c1.mp3",
  c2: "c2.mp3",
  c3: "c3.mp3",
  bgun: "rebgun.mp3",
}

/** Web Audio player for the extracted clips; positional volume mimics playsound(pos, ...). */
export class Audio {
  ctx: AudioContext
  master: GainNode
  buffers = new Map<string, AudioBuffer>()
  listener = { x: 0, y: 0, z: 0 }
  muted = false

  constructor() {
    this.ctx = new AudioContext()
    this.master = this.ctx.createGain()
    this.master.gain.value = 0.55
    this.master.connect(this.ctx.destination)
  }

  async load() {
    await Promise.all(
      Object.entries(FILES).map(async ([k, f]) => {
        try {
          const r = await fetch(asset(`snd/${f}`))
          this.buffers.set(
            k,
            await this.ctx.decodeAudioData(await r.arrayBuffer()),
          )
        } catch {
          // a missing or undecodable clip is non-fatal
        }
      }),
    )
  }

  resume() {
    if (this.ctx.state === "suspended") void this.ctx.resume()
  }

  setMuted(m: boolean) {
    this.muted = m
    this.master.gain.value = m ? 0 : 0.55
  }

  play(
    name: string,
    pos?: { x: number; y: number; z: number },
    volume = 1,
    rate = 1,
  ) {
    const buf = this.buffers.get(name)
    if (!buf || this.muted || this.ctx.state === "closed") return
    let v = volume
    if (pos) {
      const d = Math.hypot(
        pos.x - this.listener.x,
        pos.y - this.listener.y,
        pos.z - this.listener.z,
      )
      v *= Math.max(0, 1 - d / 6000) ** 1.6
      if (v < 0.02) return
    }
    const src = this.ctx.createBufferSource()
    src.buffer = buf
    src.playbackRate.value = rate
    const g = this.ctx.createGain()
    g.gain.value = v
    src.connect(g).connect(this.master)
    src.start()
  }
}
