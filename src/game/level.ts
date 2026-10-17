import * as THREE from "three"
import {
  OBJECT_BY_GREEN,
  PICKUP_BY_RED,
  PICKUP_GREEN,
  type MapDef,
} from "./data"

const base = import.meta.env.BASE_URL + "tt/"
export const asset = (p: string) => base + p

export async function loadImage(url: string) {
  const img = new Image()
  img.src = url
  await img.decode()
  return img
}

async function loadPixels(url: string) {
  const img = await loadImage(url)
  const c = document.createElement("canvas")
  c.width = img.width
  c.height = img.height
  const g = c.getContext("2d", { willReadFrequently: true })!
  g.drawImage(img, 0, 0)
  return {
    w: img.width,
    h: img.height,
    data: g.getImageData(0, 0, img.width, img.height).data,
  }
}

export type Spawn = { team: "red" | "blue"; pos: THREE.Vector3; yaw: number }
export type PickupSpot = { kind: string; pos: THREE.Vector3 }
export type Prop = { kind: string; pos: THREE.Vector3; yaw: number }

export type Level = {
  def: MapDef
  width: number // world width (mazwid)
  half: number
  grid: number // pixels per side
  heights: Float32Array // grid*grid, world height per vertex
  spawns: Spawn[]
  pickups: PickupSpot[]
  caps: THREE.Vector3[]
  props: Prop[]
  minimap: string
  maxHeight: number
}

/**
 * genlevel: vertex (i, v) -> (i*unit - w/2, v*unit - w/2, red*unit*height) in Lingo's Z-up space.
 * Three.js is Y-up, so Lingo (x, y, z) maps to (x, z, y) here.
 */
export async function loadLevel(def: MapDef): Promise<Level> {
  const [hm, pu] = await Promise.all([
    loadPixels(asset(`maps/${def.id}.png`)),
    loadPixels(asset(`maps/${def.id}powerups.png`)),
  ])
  const grid = hm.w
  const unit = def.size
  const width = unit * (grid - 1)
  const half = width / 2
  const zScale = unit * def.height
  const heights = new Float32Array(grid * grid)
  const spawns: Spawn[] = []
  const pickups: PickupSpot[] = []
  const caps: THREE.Vector3[] = []
  const props: Prop[] = []
  let maxHeight = 0

  for (let i = 0; i < grid; i++) {
    for (let v = 0; v < grid; v++) {
      const o = (v * grid + i) * 4
      const r = hm.data[o],
        g = hm.data[o + 1],
        b = hm.data[o + 2]
      const h = r * zScale
      heights[v * grid + i] = h
      maxHeight = Math.max(maxHeight, h)
      const pos = new THREE.Vector3(i * unit - half, h, v * unit - half)
      const po = (v * pu.w + i) * 4
      const pr = pu.data[po],
        pg = pu.data[po + 1],
        pb = pu.data[po + 2]
      if (g === PICKUP_GREEN) {
        const kind = PICKUP_BY_RED[pr]
        if (kind)
          pickups.push({
            kind,
            pos: pos.clone().add(new THREE.Vector3(0, 30, 0)),
          })
        continue
      }
      const obj = OBJECT_BY_GREEN[g]
      if (!obj) continue
      // po.transform.rotation.z = blue*10 - 100 (degrees)
      const yaw = THREE.MathUtils.degToRad(b * 10 - 100)
      if (obj === "spawn") {
        if (pr === 255 && pg === 0 && pb === 0)
          spawns.push({ team: "red", pos, yaw })
        else if (pr === 0 && pg === 0 && pb === 255)
          spawns.push({ team: "blue", pos, yaw })
      } else if (obj === "capturepoint") {
        caps.push(pos)
      } else {
        props.push({ kind: obj, pos, yaw })
        const kind = PICKUP_BY_RED[pr]
        if (kind) {
          // Authentic ramp pickup offsets from pickups.ls lines 19-39
          let vup = 30
          let vfor = 0
          if (obj === "ramp1") {
            vup = 100
            vfor = 100
          } else if (obj === "ramp2") {
            vup = 330
            vfor = 250
          } else if (obj === "ramp3") {
            vup = 160
            vfor = 150
          } else if (obj === "loop") {
            vup = 30
            vfor = 0
          } else if (obj === "twist") {
            vup = 200
            vfor = 0
          }
          // In Three.js (-p.yaw rotation around Y), prop local +X axis is (cos(-yaw), 0, -sin(-yaw)) = (cos(yaw), 0, sin(yaw))
          pickups.push({
            kind,
            pos: pos
              .clone()
              .add(
                new THREE.Vector3(
                  Math.cos(yaw) * vfor,
                  vup,
                  Math.sin(yaw) * vfor,
                ),
              ),
          })
        }
      }
    }
  }
  return {
    def,
    width,
    half,
    grid,
    heights,
    spawns,
    pickups,
    caps,
    props,
    minimap: asset(`maps/${def.id}tex.png`),
    maxHeight,
  }
}

/** Height of the triangulated terrain at world (x, z); optionally writes the surface normal. */
export function terrainAt(l: Level, x: number, z: number, n?: THREE.Vector3) {
  const u = l.def.size
  const fx = THREE.MathUtils.clamp((x + l.half) / u, 0, l.grid - 1.0001)
  const fz = THREE.MathUtils.clamp((z + l.half) / u, 0, l.grid - 1.0001)
  const i = Math.floor(fx),
    v = Math.floor(fz)
  const tx = fx - i,
    tz = fz - v
  const H = (a: number, b: number) => l.heights[b * l.grid + a]
  const h00 = H(i, v),
    h10 = H(i + 1, v),
    h01 = H(i, v + 1),
    h11 = H(i + 1, v + 1)
  let h: number, dx: number, dz: number
  // same diagonal split as THREE.PlaneGeometry: (i, v+1) - (i+1, v)
  if (tx + tz <= 1) {
    h = h00 + (h10 - h00) * tx + (h01 - h00) * tz
    dx = h10 - h00
    dz = h01 - h00
  } else {
    h = h11 + (h01 - h11) * (1 - tx) + (h10 - h11) * (1 - tz)
    dx = h11 - h01
    dz = h11 - h10
  }
  if (n) n.set(-dx / u, 1, -dz / u).normalize()
  return h
}

function makeTex(img: HTMLImageElement | HTMLCanvasElement, repeat = 1) {
  const t = new THREE.Texture(img)
  t.colorSpace = THREE.SRGBColorSpace
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(repeat, repeat)
  t.anisotropy = 8
  t.needsUpdate = true
  return t
}

/**
 * Ground mesh as in genlevel: base texture = <map>tex stretched over the whole map,
 * second layer = theme tile multiplied (added on artic/specialops) at 40%.
 */
export async function buildTerrain(l: Level) {
  const geo = new THREE.PlaneGeometry(l.width, l.width, l.grid - 1, l.grid - 1)
  geo.rotateX(-Math.PI / 2)
  const p = geo.attributes.position as THREE.BufferAttribute
  for (let k = 0; k < p.count; k++) {
    const i = Math.round((p.getX(k) + l.half) / l.def.size)
    const v = Math.round((p.getZ(k) + l.half) / l.def.size)
    p.setY(k, l.heights[v * l.grid + i])
  }
  geo.computeVertexNormals()
  const [baseImg, tileImg] = await Promise.all([
    loadImage(l.minimap),
    loadImage(asset(`tex/${l.def.tile}.png`)),
  ])
  const baseTex = makeTex(baseImg)
  baseTex.wrapS = baseTex.wrapT = THREE.ClampToEdgeWrapping
  const tileTex = makeTex(tileImg)
  // Original Shockwave shady() sets shader.emissive = rgb(70, 70, 70), ensuring dark maps like Special Ops have full unshadowed texture visibility
  const mat = new THREE.MeshLambertMaterial({
    map: baseTex,
    emissive: new THREE.Color(70 / 255, 70 / 255, 70 / 255),
    emissiveMap: baseTex,
  })
  mat.onBeforeCompile = (s) => {
    s.uniforms.tileMap = { value: tileTex }
    s.uniforms.tileRepeat = { value: l.grid / 2 }
    s.vertexShader = s.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec2 vTileUv;")
      .replace("#include <uv_vertex>", "#include <uv_vertex>\nvTileUv = uv;")
    s.fragmentShader = s.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nuniform sampler2D tileMap;\nuniform float tileRepeat;\nvarying vec2 vTileUv;",
      )
      .replace(
        "#include <map_fragment>",
        `#include <map_fragment>
        vec3 tile = texture2D(tileMap, vTileUv * tileRepeat).rgb;
        ${
          l.def.theme === "specialops"
            ? "diffuseColor.rgb = clamp(diffuseColor.rgb * 1.8 + tile * 1.35, 0.0, 1.0);"
            : l.def.additive
              ? "diffuseColor.rgb = clamp(diffuseColor.rgb + tile * 0.45, 0.0, 1.0);"
              : "diffuseColor.rgb *= mix(vec3(1.0), tile * 1.6, 0.4);"
        }`,
      )
      .replace(
        "#include <emissivemap_fragment>",
        `#ifdef USE_EMISSIVEMAP
          totalEmissiveRadiance *= diffuseColor.rgb;
        #endif`,
      )
  }
  const mesh = new THREE.Mesh(geo, mat)
  mesh.receiveShadow = true
  return mesh
}

/** Sky cylinder (sortskybox): radius = width * 1.2, textured with sky<theme>. Returns the horizon colour. */
export async function buildSky(l: Level, scene: THREE.Scene) {
  const img = await loadImage(asset(`tex/sky${l.def.theme}.png`))
  const c = document.createElement("canvas")
  c.width = img.width
  c.height = img.height
  const g = c.getContext("2d")!
  g.drawImage(img, 0, 0)
  const top = g.getImageData(0, 0, 1, 1).data
  const bottom = g.getImageData(0, img.height - 1, 1, 1).data
  const rad = l.width * 1.2
  const tex = makeTex(c)
  tex.repeat.set(5, 1) // textureTransform.scale x = 0.2
  tex.wrapT = THREE.ClampToEdgeWrapping
  const sky = new THREE.Mesh(
    new THREE.CylinderGeometry(rad, rad, rad * 0.7, 48, 1, true),
    new THREE.MeshBasicMaterial({
      map: tex,
      side: THREE.BackSide,
      fog: false,
      depthWrite: false,
    }),
  )
  sky.position.y = rad * 0.23
  sky.renderOrder = -1
  scene.add(sky)
  const cap = new THREE.Mesh(
    new THREE.CircleGeometry(rad, 48),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(`rgb(${top[0]},${top[1]},${top[2]})`),
      side: THREE.DoubleSide,
      fog: false,
      depthWrite: false,
    }),
  )
  cap.rotation.x = Math.PI / 2
  cap.position.y = sky.position.y + rad * 0.35
  cap.renderOrder = -1
  scene.add(cap)
  return new THREE.Color(`rgb(${bottom[0]},${bottom[1]},${bottom[2]})`)
}
