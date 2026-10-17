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
  jetengine: "jetengine.wav",
  rcbeep: "rcbeep.mp3",
  rcbombrelease: "rcbombrelease.mp3",
  offrock: "reoffrock.mp3",
  bangrcrocket: "rebangrcrocket.mp3",
  sonicblast: "resonicblast.mp3",
  sonicboom: "resonicboom.mp3",
  stealth: "restealth.mp3",
  missilelock: "remissilelock.mp3",
  airraidsiren: "airraidsiren.mp3",
  bombwhistle: "bombwhistle.mp3",
  missilebang: "missile_bang.mp3",
  powerdown: "superpowerdown.mp3",
  impulse: "impulsesnd.wav",
  vloop: "vloop.wav",
}

/** Web Audio player for the extracted clips; positional volume mimics playsound(pos, ...). */
export class Audio {
  ctx: AudioContext
  master: GainNode
  compressor: DynamicsCompressorNode
  buffers = new Map<string, AudioBuffer>()
  listener = { x: 0, y: 0, z: 0 }
  muted = false

  constructor() {
    this.ctx = new AudioContext()
    this.master = this.ctx.createGain()
    this.master.gain.value = 0.5

    // Dynamic compression normalization to prevent clipping and balance loud audio
    this.compressor = this.ctx.createDynamicsCompressor()
    this.compressor.threshold.value = -18
    this.compressor.knee.value = 24
    this.compressor.ratio.value = 6
    this.compressor.attack.value = 0.003
    this.compressor.release.value = 0.25

    this.master.connect(this.compressor).connect(this.ctx.destination)
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

  channels = new Map<string | number, { src: AudioBufferSourceNode; gain: GainNode }>()

  play(
    name: string,
    pos?: { x: number; y: number; z: number },
    volume = 1,
    rate = 1,
    channel?: string | number,
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

    // Director-style audio channel cutoff (e.g. Channel 6 for machine gun / laser)
    if (channel !== undefined) {
      const prev = this.channels.get(channel)
      if (prev) {
        try {
          prev.gain.gain.setValueAtTime(prev.gain.gain.value, this.ctx.currentTime)
          prev.gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.005)
          prev.src.stop(this.ctx.currentTime + 0.006)
        } catch {}
      }
    }

    const src = this.ctx.createBufferSource()
    src.buffer = buf
    src.playbackRate.value = rate
    const g = this.ctx.createGain()
    g.gain.value = v
    src.connect(g).connect(this.master)
    src.start()

    if (channel !== undefined) {
      this.channels.set(channel, { src, gain: g })
      src.onended = () => {
        if (this.channels.get(channel)?.src === src) {
          this.channels.delete(channel)
        }
      }
    }
  }

  loops = new Map<string, { src: AudioBufferSourceNode; gain: GainNode }>()

  /** Director-style puppet sound channel: start (or keep) a looping clip on a named channel. */
  loop(channel: string, name: string, volume = 1, rate = 1) {
    const cur = this.loops.get(channel)
    if (cur) {
      cur.gain.gain.value = volume
      cur.src.playbackRate.value = rate
      return
    }
    const buf = this.buffers.get(name)
    if (!buf || this.ctx.state === "closed") return
    const src = this.ctx.createBufferSource()
    src.buffer = buf
    src.loop = true
    src.playbackRate.value = rate
    const gain = this.ctx.createGain()
    gain.gain.value = volume
    src.connect(gain).connect(this.master)
    src.start()
    this.loops.set(channel, { src, gain })
  }

  stopLoop(channel: string) {
    const cur = this.loops.get(channel)
    if (!cur) return
    try {
      cur.src.stop()
    } catch {
      // already stopped
    }
    this.loops.delete(channel)
  }

  stopAllLoops() {
    for (const [_, l] of this.loops.entries()) {
      try {
        l.src.stop()
      } catch {
        // already stopped
      }
    }
    this.loops.clear()
  }
}
