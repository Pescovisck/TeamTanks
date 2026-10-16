# Team Tanks network protocol (reconstructed from decompiled Lingo)

Sources: `lingo/Internal/MovieScript 3 - mus.ls` (receive/lobby), `ParentScript 5 - goody.ls` (`goodmus`, state sync),
`ParentScript 7 - weaponry.ls` (fire events), `ParentScript 47 - dataminer.ls`, `ParentScript 9 - stats.ls`,
`BehaviorScript 31 - endgame.ls` (HTTP). All of this is static reading; no traffic was observed.

## 1. Transport: Adobe Multiuser Server (Multiusr.x32)
| Field | Value |
|---|---|
| Server | `77.92.78.64`, TCP `1626` (hardcoded `mla`) |
| movieID | `teamtanks2` |
| userID | player tag (`nom`); on login error a random digit 0-8 is appended and it retries |
| password | literal `"password"` |
| encryptionKey | `kwe123eefw3434mwe` (Multiuser's built-in logon encryption) |

Message payloads are Lingo values (property lists, vectors, symbols) serialized by the Multiuser Xtra.
A reimplementation needs a Shockwave Multiuser-compatible server or its own transport.

Tag validation (`VerifyUserName`): keep only `[a-z0-9]`, then reject if `value("#"&tag)` stringifies to `"0"` or contains `.`.

## 2. Lobby
1. `system.movie.getGroups` (subject `checkrooms`).
2. Build room names `@<Map>_<variant>_<n>`, n = 1..10, for maps
   `Grass_1/2, Canyon_1/2, Pyramids_1/2, Techno_1, Artic_1` (+ `specialops_1`, see below), filtered by the lobby choice.
3. `system.group.getUserCount` with that list (subject `showgroupcount`); each reply gives `groupName`, `numbermembers`.
   Max 10 players per room (`gmaxusers`).
4. Joining a room selects `glevel` from the room name (map, variant = level image `<map><variant>`, `groompos`).
5. Special Ops rooms require `datamytank` item 1 (server rank) >= 15; otherwise "Access Restricted".

Map table (`vleveldata`): grid unit / heightmap scale / friction:
grass 180/0.012/0.07, canyon 220/0.02/0.12, pyramids 180/0.025/0.10, artic 200/0.025/0,
specialops 380/0.03/0.20, techno 160/0.027/0.20.

## 3. In-game messages
All go to the room group (`submitmus` -> recipients `gmygroup`) unless noted (`submitone` = single user).
Receivers ignore their own echo except for `where` (anti-cheat) and `dead` (kill feed).

### State sync: `where` (every 16 frames from `goody.goodmus`; inbox polled on frame 8)
Always: `#pos` vector, `#rot` vector, `#pgunrot`, `#pweapon` symbol, `#team` (`#red`/`#blue`).
Optional, only when changed/non-zero:
| key | meaning |
|---|---|
| `#shots` | shots fired since last packet (receiver plays misses) |
| `#myhu` | self-damage |
| `#hurts` | proplist `playerName: damage` dealt by the sender; each named receiver applies it to itself (client-authoritative damage) |
| `#scores` | sender's total score |
| `#cap` | `[value, capturePointIndex]` capture progress |
| `#stealth` / `#thrust` | active flag for stealth / thrusters |
| `#rc` | remote-controlled bomb/rocket state (`premote.pmusdata`) |

The first `where` from an unknown sender creates their tank (`baddies.new`) and prints "X joins <team>";
an invalid team falls back to `#red`.

### Projectile / item spawns
Common fields: `#pos`, `#rot` (or `#pendpos`), `#pteam`, `#pid` (unique projectile id), sometimes `#pname`.
| subject | extra | spawns |
|---|---|---|
| `bgun` | | `shells` (cannon) |
| `nook` | | `nooks` (nuke) |
| `rocket` | `#typ` = weapon (rocket, rocketx4, ...) | `rockets` |
| `mine` | `#typ` = `"proximity"`/`"remote"` | `mines` (max 6 prox / 4 remote per player) |
| `mortar` | | `mortars` |
| `airstrike` | | `airstrike` |
| `guidedmissile` | `#pendpos`, `#pwhogotit` (locked target), `#shooter` | `guidedmissile` |
| `sonicblast` | `#pendpos` | `sonicblast` |
| `health` | | `healthscript` (max 4 per player) |
| `detonate` | `#pid` (`<name>rcbomb`, `<name>rcrocket`, or mine id) | calls `detonate()` on that actor |

### Events
| subject | content | effect |
|---|---|---|
| `dead` | `#killer, #pos, #rot, #velo, #vang, #typ` | explosion, respawn at given pose, kill feed "`killer <verb> victim`"; killer gets +200 and kill stats. Killer `"Re spawn"` = voluntary respawn, `"Re play"` = silent |
| `left` | `#killer: "Fear"` | removes tank, "X leaves"; followed by `system.group.leave` |
| `talk` | string | chat line (rate-limited by `pchatabuser` = 30 frames) |
| `super` / `endsuper` | - | supercharge on/off |
| `helloworld` | - | sent on spawn; others reply with capture-point state (`capupdate`) |
| `capupdate` (direct) | `#glow, #id` | sync capture point glow |
| `cappoint` | `#id, #team, #val` | push capture progress |
| `findrank` (direct) -> `sortrank` | `#rank` string | rank exchange; "promoted: <rank>" medal |
| `ignore` | - | keep-alive filler |
| `gettime` | to `system.server.getTime` | reply `"...:<min>:<sec>"` sets round clock |

Kill-feed verbs by weapon: mine "mines", gun/mgun "guns", bgun "cannons", nook "nooks", rocket "rockets",
proximitymine "mines", lasergun "lasers", mgunx2 "twin 73's", rocketx4 "tankbusts", remotemine "remote mines",
sonicgun "sonic blasts", guidedmissile "missiles", mortar "mortars", airstrike "airstrikes", rcbomb "remote bombs",
rcrocket "remote rockets", others "gets".

### Client-side anti-cheat
- Speed hack: the client times the server timestamps of its own `where` echoes; if the average interval drops below
  290 ms it navigates to gamevial.com (kicks itself).
- Lives tamper (`goody.cheatfinder`): lives stored with an alternating offset; a mismatch triggers `creq()`.
- Trust model: damage, score, kills and rank are all reported by the client. The server only relays messages.

## 4. Ranks
Local: `_player` pref `teamtanks_data` -> `kills_today`; rank index = kills_today/10 + 1 (max 14), reset daily:
Tank Private, Tank Gunner, Tank Captain, Tank Style Technician, Tank Commander, Chief Style Technician, Corporal,
Sergeant, Gunnery Sergeant, Master Sergeant, Master Gunnary Sergeant, Master Chief, Veteran, Special Ops.

## 5. HTTP (gamevial.com, form POST via `postNetText`; replies are `;`-separated, item 1 = `"1"` on success)
Endpoint `http://www.gamevial.com/data/gamecomms.php`, all with `sessionID` (from the hosting web page):
| action | params | reply -> member |
|---|---|---|
| `isloggedin` | | `1;<name>;<x>` -> `datame`, sets player name |
| `mytank` | `game=teamtanks` | `1;<rankpos>;<a>;<b>` -> `datamytank` (default `1;0;0`) |
| `stats` (get) | `game` | `1;<Lingo proplist>` -> `datastats` (schema in `assets/text/datastatstest_*.txt`) |
| `stats` (save) | `game`, `stats` = proplist text | |
| `inventory` | `game` | `1;<weap>:<...>;<weap>:<...>` -> `dataweapons`; each weapon name unlocks that pickup |
| `calendar` | | `a;b;<day>` -> `datacal`; premiere weapon = premium list[(day mod 13) or 13] |
| `promote` | `game` | |

Also: `scoreboard.php` with `game` (`tt<map><level>` or `teamtanks`), `score`, `nickname`;
`data/shopzone.php` (weapon shop, from the Flash lobby).
