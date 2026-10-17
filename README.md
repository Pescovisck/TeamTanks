# Team Tanks (Web Port)

A faithful web preservation and modern browser recreation of **Team Tanks**, the iconic 2006 Shockwave 3D / GameVial multiplayer vehicular combat game.

Built with **Three.js**, **React 19**, and **Tailwind CSS**, featuring real-time peer-to-peer multiplayer via WebRTC and MQTT matchmaking.

---

## Features

- **Accurate Shockwave 3D Simulation**:
  - Physics, vehicle handling, and arcade stunts recreated directly from decompiled Shockwave Lingo source code (`goody.ls`, `ageia.ls`, `weaponry.ls`).
  - Original tank bounding calculations, surface-aligned traction, reverse-steering, and jump flips (`Back`, `Front`, `Backside`, `Frontside`).
  - Authentic projectile ballistic mechanics, including timed bounce-fuse lob weapons (Nook, Mortar) and obstacle bouncing.
- **Full Arsenal Recovered**:
  - Twin 73, Cannon (`bgun`), Rocket, Tankbuster (`rocketx4`), Guided Missile, Laser, Sonic Gun.
  - Lobbed explosives: Nook (tactical nuclear strike) and Mortar.
  - Deployables: Proximity Mines, Remote Detonation Mines, Repair/Health Packs, Airstrikes.
  - Utility gear: Thrusters (jump jet), Turbo Speed Boost, Stealth Cloaking.
  - Remote vehicles: Controllable RC Bomb (ground) and RC Rocket (air).
- **All 9 Classic Battlegrounds**:
  - Grass I & II, Canyon I & II, Pyramids I & II, Arctic, Techno, and Special Ops (Asteroid).
  - Procedural terrain reconstructed from original heightmaps and props.
  - Authentic additive ground texture shaders and lighting presets.
- **Multiplayer & Matchmaking**:
  - Instant peer-to-peer room creation and join links via WebRTC (PeerJS) and Public MQTT signaling.
  - Real-time tank state synchronization, turret aiming, and weapon fire events.
  - End-of-round synchronized map voting lobby.
  - Intelligent bot AI for single-player practice or filling team slots.
- **Audio & Sights**:
  - Restored original sound effects and audio mixing.
  - Dynamic HUD with kill feed, scoreboard, capture point status, mini-radar, and weapon-specific aiming reticles.
  - Casual and Pro (freelook mouse aiming) camera modes.

---

## Controls

| Key / Action | Action |
| :--- | :--- |
| **W, A, S, D** or **Arrow Keys** | Drive & Steer (reverse-steers like original) |
| **Space** | Jump / Stunt Flip |
| **Left Mouse Button** or **F** / **Ctrl** | Fire Active Weapon |
| **Right Mouse Button** | Aim Down Sights (ADS) / Zoom / Detonate Remote Mine / Release RC |
| **Mouse Aim** | Turret Aiming (Casual auto-assist / Pro free aim) |
| **Q / E** | Turret Yaw Manual Controls |
| **Z / X** | Turret Pitch Manual Controls |
| **V** | Toggle Camera Mode (Casual vs. Pro Mode) |
| **M** | Toggle Audio Mute |
| **R** | Self-destruct / Respawn |
| **Tab** | Show Match Scoreboard |

---

## Tech Stack

- **Graphics & Engine**: [Three.js](https://threejs.org/)
- **UI & Presentation**: [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/)
- **Multiplayer Networking**: [PeerJS](https://peerjs.com/) (WebRTC DataChannels) + [MQTT.js](https://github.com/mqttjs/MQTT.js) (Signaling)
- **Build Tooling**: [Vite](https://vite.dev/), [TypeScript](https://www.typescriptlang.org/)

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm`

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Pescovisck/TeamTanks.git
   cd TeamTanks
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the local development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

4. Build for production:
   ```bash
   npm run build
   ```
   The bundled static files will be generated in `dist/`.

---

## Multiplayer Play

- **Host a Room**: Click **Host Room** on the landing page, pick your starting map and match settings, then copy the generated invite link.
- **Join a Room**: Open the share link on any computer or mobile browser, or enter the Room Code under **Join Room**.

---

## License & Credits

- Original game created by **GameVial** (2006).
- Web port and preservation created by fans, for fans, dedicated to archiving classic web browser 3D games.
