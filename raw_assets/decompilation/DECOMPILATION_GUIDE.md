# Team Tanks (2006) - Decompilation & Unity Rebuild Guide

A complete technical manual for reverse-engineering the 2006 Gamevial web game **Team Tanks** and rebuilding it in **Unity** with native PhysX vehicle physics.

---

## 1. Technical Architecture & File Overview

### Original Game Engine
* **Engine:** Macromedia / Adobe Director (Shockwave 3D engine)
* **Scripting Language:** Lingo (compiled to bytecode)
* **Physics Engine:** Ageia / NVIDIA PhysX (via Director PhysX Xtra)
* **3D Format:** Shockwave 3D (`.w3d`)
* **Executable Type:** Windows Projector (monolithic PE stub wrapping Director movie containers)

### Files in Workspace
| File / Directory | Description | Purpose in Pipeline |
| :--- | :--- | :--- |
| `teamtanks(GameVial).exe` | Original 28.2 MB Projector executable | Source binary containing game data |
| `extract_director_movie.py` | Custom Python carver script | Extracts embedded Director movies from the EXE |
| `teamtanks(RavenWoods Version)/` | Community archive containing Director runtime tools | Provides runtime dependencies and Xtras |
| `.../Projector Skeleton.../Xtras/` | Complete Adobe Director 12 plugin library | Enables asset rippers to parse 3D/Audio |
| `.../NVidiaShockwaveFix.exe` | Compatibility wrapper for modern GPUs | Fixes black screen crashes on Windows 10/11 |

---

## 2. Step-by-Step Decompilation Workflow

```
[ teamtanks.exe ]
       │
       ▼ (extract_director_movie.py)
[ movie_1_MV93.dir ] ───────────────────────────────────────────┐
       │                                                         │
       ▼ (ProjectorRays)                                         ▼ (Director Cast Ripper + Xtras)
[ Lingo Source Scripts ]                                  [ Raw Cast Members ]
- Vehicle physics & torque                                 - .w3d 3D Models
- Stunt combo math                                         - .bmp / .png Textures
- Weapon parameters & timers                               - .wav Audio SFX
       │                                                         │
       │                                                         ▼ (Shockwave 3D World Converter)
       │                                                  [ .obj / .mtl 3D Models ]
       │                                                         │
       │                                                         ▼ (Blender)
       │                                                  [ .fbx / .glb Models ]
       ▼                                                         │
 ════════════════════════════════════════════════════════════════╪══════════════
                            UNITY PROJECT
 ════════════════════════════════════════════════════════════════╪══════════════
       │                                                         │
       ▼                                                         ▼
[ C# Stunt Tank Controller ] <─────────────────────────── [ Tank Prefabs & Materials ]
- Rigidbody + PhysX
- Raycast suspension
- Stunt detection & weapons
```

---

## 3. Step 1: Carve the Director Movies

The `.exe` wraps the Director movie inside Windows PE headers. We must extract the inner container (`XFIR` chunk) first.

1. Open your terminal in `D:\Projects\TeamTanks`.
2. Run the extraction script:
   ```bash
   python extract_director_movie.py
   ```
3. This creates `extracted_movies/movie_1_MV93.dir` (~16.1 MB).
   > **Note:** `MV93` is Adobe Director's internal FourCC identifier for a complete Movie container (`MV` = Movie). This single ~16.1 MB file contains **all 58,000+ assets**: all 3D tank/arena models, audio tracks, bitmaps, and compiled Lingo scripts.

---

## 4. Step 2: Decompile the Lingo Scripts (Code & Math)

To understand vehicle handling, stunt detection, and weapon logic:

1. Download **[ProjectorRays](https://github.com/Brian151/ProjectorRays)**.
2. Decompile `movie_1_MV93.dir`:
   ```bash
   projectorrays-cli.exe decompile extracted_movies/movie_1_MV93.dir
   ```
3. The output will contain text files with the original Lingo source scripts.

### Key Logic to Inspect & Port:
* **Vehicle Torque & Friction:** Look for `applyForce`, `applyTorque`, or raycast wheel updates to see exact speed, steering speed, and suspension stiffness values.
* **Stunt Detection:** Find the routine tracking tank orientation (pitch, roll, yaw in mid-air) and air-time timers that award stunt bonuses and invincibility.
* **Weapons:** Check files relating to weapons (`nuke`, `homing`, `mine`, `cannon`) to copy projectile speeds, explosion radii, and lifetime timers.

---

## 5. Step 3: Extract & Convert 3D Models (`.w3d` to `.fbx`)

The original 3D models (tanks, turrets, wheels, tracks, arena maps) are stored as Shockwave 3D cast members (`.w3d`).

### Extracting `.w3d` Files:
1. Use **Director Cast Ripper** (or **QuickBMS** with `shockwave.bms`).
2. **Crucial:** Make sure the ripper has access to the `Xtras` folder from `teamtanks(RavenWoods Version)/Projector Skeleton for Adobe Director 12.0.0.111(3)/Xtras/` (specifically `Shockwave 3D Asset.x32`).
3. Export all 3D cast members to an output directory.

### Converting `.w3d` to Modern Formats:
1. Run the **[Shockwave 3D World Converter](https://github.com/AnthonyKleine/shockwave-3d-world-converter)** by Anthony Kleine.
2. Select your exported `.w3d` files to generate standard `.obj` + `.mtl` + texture files.
3. Open the `.obj` files in **Blender**:
   * **Scale:** Adjust scale to match real-world meters (Director games often use pixel-proportional or custom coordinates).
   * **Hierarchy:** Separate moving components:
     * `Chassis` (main tank hull)
     * `Turret` (horizontal yaw rotation)
     * `Barrel` (vertical pitch rotation)
     * `LeftTreads` / `RightTreads` / `Wheels`
   * Export the cleaned model as **`.fbx`** or **`.glb`** directly into `Assets/Art/Models/` in Unity.

---

## 6. Step 4: Extract Audio and UI Textures

* **Textures (`BITD` Chunks):**
  * Extracted as `.png` or `.bmp` images.
  * In Unity Inspector: Set **Filter Mode** to `Point (no filter)` and **Compression** to `None` or `High Quality` to retain the authentic 2006 retro look.
* **Audio (`snd` Chunks):**
  * Extracted as 22kHz / 44.1kHz `.wav` files (engine loops, firing SFX, explosions, stunt jingles).
  * Import directly into Unity's `Assets/Audio/` folder.

---

## 7. Step 5: Rebuilding in Unity (PhysX Setup)

Because Unity natively runs on **NVIDIA PhysX**, replicating the feel of *Team Tanks* is straightforward:

### 1. Tank Physics Rig:
* **Root GameObject:** Add a `Rigidbody` (Mass ~1500 kg, Interpolate: Interpolate, Collision Detection: Continuous Dynamic).
* **Center of Mass:** Create an empty child GameObject positioned slightly below the floor of the tank chassis and assign it via script:
  ```csharp
  GetComponent<Rigidbody>().centerOfMass = centerOfMassTransform.localPosition;
  ```
  *(A low center of mass is essential to replicate Team Tanks' acrobatic stunts without flipping uncontrollably on minor bumps).*
* **Suspension:** 
  * Option A: Unity's native `WheelCollider` components.
  * Option B (Recommended for stunt games): A custom **Raycast Suspension** script applying upward spring forces `F = -k * x - c * v` to the Rigidbody. This prevents snagging on arena ramps and terrain seams.

### 2. Stunt & Air-Control Mechanics:
* When the tank leaves the ground (all raycasts detect no collision):
  * Enable rotational stunt controls (`Torque` applied via WASD/Arrow keys for barrel rolls and backflips).
  * Accumulate rotation angles in mid-air (`Vector3.SignedAngle` per frame).
  * On landing (when wheels touch ground again), calculate total stunt points and grant temporary speed/invincibility boosts.

---

## 8. Fallback / Live Capture (If Extraction Stalls)

If any specific model or texture cannot be parsed from the `.dir` file:
1. Run `teamtanks(RavenWoods Version)/NVidiaShockwaveFix.exe` to enable compatibility.
2. Launch `teamtanks(RavenWoods Version)/teamtanks.exe`.
3. Use **Ninja Ripper** or **RenderDoc** attached to the game process to rip the exact 3D vertex buffers, UVs, and textures directly from GPU memory during gameplay.
