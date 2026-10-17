import { useEffect, useRef } from "react"
import * as THREE from "three"
import type { WeaponId } from "../../game/data"
import { buildTank, preloadModels, updateTankWeaponRig } from "../../game/models"

/**
 * Renders the real, original W3D tank mesh (same rig used in-game) on a transparent
 * canvas so it can sit on top of the landing page logo like the original title screen.
 */
export default function TankShowcase({
  className = "",
  weapon = "mgun",
}: {
  className?: string
  weapon?: WeaponId | null
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const tankRef = useRef<ReturnType<typeof buildTank> | null>(null)
  const weaponRef = useRef<WeaponId | null>(weapon)
  weaponRef.current = weapon

  useEffect(() => {
    if (tankRef.current) {
      updateTankWeaponRig(tankRef.current, weapon)
    }
  }, [weapon])

  useEffect(() => {
    const wrap = wrapRef.current!
    const canvas = canvasRef.current!
    let disposed = false
    let raf = 0
    let visible = true

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "low-power",
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(28, 1, 1, 4000)
    camera.position.set(0, 90, 215)
    camera.lookAt(0, 26, 0)

    scene.add(new THREE.HemisphereLight("#fff1d6", "#3a2a1a", 1.6))
    const key = new THREE.DirectionalLight("#ffffff", 3)
    key.position.set(180, 260, 200)
    scene.add(key)
    const rim = new THREE.DirectionalLight("#6fa0ff", 1.8)
    rim.position.set(-220, 80, -160)
    scene.add(rim)

    const stage = new THREE.Group()
    scene.add(stage)

    let tank: ReturnType<typeof buildTank> | null = null
    preloadModels()
      .then(() => {
        if (disposed) return
        tank = buildTank("red")
        tankRef.current = tank
        updateTankWeaponRig(tank, weaponRef.current)
        tank.root.scale.setScalar(1.0)
        tank.root.position.y = -4
        stage.add(tank.root)
      })
      .catch(() => {
        // The landing page still works without the 3D showcase.
      })

    const resize = () => {
      const w = wrap.clientWidth
      const h = wrap.clientHeight
      if (!w || !h) return
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)

    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting
      },
      { threshold: 0.01 },
    )
    io.observe(wrap)

    // Subtle pointer parallax
    const target = { x: 0, y: 0 }
    const cur = { x: 0, y: 0 }
    const onMove = (e: PointerEvent) => {
      target.x = (e.clientX / window.innerWidth - 0.5) * 2
      target.y = (e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener("pointermove", onMove)

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const clock = new THREE.Clock()

    const loop = () => {
      raf = requestAnimationFrame(loop)
      if (!visible || document.hidden) return
      const t = clock.getElapsedTime()
      cur.x += (target.x - cur.x) * 0.06
      cur.y += (target.y - cur.y) * 0.06

      // Hero angle: three-quarter view (like the original title art) that slowly sways.
      stage.rotation.y = reduce
        ? -0.55
        : -0.55 + Math.sin(t * 0.35) * 0.45 + cur.x * 0.35
      stage.rotation.x = cur.y * 0.06
      stage.position.y = reduce ? 0 : Math.sin(t * 1.4) * 2.5

      if (tank) {
        if (!reduce) {
          tank.turret.rotation.y = Math.sin(t * 0.6) * 0.5
          tank.barrel.rotation.x = 0.12 + Math.sin(t * 0.9) * 0.05
        }
        for (const w of tank.wheels) w.rotation.x -= reduce ? 0 : 0.02
      }
      renderer.render(scene, camera)
    }
    loop()

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      window.removeEventListener("pointermove", onMove)
      // Geometry/textures are shared with the game cache, so only the renderer is disposed.
      renderer.dispose()
    }
  }, [])

  return (
    <div ref={wrapRef} className={className} aria-hidden="true">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  )
}

