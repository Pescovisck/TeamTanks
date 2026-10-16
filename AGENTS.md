# TeamTanks Web

Web remake of the classic 2006 GameVial Shockwave 3D game **TeamTanks**, built with React 19, Three.js, PeerJS (WebRTC multiplayer), and Vite.

## Project Structure

- `src/game/data.ts` — Weapons, maps, teams, ranks, and original game constants
- `src/game/models.ts` — W3D 3D model loader (`public/tt/models/models.bin`) and procedural rig builders
- `src/game/engine.ts` — Three.js 3D simulation, physics, AI bots, weapons, pickups, and camera modes
- `src/game/net.ts` — PeerJS WebRTC P2P multiplayer lobby & state synchronization
- `src/game/audio.ts` — Original MP3 sound effects & procedural audio synthesis
- `src/ui/Menu.tsx` — Main menu, tank customization, map & mode selection, multiplayer lobby
- `src/ui/Hud.tsx` — In-game HUD, radar, scoreboard, weapon sights, and chat
- `public/tt/` — Runtime 3D models, terrain heightmaps, textures, sounds, and HUD sprites
- `raw_assets/` & `teamtanks_re/` — Complete archive of decompiled Shockwave Director scripts (`.ls`), W3D/OBJ 3D models, textures, and Flash UI assets

## Commands

- `npm run dev` — Start Vite development server
- `npm run build` — Build production bundle to `dist/`
- `npm run preview` — Preview production build locally
