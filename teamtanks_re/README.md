# Team Tanks (GameVial) - reverse engineering notes

Target: teamtanks.exe, SHA-256 c4f2823499146f0ed3ea8c6e4eddc5f1669f83a27bf3ec2ca995ab1b1533009f
REA evidence: pe.json (inspect-pe-resources), art.json (inspect-artifact)

## Container layout
- PE32 Director 12 projector stub; overlay at 0x6E600 starts with a `PJ01` header
- APPL RIFX (little-endian "XFIR") at 4886136: 17 embedded Xtras (`File` chunks), Dict of Xtra paths
- Main movie MV93 at 12190308 (16 MB, uncompressed); source name D:\dev\gamevial\games\teamtanks\teamtanks10.dir
- The embedded movie's mmap uses exe-absolute offsets; rebase by -12190308 to get a standalone .dir (see rifx.py)

## Decompiled Lingo
lingo/ - 51 scripts, ~8,650 lines (ProjectorRays). Also tt_decompiled.dir (unprotected movie, opens in Director).

## Cross-check with shock.py
- shock.py extracted the same 17 Xtras (decompressed to real PE32 DLLs, all Adobe 12.0r111) -> xtras/, plus teamtanks10.dxr
- Decompiling shock.py's movie yields scripts byte-identical to lingo/ (independent confirmation)
- REA inspect-pe-resources evidence for Multiusr / dynamiks / Shockwave 3D Asset in xtras/*.pe.json
- `comms` (scriptId 44, Lscr 57990) and `dataminer_localhost` (scriptId 50, Lscr 57996) are genuinely empty:
  92-byte Lscr with 0 handlers/props/globals and empty scriptSrcText. Not a decompiler failure.

## Assets (export_assets.py + dirfile.py)
`python3 export_assets.py teamtanks10.dxr assets` (pure Python, no dependencies). Index: assets/index.json
- bitmaps/ 193 PNG: 32-bit BITD (PackBits RLE, per-row A,R,G,B planes) + ALFA alpha. Includes level maps
  <map>1 (R=height, G=object id, B=rotation), <map>1powerups (R=pickup id / spawn team), <map>1tex
- sounds/ 40: ediM -> MP3 (SWA header 0x140 stripped, or already ID3/raw MPEG); sndH+sndS -> WAV PCM
  (sndH big-endian u32: [1]=frames [11]=rate [17]=bits [18]=channels)
- 3d/3d_23561.w3d: Shockwave 3D world (IFX), 3DEM wrapper stripped
- flash/ 7 SWF (UI_menu, UI_trans, icons, ...), fonts/ 2 PFR (Eight Track, Lucida Sans Unicode)
- text/ 20: XMED text section 0002 "<hexlen>,<text>". Many hold leftover dev test data
  (datastatstest = full stats record schema, datacal = "4;30;15400", sample scoreboards)
- Not exported: 'physx' (Havok Xtra member with no media), 5 bitmap members without BITD

## Network protocol
See PROTOCOL.md: Multiuser login/lobby/rooms, every in-game message subject and field, client-side anti-cheat,
rank table, and the gamevial.com HTTP API (actions, params, reply formats).

## 3D world (w3d_inventory.py)
`python3 w3d_inventory.py assets/3d/3d_23561.w3d assets/3d/inventory.json`
- Shockwave W3D block layout: u32 type, u32 size, data padded to 4 (no U3D metadata field). Parses 432 blocks
  covering all 631,812 bytes.
- 66 models (tank body 'tank', 4 wheels wfl/wfr/wbl/wbr, turret/gun variants per weapon, projectiles, ramps/loop/twist,
  spawn, capturepoint, airship/bombs, pickups p1..p9), 42 shaders, 41 materials, 1 camera, 1 light.
- Not decoded: vertex/face data in 0xFFFFFF49 blocks (Shockwave compressed mesh bitstream). Converting to OBJ/glTF
  requires implementing that decoder, or re-exporting from Director with the 3D Xtra.
