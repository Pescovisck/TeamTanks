import * as THREE from "three"
import { Audio } from "./audio"
import {
  BOT_NAMES,
  BSP,
  CAPTURE_RADIUS,
  DEATH_SCORE,
  KILL_SCORE,
  MAPS,
  MAX_HEALTH,
  PICKUP_SUBSTITUTE,
  SPAWN_PROTECT,
  WEAPONS,
  type MapDef,
  type WeaponId,
} from "./data"
import {
  buildSky,
  buildTerrain,
  loadLevel,
  terrainAt,
  type Level,
} from "./level"
import {
  buildBrickWall,
  buildCapturePoint,
  buildDebrisPiece,
  buildPickup,
  buildProjectileMesh,
  buildProp,
  buildSpawnPad,
  buildTank,
  preloadModels,
  tex,
  TEAM_COLORS,
  updateTankWeaponRig,
  type CapRig,
  type TankRig,
} from "./models"
import { MultiplayerSession, type NetMessage } from "./multiplayer"

export type Team = "red" | "blue"
export type Difficulty = "rookie" | "regular" | "veteran"

export type GameOptions = {
  map: MapDef
  minutes: number
  teamSize: number
  difficulty: Difficulty
  playerName: string
  playerTeam: Team
  proMode?: boolean
  roomCode?: string
  joinAsClient?: boolean
}

export type FeedItem = {
  id: number
  text?: string
  killer?: {
    name: string
    team: Team
    isPlayer?: boolean
  }
  victim?: {
    name: string
    team: Team
    isPlayer?: boolean
  }
  weapon?: WeaponId
  weaponIcon?: number
  weaponVerb?: string
  team?: Team
  t: number
}
export type Popup = {
  id: number
  text: string
  t: number
  kind: "trick" | "damage" | "info"
}

export type HudState = {
  health: number
  weapon: WeaponId | null
  ammo: number
  uber: number
  superT: number
  speedT: number
  stealthT: number
  timeLeft: number
  caps: number[] // 0 = red, 255 = blue
  feed: FeedItem[]
  popups: Popup[]
  dead: boolean
  respawnIn: number
  spawnProtect: boolean
  hitMarker: number
  hurtDir: number | null
  proMode: boolean
  zoomed: boolean
  siteIndex: number
  isControllingRc: boolean
  scoreboard: {
    name: string
    team: Team
    score: number
    kills: number
    deaths: number
    isPlayer: boolean
    isRemote?: boolean
  }[]
  minimap: { x: number; z: number; team: Team; isPlayer: boolean; yaw: number }[]
  minimapCaps: { x: number; z: number; v: number }[]
  over: null | { winner: Team | "draw"; blueShare: number }
  locked: boolean
  speed: number
  netStatus?: {
    roomCode: string
    connected: boolean
    isHost: boolean
    peers: number
  } | null
  mapVote?: {
    candidates: MapDef[]
    votes: Record<string, string>
    myVote: string
  } | null
}

type Tank = {
  id: number
  name: string
  team: Team
  isPlayer: boolean
  isRemote?: boolean
  lastNetSeen?: number
  rig: TankRig
  pos: THREE.Vector3
  vel: THREE.Vector3
  q: THREE.Quaternion
  angVel: THREE.Vector3
  prevPos: THREE.Vector3
  prevQ: THREE.Quaternion
  renderPos: THREE.Vector3
  renderQ: THREE.Quaternion
  onFloor: boolean
  health: number
  weapon: WeaponId | null
  ammo: number
  cooldown: number
  jumpCd: number
  aimYaw: number
  aimPitch: number
  spawnProtect: number
  speedT: number
  stealthT: number
  superT: number
  uber: number
  dead: boolean
  respawnT: number
  score: number
  kills: number
  deaths: number
  trickAngle: number
  trickKey: string
  airFrames: number
  input: { throttle: number; turn: number; fire: boolean; jump: boolean }
  ai: {
    target: Tank | null
    goal: THREE.Vector3 | null
    think: number
    stuck: number
    reaction: number
    strafe: number
  }
  mines: Projectile[]
  nametagSprite?: THREE.Sprite
  nametagTex?: THREE.CanvasTexture
}

type Projectile = {
  kind: "shell" | "rocket" | "lob" | "homing" | "mine" | "bomb"
  weapon: WeaponId
  owner: Tank
  pos: THREE.Vector3
  vel: THREE.Vector3
  life: number
  obj: THREE.Object3D
  target?: Tank | null
  armed?: number
  gravity: number
  trail: number
}

type Effect = {
  obj: THREE.Object3D
  life: number
  max: number
  keepGeometry?: boolean
  update?: (e: Effect, k: number) => void
  dispose?: () => void
}

type Pickup = {
  kind: string
  weapon: WeaponId
  pos: THREE.Vector3
  obj: THREE.Object3D
  respawn: number
}
type Cap = { pos: THREE.Vector3; v: number; rig: CapRig }

const DT = 1 / 60
const GRAVITY = 2100
const UP = new THREE.Vector3(0, 1, 0)
const tmpV = new THREE.Vector3()
const tmpV2 = new THREE.Vector3()
const tmpQ = new THREE.Quaternion()
const tmpM = new THREE.Matrix4()

const DIFF = {
  rookie: { spread: 0.11, reaction: 45, fireScale: 1.8, aggro: 2600 },
  regular: { spread: 0.06, reaction: 25, fireScale: 1.25, aggro: 3400 },
  veteran: { spread: 0.03, reaction: 12, fireScale: 1, aggro: 4200 },
}

function disposeTree(o: THREE.Object3D) {
  o.traverse((c) => {
    const m = c as THREE.Mesh
    if (m.geometry && !(c instanceof THREE.Sprite)) m.geometry.dispose()
  })
}

function wrapAngle(a: number) {
  while (a > Math.PI) a -= Math.PI * 2
  while (a < -Math.PI) a += Math.PI * 2
  return a
}

/** Original Shockwave 3D tank nametag billboarding over enemy and friendly tanks. */
function createNametagSprite(
  name: string,
  team: Team,
): { sprite: THREE.Sprite; tex: THREE.CanvasTexture } {
  const canvas = document.createElement("canvas")
  canvas.width = 512
  canvas.height = 128
  const ctx = canvas.getContext("2d")!

  ctx.clearRect(0, 0, 512, 128)

  const isRed = team === "red"
  const teamColor = isRed ? "#ff4433" : "#3b82f6"

  // Bold legible text in team color with dark outline and shadow for contrast
  ctx.font = "bold 64px 'Chakra Petch', 'Russo One', sans-serif"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"

  ctx.shadowColor = "rgba(0, 0, 0, 0.95)"
  ctx.shadowBlur = 8
  ctx.shadowOffsetX = 2
  ctx.shadowOffsetY = 3

  ctx.strokeStyle = "rgba(0, 0, 0, 0.85)"
  ctx.lineWidth = 6
  ctx.strokeText(name.toUpperCase(), 256, 64)

  ctx.fillStyle = teamColor
  ctx.fillText(name.toUpperCase(), 256, 64)

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.minFilter = THREE.LinearFilter
  tex.magFilter = THREE.LinearFilter

  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthTest: true,
    depthWrite: false,
  })

  const sprite = new THREE.Sprite(mat)
  sprite.scale.set(48, 12, 1)
  sprite.renderOrder = 10
  return { sprite, tex }
}

export class Game {
  opts: GameOptions
  canvas: HTMLCanvasElement
  onHud: (s: HudState) => void
  renderer!: THREE.WebGLRenderer
  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(62, 1, 2, 60000)
  level!: Level
  colliders: THREE.Object3D[] = []
  sun!: THREE.DirectionalLight
  audio = new Audio()
  tanks: Tank[] = []
  player!: Tank
  projectiles: Projectile[] = []
  effects: Effect[] = []
  pickups: Pickup[] = []
  caps: Cap[] = []
  feed: FeedItem[] = []
  popups: Popup[] = []
  frame = 0
  timeLeft: number
  over: HudState["over"] = null
  keys = new Set<string>()
  mouseDown = false
  locked = false
  proMode = false
  rightMouseDown = false
  paiminc = 50
  rcPawn: {
    kind: "rcbomb" | "rcrocket"
    pos: THREE.Vector3
    vel: THREE.Vector3
    rot: THREE.Vector3 // pitch, roll, yaw
    mesh: THREE.Object3D
    life: number
    maxLife: number
    fuel: number
    push: number
  } | null = null
  airstrikeMarker: THREE.Mesh | null = null
  sparkMat!: THREE.SpriteMaterial
  bloodMat!: THREE.SpriteMaterial
  muzzleFlashMat!: THREE.SpriteMaterial
  muzzleLaserMat!: THREE.SpriteMaterial
  running = false
  raf = 0
  acc = 0
  last = 0
  uid = 1
  hitMarker = 0
  hurtDir: number | null = null
  hurtT = 0
  shake = 0
  camPos = new THREE.Vector3()
  camLook = new THREE.Vector3()
  raycaster = new THREE.Raycaster()
  bangTextures: Record<string, { tex: THREE.Texture; grid: number }> = {}
  puffMat!: THREE.SpriteMaterial
  disposers: (() => void)[] = []
  disposed = false
  mp: MultiplayerSession | null = null
  netStatus: HudState["netStatus"] = null
  mapVoteCandidates: MapDef[] = []
  mapVotes: Record<string, string> = {}
  onNextRoundRequested?: (nextMap: MapDef) => void

  constructor(
    canvas: HTMLCanvasElement,
    opts: GameOptions,
    onHud: (s: HudState) => void,
    onNextRoundRequested?: (nextMap: MapDef) => void,
  ) {
    this.canvas = canvas
    this.opts = opts
    this.onHud = onHud
    this.onNextRoundRequested = onNextRoundRequested
    this.timeLeft = opts.minutes * 60
    if (opts.proMode !== undefined) this.proMode = opts.proMode
  }

  async init(onProgress?: (msg: string) => void) {
    onProgress?.("Decoding W3D models & building level")
    const r = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: "high-performance",
    })
    r.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    r.shadowMap.enabled = true
    r.shadowMap.type = THREE.PCFSoftShadowMap
    r.outputColorSpace = THREE.SRGBColorSpace
    r.toneMapping = THREE.ACESFilmicToneMapping
    r.toneMappingExposure = 1.05
    this.renderer = r
    const [level] = await Promise.all([
      loadLevel(this.opts.map),
      preloadModels(),
    ])
    this.level = level
    const l = this.level

    onProgress?.("Raising terrain")
    this.scene.add(await buildTerrain(l))
    const horizon = await buildSky(l, this.scene)
    this.scene.fog = new THREE.Fog(horizon, l.width * 0.45, l.width * 1.25)
    this.scene.background = horizon

    this.scene.add(new THREE.HemisphereLight("#dfe8ff", "#5a4a38", 1.1))
    const sun = new THREE.DirectionalLight("#fff3e0", 2.2)
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    const sc = sun.shadow.camera
    sc.left = sc.bottom = -2200
    sc.right = sc.top = 2200
    sc.near = 100
    sc.far = 20000
    sun.shadow.bias = -0.0004
    this.scene.add(sun, sun.target)
    this.sun = sun

    onProgress?.("Placing ramps and spawns")
    for (const p of l.props) {
      const o = buildProp(p.kind)
      o.position.copy(p.pos).add(new THREE.Vector3(0, -5, 0))
      o.rotation.y = -p.yaw // Lingo Z-up rotation flips sign in Y-up space
      this.scene.add(o)
      if (o.userData.collider) this.colliders.push(o.userData.collider)
    }
    if (this.opts.map.id === "grass1") {
      const brick = buildBrickWall()
      this.scene.add(brick)
      if (brick.userData.collider) this.colliders.push(brick.userData.collider)
    }
    for (const s of l.spawns) {
      const pad = buildSpawnPad(s.team)
      pad.position.copy(s.pos)
      pad.position.y = terrainAt(l, s.pos.x, s.pos.z) - 4
      pad.rotation.y = -s.yaw
      this.scene.add(pad)
      pad.updateMatrixWorld(true)
      if (pad.userData.collider) this.colliders.push(pad.userData.collider)
    }
    for (const c of l.caps) {
      const rig = buildCapturePoint()
      rig.group.position.copy(c)
      this.scene.add(rig.group)
      this.caps.push({ pos: c.clone(), v: 127, rig })
      rig.group.updateMatrixWorld(true)
      if (rig.group.userData.collider)
        this.colliders.push(rig.group.userData.collider)
    }
    for (const p of l.pickups) {
      const weapon = (PICKUP_SUBSTITUTE[p.kind] ?? p.kind) as WeaponId
      if (!WEAPONS[weapon]) continue
      const obj = buildPickup(WEAPONS[weapon].icon)
      obj.position.copy(p.pos)
      this.scene.add(obj)
      this.pickups.push({
        kind: p.kind,
        weapon,
        pos: p.pos.clone(),
        obj,
        respawn: 0,
      })
    }
    this.buildFence()
    this.scene.updateMatrixWorld(true)

    // bangs.ls animates a sprite sheet: 4x4 frames (nook 8x8)
    for (const [name, grid] of [
      ["bangrocket", 4],
      ["bangnook", 8],
      ["bangmine", 4],
      ["bangbgun", 4],
      ["bangbang", 4],
      ["bangairstrike", 4],
      ["bangdead", 4],
    ] as const) {
      this.bangTextures[name] = { tex: tex(name), grid }
    }
    this.puffMat = new THREE.SpriteMaterial({
      map: tex("pufft"),
      transparent: true,
      depthWrite: false,
      opacity: 0.6,
    })
    this.sparkMat = new THREE.SpriteMaterial({
      map: tex("pufft"),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    this.bloodMat = new THREE.SpriteMaterial({
      map: tex("tblood"),
      transparent: true,
      depthWrite: false,
      opacity: 0.85,
    })
    this.muzzleFlashMat = new THREE.SpriteMaterial({
      map: tex("mfmachinegun"),
      color: "#ffffff",
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    this.muzzleLaserMat = new THREE.SpriteMaterial({
      map: tex("mflaser"),
      color: "#ffffff",
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })

    onProgress?.("Fuelling tanks")
    const pTeam = this.opts.playerTeam
    this.player = this.addTank(this.opts.playerName, pTeam, true)
    const names = [...BOT_NAMES].sort(() => Math.random() - 0.5)
    const squadSize = this.opts.teamSize || 5
    for (let i = 0; i < squadSize - 1; i++)
      this.addTank(names.pop()!, pTeam, false)
    for (let i = 0; i < squadSize; i++)
      this.addTank(names.pop()!, pTeam === "red" ? "blue" : "red", false)
    for (const t of this.tanks) this.respawn(t, true)

    // Initialize P2P + BroadcastChannel Multiplayer if roomCode is provided
    const room = this.opts.roomCode?.trim()
    if (room) {
      this.netStatus = {
        roomCode: room,
        connected: false,
        isHost: false,
        peers: 0,
      }
      this.mp = new MultiplayerSession(
        room,
        this.player.name,
        this.player.team,
        (msg) => this.onNetMessage(msg),
        (st) => {
          this.netStatus = { roomCode: room, ...st }
          this.emitHud()
        },
        {
          roomCode: room,
          mapId: this.opts.map.id,
          mapName: this.opts.map.name,
          joinAsClient: this.opts.joinAsClient,
        },
      )
    }

    // sounds stream in the background; play() skips clips that are not decoded yet
    void this.audio.load()
    if (this.disposed) throw new Error("disposed")
    this.scene.updateMatrixWorld(true)
    this.bindInput()
    this.resize()
    this.pushFeed(
      room
        ? `Joined P2P room "${room}" on ${this.opts.map.name}.`
        : "TeamTanks loaded. Hold the capture points.",
    )
  }

  onNetMessage(msg: NetMessage) {
    if (msg.subject === "where") {
      const s = msg.state
      const remoteName = s.name === this.player.name ? `${s.name}_remote` : s.name
      let rt = this.tanks.find((t) => t.isRemote && t.name === remoteName)
      if (!rt) {
        // A player joining takes the place of a bot on their team to keep both sides balanced
        const botToReplace = this.tanks.find(
          (t) => !t.isPlayer && !t.isRemote && t.team === s.team,
        )

        if (botToReplace) {
          const oldName = botToReplace.name
          this.removeTank(botToReplace)
          this.pushFeed(`${remoteName} replaced ${oldName}`, s.team)
        } else {
          // If all spots on that team are already humans, allow unlimited joining!
          this.pushFeed(`${remoteName} joined the battle`, s.team)
        }

        rt = this.addTank(remoteName, s.team, false, true)
      }
      rt.lastNetSeen = this.frame
      rt.team = s.team
      rt.pos.set(s.pos[0], s.pos[1], s.pos[2])
      rt.q.set(s.quat[0], s.quat[1], s.quat[2], s.quat[3])
      rt.vel.set(s.vel[0], s.vel[1], s.vel[2])
      rt.aimYaw = s.turretYaw
      rt.aimPitch = s.gunPitch
      rt.weapon = s.weapon
      rt.health = s.hp
      rt.score = s.score
      rt.superT = s.superActive ? Math.max(rt.superT, 10) : 0
      rt.stealthT = s.stealthActive ? Math.max(rt.stealthT, 10) : 0
      rt.speedT = s.thrustActive ? Math.max(rt.speedT, 10) : 0
      rt.dead = s.hp <= 0
      rt.rig.root.visible = !rt.dead
    } else if (msg.subject === "fire") {
      const shooterName = msg.sender === this.player.name ? `${msg.sender}_remote` : msg.sender
      const shooter = this.tanks.find((t) => t.name === shooterName)
      if (!shooter) return
      const pos = new THREE.Vector3(msg.pos[0], msg.pos[1], msg.pos[2])
      const dir = new THREE.Vector3(msg.dir[0], msg.dir[1], msg.dir[2])
      const w = WEAPONS[msg.weapon]
      if (!w) return
      if (w.kind === "hitscan") {
        this.hitscan(shooter, pos, dir, w.id)
      } else if (w.kind === "shell") {
        this.spawnProjectile(
          shooter,
          "shell",
          w.id,
          pos,
          dir.multiplyScalar(w.speed!),
          0.25,
          120,
        )
        this.audio.play("bgun", pos, 0.7)
      } else if (w.kind === "rocket") {
        this.spawnProjectile(
          shooter,
          "rocket",
          w.id,
          pos,
          dir.multiplyScalar(w.speed!),
          0,
          200,
        )
        this.audio.play("rocket", pos, 0.7)
      } else if (w.kind === "lob") {
        this.spawnProjectile(
          shooter,
          "lob",
          w.id,
          pos,
          dir.multiplyScalar(w.speed!),
          0.7,
          400,
        )
        this.audio.play(w.id === "nook" ? "grenade" : "mortar", pos, 0.7)
      } else if (w.kind === "homing") {
        this.spawnProjectile(
          shooter,
          "homing",
          w.id,
          pos,
          dir.multiplyScalar(w.speed!),
          0,
          300,
        )
        this.audio.play("rocket", pos, 0.7, 1.15)
      } else if (w.kind === "mine") {
        const m = this.spawnProjectile(
          shooter,
          "mine",
          w.id,
          pos,
          new THREE.Vector3(),
          0,
          3600,
        )
        m.armed = 60
        shooter.mines.push(m)
      } else if (w.kind === "airstrike") {
        this.airstrike(shooter, this.aimPoint(pos, dir, 7000))
      }
    } else if (msg.subject === "cappoint") {
      const cap = this.caps[msg.id]
      if (cap) cap.v = msg.val
    } else if (msg.subject === "left") {
      const senderName = msg.sender === this.player.name ? `${msg.sender}_remote` : msg.sender
      const idx = this.tanks.findIndex(
        (t) => t.isRemote && (t.name === msg.sender || t.name === senderName),
      )
      if (idx >= 0) {
        const rt = this.tanks[idx]
        const team = rt.team
        const name = rt.name
        this.removeTank(rt)
        this.pushFeed(`${name} left the room`, team)

        // Only spawn a replacement bot if the team has fallen below the 5-tank squad baseline
        const remainingOnTeam = this.tanks.filter((t) => t.team === team).length
        if (remainingOnTeam < 5) {
          const unusedNames = BOT_NAMES.filter(
            (bn) => !this.tanks.some((t) => t.name === bn),
          )
          const botName =
            unusedNames[Math.floor(Math.random() * unusedNames.length)] ??
            `bot_${Math.floor(Math.random() * 100)}`
          const newBot = this.addTank(botName, team, false, false)
          this.respawn(newBot, true)
          this.pushFeed(`${botName} joined to replace ${name}`, team)
        }
      }
    } else if (msg.subject === "mapvote") {
      this.mapVotes[msg.sender] = msg.mapId
      this.emitHud()
    } else if (msg.subject === "nextmap") {
      const targetMap = MAPS.find((m) => m.id === msg.mapId) ?? this.opts.map
      this.onNextRoundRequested?.(targetMap)
    }
  }

  /** Marks the physbox boundary (sortphysbox: width * 0.99). */
  buildFence() {
    const l = this.level
    const mat = new THREE.MeshStandardMaterial({
      color: "#f2c230",
      emissive: "#3a2a00",
      roughness: 0.5,
    })
    const n = 28
    const inst = new THREE.InstancedMesh(
      new THREE.BoxGeometry(24, 120, 24),
      mat,
      n * 4,
    )
    let k = 0
    const lim = l.half * 0.99
    for (let s = 0; s < 4; s++) {
      for (let i = 0; i < n; i++) {
        const t = -lim + (i / (n - 1)) * lim * 2
        const x = s < 2 ? t : s === 2 ? -lim : lim
        const z = s < 2 ? (s === 0 ? -lim : lim) : t
        tmpM.makeTranslation(x, terrainAt(l, x, z) + 60, z)
        inst.setMatrixAt(k++, tmpM)
      }
    }
    this.scene.add(inst)
  }

  addTank(
    name: string,
    team: Team,
    isPlayer: boolean,
    isRemote = false,
  ): Tank {
    const rig = buildTank(team)
    this.scene.add(rig.root)
    const { sprite: nametagSprite, tex: nametagTex } = createNametagSprite(
      name,
      team,
    )
    this.scene.add(nametagSprite)
    nametagSprite.visible = false // initially hidden, updated in render()
    const d = DIFF[this.opts.difficulty]
    const t: Tank = {
      id: this.uid++,
      name,
      team,
      isPlayer,
      isRemote,
      lastNetSeen: this.frame,
      rig,
      nametagSprite,
      nametagTex,
      pos: new THREE.Vector3(),
      vel: new THREE.Vector3(),
      q: new THREE.Quaternion(),
      angVel: new THREE.Vector3(),
      prevPos: new THREE.Vector3(),
      prevQ: new THREE.Quaternion(),
      renderPos: new THREE.Vector3(),
      renderQ: new THREE.Quaternion(),
      onFloor: false,
      health: MAX_HEALTH,
      weapon: "mgun",
      ammo: WEAPONS.mgun.ammo,
      cooldown: 0,
      jumpCd: 0,
      aimYaw: 0,
      aimPitch: 0.05,
      spawnProtect: 0,
      speedT: 0,
      stealthT: 0,
      superT: 0,
      uber: 0,
      dead: false,
      respawnT: 0,
      score: 0,
      kills: 0,
      deaths: 0,
      trickAngle: 0,
      trickKey: "",
      airFrames: 0,
      input: { throttle: 0, turn: 0, fire: false, jump: false },
      ai: {
        target: null,
        goal: null,
        think: Math.random() * 30,
        stuck: 0,
        reaction: d.reaction,
        strafe: Math.random() < 0.5 ? -1 : 1,
      },
      mines: [],
    }
    this.tanks.push(t)
    return t
  }

  removeTank(tank: Tank) {
    this.scene.remove(tank.rig.root)
    if (tank.nametagSprite) {
      this.scene.remove(tank.nametagSprite)
      tank.nametagSprite.material.dispose()
      tank.nametagTex?.dispose()
    }
    this.audio.stopLoop(`engine_${tank.id}`)
    for (const m of tank.mines) this.scene.remove(m.obj)
    for (const other of this.tanks) {
      if (other.ai?.target === tank) other.ai.target = null
    }
    const idx = this.tanks.indexOf(tank)
    if (idx >= 0) this.tanks.splice(idx, 1)
  }

  updateTankNametag(t: Tank) {
    if (t.nametagSprite) {
      this.scene.remove(t.nametagSprite)
      t.nametagSprite.material.dispose()
      t.nametagTex?.dispose()
    }
    const { sprite, tex } = createNametagSprite(t.name, t.team)
    t.nametagSprite = sprite
    t.nametagTex = tex
    this.scene.add(sprite)
  }

  /** goody.repos: drop onto a random team spawn, facing the map centre, with spawn protection. */
  respawn(t: Tank, initial = false) {
    const spots = this.level.spawns.filter((s) => s.team === t.team)
    const s = spots[0] ?? this.level.spawns[0]
    const mates = this.tanks.filter((o) => o.team === t.team)
    const slot = mates.indexOf(t)
    const spawnYaw = s ? -s.yaw : 0
    // Arrange tanks side-by-side directly on top of the spawn pad surface
    const lateralOffset = (slot - (mates.length - 1) / 2) * 32
    const right = new THREE.Vector3(Math.cos(spawnYaw), 0, -Math.sin(spawnYaw))
    t.pos.copy(s ? s.pos : new THREE.Vector3()).addScaledVector(right, lateralOffset)
    // Spawn directly on top of the spawn structure platform (W3D spawn pad platform at Y = 276.64 above pad position)
    let platformY = terrainAt(this.level, t.pos.x, t.pos.z)
    if (s) {
      const padSurfaceY = terrainAt(this.level, s.pos.x, s.pos.z) - 4 + 276.64
      platformY = padSurfaceY
      const startY = padSurfaceY + 300
      this.raycaster.set(tmpV2.set(t.pos.x, startY, t.pos.z), tmpV.set(0, -1, 0))
      this.raycaster.far = 400
      const hits = this.raycaster.intersectObjects(this.colliders, false)
      for (const hit of hits) {
        if (!hit.face) continue
        const norm = hit.face.normal.clone().transformDirection(hit.object.matrixWorld)
        if (norm.y > 0.5 && hit.point.y > platformY - 50) {
          platformY = hit.point.y
          break
        }
      }
    }
    t.pos.y = platformY + 16
    t.vel.set(0, 0, 0)
    t.angVel.set(0, 0, 0)
    t.q.setFromAxisAngle(UP, spawnYaw)
    t.aimYaw = spawnYaw
    t.aimPitch = 0.05
    t.prevPos.copy(t.pos)
    t.prevQ.copy(t.q)
    t.renderPos.copy(t.pos)
    t.renderQ.copy(t.q)
    t.health = MAX_HEALTH
    t.weapon = "mgun"
    t.ammo = WEAPONS.mgun.ammo
    t.dead = false
    t.rig.root.visible = true
    t.spawnProtect = SPAWN_PROTECT
    t.speedT = t.stealthT = 0
    t.trickAngle = 0
    t.airFrames = 0
    updateTankWeaponRig(t.rig, t.weapon)
    if (initial && t.isPlayer) {
      this.camPos.set(0, 0, 0)
      this.camLook.set(0, 0, 0)
    }
    if (!initial && t.isPlayer) this.audio.play("reload", undefined, 0.6)
  }

  // ---------------------------------------------------------------- input
  bindInput() {
    const kd = (e: KeyboardEvent) => {
      if (
        [
          "Space",
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          "Tab",
        ].includes(e.code)
      )
        e.preventDefault()
      this.keys.add(e.code)
      this.audio.resume()
      if (e.code === "KeyM") this.audio.setMuted(!this.audio.muted)
      if (e.code === "KeyV" && !e.repeat) {
        this.toggleCameraMode()
      }
      if (e.code === "KeyR" && !e.repeat && !this.player.dead && !this.over) {
        this.pushFeed({
          victim: {
            name: this.player.name,
            team: this.player.team,
            isPlayer: true,
          },
          weaponVerb: "respawn",
        })
        this.respawn(this.player)
      }
    }
    const ku = (e: KeyboardEvent) => this.keys.delete(e.code)
    const md = (e: MouseEvent) => {
      this.audio.resume()
      if (!this.locked) {
        this.requestLock()
        return
      }
      if (e.button === 0) this.mouseDown = true
      if (e.button === 2) this.rightMouseDown = true
    }
    const mu = (e: MouseEvent) => {
      if (e.button === 0) this.mouseDown = false
      if (e.button === 2) this.rightMouseDown = false
    }
    const mm = (e: MouseEvent) => {
      if (!this.locked || this.player.dead || this.over) return
      if (this.rcPawn) {
        this.rcPawn.rot.z -= e.movementX * 0.0025
        if (this.rcPawn.kind === "rcrocket") {
          this.rcPawn.rot.x = THREE.MathUtils.clamp(
            this.rcPawn.rot.x - e.movementY * 0.002,
            -1.1,
            1.1,
          )
        }
        return
      }
      if (!this.proMode) return
      const sens = this.rightMouseDown ? 0.0006 : 0.0024
      const pSens = this.rightMouseDown ? 0.0005 : 0.0018
      this.player.aimYaw -= e.movementX * sens
      this.player.aimPitch = THREE.MathUtils.clamp(
        this.player.aimPitch - e.movementY * pSens,
        -0.5,
        1.1,
      )
    }
    const cm = (e: MouseEvent) => e.preventDefault()
    const pl = () => {
      this.locked = document.pointerLockElement === this.canvas
      if (!this.locked) {
        this.mouseDown = false
        this.rightMouseDown = false
      }
      this.emitHud()
    }
    const rs = () => this.resize()
    const blur = () => {
      this.keys.clear()
      this.mouseDown = false
      this.rightMouseDown = false
    }
    window.addEventListener("keydown", kd)
    window.addEventListener("keyup", ku)
    this.canvas.addEventListener("mousedown", md)
    window.addEventListener("mouseup", mu)
    window.addEventListener("mousemove", mm)
    this.canvas.addEventListener("contextmenu", cm)
    document.addEventListener("pointerlockchange", pl)
    window.addEventListener("resize", rs)
    window.addEventListener("blur", blur)
    this.disposers.push(() => {
      window.removeEventListener("keydown", kd)
      window.removeEventListener("keyup", ku)
      this.canvas.removeEventListener("mousedown", md)
      window.removeEventListener("mouseup", mu)
      window.removeEventListener("mousemove", mm)
      this.canvas.removeEventListener("contextmenu", cm)
      document.removeEventListener("pointerlockchange", pl)
      window.removeEventListener("resize", rs)
      window.removeEventListener("blur", blur)
    })
  }

  resize() {
    const w = this.canvas.clientWidth || window.innerWidth
    const h = this.canvas.clientHeight || window.innerHeight
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
  }

  requestLock() {
    try {
      const r =
        this.canvas.requestPointerLock?.() as unknown as Promise<void> | undefined
      r?.catch?.(() => {})
    } catch {
      // pointer lock can be refused (e.g. inside some iframes); keyboard still works
    }
  }

  toggleCameraMode() {
    this.proMode = !this.proMode
    this.popup(this.proMode ? "PRO CAMERA" : "CASUAL CAMERA", "info")
    this.emitHud()
  }

  setPlayerLoadout(name: string, team: Team) {
    this.player.name = name
    if (this.player.team !== team) {
      this.player.team = team
      this.scene.remove(this.player.rig.root)
      this.player.rig = buildTank(team)
      this.scene.add(this.player.rig.root)

      // Balance teams: replace a bot on the new team if one exists
      const botOnNewTeam = this.tanks.find(
        (t) => !t.isPlayer && !t.isRemote && t.team === team,
      )
      if (botOnNewTeam) {
        this.removeTank(botOnNewTeam)
      }

      // If the old team drops below 5, spawn a replacement bot
      const oldTeam: Team = team === "red" ? "blue" : "red"
      const remainingOnOldTeam = this.tanks.filter((t) => t.team === oldTeam).length
      if (remainingOnOldTeam < 5) {
        const unusedNames = BOT_NAMES.filter(
          (bn) => !this.tanks.some((t) => t.name === bn),
        )
        const botName =
          unusedNames[Math.floor(Math.random() * unusedNames.length)] ??
          `bot_${Math.floor(Math.random() * 100)}`
        const newBot = this.addTank(botName, oldTeam, false, false)
        this.respawn(newBot, true)
      }
    }
    this.respawn(this.player, true)
    this.pushFeed(`${this.player.name} deployed on ${team === "red" ? "Red" : "Blue"} team`, team)
    this.emitHud()
  }

  castMapVote(mapId: string) {
    this.mapVotes[this.player.name] = mapId
    this.mp?.send({
      subject: "mapvote",
      sender: this.player.name,
      mapId,
    })
    this.emitHud()
  }

  confirmNextMap(mapId: string) {
    const targetMap = MAPS.find((m) => m.id === mapId) ?? this.opts.map
    this.mp?.send({
      subject: "nextmap",
      sender: this.player.name,
      mapId: targetMap.id,
    })
    this.onNextRoundRequested?.(targetMap)
  }

  start() {
    this.running = true
    this.last = performance.now()
    const loop = (now: number) => {
      if (!this.running) return
      this.raf = requestAnimationFrame(loop)
      this.acc += Math.min(0.1, (now - this.last) / 1000)
      this.last = now
      let steps = 0
      while (this.acc >= DT && steps < 6) {
        this.step()
        this.acc -= DT
        steps++
      }
      this.render()
    }
    this.raf = requestAnimationFrame(loop)
  }

  dispose() {
    this.disposed = true
    this.running = false
    cancelAnimationFrame(this.raf)
    this.disposers.forEach((d) => d())
    this.mp?.dispose()
    if (document.pointerLockElement === this.canvas) document.exitPointerLock()
    this.audio.stopAllLoops()
    void this.audio.ctx.close()
    for (const t of this.tanks) {
      if (t.nametagSprite) {
        this.scene.remove(t.nametagSprite)
        t.nametagSprite.material.dispose()
        t.nametagTex?.dispose()
      }
    }
    this.renderer?.dispose()
  }

  // ---------------------------------------------------------------- simulation
  step() {
    this.frame++
    for (const t of this.tanks) {
      t.prevPos.copy(t.pos)
      t.prevQ.copy(t.q)
    }
    if (!this.over) {
      this.timeLeft -= DT
      if (this.timeLeft <= 0) this.endRound()
    }
    const p = this.player
    const k = this.keys
    if (!this.over) {
      p.input.throttle =
        (k.has("KeyW") || k.has("ArrowUp") ? 1 : 0) -
        (k.has("KeyS") || k.has("ArrowDown") ? 1 : 0)
      p.input.turn =
        (k.has("KeyA") || k.has("ArrowLeft") ? 1 : 0) -
        (k.has("KeyD") || k.has("ArrowRight") ? 1 : 0)
      p.input.fire = this.mouseDown || k.has("KeyF") || k.has("ControlLeft")
      p.input.jump = k.has("Space")
      // keyboard aim fallback (Q/E turn the turret, Z/X tilt the barrel)
      if (k.has("KeyQ")) p.aimYaw += 0.035
      if (k.has("KeyE")) p.aimYaw -= 0.035
      if (k.has("KeyZ")) p.aimPitch = Math.min(0.55, p.aimPitch + 0.012)
      if (k.has("KeyX")) p.aimPitch = Math.max(-0.3, p.aimPitch - 0.012)

      // Casual camera & gun mode (goody.ls: vgunangs, hull alignment, autoaim)
      if (!this.proMode && !this.rcPawn) {
        const fwd = tmpV.set(0, 0, -1).applyQuaternion(p.q)
        const hullYaw = Math.atan2(-fwd.x, -fwd.z)
        const gunAngles: Partial<Record<WeaponId, number>> = {
          nook: 30 * (Math.PI / 180),
          mortar: 20 * (Math.PI / 180),
          rcrocket: 35 * (Math.PI / 180),
          rocket: 1 * (Math.PI / 180),
          guidedmissile: 1 * (Math.PI / 180),
          sonicgun: -1 * (Math.PI / 180),
        }
        const targetPitch = (p.weapon && gunAngles[p.weapon]) ?? -0.02
        p.aimPitch += (targetPitch - p.aimPitch) * 0.1

        if (p.input.throttle !== 0) {
          p.aimYaw += wrapAngle(hullYaw - p.aimYaw) * 0.12
        } else if (p.input.turn !== 0) {
          p.aimYaw += p.input.turn * 0.04
        }

        if (p.input.fire) {
          let bestTarget: Tank | null = null
          let bestDist = 4000
          const aimDir = tmpV.set(-Math.sin(p.aimYaw), 0, -Math.cos(p.aimYaw))
          for (const t of this.tanks) {
            if (t.team !== p.team && !t.dead && t.stealthT === 0) {
              const d = tmpV2.subVectors(t.pos, p.pos)
              const dist = d.length()
              if (dist < bestDist) {
                d.y = 0
                d.normalize()
                if (aimDir.angleTo(d) < 0.22) {
                  bestTarget = t
                  bestDist = dist
                }
              }
            }
          }
          if (bestTarget) {
            const toTarget = tmpV2.subVectors(bestTarget.pos, p.pos)
            const targetYaw = Math.atan2(-toTarget.x, -toTarget.z)
            p.aimYaw += wrapAngle(targetYaw - p.aimYaw) * 0.2
          }
        }
      }
    } else {
      p.input = { throttle: 0, turn: 0, fire: false, jump: false }
    }

    for (const t of this.tanks) {
      if (t.isRemote) {
        // Interpolate remote tank position smoothly
        t.pos.addScaledVector(t.vel, DT * 0.5)
        continue
      }
      if (t.dead) {
        if (--t.respawnT <= 0 && !this.over) this.respawn(t)
        continue
      }
      if (!t.isPlayer) this.think(t)
      this.physics(t)
      this.weapons(t)
      if (t.spawnProtect > 0) t.spawnProtect--
      if (t.speedT > 0) t.speedT--
      if (t.stealthT > 0) t.stealthT--
      if (t.superT > 0 && --t.superT === 0) {
        t.uber = 0
        if (t.isPlayer) this.audio.play("super", undefined, 0.6)
      }
    }

    // Authentic tank engine audio loop attached to each tank with 3D falloff & normalized volume
    for (const t of this.tanks) {
      const channel = `engine_${t.id}`
      if (t.dead || this.over) {
        this.audio.stopLoop(channel)
        continue
      }
      const dist = Math.hypot(
        t.pos.x - this.audio.listener.x,
        t.pos.y - this.audio.listener.y,
        t.pos.z - this.audio.listener.z,
      )
      const atten = t.isPlayer ? 1 : Math.max(0, 1 - dist / 3200) ** 1.8
      if (atten <= 0.01) {
        this.audio.stopLoop(channel)
        continue
      }
      const sp = Math.hypot(t.vel.x, t.vel.z)
      const isDriving = t.input.throttle !== 0
      const baseVol = 0.08 + Math.min(0.08, (sp / 820) * 0.06 + (isDriving ? 0.02 : 0))
      const pitch = 0.8 + Math.min(0.5, (sp / 820) * 0.35 + (isDriving ? 0.12 : 0))
      this.audio.loop(channel, "vloop", baseVol * atten, pitch)
    }

    // Broadcast local player state to P2P room every 3 frames (20 Hz)
    if (this.mp && this.frame % 3 === 0) {
      this.mp.send({
        subject: "where",
        sender: p.name,
        state: {
          name: p.name,
          team: p.team,
          pos: [p.pos.x, p.pos.y, p.pos.z],
          quat: [p.q.x, p.q.y, p.q.z, p.q.w],
          vel: [p.vel.x, p.vel.y, p.vel.z],
          turretYaw: p.aimYaw,
          gunPitch: p.aimPitch,
          weapon: p.weapon ?? "mgun",
          hp: p.dead ? 0 : p.health,
          score: p.score,
          superActive: p.superT > 0,
          stealthActive: p.stealthT > 0,
          thrustActive: p.speedT > 0,
        },
      })
    }

    this.collideTanks()
    this.stepRcPawn()
    this.stepProjectiles()
    this.stepPickups()
    if (this.frame % 16 === 0) this.stepCaps()
    this.stepEffects()
    if (this.hitMarker > 0) this.hitMarker--
    if (this.hurtT > 0 && --this.hurtT === 0) this.hurtDir = null
    if (this.frame % 4 === 0) this.emitHud()
  }

  stepRcPawn() {
    const rc = this.rcPawn
    if (!rc) return
    const p = this.player
    rc.life++
    rc.fuel--

    if (rc.kind === "rcbomb") {
      // Ground movement & physics adhering to terrain and ramps
      const n = new THREE.Vector3(0, 1, 0)
      const gh = this.groundAt(rc.pos.x, rc.pos.z, rc.pos.y, n)
      if (this.keys.has("KeyA") || this.keys.has("ArrowLeft")) rc.rot.z += 0.05
      if (this.keys.has("KeyD") || this.keys.has("ArrowRight")) rc.rot.z -= 0.05
      const isDriving = this.mouseDown || this.keys.has("KeyW") || this.keys.has("ArrowUp")
      const fwd = new THREE.Vector3(-Math.sin(rc.rot.z), 0, -Math.cos(rc.rot.z))

      const onFloor = rc.pos.y <= gh + 14
      if (onFloor) {
        rc.pos.y = gh + 8
        rc.vel.y = 0
        if (isDriving) {
          fwd.addScaledVector(n, -fwd.dot(n)).normalize()
          rc.vel.copy(fwd).multiplyScalar(rc.push * 26)
        } else {
          rc.vel.multiplyScalar(0.92)
        }
        const right = new THREE.Vector3().crossVectors(fwd, n).normalize()
        tmpM.makeBasis(right, n, fwd.clone().negate())
        rc.mesh.quaternion.setFromRotationMatrix(tmpM)
      } else {
        rc.vel.y -= GRAVITY * DT
        rc.mesh.rotation.y = rc.rot.z
      }
      rc.pos.addScaledVector(rc.vel, DT)
      if (rc.pos.y < gh + 8) {
        rc.pos.y = gh + 8
        rc.vel.y = 0
      }
      rc.mesh.position.copy(rc.pos)

      if (this.frame % 30 === 0)
        this.audio.play("rcbeep", rc.pos, 0.4)

      let hitEnemy = false
      for (const t of this.tanks) {
        if (!t.dead && t.team !== p.team && t.pos.distanceTo(rc.pos) < BSP * 1.2) {
          hitEnemy = true
          break
        }
      }

      const shouldDetonate =
        hitEnemy ||
        this.rightMouseDown ||
        (this.keys.has("ControlLeft") && rc.life > 60) ||
        rc.fuel <= 0 ||
        rc.life > rc.maxLife

      if (shouldDetonate) {
        this.explode(rc.pos.clone(), 20, p, "rcbomb")
        this.scene.remove(rc.mesh)
        disposeTree(rc.mesh)
        this.rcPawn = null
        p.weapon = null
        p.ammo = 0
        updateTankWeaponRig(p.rig, null)
      }
    } else if (rc.kind === "rcrocket") {
      // Air flight movement
      if (this.proMode) {
        if (this.mouseDown || this.keys.has("ControlLeft")) {
          rc.push = Math.min(30, rc.push * 1.02)
        } else {
          rc.push = Math.max(12, rc.push * 0.98)
        }
      } else {
        rc.push = 20
        if (this.keys.has("KeyA") || this.keys.has("ArrowLeft")) rc.rot.z += 0.04
        if (this.keys.has("KeyD") || this.keys.has("ArrowRight")) rc.rot.z -= 0.04
        if (this.keys.has("KeyW") || this.keys.has("ArrowUp")) rc.rot.x = Math.min(1.1, rc.rot.x + 0.03)
        if (this.keys.has("KeyS") || this.keys.has("ArrowDown")) rc.rot.x = Math.max(-1.1, rc.rot.x - 0.03)
      }
      const fwd = new THREE.Vector3(
        -Math.sin(rc.rot.z) * Math.cos(rc.rot.x),
        Math.sin(rc.rot.x),
        -Math.cos(rc.rot.z) * Math.cos(rc.rot.x),
      ).normalize()
      rc.vel.copy(fwd).multiplyScalar(rc.push * 25)
      rc.pos.addScaledVector(rc.vel, DT)
      rc.mesh.position.copy(rc.pos)
      rc.mesh.lookAt(rc.pos.clone().add(fwd))

      if (this.frame % 2 === 0)
        this.puff(rc.pos, 50, 30)

      const gh = terrainAt(this.level, rc.pos.x, rc.pos.z)
      const hitGround = rc.pos.y <= gh + 5

      let hitEnemy = false
      for (const t of this.tanks) {
        if (!t.dead && t.team !== p.team && t.pos.distanceTo(rc.pos) < BSP * 1.2) {
          hitEnemy = true
          break
        }
      }

      const shouldDetonate =
        hitGround ||
        hitEnemy ||
        this.rightMouseDown ||
        (this.keys.has("ControlLeft") && rc.life > 60) ||
        rc.fuel <= 0 ||
        rc.life > rc.maxLife

      if (shouldDetonate) {
        this.explode(rc.pos.clone(), 25, p, "rcrocket")
        this.scene.remove(rc.mesh)
        disposeTree(rc.mesh)
        this.rcPawn = null
        p.weapon = null
        p.ammo = 0
        updateTankWeaponRig(p.rig, null)
      }
    }
  }

  /** Terrain height, raised by any ramp, platform, or structure under (x, z). */
  groundAt(x: number, z: number, y: number, n: THREE.Vector3) {
    let h = terrainAt(this.level, x, z, n)
    if (this.colliders.length) {
      const startY = Math.max(y + 160, h + 80)
      this.raycaster.set(tmpV2.set(x, startY, z), tmpV.set(0, -1, 0))
      this.raycaster.far = Math.max(300, startY - h + 50)
      const hits = this.raycaster.intersectObjects(this.colliders, false)
      for (const hit of hits) {
        if (!hit.face) continue
        const norm = hit.face.normal.clone().transformDirection(hit.object.matrixWorld)
        // Upward-facing drivable surface (slope normal.y > 0.15, not vertical walls/ceilings)
        if (norm.y > 0.15 && hit.point.y > h) {
          // Driving step tolerance: climb smoothly up slopes up to +70 units from current position
          // or land on platforms if descending/airborne
          if (hit.point.y <= y + 70 || y >= hit.point.y - 15) {
            h = hit.point.y
            n.copy(norm)
            break
          }
        }
      }
    }
    return h
  }

  /** Arcade take on goody.movecar: surface-aligned drive, 0.99 velocity damping, reverse-steer, impulse jumps with flips. */
  physics(t: Tank) {
    const l = this.level
    const n = new THREE.Vector3()
    const h = this.groundAt(t.pos.x, t.pos.z, t.pos.y, n)
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(t.q)
    const dist = t.pos.y - (h + 5)
    const upright = up.dot(n)
    const wasAir = !t.onFloor
    t.onFloor = dist <= 6 && t.vel.dot(n) < 260 && upright > 0.35

    if (t.jumpCd > 0) t.jumpCd--
    const boost = t.speedT > 0 ? 2.2 : 1
    const maxSpeed = 820 * boost * (t.superT > 0 ? 1.15 : 1)

    if (t.onFloor) {
      if (wasAir && t.airFrames > 10) this.land(t)
      t.airFrames = 0
      t.pos.y = Math.max(t.pos.y, h + 5)
      const vn = t.vel.dot(n)
      if (vn < 0) t.vel.addScaledVector(n, -vn)
      const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(t.q)
      fwd.addScaledVector(n, -fwd.dot(n)).normalize()
      const right = new THREE.Vector3().crossVectors(fwd, n).normalize()
      tmpM.makeBasis(right, n, fwd.clone().negate())
      tmpQ.setFromRotationMatrix(tmpM)
      t.q.slerp(tmpQ, 0.3)
      t.angVel.set(0, 0, 0)

      const along = t.vel.dot(fwd)
      const thr = t.input.throttle
      if (
        thr !== 0 &&
        (Math.abs(along) < maxSpeed || Math.sign(along) !== Math.sign(thr))
      ) {
        const braking =
          Math.sign(along) !== Math.sign(thr) && Math.abs(along) > 30
        t.vel.addScaledVector(
          fwd,
          thr * 1700 * boost * DT * (braking ? 1.6 : 1),
        )
      }
      // vturn reverses when driving backwards and is zero when stationary
      const dir = along < -20 ? -1 : along > 20 ? 1 : 0
      const steer =
        t.input.turn * dir * 2.2 * Math.min(1, Math.abs(along) / 220 + 0.25)
      if (steer) t.q.premultiply(tmpQ.setFromAxisAngle(n, steer * DT))
      const lat = tmpV2
        .copy(t.vel)
        .addScaledVector(fwd, -along)
        .addScaledVector(n, -t.vel.dot(n))
      t.vel.addScaledVector(
        lat,
        -(1 - Math.exp(-DT * (5 + l.def.friction * 30))),
      )
      t.vel.multiplyScalar(thr === 0 ? 0.985 : 0.995)
      t.vel.y -= GRAVITY * DT * 0.5
      // goody.jump: impulse along the tank's up axis; forward+jump is a back flip, sideways a roll
      if (t.input.jump && t.jumpCd === 0) {
        const pow = t.superT > 0 ? 1.35 : 1
        t.vel.addScaledVector(n, 1050 * pow)
        if (thr !== 0) {
          t.angVel.copy(right).multiplyScalar(thr * 6.6 * pow)
          t.trickKey = thr > 0 ? "Back" : "Front"
        } else if (t.input.turn !== 0) {
          t.angVel.copy(fwd).multiplyScalar(t.input.turn * 6.6 * pow)
          t.trickKey = t.input.turn > 0 ? "Backside" : "Frontside"
        } else {
          t.trickKey = ""
        }
        t.trickAngle = 0
        t.jumpCd = 60
        t.onFloor = false
        this.audio.play("airblast", t.pos, 0.45, 0.9 + Math.random() * 0.2)
      }
    } else {
      t.airFrames++
      t.vel.y -= GRAVITY * DT
      const w = t.angVel.length()
      if (w > 0.0001) {
        t.q.premultiply(
          tmpQ.setFromAxisAngle(tmpV2.copy(t.angVel).divideScalar(w), w * DT),
        )
        t.trickAngle += THREE.MathUtils.radToDeg(w * DT)
      }
      t.angVel.multiplyScalar(0.997)
      // upside-down on the ground: hop and right itself
      if (dist <= 8 && upright <= 0.35) {
        t.pos.y = h + 8
        const axis = new THREE.Vector3().crossVectors(up, n)
        if (axis.lengthSq() < 1e-4) axis.set(1, 0, 0).applyQuaternion(t.q)
        t.angVel.copy(axis.normalize()).multiplyScalar(5)
        t.vel.y = Math.max(t.vel.y, 320)
        t.vel.multiplyScalar(0.92)
        if (this.frame % 30 === 0) this.audio.play("crash", t.pos, 0.4)
        t.trickAngle = 0
      }
    }
    t.pos.addScaledVector(t.vel, DT)

    // Horizontal obstacle bumper collision against true vertical walls only (not ramps)
    if (this.colliders.length && t.vel.lengthSq() > 100) {
      const vNorm = tmpV.copy(t.vel).normalize()
      this.raycaster.set(tmpV2.copy(t.pos).add(new THREE.Vector3(0, 15, 0)), vNorm)
      this.raycaster.far = BSP * 1.2
      const hit = this.raycaster.intersectObjects(this.colliders, false)[0]
      if (hit && hit.face) {
        const wallN = hit.face.normal.clone().transformDirection(hit.object.matrixWorld)
        if (Math.abs(wallN.y) < 0.25) {
          // Push tank away from vertical wall
          const overlap = this.raycaster.far - hit.distance
          t.pos.addScaledVector(wallN, overlap)
          const dot = t.vel.dot(wallN)
          if (dot < 0) t.vel.addScaledVector(wallN, -dot * 1.2)
        }
      }
    }

    const ground = terrainAt(l, t.pos.x, t.pos.z)
    if (t.pos.y < ground + 2) {
      t.pos.y = ground + 2
      if (t.vel.y < 0) t.vel.y = 0
    }
    const lim = l.half * 0.985
    for (const ax of ["x", "z"] as const) {
      if (Math.abs(t.pos[ax]) > lim) {
        t.pos[ax] = Math.sign(t.pos[ax]) * lim
        t.vel[ax] *= -0.4
      }
    }
  }

  /** calctrick/whattrick: rotation/180 -> tier; uber += tier^2 * 3; uber > 100 -> supercharge for 600 frames. */
  land(t: Tank) {
    const halfTurns = Math.floor(t.trickAngle / 180 + 0.25)
    const tier =
      halfTurns >= 8
        ? 5
        : halfTurns >= 6
          ? 4
          : halfTurns >= 4
            ? 3
            : halfTurns >= 2
              ? 2
              : halfTurns >= 1
                ? 1
                : 0
    const names = ["", "", "flip", "double flip", "triple flip", "quad flip"]
    if (t.uber > 100 && t.superT === 0) {
      t.superT = 600
      this.audio.play("powerup", t.pos, 0.8)
      if (t.isPlayer) this.popup("SUPERCHARGED", "trick")
      this.pushFeed(`${t.name} is supercharged`, t.team)
    } else if (tier > 0) {
      if (t.superT === 0) t.uber += tier * tier * 3
      if (names[tier] && t.isPlayer)
        this.popup(`${t.trickKey} ${names[tier]}`.trim(), "trick")
    }
    t.trickAngle = 0
    this.audio.play("crash", t.pos, 0.18, 1.3)
  }

  collideTanks() {
    const live = this.tanks.filter((t) => !t.dead)
    for (let i = 0; i < live.length; i++) {
      for (let j = i + 1; j < live.length; j++) {
        const a = live[i],
          b = live[j]
        const d = tmpV.subVectors(b.pos, a.pos)
        const len = d.length()
        const min = BSP * 2.1
        if (len > 0.01 && len < min) {
          d.divideScalar(len)
          const push = (min - len) / 2
          a.pos.addScaledVector(d, -push)
          b.pos.addScaledVector(d, push)
          const rel = tmpV2.subVectors(b.vel, a.vel).dot(d)
          if (rel < 0) {
            a.vel.addScaledVector(d, rel * 0.8)
            b.vel.addScaledVector(d, -rel * 0.8)
            if (rel < -500) this.audio.play("crash", a.pos, 0.5)
          }
        }
      }
    }
  }

  // ---------------------------------------------------------------- AI
  think(t: Tank) {
    const d = DIFF[this.opts.difficulty]
    const ai = t.ai
    if (this.over) {
      t.input = { throttle: 0, turn: 0, fire: false, jump: false }
      return
    }
    if (--ai.think <= 0) {
      ai.think = 20 + Math.random() * 20
      let best: Tank | null = null
      let bd = d.aggro
      for (const o of this.tanks) {
        if (o.team === t.team || o.dead) continue
        const dist = o.pos.distanceTo(t.pos)
        if (dist < (o.stealthT > 0 ? 450 : bd) && dist < bd) {
          bd = dist
          best = o
        }
      }
      if (best !== ai.target) ai.reaction = d.reaction
      ai.target = best
      // goal: a contested capture point, an upgrade pickup if poorly armed, otherwise the enemy
      const want = t.team === "blue" ? 255 : 0
      let goal: THREE.Vector3 | null = null
      let gd = Infinity
      for (const c of this.caps) {
        const need = Math.abs(want - c.v)
        if (need < 24) continue
        const dist = c.pos.distanceTo(t.pos) - need * 6
        if (dist < gd) {
          gd = dist
          goal = c.pos
        }
      }
      if (t.weapon === "mgun" || !t.weapon || t.health < 45 || !goal) {
        for (const p of this.pickups) {
          if (
            p.respawn > 0 ||
            p.weapon === "speed" ||
            p.weapon === "thrusters" ||
            p.weapon === "stealth"
          )
            continue
          if (p.weapon === "health" && t.health > 60) continue
          const dist =
            p.pos.distanceTo(t.pos) * (p.weapon === "health" ? 0.6 : 1)
          if (dist < (goal ? 2200 : 1e9) && dist < gd) {
            gd = dist
            goal = p.pos
          }
        }
      }
      if (ai.target && ai.target.pos.distanceTo(t.pos) < 1400)
        goal = ai.target.pos
      ai.goal = goal ?? ai.target?.pos ?? null
      if (Math.random() < 0.08) ai.strafe *= -1
    }

    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(t.q)
    const heading = Math.atan2(-fwd.x, -fwd.z)
    if (ai.goal) {
      const to = new THREE.Vector3().subVectors(ai.goal, t.pos)
      const dist = Math.hypot(to.x, to.z)
      let want = Math.atan2(-to.x, -to.z)
      if (ai.target && ai.goal === ai.target.pos && dist < 900)
        want += ai.strafe * 0.9 // circle-strafe
      const diff = wrapAngle(want - heading)
      t.input.turn = Math.abs(diff) > 0.08 ? Math.sign(diff) : 0
      const atCap =
        this.caps.some((c) => c.pos === ai.goal) && dist < CAPTURE_RADIUS * 0.6
      t.input.throttle = atCap
        ? this.frame % 90 < 45
          ? 0.4
          : -0.4
        : Math.abs(diff) > 2.2 && dist < 700
          ? -1
          : 1
    } else {
      t.input.turn = Math.sin(this.frame * 0.01 + t.id) > 0.6 ? 1 : 0
      t.input.throttle = 1
    }
    const sp = Math.hypot(t.vel.x, t.vel.z)
    ai.stuck =
      t.input.throttle !== 0 && sp < 120
        ? ai.stuck + 1
        : Math.max(0, ai.stuck - 2)
    t.input.jump = ai.stuck > 70 || (t.onFloor && Math.random() < 0.0025)
    if (ai.stuck > 70) {
      t.input.throttle = -1
      if (ai.stuck > 140) ai.stuck = 0
    }

    const tgt = ai.target
    t.input.fire = false
    if (tgt && !tgt.dead) {
      const w = WEAPONS[t.weapon ?? "mgun"]
      const aimAt = tgt.pos.clone().add(new THREE.Vector3(0, 30, 0))
      const dist = aimAt.distanceTo(t.pos)
      if (w.speed) aimAt.addScaledVector(tgt.vel, (dist / w.speed) * 0.8)
      const to = aimAt.sub(t.pos.clone().add(new THREE.Vector3(0, 45, 0)))
      const yaw = Math.atan2(-to.x, -to.z)
      let pitch = Math.atan2(to.y, Math.hypot(to.x, to.z))
      if (w.kind === "lob" && w.speed) {
        const v = w.speed,
          g = GRAVITY * 0.7,
          x = Math.hypot(to.x, to.z),
          y = to.y
        const disc = v ** 4 - g * (g * x * x + 2 * y * v * v)
        pitch = disc > 0 ? Math.atan((v * v - Math.sqrt(disc)) / (g * x)) : 0.6
      }
      t.aimYaw += wrapAngle(yaw - t.aimYaw) * 0.12
      t.aimPitch +=
        (THREE.MathUtils.clamp(pitch, -0.3, 0.9) - t.aimPitch) * 0.12
      if (ai.reaction > 0) ai.reaction--
      const range =
        w.kind === "hitscan"
          ? 2600
          : w.kind === "sonic"
            ? 700
            : w.kind === "mine"
              ? 500
              : w.kind === "airstrike"
                ? 3500
                : 3800
      const aligned = Math.abs(wrapAngle(yaw - t.aimYaw)) < 0.12
      const useful =
        !["heal", "boost", "cloak"].includes(w.kind) ||
        (w.kind === "heal" ? t.health < 70 : true)
      t.input.fire = ai.reaction <= 0 && dist < range && aligned && useful
    } else {
      t.aimYaw += wrapAngle(heading - t.aimYaw) * 0.05
      t.aimPitch += (0.05 - t.aimPitch) * 0.05
      if (t.weapon === "health" && t.health < 70) t.input.fire = true
    }
  }

  // ---------------------------------------------------------------- weapons
  muzzle(t: Tank) {
    t.rig.root.position.copy(t.pos)
    t.rig.root.quaternion.copy(t.q)
    t.rig.root.updateMatrixWorld(true)
    const pos = t.rig.muzzle.getWorldPosition(new THREE.Vector3())
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(
      t.rig.barrel.getWorldQuaternion(new THREE.Quaternion()),
    )
    return { pos, dir }
  }

  /** Direction from the muzzle to whatever is under the screen-centre crosshair. */
  crosshairDir(from: THREE.Vector3) {
    const camDir = this.camera.getWorldDirection(new THREE.Vector3())
    const origin = this.camera.position
    let best = 7000
    for (const o of this.tanks) {
      if (o.isPlayer || o.dead) continue
      const c = new THREE.Vector3()
        .copy(o.pos)
        .add(new THREE.Vector3(0, 28, 0))
        .sub(origin)
      const along = c.dot(camDir)
      if (along < 300 || along > best) continue
      if (c.addScaledVector(camDir, -along).length() < BSP) best = along
    }
    for (let s = 300; s < best; s += 50) {
      const p = origin.clone().addScaledVector(camDir, s)
      if (p.y < terrainAt(this.level, p.x, p.z)) {
        best = s
        break
      }
    }
    return origin.clone().addScaledVector(camDir, best).sub(from).normalize()
  }

  weapons(t: Tank) {
    if (t.cooldown > 0) {
      t.cooldown--
      return
    }
    if (!t.input.fire || !t.weapon || this.over) return
    const w = WEAPONS[t.weapon]
    const diff = DIFF[this.opts.difficulty]
    t.cooldown = Math.round(w.cooldown * (t.isPlayer ? 1 : diff.fireScale))
    const { pos, dir: barrelDir } = this.muzzle(t)
    const dir = t.isPlayer ? this.crosshairDir(pos) : barrelDir
    const spread = t.isPlayer ? 0.012 : diff.spread

    if (t.isPlayer && this.mp) {
      this.mp.send({
        subject: "fire",
        sender: t.name,
        team: t.team,
        weapon: w.id,
        pid: `${t.name}_${this.frame}`,
        pos: [pos.x, pos.y, pos.z],
        dir: [dir.x, dir.y, dir.z],
      })
    }

    switch (w.kind) {
      case "hitscan":
        dir
          .add(
            new THREE.Vector3(
              Math.random() - 0.5,
              Math.random() - 0.5,
              Math.random() - 0.5,
            ).multiplyScalar(spread),
          )
          .normalize()
        this.hitscan(t, pos, dir, w.id)
        t.vel.addScaledVector(dir, w.id === "lasergun" ? -6 : -14) // bullettest recoil
        t.ammo--
        break
      case "shell":
        this.spawnProjectile(
          t,
          "shell",
          w.id,
          pos,
          dir.multiplyScalar(w.speed!),
          0.25,
          120,
        )
        this.audio.play("bgun", pos, 0.7)
        this.flash(pos, 1.4)
        t.ammo--
        break
      case "rocket":
        this.spawnProjectile(
          t,
          "rocket",
          w.id,
          pos,
          dir.multiplyScalar(w.speed!),
          0,
          200,
        )
        this.audio.play("rocket", pos, 0.7)
        t.ammo--
        break
      case "lob":
        this.spawnProjectile(
          t,
          "lob",
          w.id,
          pos,
          dir.multiplyScalar(w.speed!),
          0.7,
          400,
        )
        this.audio.play(w.id === "nook" ? "nook" : "mortar", pos, 0.7)
        t.ammo--
        break
      case "homing": {
        const target = this.lockTarget(t, pos, dir)
        this.spawnProjectile(
          t,
          "homing",
          w.id,
          pos,
          dir.multiplyScalar(w.speed!),
          0,
          300,
          target,
        )
        this.audio.play("offrock", pos, 0.7)
        t.ammo--
        break
      }
      case "mine": {
        if (t.mines.length >= (w.id === "remotemine" ? 3 : 5))
          this.removeProjectile(t.mines[0])
        const back = new THREE.Vector3(0, 0, 1)
          .applyQuaternion(t.q)
          .multiplyScalar(80)
          .add(t.pos)
        back.y = terrainAt(this.level, back.x, back.z) + 8
        const m = this.spawnProjectile(
          t,
          "mine",
          w.id,
          back,
          new THREE.Vector3(),
          0,
          3600,
        )
        m.armed = 60
        t.mines.push(m)
        this.audio.play("minedrop", back, 0.6)
        t.ammo--
        break
      }
      case "heal": {
        const back = new THREE.Vector3(0, 0, 1)
          .applyQuaternion(t.q)
          .multiplyScalar(80)
          .add(t.pos)
        back.y = terrainAt(this.level, back.x, back.z) + 8
        const m = this.spawnProjectile(
          t,
          "mine",
          w.id,
          back,
          new THREE.Vector3(),
          0,
          3600,
        )
        m.armed = 50
        t.mines.push(m)
        this.audio.play("minedrop", back, 0.6)
        t.ammo--
        break
      }
      case "sonic":
        this.explode(pos.clone().addScaledVector(dir, 320), w.power, t, w.id)
        this.audio.play("sonicblast", pos, 0.8)
        t.ammo--
        break
      case "airstrike":
        this.airstrike(t, this.aimPoint(pos, dir, 7000))
        t.ammo--
        break
      case "boost":
        t.speedT = Math.min(600, t.speedT + 20)
        t.ammo = Math.max(0, t.ammo - 1)
        if (t.isPlayer && this.frame % 30 === 0)
          this.audio.play("speed", t.pos, 0.6)
        break
      case "cloak":
        t.stealthT = Math.min(720, t.stealthT + 20)
        t.ammo = Math.max(0, t.ammo - 1)
        if (t.isPlayer && this.frame % 40 === 0)
          this.audio.play("stealth", t.pos, 0.6)
        break
      case "thrusters": {
        t.ammo = Math.max(0, t.ammo - 1)
        const upVec = new THREE.Vector3(0, 1, 0).applyQuaternion(t.q)
        t.vel.addScaledVector(upVec, 45)
        t.onFloor = false
        if (t.isPlayer) {
          t.rig.thrustMesh.visible = true
          if (this.frame % 20 === 0)
            this.audio.play("jetengine", t.pos, 0.7)
        }
        break
      }
      case "rcbomb": {
        const spawnPos = pos.clone().addScaledVector(dir, 80)
        spawnPos.y = terrainAt(this.level, spawnPos.x, spawnPos.z) + 10
        if (t.isPlayer) {
          if (!this.rcPawn) {
            const obj = buildProjectileMesh("rcbomb", "rcbomb", t.team)
            obj.position.copy(spawnPos)
            this.scene.add(obj)
            this.rcPawn = {
              kind: "rcbomb",
              pos: spawnPos,
              vel: new THREE.Vector3(-Math.sin(t.aimYaw), 0, -Math.cos(t.aimYaw)).multiplyScalar(350),
              rot: new THREE.Vector3(0, 0, t.aimYaw),
              mesh: obj,
              life: 0,
              maxLife: 1000,
              fuel: 1000,
              push: 20,
            }
            this.audio.play("rcbombrelease", spawnPos, 0.8)
            t.cooldown = 30
          }
        } else {
          // Bot fires rcbomb: autonomous bomb rolling forward
          this.spawnProjectile(t, "bomb", "rcbomb", spawnPos, dir.multiplyScalar(450), 0.5, 300)
          this.audio.play("rcbombrelease", spawnPos, 0.8)
          t.cooldown = 60
          t.ammo--
        }
        break
      }
      case "rcrocket": {
        const spawnPos = pos.clone().addScaledVector(dir, 120)
        if (t.isPlayer) {
          if (!this.rcPawn) {
            const obj = buildProjectileMesh("rcrocket", "rcrocket", t.team)
            obj.position.copy(spawnPos)
            this.scene.add(obj)
            this.rcPawn = {
              kind: "rcrocket",
              pos: spawnPos,
              vel: dir.clone().multiplyScalar(500),
              rot: new THREE.Vector3(0, 0, t.aimYaw),
              mesh: obj,
              life: 0,
              maxLife: 1200,
              fuel: 1200,
              push: 20,
            }
            this.audio.play("offrock", spawnPos, 0.8)
            t.cooldown = 30
          }
        } else {
          // Bot fires rcrocket: autonomous rocket towards target
          const target = this.lockTarget(t, pos, dir)
          this.spawnProjectile(t, "rocket", "rcrocket", spawnPos, dir.multiplyScalar(600), 0, 300, target)
          this.audio.play("offrock", spawnPos, 0.8)
          t.cooldown = 60
          t.ammo--
        }
        break
      }
    }

    if (t.ammo <= 0) {
      // Unarmed state (goody.pweapon = #none, reload(me, "remove"))
      t.weapon = null
      t.ammo = 0
    }
    updateTankWeaponRig(t.rig, t.weapon)
  }

  hitscan(t: Tank, from: THREE.Vector3, dir: THREE.Vector3, weapon: WeaponId) {
    const w = WEAPONS[weapon]
    let best = 8000
    let victim: Tank | null = null
    for (const o of this.tanks) {
      if (o === t || o.dead) continue
      const c = new THREE.Vector3()
        .copy(o.pos)
        .add(new THREE.Vector3(0, 28, 0))
        .sub(from)
      const along = c.dot(dir)
      if (along < 0 || along > best) continue
      if (c.addScaledVector(dir, -along).length() < BSP * 0.95) {
        best = along
        victim = o
      }
    }
    for (let s = 40; s < best; s += 45) {
      const p = tmpV.copy(from).addScaledVector(dir, s)
      if (p.y < terrainAt(this.level, p.x, p.z)) {
        best = s
        victim = null
        break
      }
    }
    const end = from.clone().addScaledVector(dir, best)
    if (victim) {
      this.damage(victim, w.power, t, weapon)
      this.spark(end, "#ff4a2a")
    } else if (best < 8000) {
      this.spark(end, "#ffe7a0")
    }
    this.tracer(
      from,
      end,
      weapon === "lasergun" ? "#ff3df5" : "#ffd36a",
      weapon === "lasergun" ? 5 : 2.5,
    )
    this.flash(from, weapon === "lasergun" ? 0.85 : 1, weapon === "lasergun")
    const isLaser = weapon === "lasergun"
    this.audio.play(
      isLaser ? "laser" : "gunfire",
      from,
      isLaser ? 0.5 : 0.6,
      0.96 + Math.random() * 0.08,
      `gun_${t.name}`,
    )
  }

  lockTarget(t: Tank, pos: THREE.Vector3, dir: THREE.Vector3) {
    let best: Tank | null = null
    let bestDot = 0.86
    for (const o of this.tanks) {
      if (o.team === t.team || o.dead || o.stealthT > 0) continue
      const d = tmpV.subVectors(o.pos, pos).normalize().dot(dir)
      if (d > bestDot) {
        bestDot = d
        best = o
      }
    }
    if (best && t.isPlayer) this.popup(`LOCKED: ${best.name}`, "info")
    return best
  }

  aimPoint(from: THREE.Vector3, dir: THREE.Vector3, max: number) {
    for (let s = 60; s < max; s += 60) {
      const p = from.clone().addScaledVector(dir, s)
      if (p.y < terrainAt(this.level, p.x, p.z)) return p
    }
    const p = from.clone().addScaledVector(dir, max)
    p.y = terrainAt(this.level, p.x, p.z)
    return p
  }

  /** airstrike.ls: a target marker, then bombs fall from the airship. */
  airstrike(t: Tank, target: THREE.Vector3) {
    const marker = new THREE.Mesh(
      new THREE.CircleGeometry(260, 32),
      new THREE.MeshBasicMaterial({
        map: tex(`airstrike_target_${t.team}`),
        transparent: true,
        depthWrite: false,
      }),
    )
    marker.rotation.x = -Math.PI / 2
    marker.position.copy(target).add(new THREE.Vector3(0, 12, 0))
    this.scene.add(marker)
    this.effects.push({
      obj: marker,
      life: 150,
      max: 150,
      update: (e) => (e.obj.rotation.z += 0.05),
    })
    this.audio.play("c1", target, 0.6)
    if (t.isPlayer) this.popup("AIRSTRIKE INBOUND", "info")
    for (let i = 0; i < 6; i++) {
      const off = new THREE.Vector3(
        (Math.random() - 0.5) * 700,
        2600 + i * 180,
        (Math.random() - 0.5) * 700,
      )
      const p = this.spawnProjectile(
        t,
        "bomb",
        "airstrike",
        target.clone().add(off),
        new THREE.Vector3(0, -600, 0),
        1,
        600,
      )
      p.armed = 70 + i * 10
    }
  }

  spawnProjectile(
    t: Tank,
    kind: Projectile["kind"],
    weapon: WeaponId,
    pos: THREE.Vector3,
    vel: THREE.Vector3,
    gravity: number,
    life: number,
    target?: Tank | null,
  ) {
    const obj = buildProjectileMesh(kind, weapon, t.team)
    obj.position.copy(pos)
    this.scene.add(obj)
    const p: Projectile = {
      kind,
      weapon,
      owner: t,
      pos: pos.clone(),
      vel: vel.clone(),
      life,
      obj,
      target,
      gravity,
      trail: 0,
    }
    this.projectiles.push(p)
    return p
  }

  stepProjectiles() {
    for (const p of [...this.projectiles]) {
      if (!this.projectiles.includes(p)) continue
      p.life--
      if (p.weapon === "health") {
        if (p.armed! > 0) p.armed!--
        else {
          for (const o of this.tanks) {
            if (o.dead) continue
            if (o.pos.distanceTo(p.pos) < BSP * 1.6) {
              o.health = MAX_HEALTH
              this.audio.play("pickup", p.pos, 0.8)
              if (o.isPlayer) this.popup("REPAIR PACK (+FULL)", "info")
              this.removeProjectile(p)
              break
            }
          }
        }
        if (p.life <= 0 && this.projectiles.includes(p))
          this.removeProjectile(p)
        continue
      }
      if (p.kind === "mine") {
        if (p.armed! > 0) p.armed!--
        else {
          if (
            p.weapon === "remotemine" &&
            p.owner.isPlayer &&
            (this.rightMouseDown || this.keys.has("KeyE") || this.keys.has("ControlLeft"))
          ) {
            this.explode(p.pos, WEAPONS[p.weapon].power, p.owner, p.weapon, p)
            continue
          }
          if (p.weapon === "proximitymine") {
            for (const o of this.tanks) {
              if (o.dead || o.team === p.owner.team) continue
              if (o.pos.distanceTo(p.pos) < 190) {
                this.explode(p.pos, WEAPONS[p.weapon].power, p.owner, p.weapon, p)
                break
              }
            }
          }
        }
        if (p.life <= 0 && this.projectiles.includes(p))
          this.removeProjectile(p)
        continue
      }
      if (p.kind === "bomb" && p.armed! > 0) {
        if (--p.armed! === 0) {
          p.obj.visible = true
          this.audio.play("c2", p.pos, 0.3)
        }
        continue
      }
      if (p.kind === "homing" && p.target && !p.target.dead) {
        const want = tmpV
          .copy(p.target.pos)
          .add(tmpV2.set(0, 30, 0))
          .sub(p.pos)
          .normalize()
          .multiplyScalar(p.vel.length())
        p.vel.lerp(want, 0.06)
      }
      p.vel.y -= GRAVITY * p.gravity * DT
      p.pos.addScaledVector(p.vel, DT)
      p.obj.position.copy(p.pos)
      if (p.vel.lengthSq() > 1) p.obj.lookAt(tmpV.copy(p.pos).sub(p.vel))
      if (
        (p.kind === "rocket" ||
          p.kind === "homing" ||
          (p.kind === "lob" && p.weapon === "nook")) &&
        ++p.trail % 2 === 0
      )
        this.puff(p.pos, 60, 40)

      let hit =
        p.life <= 0 || p.pos.y <= terrainAt(this.level, p.pos.x, p.pos.z) + 4
      if (
        !hit &&
        (Math.abs(p.pos.x) > this.level.half ||
          Math.abs(p.pos.z) > this.level.half)
      )
        hit = true

      // Obstacle collision against props/spawns/caps/brick wall
      if (!hit && this.colliders.length && p.vel.lengthSq() > 1) {
        this.raycaster.set(p.pos, tmpV.copy(p.vel).normalize())
        this.raycaster.far = Math.max(25, p.vel.length() * DT)
        const obsHit = this.raycaster.intersectObjects(this.colliders, false)[0]
        if (obsHit) hit = true
      }

      if (!hit) {
        for (const o of this.tanks) {
          if (o.dead || o === p.owner) continue
          if (
            tmpV
              .copy(o.pos)
              .add(tmpV2.set(0, 28, 0))
              .distanceTo(p.pos) <
            BSP + 8
          ) {
            hit = true
            break
          }
        }
      }
      if (hit)
        this.explode(
          p.pos.clone(),
          WEAPONS[p.weapon].power,
          p.owner,
          p.weapon,
          p,
        )
    }
  }

  removeProjectile(p: Projectile) {
    const i = this.projectiles.indexOf(p)
    if (i < 0) return
    this.projectiles.splice(i, 1)
    this.scene.remove(p.obj)
    disposeTree(p.obj)
    const m = p.owner.mines.indexOf(p)
    if (m >= 0) p.owner.mines.splice(m, 1)
  }

  /** bangs.ls: zone = power*50, distrat = (zone - d)/zone, force = distrat*power*200, damage = force*0.02. */
  explode(
    pos: THREE.Vector3,
    power: number,
    owner: Tank,
    weapon: WeaponId,
    proj?: Projectile,
  ) {
    if (proj) this.removeProjectile(proj)
    const zone = power * 50
    for (const o of this.tanks) {
      if (o.dead) continue
      const centre = new THREE.Vector3()
        .copy(o.pos)
        .add(new THREE.Vector3(0, 25, 0))
      const mag = centre.distanceTo(pos)
      if (mag >= zone) continue
      const distrat = (zone - mag) / zone
      const force = distrat * power * 200
      if (o.team !== owner.team || o === owner || weapon === "sonicgun") {
        const delta = centre
          .sub(pos.clone().add(new THREE.Vector3(0, -5, 0)))
          .normalize()
        const push = Math.min(
          2400,
          force * (weapon === "sonicgun" ? 7 : 1) * 0.32,
        )
        o.vel.addScaledVector(delta, push)
        o.vel.y += push * 0.35
        o.angVel.add(
          new THREE.Vector3(
            Math.random() - 0.5,
            0,
            Math.random() - 0.5,
          ).multiplyScalar(push * 0.004),
        )
        if (push > 200) o.onFloor = false
      }
      this.damage(o, Math.floor(force * 0.02), owner, weapon)
    }
    const name =
      weapon === "nook"
        ? "bangnook"
        : weapon === "proximitymine" || weapon === "remotemine"
          ? "bangmine"
          : weapon === "bgun"
            ? "bangbgun"
            : weapon === "rocketx4"
              ? "bangbang"
              : weapon === "mortar" || weapon === "airstrike"
                ? "bangairstrike"
                : "bangrocket"
    this.bang(pos, name, zone * (weapon === "nook" ? 0.9 : 0.75))
    const snd =
      weapon === "nook"
        ? "nook"
        : weapon === "bgun"
          ? "bgunbang"
          : weapon === "mortar"
            ? "bangmortar"
            : weapon === "proximitymine" || weapon === "remotemine"
              ? "reboom1"
              : "bangrocket"
    this.audio.play(snd, pos, weapon === "nook" ? 1 : 0.8)
    const d = pos.distanceTo(this.player.pos)
    this.shake = Math.max(
      this.shake,
      Math.max(0, 1 - d / (zone * 3)) * (power / 12),
    )
  }

  /** goody.hurt: only enemies or yourself can hurt you; supercharge and spawn protection block damage. */
  damage(o: Tank, amount: number, by: Tank, weapon: WeaponId) {
    if (amount <= 0 || o.dead || this.over) return
    if (o.team === by.team && o !== by) return
    if (o.superT > 0 || o.spawnProtect > 0) return
    o.uber = Math.max(0, o.uber - 0.1 * amount)
    o.health -= amount
    if (by !== o) {
      const pts = by.superT > 0 ? amount * 2 : amount // scorehurt doubles while supercharged
      by.score += pts
      if (by.isPlayer) {
        this.hitMarker = 8
        this.popup(`*${pts}*`, "damage")
      }
    }
    if (o.isPlayer) {
      const to = tmpV.subVectors(by.pos, o.pos)
      this.hurtDir = Math.atan2(-to.x, -to.z) - o.aimYaw
      this.hurtT = 50
      this.audio.play("crash", undefined, 0.35)
    }
    if (o.health < 0) this.kill(o, by, weapon)
  }

  kill(o: Tank, by: Tank, weapon: WeaponId) {
    o.dead = true
    o.deaths++
    o.score += DEATH_SCORE
    o.respawnT = 150
    o.rig.root.visible = false
    for (const m of [...o.mines]) this.removeProjectile(m)
    if (by !== o) {
      by.score += KILL_SCORE
      by.kills++
    }
    const wDef = WEAPONS[weapon]
    if (by === o) {
      this.pushFeed({
        victim: {
          name: o.name,
          team: o.team,
          isPlayer: o.isPlayer,
        },
        weapon,
        weaponIcon: wDef?.icon ?? 1,
        weaponVerb: "self-destructed",
      })
    } else {
      this.pushFeed({
        killer: {
          name: by.name,
          team: by.team,
          isPlayer: by.isPlayer,
        },
        victim: {
          name: o.name,
          team: o.team,
          isPlayer: o.isPlayer,
        },
        weapon,
        weaponIcon: wDef?.icon ?? 1,
        weaponVerb: wDef?.verb ?? "destroys",
      })
    }
    this.bang(o.pos.clone().add(new THREE.Vector3(0, 40, 0)), "bangdead", 900)
    this.audio.play("death", o.pos, 1)
    this.wreck(o)
  }

  /** porkchop.ls: 9 original W3D debris pieces (p1..p9) tumble away with smoke trails. */
  wreck(o: Tank) {
    for (let i = 1; i <= 9; i++) {
      const piece = buildDebrisPiece(i)
      piece.position.copy(o.pos).add(new THREE.Vector3(0, 24, 0))
      piece.quaternion.copy(o.q)
      this.scene.add(piece)
      const v = o.vel
        .clone()
        .add(
          new THREE.Vector3(
            (Math.random() - 0.5) * 650,
            550 + Math.random() * 550,
            (Math.random() - 0.5) * 650,
          ),
        )
      const spin = new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8,
      )
      this.effects.push({
        obj: piece,
        life: 160,
        max: 160,
        keepGeometry: true,
        update: (e) => {
          v.y -= GRAVITY * DT
          e.obj.position.addScaledVector(v, DT)
          const g = terrainAt(this.level, e.obj.position.x, e.obj.position.z)
          if (e.obj.position.y < g) {
            e.obj.position.y = g
            v.multiplyScalar(0.4)
            v.y = Math.abs(v.y) * 0.3
            spin.multiplyScalar(0.5)
          }
          e.obj.rotation.x += spin.x * DT
          e.obj.rotation.y += spin.y * DT
          e.obj.rotation.z += spin.z * DT
          if (i <= 3 && this.frame % 6 === 0)
            this.puff(e.obj.position, 110, 75, "#333333")
        },
      })
    }
  }

  stepPickups() {
    for (const p of this.pickups) {
      if (p.respawn > 0) {
        if (--p.respawn === 0) p.obj.visible = true
        continue
      }
      p.obj.rotation.y += 0.03
      p.obj.position.y =
        p.pos.y + 20 + Math.sin(this.frame * 0.05 + p.pos.x) * 10
      for (const t of this.tanks) {
        if (t.dead || t.pos.distanceTo(p.pos) > 120) continue
        const w = WEAPONS[p.weapon]
        t.weapon = w.id
        t.ammo = w.ammo
        t.cooldown = 10
        updateTankWeaponRig(t.rig, t.weapon)
        if (t.isPlayer) {
          this.popup(w.label.toUpperCase(), "info")
          this.audio.play("pickup", undefined, 0.8)
        }
        p.respawn = 900
        p.obj.visible = false
        break
      }
    }
  }

  /** capturepoint.ls: each tank in range pushes the glow by 2 towards its team every 16 frames. */
  stepCaps() {
    for (let idx = 0; idx < this.caps.length; idx++) {
      const c = this.caps[idx]
      const before = c.v
      for (const t of this.tanks) {
        if (
          t.dead ||
          Math.hypot(t.pos.x - c.pos.x, t.pos.z - c.pos.z) > CAPTURE_RADIUS
        )
          continue
        c.v = THREE.MathUtils.clamp(c.v + (t.team === "blue" ? 2 : -2), 0, 255)
      }
      if (before !== c.v && this.mp) {
        this.mp.send({
          subject: "cappoint",
          sender: this.player.name,
          id: idx,
          team: this.player.team,
          val: c.v,
          tarGlow: [(255 - c.v) / 255, 0, c.v / 255],
        })
      }
      if (before !== c.v && (c.v === 255 || c.v === 0)) {
        const team: Team = c.v === 255 ? "blue" : "red"
        this.pushFeed(
          `${team === "blue" ? "Blue" : "Red"} captured a point`,
          team,
        )
        this.audio.play(team === this.player.team ? "c3" : "c2", undefined, 0.7)
      }
    }
  }

  /** endgame.ls: sum of the blue channel vs 127 * count decides the round. */
  endRound() {
    this.audio.stopAllLoops()
    const total = this.caps.reduce((s, c) => s + c.v, 0)
    const mid = 127 * this.caps.length
    const winner: Team | "draw" =
      total > mid ? "blue" : total < mid ? "red" : "draw"
    this.over = {
      winner,
      blueShare: this.caps.length ? total / (255 * this.caps.length) : 0.5,
    }
    const others = MAPS.filter((m) => m.id !== this.opts.map.id)
    const seedStr = (this.opts.roomCode || "SOLO") + this.opts.map.id
    let hash = 0
    for (let i = 0; i < seedStr.length; i++) {
      hash = (hash * 31 + seedStr.charCodeAt(i)) >>> 0
    }
    const shuffled = [...others].sort((a, b) => {
      const ha = (hash ^ (a.id.charCodeAt(0) * 17)) % 100
      const hb = (hash ^ (b.id.charCodeAt(0) * 17)) % 100
      return ha - hb
    })
    this.mapVoteCandidates = [this.opts.map, ...shuffled.slice(0, 3)]
    this.mapVotes = { [this.player.name]: this.opts.map.id }
    this.mp?.send({
      subject: "mapvote",
      sender: this.player.name,
      mapId: this.opts.map.id,
    })
    this.audio.play(
      winner === this.player.team ? "bugle" : "endwav",
      undefined,
      0.9,
    )
    if (document.pointerLockElement === this.canvas) document.exitPointerLock()
    this.emitHud()
  }

  // ---------------------------------------------------------------- effects
  bang(pos: THREE.Vector3, name: string, size: number) {
    const src = this.bangTextures[name] ?? this.bangTextures.bangrocket
    const t = src.tex.clone()
    t.repeat.set(1 / src.grid, 1 / src.grid)
    t.needsUpdate = true
    const mat = new THREE.SpriteMaterial({
      map: t,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    const s = new THREE.Sprite(mat)
    s.position.copy(pos)
    s.scale.set(size, size, 1)
    this.scene.add(s)
    const frames = src.grid * src.grid
    const max = name === "bangnook" ? 64 : 24
    this.effects.push({
      obj: s,
      life: max,
      max,
      dispose: () => {
        t.dispose()
        mat.dispose()
      },
      update: (_e, k) => {
        const f = Math.min(frames - 1, Math.floor((1 - k) * frames))
        t.offset.set(
          (f % src.grid) / src.grid,
          1 - (Math.floor(f / src.grid) + 1) / src.grid,
        )
      },
    })
    const light = new THREE.PointLight("#ffd27a", 6, size * 3, 1.5)
    light.position.copy(pos)
    this.scene.add(light)
    this.effects.push({
      obj: light,
      life: 14,
      max: 14,
      update: (e, k) => ((e.obj as THREE.PointLight).intensity = 6 * k),
    })
  }

  puff(pos: THREE.Vector3, size: number, life: number, color = "#ffffff") {
    const m = this.puffMat.clone()
    m.color.set(color)
    const s = new THREE.Sprite(m)
    s.position.copy(pos)
    s.scale.set(size, size, 1)
    this.scene.add(s)
    this.effects.push({
      obj: s,
      life,
      max: life,
      dispose: () => m.dispose(),
      update: (e, k) => {
        e.obj.scale.setScalar(size * (2 - k))
        m.opacity = 0.5 * k
        e.obj.position.y += 0.6
      },
    })
  }

  flash(pos: THREE.Vector3, scale = 1, isLaser = false) {
    const baseMat = isLaser ? this.muzzleLaserMat : this.muzzleFlashMat
    const m = baseMat.clone()
    m.rotation = Math.random() * Math.PI * 2
    const s = new THREE.Sprite(m)
    s.position.copy(pos)
    const baseSize = isLaser ? 40 : 48
    s.scale.setScalar(baseSize * scale)
    this.scene.add(s)
    this.effects.push({
      obj: s,
      life: 2,
      max: 2,
      dispose: () => m.dispose(),
      update: (e, k) => {
        m.opacity = Math.max(0, k)
        e.obj.scale.setScalar(baseSize * scale * (0.85 + 0.25 * (1 - k)))
      },
    })
  }

  spark(pos: THREE.Vector3, color: string) {
    const m = this.sparkMat.clone()
    m.color.set(color)
    m.rotation = Math.random() * Math.PI * 2
    const s = new THREE.Sprite(m)
    s.position.copy(pos)
    s.scale.setScalar(35)
    this.scene.add(s)
    this.effects.push({
      obj: s,
      life: 6,
      max: 6,
      dispose: () => m.dispose(),
      update: (e, k) => {
        m.opacity = Math.max(0, k)
        e.obj.scale.setScalar(35 * k + 5)
      },
    })
  }

  tracer(a: THREE.Vector3, b: THREE.Vector3, color: string, width: number) {
    const len = a.distanceTo(b)
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const m = new THREE.Mesh(
      new THREE.CylinderGeometry(width, width, len, 4, 1, true),
      mat,
    )
    m.position.copy(a).add(b).multiplyScalar(0.5)
    m.quaternion.setFromUnitVectors(UP, tmpV.subVectors(b, a).normalize())
    this.scene.add(m)
    this.effects.push({
      obj: m,
      life: 4,
      max: 4,
      dispose: () => mat.dispose(),
      update: (_e, k) => (mat.opacity = 0.85 * k),
    })
  }

  stepEffects() {
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const e = this.effects[i]
      e.life--
      e.update?.(e, e.life / e.max)
      if (e.life <= 0) {
        this.scene.remove(e.obj)
        if (!e.keepGeometry) disposeTree(e.obj)
        e.dispose?.()
        this.effects.splice(i, 1)
      }
    }
  }

  pushFeed(
    itemOrText: string | Omit<FeedItem, "id" | "t">,
    team?: Team,
  ) {
    const item: FeedItem =
      typeof itemOrText === "string"
        ? { id: this.uid++, text: itemOrText, team, t: this.frame }
        : { id: this.uid++, ...itemOrText, t: this.frame }
    this.feed.push(item)
    if (this.feed.length > 7) this.feed.shift()
    this.emitHud()
  }

  popup(text: string, kind: Popup["kind"]) {
    this.popups.push({ id: this.uid++, text, t: this.frame, kind })
    if (this.popups.length > 5) this.popups.shift()
  }

  // ---------------------------------------------------------------- rendering
  render() {
    const p = this.player
    const isZoomed =
      this.proMode &&
      this.rightMouseDown &&
      p.weapon !== null &&
      !["speed", "thrusters", "health", "stealth", "remotemine", "proximitymine"].includes(p.weapon)

    const alpha = Math.min(1, Math.max(0, this.acc / DT))

    for (const t of this.tanks) {
      if (t.dead) {
        if (t.nametagSprite) t.nametagSprite.visible = false
        continue
      }
      // Interpolate position and orientation between physics steps for high-refresh fluidity
      t.renderPos.copy(t.prevPos).lerp(t.pos, alpha)
      t.renderQ.copy(t.prevQ).slerp(t.q, alpha)

      const r = t.rig
      updateTankWeaponRig(r, t.weapon)
      r.root.position.copy(t.renderPos)
      r.root.quaternion.copy(t.renderQ)

      r.root.visible = !t.dead

      // Original Shockwave 3D tank nametag overhead billboarding
      if (t.nametagSprite) {
        const show =
          !t.isPlayer &&
          !t.dead &&
          (t.team === p.team || t.stealthT === 0)
        t.nametagSprite.visible = show
        if (show) {
          t.nametagSprite.position.set(
            t.renderPos.x,
            t.renderPos.y + 46,
            t.renderPos.z,
          )
          const dist = this.camera.position.distanceTo(t.renderPos)
          const sf = Math.min(2.2, Math.max(0.85, dist * 0.0016))
          t.nametagSprite.scale.set(48 * sf, 12 * sf, 1)
        }
      }

      const fwd = tmpV.set(0, 0, -1).applyQuaternion(t.renderQ)
      const hullYaw = Math.atan2(-fwd.x, -fwd.z)
      r.turret.rotation.y = wrapAngle(t.aimYaw - hullYaw)
      r.barrel.rotation.x = t.aimPitch
      const sp = t.vel.dot(fwd)
      for (const w of r.wheels) w.rotation.x -= (sp / 17) * DT
      for (const w of r.frontWheels)
        (w.parent as THREE.Object3D).rotation.y = t.input.turn * 0.4
      r.thrustMesh.visible = t.speedT > 0
      const shieldMat = r.shield.material as THREE.MeshBasicMaterial
      shieldMat.opacity =
        t.spawnProtect > 0
          ? 0.07 + 0.05 * Math.sin(this.frame * 0.3)
          : t.superT > 0
            ? 0.22 + 0.1 * Math.sin(this.frame * 0.5)
            : 0
      shieldMat.color.copy(
        t.superT > 0 ? new THREE.Color("#fff27a") : TEAM_COLORS[t.team],
      )
      const cloaked = t.stealthT > 0
      for (const m of r.materials) {
        m.transparent = cloaked
        m.opacity = cloaked
          ? t.isPlayer || t.team === p.team
            ? 0.35
            : 0.06
          : 1
      }
    }
    for (const c of this.caps) {
      const col = new THREE.Color().setRGB((255 - c.v) / 255, 0, c.v / 255)
      const gm = c.rig.glow.material as THREE.MeshBasicMaterial
      gm.color.copy(col)
      c.rig.core.emissive.copy(col)
      c.rig.light.color.copy(col)
      c.rig.glow.rotation.y += 0.004
      if (gm.map) gm.map.offset.y = (gm.map.offset.y + 0.003) % 1
    }

    // third-person camera & RC follow (goody.docams / rcbomb / rcrocket)
    if (!this.over) {
      if (this.rcPawn) {
        const pawn = this.rcPawn
        const back = new THREE.Vector3(Math.sin(pawn.rot.z), 0, Math.cos(pawn.rot.z))
        const fwd = new THREE.Vector3(-Math.sin(pawn.rot.z), 0, -Math.cos(pawn.rot.z))
        const dist = pawn.kind === "rcbomb" ? 80 : 150
        const height = pawn.kind === "rcbomb" ? 28 : 60
        const want = pawn.pos.clone().addScaledVector(back, dist).add(new THREE.Vector3(0, height, 0))
        const g = terrainAt(this.level, want.x, want.z) + 15
        if (want.y < g) want.y = g
        const look = pawn.pos.clone().addScaledVector(fwd, 200).add(new THREE.Vector3(0, 10, 0))
        if (this.camPos.lengthSq() === 0) {
          this.camPos.copy(want)
          this.camLook.copy(look)
        }
        this.camPos.lerp(want, 0.25)
        this.camLook.lerp(look, 0.35)
      } else {
        const yaw = p.aimYaw
        const back = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw))
        const fwd = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw))
        const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw))

        let want: THREE.Vector3
        let look: THREE.Vector3

        if (isZoomed) {
          // Over-the-shoulder zoom slightly up and right of the turret to clear tank chassis & muzzle
          want = p.renderPos
            .clone()
            .addScaledVector(back, 28)
            .addScaledVector(right, 14)
            .add(new THREE.Vector3(0, 42, 0))
          look = want
            .clone()
            .addScaledVector(fwd, 2000)
            .add(new THREE.Vector3(0, p.aimPitch * 2000, 0))
        } else {
          // Authentic Shockwave distance: 200 units back, 65 units up (tracking smoothly interpolated renderPos)
          want = p.renderPos.clone().addScaledVector(back, 200).add(new THREE.Vector3(0, 65 - p.aimPitch * 100, 0))
          const g = terrainAt(this.level, want.x, want.z) + 30
          if (want.y < g) want.y = g
          look = p.renderPos.clone().addScaledVector(fwd, 800).add(new THREE.Vector3(0, 45 + p.aimPitch * 600, 0))
        }

        if (this.camPos.lengthSq() === 0) {
          this.camPos.copy(want)
          this.camLook.copy(look)
        }
        this.camPos.lerp(want, p.dead ? 0.05 : isZoomed ? 0.6 : 0.28)
        this.camLook.lerp(look, isZoomed ? 0.7 : 0.35)
      }
    } else {
      const a = this.frame * 0.003
      this.camPos.lerp(
        new THREE.Vector3(
          Math.cos(a) * this.level.half,
          this.level.maxHeight + 2400,
          Math.sin(a) * this.level.half,
        ),
        0.01,
      )
      this.camLook.lerp(new THREE.Vector3(0, 0, 0), 0.02)
    }
    this.camera.position.copy(this.camPos)
    if (this.shake > 0.01) {
      this.camera.position.add(
        new THREE.Vector3(
          Math.random() - 0.5,
          Math.random() - 0.5,
          Math.random() - 0.5,
        ).multiplyScalar(this.shake * 40),
      )
      this.shake *= 0.88
    }
    this.camera.lookAt(this.camLook)

    const targetFov =
      isZoomed && p.weapon
        ? WEAPONS[p.weapon].aimFov
        : p.speedT > 0
          ? 58
          : 50
    if (Math.abs(this.camera.fov - targetFov) > 0.05) {
      this.camera.fov += (targetFov - this.camera.fov) * (isZoomed ? 0.2 : 0.08)
      this.camera.updateProjectionMatrix()
    }
    this.audio.listener = p.renderPos

    this.sun.position.copy(p.renderPos).add(new THREE.Vector3(2000, 8000, 1500))
    this.sun.target.position.copy(p.renderPos)
    this.renderer.render(this.scene, this.camera)
  }

  emitHud() {
    const p = this.player
    const now = this.frame
    const l = this.level
    this.feed = this.feed.filter((f) => now - f.t < 60 * 8)
    const isZoomed =
      this.proMode &&
      this.rightMouseDown &&
      p.weapon !== null &&
      !["speed", "thrusters", "health", "stealth", "remotemine", "proximitymine"].includes(p.weapon)
    const curW = p.weapon ? WEAPONS[p.weapon] : null

    this.onHud({
      health: Math.max(0, p.health),
      weapon: p.weapon,
      ammo: p.ammo,
      uber: Math.min(100, p.uber),
      superT: p.superT,
      speedT: p.speedT,
      stealthT: p.stealthT,
      timeLeft: Math.max(0, this.timeLeft),
      caps: this.caps.map((c) => c.v),
      feed: [...this.feed],
      popups: [...this.popups],
      dead: p.dead,
      respawnIn: Math.ceil(p.respawnT / 60),
      spawnProtect: p.spawnProtect > 0,
      hitMarker: this.hitMarker,
      hurtDir: this.hurtDir,
      proMode: this.proMode,
      zoomed: isZoomed,
      siteIndex: isZoomed && curW ? curW.site : 0,
      isControllingRc: this.rcPawn !== null,
      scoreboard: this.tanks
        .map((t) => ({
          name: t.name,
          team: t.team,
          score: t.score,
          kills: t.kills,
          deaths: t.deaths,
          isPlayer: t.isPlayer,
          isRemote: t.isRemote,
        }))
        .sort((a, b) => b.score - a.score),
      minimap: this.tanks
        .filter((t) => !t.dead && (t.team === p.team || t.stealthT === 0))
        .map((t) => {
          const f = new THREE.Vector3(0, 0, -1).applyQuaternion(t.q)
          return {
            x: (t.pos.x + l.half) / l.width,
            z: (t.pos.z + l.half) / l.width,
            team: t.team,
            isPlayer: t.isPlayer,
            yaw: Math.atan2(f.x, -f.z),
          }
        }),
      minimapCaps: this.caps.map((c) => ({
        x: (c.pos.x + l.half) / l.width,
        z: (c.pos.z + l.half) / l.width,
        v: c.v,
      })),
      over: this.over,
      locked: this.locked,
      speed: Math.round(Math.hypot(p.vel.x, p.vel.z)),
      netStatus: this.netStatus,
      mapVote: this.over
        ? {
            candidates: this.mapVoteCandidates,
            votes: { ...this.mapVotes },
            myVote: this.mapVotes[this.player.name] ?? this.opts.map.id,
          }
        : null,
    })
  }
}
