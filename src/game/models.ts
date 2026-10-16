import * as THREE from "three"
import { asset } from "./level"

export const TEAM_COLORS = {
  red: new THREE.Color("#d23a26"),
  blue: new THREE.Color("#2f6fe0"),
}

const loader = new THREE.TextureLoader()
const texCache = new Map<string, THREE.Texture>()
export function tex(name: string, repeat = 1) {
  const key = name + repeat
  let t = texCache.get(key)
  if (!t) {
    t = loader.load(asset(`tex/${name}.png`))
    t.colorSpace = THREE.SRGBColorSpace
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(repeat, repeat)
    texCache.set(key, t)
  }
  return t
}

interface SubmeshEntry {
  mtl: string
  start: number
  count: number
}

interface ModelManifestEntry {
  vOffset: number
  vCount: number
  iOffset: number
  iCount: number
  isProp: boolean
  submeshes: SubmeshEntry[]
}

const geomCache = new Map<string, THREE.BufferGeometry>()
let modelsLoadedPromise: Promise<void> | null = null

/** Preloads the decoded original Shockwave W3D binary mesh archive (models.bin + models.json). */
export function preloadModels(): Promise<void> {
  if (modelsLoadedPromise) return modelsLoadedPromise
  modelsLoadedPromise = (async () => {
    const [manifestRes, binRes] = await Promise.all([
      fetch(asset("models/models.json")),
      fetch(asset("models/models.bin")),
    ])
    const manifest: Record<string, ModelManifestEntry> =
      await manifestRes.json()
    const buf = await binRes.arrayBuffer()

    for (const [name, entry] of Object.entries(manifest)) {
      const interleaved = new Float32Array(
        buf,
        entry.vOffset,
        entry.vCount * 8,
      )
      const indices = new Uint16Array(buf, entry.iOffset, entry.iCount)

      const pos = new Float32Array(entry.vCount * 3)
      const norm = new Float32Array(entry.vCount * 3)
      const uv = new Float32Array(entry.vCount * 2)

      for (let i = 0; i < entry.vCount; i++) {
        pos[i * 3 + 0] = interleaved[i * 8 + 0]
        pos[i * 3 + 1] = interleaved[i * 8 + 1]
        pos[i * 3 + 2] = interleaved[i * 8 + 2]
        norm[i * 3 + 0] = interleaved[i * 8 + 3]
        norm[i * 3 + 1] = interleaved[i * 8 + 4]
        norm[i * 3 + 2] = interleaved[i * 8 + 5]
        uv[i * 2 + 0] = interleaved[i * 8 + 6]
        uv[i * 2 + 1] = interleaved[i * 8 + 7]
      }

      const geom = new THREE.BufferGeometry()
      geom.setAttribute("position", new THREE.BufferAttribute(pos, 3))
      geom.setAttribute("normal", new THREE.BufferAttribute(norm, 3))
      geom.setAttribute("uv", new THREE.BufferAttribute(uv, 2))
      geom.setIndex(new THREE.BufferAttribute(indices.slice(), 1))
      geom.clearGroups()
      entry.submeshes.forEach((sub, idx) => {
        geom.addGroup(sub.start, sub.count, idx)
      })
      geom.computeBoundingSphere()
      geom.computeBoundingBox()
      geomCache.set(name, geom)
    }
  })()
  return modelsLoadedPromise
}

export function getModelGeometry(name: string): THREE.BufferGeometry {
  return geomCache.get(name) ?? new THREE.BoxGeometry(10, 10, 10)
}

function shadyMat(
  texName: string,
  emissiveHex = "#242424",
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    map: tex(texName),
    emissive: new THREE.Color(emissiveHex),
    roughness: 0.65,
    metalness: 0.2,
  })
}

// Weapon visual tables from weaponry.ls / baddies.ls
const VGRES: Record<string, string | null> = {
  mgun: "mgun",
  bgun: "bgun",
  nook: "nooklauncher",
  rocket: "rocketlauncher",
  proximitymine: null,
  speed: null,
  lasergun: "lasergun",
  mgunx2: "mgunx2",
  rocketx4: "rocketlauncherx4",
  remotemine: null,
  sonicgun: "sonicgun",
  guidedmissile: "guidedmissilelauncher",
  thrusters: null,
  mortar: "mortarlauncher",
  airstrike: "airstrikelauncher",
  rcbomb: null,
  rcrocket: "rcrocketlauncher",
  health: null,
  stealth: null,
}

const VTRES: Record<string, string | null> = {
  mgun: "turret",
  bgun: "turret",
  nook: "turret",
  rocket: "turretround",
  proximitymine: null,
  speed: null,
  lasergun: "laserturret",
  mgunx2: "turret",
  rocketx4: "turretround",
  remotemine: null,
  sonicgun: "turretround",
  guidedmissile: "turretround",
  thrusters: null,
  mortar: "turretround",
  airstrike: "turretround",
  rcbomb: "rcbomblauncher",
  rcrocket: "turretround",
  health: null,
  stealth: null,
}

const VBRES: Record<string, string | null> = {
  mgun: null,
  bgun: null,
  nook: null,
  rocket: null,
  proximitymine: "minelauncher",
  speed: "speed",
  lasergun: null,
  mgunx2: null,
  rocketx4: null,
  remotemine: "minelauncher",
  sonicgun: null,
  guidedmissile: null,
  thrusters: "thrusters",
  mortar: null,
  airstrike: null,
  rcbomb: null,
  rcrocket: null,
  health: "minelauncher",
  stealth: "stealth",
}

function getGunMaterials(
  resName: string,
  team: "red" | "blue",
): THREE.MeshStandardMaterial | THREE.MeshStandardMaterial[] {
  if (resName === "mgun" || resName === "mgunx2" || resName === "bgun") {
    return shadyMat(resName)
  }
  if (resName === "rcrocketlauncher") {
    return [shadyMat(`${team}rocketlauncher`), shadyMat(`${team}rcrocket`)]
  }
  if (resName === "rocketlauncherx4") {
    return [shadyMat(`${team}rocketlauncher`), shadyMat(`${team}rocket`)]
  }
  if (resName === "airstrikelauncher") {
    return shadyMat("airstrikelauncher")
  }
  return shadyMat(`${team}${resName}`)
}

function getTurretMaterials(
  resName: string,
  team: "red" | "blue",
): THREE.MeshStandardMaterial | THREE.MeshStandardMaterial[] {
  if (resName === "rcbomblauncher") {
    return [shadyMat(`${team}rocketlauncher`), shadyMat(`${team}rcbomb`)]
  }
  if (resName === "laserturret") {
    return shadyMat(`${team}lasergun`)
  }
  return shadyMat("turret")
}

function getBackMaterials(
  resName: string,
  team: "red" | "blue",
): THREE.MeshStandardMaterial {
  return shadyMat(`${team}${resName}`)
}

export type TankRig = {
  root: THREE.Group
  turret: THREE.Group
  barrel: THREE.Group
  wheels: THREE.Mesh[]
  frontWheels: THREE.Mesh[]
  materials: THREE.MeshStandardMaterial[]
  muzzle: THREE.Object3D
  shield: THREE.Mesh
  team: "red" | "blue"
  chassisMesh: THREE.Mesh
  turretMesh: THREE.Mesh
  gunMesh: THREE.Mesh
  backMesh: THREE.Mesh
  thrustMesh: THREE.Mesh
  muzzleMesh: THREE.Mesh
  currentWeapon: string | null
}

/** Original W3D four-wheeled tank (wfl/wfr/wbl/wbr, turret, gun, pback, thrust). Nose points toward -Z. */
export function buildTank(team: "red" | "blue"): TankRig {
  const root = new THREE.Group()

  // Lift inner visual assembly by +24 Y so wheels rest on the ground at tank pos.y = h + 5
  const body = new THREE.Group()
  body.position.y = 24
  root.add(body)

  const hullMat = shadyMat(`tank_${team}`)
  const visorMat = new THREE.MeshStandardMaterial({
    color: "#080c18",
    emissive: "#02040a",
    roughness: 0.15,
    metalness: 0.85,
  })
  const chassisMesh = new THREE.Mesh(getModelGeometry("tank"), [
    hullMat,
    visorMat,
  ])
  chassisMesh.castShadow = true
  body.add(chassisMesh)

  const wheelMat = shadyMat("wheels")
  const wheels: THREE.Mesh[] = []
  const frontWheels: THREE.Mesh[] = []
  const wheelDefs: [string, number, number, number][] = [
    ["wfl", -22, -12, -25],
    ["wfr", 22, -12, -25],
    ["wbl", -22, -12, 19],
    ["wbr", 22, -12, 19],
  ]
  for (const [wName, wx, wy, wz] of wheelDefs) {
    const pivot = new THREE.Group()
    pivot.position.set(wx, wy, wz)
    const w = new THREE.Mesh(getModelGeometry(wName), wheelMat)
    w.scale.setScalar(1.7)
    w.castShadow = true
    pivot.add(w)
    body.add(pivot)
    wheels.push(w)
    if (wz < 0) frontWheels.push(w)
  }

  const turret = new THREE.Group()
  turret.position.set(0, 13, 0)
  body.add(turret)

  const turretMat = shadyMat("turret")
  const turretMesh = new THREE.Mesh(getModelGeometry("turret"), turretMat)
  turretMesh.castShadow = true
  turret.add(turretMesh)

  const barrel = new THREE.Group()
  barrel.position.set(0, 0, 0)
  turret.add(barrel)

  const gunMat = shadyMat("mgun")
  const gunMesh = new THREE.Mesh(getModelGeometry("mgun"), gunMat)
  gunMesh.castShadow = true
  barrel.add(gunMesh)

  const muzzleMat = new THREE.MeshBasicMaterial({
    map: tex("mfmachinegun"),
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  })
  const muzzleMesh = new THREE.Mesh(getModelGeometry("mfmgun"), muzzleMat)
  muzzleMesh.visible = false
  barrel.add(muzzleMesh)

  const muzzle = new THREE.Object3D()
  muzzle.position.set(0, 2, -38)
  barrel.add(muzzle)

  const backMat = shadyMat(`${team}speed`)
  const backMesh = new THREE.Mesh(getModelGeometry("speed"), backMat)
  backMesh.visible = false
  backMesh.castShadow = true
  body.add(backMesh)

  const thrustMat = new THREE.MeshBasicMaterial({
    map: tex("thrust", 2),
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  })
  const thrustMesh = new THREE.Mesh(getModelGeometry("thrust"), thrustMat)
  thrustMesh.visible = false
  body.add(thrustMesh)

  const shield = new THREE.Mesh(
    new THREE.SphereGeometry(78, 24, 16),
    new THREE.MeshBasicMaterial({
      color: "#ffffff",
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  )
  shield.position.y = 24
  root.add(shield)

  const rig: TankRig = {
    root,
    turret,
    barrel,
    wheels,
    frontWheels,
    materials: [hullMat, visorMat, wheelMat, turretMat, gunMat, backMat],
    muzzle,
    shield,
    team,
    chassisMesh,
    turretMesh,
    gunMesh,
    backMesh,
    thrustMesh,
    muzzleMesh,
    currentWeapon: "mgun",
  }

  return rig
}

/** Updates the tank's 3D turret, gun barrel, and rear pod meshes to match its equipped weapon. */
export function updateTankWeaponRig(rig: TankRig, weapon: string | null) {
  if (rig.currentWeapon === weapon) return
  rig.currentWeapon = weapon
  const w = weapon ?? "mgun"
  const gRes = weapon ? VGRES[w] : null
  const tRes = weapon ? VTRES[w] : null
  const bRes = weapon ? VBRES[w] : null

  if (!gRes) {
    rig.gunMesh.visible = false
  } else {
    rig.gunMesh.visible = true
    rig.gunMesh.geometry = getModelGeometry(gRes)
    rig.gunMesh.material = getGunMaterials(gRes, rig.team)
  }

  if (!tRes) {
    rig.turretMesh.visible = false
  } else {
    rig.turretMesh.visible = true
    rig.turretMesh.geometry = getModelGeometry(tRes)
    rig.turretMesh.material = getTurretMaterials(tRes, rig.team)
  }

  if (!bRes) {
    rig.backMesh.visible = false
  } else {
    rig.backMesh.visible = true
    rig.backMesh.geometry = getModelGeometry(bRes)
    rig.backMesh.material = getBackMaterials(bRes, rig.team)
  }

  // Rebuild materials array for stealth opacity toggling
  const mats = new Set<THREE.MeshStandardMaterial>()
  rig.root.traverse((c) => {
    const m = c as THREE.Mesh
    if (!m.isMesh) return
    const arr = Array.isArray(m.material) ? m.material : [m.material]
    for (const mat of arr) {
      if (mat instanceof THREE.MeshStandardMaterial) mats.add(mat)
    }
  })
  rig.materials = [...mats]
}

/** Original W3D ramps (ramp1/2/3), loop and twist. */
export function buildProp(kind: string): THREE.Object3D {
  const g = new THREE.Group()
  if (
    kind === "ramp1" ||
    kind === "ramp2" ||
    kind === "ramp3" ||
    kind === "loop"
  ) {
    const m = new THREE.Mesh(getModelGeometry(kind), shadyMat("rampboard"))
    m.castShadow = m.receiveShadow = true
    g.add(m)
    g.userData.collider = m
  } else if (kind === "twist") {
    const m = new THREE.Mesh(getModelGeometry("twist"), shadyMat("spawnwarn"))
    m.castShadow = m.receiveShadow = true
    g.add(m)
    g.userData.collider = m
  }
  return g
}

/** Original W3D brick wall on grass1: initgame.ls ground whitebrick1 (scale [1.3, 0.78, 1.3], pos [0, 220, 0], tex brick). */
export function buildBrickWall(): THREE.Object3D {
  const g = new THREE.Group()
  const mat = shadyMat("brick", "#464646")
  const m = new THREE.Mesh(getModelGeometry("groundwhitebrick1"), mat)
  m.scale.set(1.3, 0.78, 1.3)
  m.position.set(0, 220, 0)
  m.castShadow = m.receiveShadow = true
  g.add(m)
  g.userData.collider = m
  return g
}

/** Original W3D spawn building (initgame.ls: 6 submeshes, scale 0.6). */
export function buildSpawnPad(team: "red" | "blue") {
  const g = new THREE.Group()
  const teamTex = team === "blue" ? "blue" : "red"
  const teamEmissive = team === "blue" ? "#0000cc" : "#cc0000"
  const mats = [
    shadyMat(teamTex, teamEmissive),
    shadyMat("spawnbase"),
    shadyMat("spawngrid"),
    shadyMat("spawnstart"),
    shadyMat("spawnwarn"),
    shadyMat("spawnwindows"),
  ]
  const m = new THREE.Mesh(getModelGeometry("spawn"), mats)
  m.scale.setScalar(0.6)
  m.castShadow = m.receiveShadow = true
  g.add(m)
  g.userData.collider = m
  return g
}

export type CapRig = {
  group: THREE.Group
  glow: THREE.Mesh
  core: THREE.MeshStandardMaterial
  light: THREE.PointLight
}

/** Original W3D capture point with animated 'glow' column (capturepoint.ls). */
export function buildCapturePoint(): CapRig {
  const g = new THREE.Group()
  const core = new THREE.MeshStandardMaterial({
    color: "#ffffff",
    emissive: "#7f007f",
    emissiveIntensity: 1.5,
    roughness: 0.2,
  })
  const cpMats = [
    shadyMat("rampboard"),
    shadyMat("spawnstart"),
    core,
    shadyMat("spawnbase"),
  ]
  const cpMesh = new THREE.Mesh(getModelGeometry("capturepoint"), cpMats)
  cpMesh.castShadow = cpMesh.receiveShadow = true
  g.add(cpMesh)
  g.userData.collider = cpMesh

  const glowTex = tex("glow").clone()
  glowTex.needsUpdate = true
  const glow = new THREE.Mesh(
    getModelGeometry("glow"),
    new THREE.MeshBasicMaterial({
      map: glowTex,
      color: "#7f007f",
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  )
  g.add(glow)

  const light = new THREE.PointLight("#7f007f", 3, 1600, 1.2)
  light.position.y = 300
  g.add(light)
  return { group: g, glow, core, light }
}

/** Original pickup icon plane (pickups.ls: 100x100 double-sided plane with transparent weapon icon). */
const pickupGeo = new THREE.PlaneGeometry(100, 100)
export function buildPickup(icon: number) {
  const g = new THREE.Group()
  // icon is 2..20 matching icon_<icon>.png (transparent vivid icon)
  const iconTex = loader.load(asset(`ui/icon_${icon}.png`))
  iconTex.colorSpace = THREE.SRGBColorSpace
  const card = new THREE.Mesh(
    pickupGeo,
    new THREE.MeshBasicMaterial({
      map: iconTex,
      transparent: true,
      alphaTest: 0.05,
      side: THREE.DoubleSide,
    }),
  )
  card.position.y = 40
  g.add(card)
  return g
}

/** Original W3D projectile / mine / bomb / crate mesh. */
export function buildProjectileMesh(
  kind: string,
  weapon: string,
  team: "red" | "blue",
): THREE.Object3D {
  if (kind === "mine") {
    const modelName = weapon === "remotemine" ? "remotemine" : "proximitymine"
    const m = new THREE.Mesh(
      getModelGeometry(modelName),
      shadyMat(`${team}mines`),
    )
    m.scale.setScalar(1)
    return m
  }
  if (kind === "health") {
    const m = new THREE.Mesh(
      getModelGeometry("health"),
      shadyMat("tboxhealth"),
    )
    m.scale.setScalar(0.5)
    return m
  }
  if (kind === "bomb") {
    const g = new THREE.Group()
    const m = new THREE.Mesh(
      getModelGeometry("bigbomb"),
      shadyMat(`${team}bombtex`),
    )
    m.rotation.x = -Math.PI / 2
    m.scale.setScalar(1)
    g.add(m)
    g.visible = false
    return g
  }
  if (kind === "lob") {
    const isNook = weapon === "nook"
    const m = new THREE.Mesh(
      getModelGeometry(isNook ? "nook" : "mortar"),
      shadyMat(isNook ? `${team}nook` : `${team}mortarlauncher`),
    )
    m.scale.setScalar(isNook ? 1 : 2)
    return m
  }
  if (kind === "shell") {
    const g = new THREE.Group()
    const m = new THREE.Mesh(
      getModelGeometry("shell"),
      shadyMat(`${team}shell`),
    )
    m.scale.setScalar(4)
    g.add(m)
    return g
  }
  if (kind === "rcbomb") {
    const g = new THREE.Group()
    const m = new THREE.Mesh(
      getModelGeometry("rcbomb"),
      shadyMat(`${team}rcbomb`),
    )
    m.scale.setScalar(2)
    g.add(m)
    return g
  }
  // rocket / rocketx4 / guidedmissile / rcrocket
  const g = new THREE.Group()
  const modelName =
    weapon === "rocketx4"
      ? "rocketx4"
      : weapon === "guidedmissile"
        ? "guidedmissile"
        : weapon === "rcrocket"
          ? "rcrocket"
          : "rocket"
  const texName =
    weapon === "rcrocket" ? `${team}rcrocket` : `${team}rocket`
  const body = new THREE.Mesh(getModelGeometry(modelName), shadyMat(texName))
  const scale =
    weapon === "rocketx4" ? 4 : weapon === "guidedmissile" ? 1.5 : weapon === "rcrocket" ? 1.5 : 2
  body.scale.setScalar(scale)
  g.add(body)
  return g
}

/** Original W3D porkchop debris piece (p1..p9 from porkchop.ls). */
export function buildDebrisPiece(index: number): THREE.Mesh {
  const name = `p${Math.max(1, Math.min(9, index))}`
  return new THREE.Mesh(getModelGeometry(name), shadyMat("porkchoptex"))
}
