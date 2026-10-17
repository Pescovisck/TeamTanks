// Gameplay tables recovered from the decompiled Lingo (see teamtanks_re/).
// Distances are in original Shockwave 3D units; the tank bounding radius (bsp) is 55.

export type Team = "red" | "blue"
export type MapId =
  | "grass1"
  | "grass2"
  | "canyon1"
  | "canyon2"
  | "pyramids1"
  | "pyramids2"
  | "artic1"
  | "techno1"
  | "specialops1"

export type MapDef = {
  id: MapId
  name: string
  theme: "grass" | "canyon" | "pyramids" | "artic" | "specialops" | "techno"
  size: number // grid unit
  height: number // heightmap scale: z = red * size * height
  friction: number
  tile: string
  additive: boolean // artic/specialops blend the tile additively
}

// mus.ls `vleveldata`
const THEMES = {
  grass: { size: 180, height: 0.012, friction: 0.07, tile: "grass" },
  canyon: { size: 220, height: 0.02, friction: 0.12, tile: "sand" },
  pyramids: { size: 180, height: 0.025, friction: 0.1, tile: "stone" },
  artic: { size: 200, height: 0.025, friction: 0, tile: "snow" },
  specialops: { size: 380, height: 0.03, friction: 0.2, tile: "asteroid" },
  techno: { size: 160, height: 0.027, friction: 0.2, tile: "circuits" },
} as const

function def(id: MapId, name: string, theme: MapDef["theme"]): MapDef {
  return {
    id,
    name,
    theme,
    ...THEMES[theme],
    additive: theme === "artic" || theme === "specialops",
  }
}

export const MAPS: MapDef[] = [
  def("grass1", "Grass I", "grass"),
  def("grass2", "Grass II", "grass"),
  def("canyon1", "Canyon I", "canyon"),
  def("canyon2", "Canyon II", "canyon"),
  def("pyramids1", "Pyramids I", "pyramids"),
  def("pyramids2", "Pyramids II", "pyramids"),
  def("artic1", "Artic", "artic"),
  def("techno1", "Techno", "techno"),
  def("specialops1", "Special Ops", "specialops"),
]

// initgame.ls: powerup-map red value -> pickup (vpowerupscols / vpicklist)
export const PICKUP_BY_RED: Record<number, string> = {
  100: "mgun",
  105: "bgun",
  110: "nook",
  115: "rocket",
  120: "proximitymine",
  125: "speed",
  130: "lasergun",
  135: "mgunx2",
  140: "rocketx4",
  145: "remotemine",
  150: "sonicgun",
  155: "guidedmissile",
  160: "thrusters",
  165: "mortar",
  170: "airstrike",
  175: "rcbomb",
  180: "rcrocket",
  185: "health",
  190: "stealth",
}

// initgame.ls: heightmap green value -> object (vgrncols / pcontent)
export const OBJECT_BY_GREEN: Record<number, string> = {
  100: "ramp1",
  110: "ramp2",
  120: "ramp3",
  130: "loop",
  140: "twist",
  200: "spawn",
  250: "capturepoint",
}
export const PICKUP_GREEN = 191

export type WeaponId =
  | "mgun"
  | "mgunx2"
  | "lasergun"
  | "bgun"
  | "rocket"
  | "rocketx4"
  | "nook"
  | "proximitymine"
  | "remotemine"
  | "mortar"
  | "guidedmissile"
  | "sonicgun"
  | "airstrike"
  | "rcbomb"
  | "rcrocket"
  | "speed"
  | "thrusters"
  | "health"
  | "stealth"

export type WeaponDef = {
  id: WeaponId
  label: string
  icon: number // ammo_hud_<n> (weaponry.ls: index in pweaplist + 1)
  kind:
    | "hitscan"
    | "shell"
    | "rocket"
    | "lob"
    | "mine"
    | "homing"
    | "sonic"
    | "airstrike"
    | "boost"
    | "heal"
    | "cloak"
    | "thrusters"
    | "rcbomb"
    | "rcrocket"
  cooldown: number // frames at 60 fps (weaponry.ls `waitgun`)
  power: number // explosion power (bangs.ls `ppower`) or hitscan damage (weaponry.ls `vpains`)
  ammo: number // exact original values from pickups.ls
  speed?: number // projectile speed, units/s
  aimFov: number // goody.ls `vaimdepths`
  site: number // goody.ls `pweapsites` site_1..site_8 (0 = none)
  verb: string // kill-feed verb (mus.ls `vdesc`)
}

export const WEAPONS: Record<WeaponId, WeaponDef> = {
  mgun: {
    id: "mgun",
    label: "Machine Gun",
    icon: 2,
    kind: "hitscan",
    cooldown: 3,
    power: 6,
    ammo: 80,
    aimFov: 35,
    site: 1,
    verb: "guns",
  },
  bgun: {
    id: "bgun",
    label: "Cannon",
    icon: 3,
    kind: "shell",
    cooldown: 18,
    power: 10,
    ammo: 6,
    speed: 5130, // 171 u/frame * 30fps
    aimFov: 35,
    site: 2,
    verb: "cannons",
  },
  nook: {
    id: "nook",
    label: "Nook",
    icon: 4,
    kind: "lob",
    cooldown: 70,
    power: 40,
    ammo: 1,
    speed: 1920, // Matches 50 u/frame with ageia.ls -1z gravity (~2170u air carry at 30° + ~650u roll)
    aimFov: 45,
    site: 3,
    verb: "nooks",
  },
  rocket: {
    id: "rocket",
    label: "Rocket",
    icon: 5,
    kind: "rocket",
    cooldown: 40,
    power: 15,
    ammo: 4,
    speed: 2400, // 80 u/frame * 30fps
    aimFov: 35,
    site: 4,
    verb: "rockets",
  },
  proximitymine: {
    id: "proximitymine",
    label: "Proximity Mine",
    icon: 6,
    kind: "mine",
    cooldown: 18,
    power: 20,
    ammo: 5,
    aimFov: 50,
    site: 0,
    verb: "mines",
  },
  speed: {
    id: "speed",
    label: "Speed",
    icon: 7,
    kind: "boost",
    cooldown: 0,
    power: 0,
    ammo: 100, // 100 fuel frames
    aimFov: 50,
    site: 0,
    verb: "gets",
  },
  lasergun: {
    id: "lasergun",
    label: "Laser",
    icon: 8,
    kind: "hitscan",
    cooldown: 3,
    power: 3,
    ammo: 120,
    aimFov: 25,
    site: 5,
    verb: "lasers",
  },
  mgunx2: {
    id: "mgunx2",
    label: "Twin 73",
    icon: 9,
    kind: "hitscan",
    cooldown: 5,
    power: 6,
    ammo: 80,
    aimFov: 35,
    site: 1,
    verb: "twin 73's",
  },
  rocketx4: {
    id: "rocketx4",
    label: "Tankbuster",
    icon: 10,
    kind: "rocket",
    cooldown: 40,
    power: 25,
    ammo: 2,
    speed: 960, // 80 * 0.4 * 30fps
    aimFov: 35,
    site: 4,
    verb: "tankbusts",
  },
  remotemine: {
    id: "remotemine",
    label: "Remote Mine",
    icon: 11,
    kind: "mine",
    cooldown: 18,
    power: 28,
    ammo: 3,
    aimFov: 50,
    site: 0,
    verb: "remote mines",
  },
  sonicgun: {
    id: "sonicgun",
    label: "Sonic Gun",
    icon: 12,
    kind: "sonic",
    cooldown: 40,
    power: 8,
    ammo: 4,
    aimFov: 35,
    site: 6,
    verb: "sonic blasts",
  },
  guidedmissile: {
    id: "guidedmissile",
    label: "Guided Missile",
    icon: 13,
    kind: "homing",
    cooldown: 55,
    power: 11,
    ammo: 3,
    speed: 750, // 25 u/frame * 30fps
    aimFov: 35,
    site: 4,
    verb: "missiles",
  },
  thrusters: {
    id: "thrusters",
    label: "Thrusters",
    icon: 14,
    kind: "thrusters",
    cooldown: 0,
    power: 0,
    ammo: 400, // 400 fuel frames
    aimFov: 50,
    site: 0,
    verb: "gets",
  },
  mortar: {
    id: "mortar",
    label: "Mortar",
    icon: 15,
    kind: "lob",
    cooldown: 25,
    power: 14,
    ammo: 5,
    speed: 3000, // 100 u/frame * 30fps
    aimFov: 45,
    site: 7,
    verb: "mortars",
  },
  airstrike: {
    id: "airstrike",
    label: "Airstrike",
    icon: 16,
    kind: "airstrike",
    cooldown: 60,
    power: 18,
    ammo: 1,
    aimFov: 40,
    site: 8,
    verb: "airstrikes",
  },
  rcbomb: {
    id: "rcbomb",
    label: "RC Bomb",
    icon: 17,
    kind: "rcbomb",
    cooldown: 55,
    power: 24,
    ammo: 1000, // 1000 fuel frames
    speed: 600,
    aimFov: 50,
    site: 0,
    verb: "RC bombs",
  },
  rcrocket: {
    id: "rcrocket",
    label: "RC Rocket",
    icon: 18,
    kind: "rcrocket",
    cooldown: 55,
    power: 22,
    ammo: 1200, // 1200 fuel frames
    speed: 720,
    aimFov: 50,
    site: 0,
    verb: "RC rockets",
  },
  health: {
    id: "health",
    label: "Health",
    icon: 19,
    kind: "heal",
    cooldown: 20,
    power: 0,
    ammo: 3,
    aimFov: 50,
    site: 0,
    verb: "heals",
  },
  stealth: {
    id: "stealth",
    label: "Stealth",
    icon: 20,
    kind: "cloak",
    cooldown: 0,
    power: 0,
    ammo: 250, // 250 fuel frames
    aimFov: 50,
    site: 0,
    verb: "gets",
  },
}

// All 19 original weapons are now directly represented with their W3D models and icons.
export const PICKUP_SUBSTITUTE: Record<string, WeaponId> = {}

// goody.ls rank table
export const RANKS = [
  "Tank Private",
  "Tank Gunner",
  "Tank Captain",
  "Tank Style Technician",
  "Tank Commander",
  "Chief Style Technician",
  "Corporal",
  "Sergeant",
  "Gunnery Sergeant",
  "Master Sergeant",
  "Master Gunnary Sergeant",
  "Master Chief",
  "Veteran",
  "Special Ops",
]

export const BSP = 55 // tank bounding-sphere radius
export const MAX_HEALTH = 102 // goody.repos: plives = 102
export const SPAWN_PROTECT = 210 // frames
export const CAPTURE_RADIUS = BSP * 9
export const KILL_SCORE = 200
export const DEATH_SCORE = -100

export const BOT_NAMES = [
  "Fear",
  "kuku1233",
  "sanaey",
  "pati",
  "duper",
  "sef",
  "Gunnar",
  "Ironside",
  "Moxie",
  "Rivet",
  "Torque",
  "Viper",
]
