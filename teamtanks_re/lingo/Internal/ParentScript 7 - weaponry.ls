property pos, muzzleflare, waitgun, shots, hurts, pthruster, premote, pweaplist, pweapsites, pstealth, pairstrike, pSpeed, poldweapon
global nom, gteam, gmem, ghvk, gplayers, gredplayers, gblueplayers, goody, pcam, gsmokes

on new me, who
  shots = 0
  waitgun = 0
  ticker = 1
  hurts = [:]
  pthruster = VOID
  pstealth = VOID
  premote = VOID
  pairstrike = VOID
  pSpeed = VOID
  pweaplist = [#mgun, #bgun, #nook, #rocket, #proximitymine, #speed, #lasergun, #mgunx2, #rocketx4, #remotemine, #sonicgun, #guidedmissile, #thrusters, #mortar, #airstrike, #rcbomb, #rcrocket, #health, #stealth]
  pweapsites = [1, 2, 3, 4, 0, 0, 5, 1, 4, 0, 6, 4, 0, 7, 8, 0, 0, 0, 0]
  poldweapon = goody.pweapon
  reload(me, goody.pweapon)
  (the actorList).add(me)
  return me
end

on stepFrame me
  if not voidp(goody) then
    gun(me)
  end if
end

on reload me, nweap
  vgres = ["mgun", "bgun", "nooklauncher", "rocketlauncher", 0, 0, "lasergun", "mgunx2", "rocketlauncherx4", 0, "sonicgun", "guidedmissilelauncher", 0, "mortarlauncher", "airstrikelauncher", 0, "rcrocketlauncher", 0, 0]
  vtres = ["turret", "turret", "turret", "turretround", 0, 0, "laserturret", "turret", "turretround", 0, "turretround", "turretround", 0, "turretround", "turretround", "rcbomblauncher", "turretround", 0, 0]
  vbres = [0, 0, 0, 0, "minelauncher", "speed", 0, 0, 0, "minelauncher", 0, 0, "thrusters", 0, 0, 0, 0, "minelauncher", "stealth"]
  vtweap = pweaplist.getOne(nweap)
  if not vtweap then
    goody.pgun.visibility = #none
    goody.pturret.visibility = #none
    goody.pback.visibility = #none
    if nweap = "hide" then
    else
      goody.pweapon = #none
      member("ammo_hud").image = member("ammo_hud_1").image
      texy("ammo_hud")
      member("ammo").image = member("ammoempty").image
      texy("ammo")
    end if
  else
    member("ammo_hud").image = member("ammo_hud_" & vtweap + 1).image
    texy("ammo_hud")
    if vgres[vtweap] = 0 then
      goody.pgun.visibility = #none
    else
      goody.pgun.visibility = #front
      goody.pgun.resource = gmem.model(vgres[vtweap]).resource
      if (vgres[vtweap] = "mgun") or (vgres[vtweap] = "mgunx2") or (vgres[vtweap] = "bgun") then
        vs = shady(string(vgres[vtweap]))
        goody.pgun.shaderList = vs
        vs.shininess = 90
      else
        if vgres[vtweap] = "rcrocketlauncher" then
          goody.pgun.shaderList[1] = shady(goody.pteam & "rocketlauncher")
          goody.pgun.shaderList[2] = shady(goody.pteam & "rcrocket")
        else
          if vgres[vtweap] = "rocketlauncherx4" then
            goody.pgun.shaderList[1] = shady(goody.pteam & "rocketlauncher")
            goody.pgun.shaderList[2] = shady(goody.pteam & "rocket")
          else
            if vgres[vtweap] = "airstrikelauncher" then
              vs = shady(goody.pteam & "rocketlauncher")
              goody.pgun.shaderList = vs
            else
              vs = shady(goody.pteam & string(vgres[vtweap]))
              goody.pgun.shaderList = vs
            end if
          end if
        end if
      end if
    end if
    if vtres[vtweap] = 0 then
      goody.pturret.visibility = #none
    else
      goody.pturret.visibility = #front
      goody.pturret.resource = gmem.model(vtres[vtweap]).resource
      if vtres[vtweap] = "rcbomblauncher" then
        goody.pturret.shaderList[1] = shady(goody.pteam & "rocketlauncher")
        goody.pturret.shaderList[2] = shady(goody.pteam & "rcbomb")
      else
        if vtres[vtweap] = "laserturret" then
          vs = shady(goody.pteam & string("lasergun"))
          vs.shininess = 90
          goody.pturret.shaderList = vs
        else
          if vtres[vtweap] = "turretround" then
            vs = shady(string("turret"))
            vs.shininess = 90
            goody.pturret.shaderList = vs
          else
            vs = shady(string(vtres[vtweap]))
            vs.shininess = 90
            goody.pturret.shaderList = vs
          end if
        end if
      end if
    end if
    if vbres[vtweap] = 0 then
      goody.pback.visibility = #none
    else
      goody.pback.visibility = #front
      goody.pback.resource = gmem.model(vbres[vtweap]).resource
      vs = shady(goody.pteam & string(vbres[vtweap]))
      vs.shininess = 90
      goody.pback.shaderList = vs
    end if
  end if
  waitgun = 5
end

on gun me
  waitgun = waitgun - 1
  if not voidp(goody.pweapon) then
    if (goody.ptyping = 0) or (goody.pstate = "play") then
      bullets = goody.weapons.getaProp(goody.pweapon)
      if waitgun < 1 then
        if bullets = 0 then
          reload(me)
        end if
        if (the mouseDown or the controlDown) and (goody.pstate = "play") then
          if goody.pgunmode = 0 then
            goody.autoaim()
          end if
          if bullets >= 1 then
            vnaebohs = [#speed, #thrusters, #health, #stealth, #none]
            if vnaebohs.getOne(goody.pweapon) = 0 then
              goody.pstats.pshots_total = goody.pstats.pshots_total + 1
              vfoo = integer(goody.pstats.pweapaccuracy_shots.getaProp(goody.pweapon)) + 1
              goody.pstats.pweapaccuracy_shots.setaProp(goody.pweapon, vfoo)
            end if
            howmuch = 1
            vid = goody.pweapon & random(5000)
            case goody.pweapon of
              #mgun:
                waitgun = 3
                playsound(goody.pos, "gunfire", 6)
                bullettest(me)
              #bgun:
                bgun = script("shells").new(goody.gunpos, goody.gunrot, nom, goody.pteam, vid)
                goody.pdummy.applyLinearImpulse(-angtovec(goody.gunrot) * (350 - (goody.pdummy.linearVelocity.magnitude * 2)), vector(0, 0, 20))
                submitmus([#subject: "bgun", #content: [#pos: goody.gunpos, #rot: goody.gunrot, #pname: nom, #pteam: goody.pteam, #pid: vid]])
                waitgun = 18
              #nook:
                goody.pdummy.applyLinearImpulse(-angtovec(goody.gunrot) * (700 - (goody.pdummy.linearVelocity.magnitude * 2)), vector(0, 0, 20))
                gren = script("nooks").new(goody.gunpos, goody.gunrot, nom, goody.pteam, vid)
                submitmus([#subject: "nook", #content: [#pos: goody.gunpos, #rot: goody.gunrot, #pname: nom, #pteam: goody.pteam, #pid: vid]])
                waitgun = 70
              #rocket:
                goody.pdummy.applyLinearImpulse(-angtovec(goody.prot) * (400 - (goody.pdummy.linearVelocity.magnitude * 2)), vector(0, 0, 20))
                rock = script("rockets").new(goody.gunpos, goody.gunrot, nom, goody.pteam, vid, goody.pweapon)
                submitmus([#subject: "rocket", #content: [#pos: goody.gunpos, #rot: goody.gunrot, #pname: nom, #pteam: goody.pteam, #pid: vid, #typ: goody.pweapon]])
                waitgun = 40
              #proximitymine:
                mine = script("mines").new(goody.pos, goody.rot, nom, goody.pteam, vid, "proximity")
                goody.pminelist.proximity.add(mine)
                goody.pallmines.add(mine)
                submitmus([#subject: "mine", #content: [#pos: goody.pos, #rot: goody.rot, #pteam: goody.pteam, #pid: vid, #typ: "proximity"]])
                if goody.pminelist.proximity.count > 5 then
                  goody.pminelist.proximity[1].detonate()
                end if
                waitgun = 18
              #remotemine:
                mine = script("mines").new(goody.pos, goody.rot, nom, goody.pteam, vid, "remote")
                goody.pminelist.remote.add(mine)
                goody.pallmines.add(mine)
                submitmus([#subject: "mine", #content: [#pos: goody.pos, #rot: goody.rot, #pteam: goody.pteam, #pid: vid, #typ: "remote"]])
                if goody.pminelist.remote.count > 3 then
                  goody.pminelist.remote[1].detonate()
                end if
                waitgun = 18
              #speed:
                waitgun = 1
                if pSpeed = VOID then
                  pSpeed = script("speedscript").new()
                end if
              #thrusters:
                waitgun = 1
                if pthruster = VOID then
                  pthruster = script("thrusters").new()
                end if
              #lasergun:
                waitgun = 3
                playsound(goody.pos, "relaser", 6)
                bullettest(me)
              #mgunx2:
                waitgun = 5
                playsound(goody.pos, "gunfire", 6)
                bullettest(me)
                goody.gunrot.z = goody.gunrot.z + random(3) - 2
                bullettest(me)
              #rocketx4:
                goody.pdummy.applyLinearImpulse(-angtovec(goody.prot) * (1000 - (goody.pdummy.linearVelocity.magnitude * 2)), vector(0, 0, 20))
                rock = script("rockets").new(goody.gunpos, goody.gunrot, nom, goody.pteam, vid, goody.pweapon)
                submitmus([#subject: "rocket", #content: [#pos: goody.gunpos, #rot: goody.gunrot, #pname: nom, #pteam: goody.pteam, #pid: vid, #typ: goody.pweapon]])
                waitgun = 40
              #sonicgun:
                fire = rayshoot(me, angtovec(goody.gunrot), 8000)
                if fire.pname <> 0 then
                  vpos = fire.pos
                else
                  vpos = goody.gunpos + (angtovec(goody.gunrot) * 8000)
                end if
                rocket = script("sonicblast").new(goody.gunpos, vpos, nom, vid, goody.pteam)
                submitmus([#subject: "sonicblast", #content: [#pos: goody.gunpos, #pendpos: vpos, #pname: nom, #pid: vid, #pteam: goody.pteam]])
                waitgun = 40
              #guidedmissile:
                vmaxdist = 8000
                vdir = angtovec(goody.gunrot)
                fire = rayshoot(me, vdir, vmaxdist)
                if fire.pname <> 0 then
                  vendpos = fire.pos
                  vfirename = fire.pname
                else
                  vendpos = goody.gunpos + (angtovec(goody.gunrot) * vmaxdist)
                  vfirename = 0
                end if
                vdist = vendpos.distanceTo(goody.gunpos)
                if string(goody.pteam) = "blue" then
                  vlist = gredplayers
                else
                  vlist = gblueplayers
                end if
                vname = 0
                repeat with vbad in vlist
                  vdelta = vbad.pos - goody.gunpos
                  if vdelta.magnitude < vmaxdist then
                    vdnorm = vdelta
                    vdnorm.normalize()
                    if vdir.distanceTo(vdelta) < 0.20000000000000001 then
                      if (vdelta.magnitude < vdist) or (vfirename = vbad.pname) then
                        vendpos = vbad.pos
                        vname = vbad.pname
                        exit repeat
                      end if
                    end if
                  end if
                end repeat
                rocket = script("guidedmissile").new(goody.gunpos, vendpos, vname, nom, vid, goody.pteam)
                submitmus([#subject: "guidedmissile", #content: [#pos: goody.gunpos, #pendpos: vendpos, #pwhogotit: vname, #shooter: nom, #pid: vid, #pteam: goody.pteam]])
                waitgun = 55
              #mortar:
                goody.pdummy.applyLinearImpulse(-angtovec(goody.gunrot) * (350 - (goody.pdummy.linearVelocity.magnitude * 2)), vector(0, 0, 20))
                mortar = script("mortars").new(goody.gunpos, goody.gunrot, nom, goody.pteam, vid)
                submitmus([#subject: "mortar", #content: [#pos: goody.gunpos, #rot: goody.gunrot, #pteam: goody.pteam, #pid: vid]])
                waitgun = 25
              #airstrike:
                if pairstrike = VOID then
                  fire = rayshoot(me, angtovec(goody.gunrot), 8000)
                  if fire.pname <> 0 then
                    gmem.model("airstriketarget").transform.position = fire.pos + (fire.norm * 2)
                    gmem.model("airstriketarget").pointAt(fire.pos)
                    vpos = fire.pos
                  else
                    vpos = gmem.model("airstriketarget").transform.position
                  end if
                  pairstrike = script("airstrike").new(vpos, goody.gunrot, nom, goody.pteam, vid)
                  submitmus([#subject: "airstrike", #content: [#pos: vpos, #rot: goody.gunrot, #pname: nom, #pteam: goody.pteam, #pid: vid]])
                end if
                waitgun = 25
              #rcbomb:
                if voidp(premote) then
                  premote = script("rcbomb").new(goody.gunpos, goody.gunrot, nom, goody.pteam, vid)
                  goody.pdummy.applyLinearImpulse(-angtovec(goody.prot) * (400 - (goody.pdummy.linearVelocity.magnitude * 2)), vector(0, 0, 20))
                  reload(me, "hide")
                end if
                waitgun = 20
              #rcrocket:
                if voidp(premote) then
                  premote = script("rcrocket").new(goody.gunpos, goody.gunrot, nom, goody.pteam, vid)
                  goody.pdummy.applyLinearImpulse(-angtovec(goody.prot) * (400 - (goody.pdummy.linearVelocity.magnitude * 2)), vector(0, 0, 20))
                  reload(me, "hide")
                end if
                waitgun = 1
              #health:
                vhealth = script("healthscript").new(goody.pos, goody.rot, vid)
                goody.phealthlist.add(vhealth)
                submitmus([#subject: "health", #content: [#pos: goody.pos, #rot: goody.rot, #pid: vid]])
                if goody.phealthlist.count > 3 then
                  goody.phealthlist[1].detonate()
                end if
                waitgun = 20
              #stealth:
                if voidp(pstealth) then
                  pstealth = script("stealthscript").new()
                end if
            end case
            goody.weapons.setaProp(goody.pweapon, bullets - 1)
          else
            if pthruster <> VOID then
              pthruster.die()
            end if
            if pstealth <> VOID then
              pstealth.die()
            end if
            if premote <> VOID then
              premote.bang()
            end if
            if pSpeed <> VOID then
              pSpeed.die()
            end if
            reload(me, "remove")
          end if
        else
          goody.pspeedo = 0
        end if
      else
      end if
    end if
  end if
end

on bullettest me
  repeat with bad in gplayers
    if bad.getaProp(#pwheelgroup) <> 0 then
      bad.pwheelgroup.removeFromWorld()
    end if
  end repeat
  vpains = [#mgun: 6, #mgunx2: 6, #lasergun: 3]
  vbounce = [#mgun: 300, #mgunx2: 300, #lasergun: 100]
  h = vpains.getaProp(goody.pweapon)
  badname = EMPTY
  shot = angtovec(goody.gunrot)
  goody.pdummy.applyLinearImpulse(-shot * (vbounce.getaProp(goody.pweapon) - (goody.pdummy.linearVelocity.magnitude * 2)), vector(0, 0, 20))
  if the rightMouseDown and goody.pgunmode then
    vray = goody.pray
  else
    gsmokes.removeFromWorld()
    vray = gmem.modelsUnderRay(goody.gunpos + (shot * goody.bsp * 2), shot, 1, #detailed)
    gsmokes.addToWorld()
  end if
  if vray <> [] then
    blood = 0
    repeat with bad in gplayers
      if vray[1].model = bad.pmod then
        if not voidp(bad) then
          if bad.getaProp(#pname) > 0 then
            badname = bad.pname
            blood = 1
          end if
          exit repeat
        end if
      end if
    end repeat
    shots = shots + 1
    if blood = 1 then
      if (bad.psuper = 0) and (bad.pteam <> goody.pteam) and (bad.pspawnprotect = 0) then
        goody.scorehurt(h)
      end if
      moo = value("#" & badname)
      arse = hurts.getaProp(moo)
      if arse <> 0 then
        hurts.setaProp(moo, arse + h)
      else
        hurts.addProp(moo, h)
      end if
      bang = script("blood").new(vray[1].isectPosition - (shot * goody.bsp / 2))
    else
      if blood = 2 then
        if (bad.psuper = 0) and (bad.pteam <> goody.pteam) and (bad.pspawnprotect = 0) then
          goody.scorehurt(h)
        end if
        bang = script("blood").new(vray[1].isectPosition - (shot * goody.bsp / 2))
      else
        bang = script("miss").new(vray[1].isectPosition, vray[1].isectNormal)
      end if
    end if
    vdest = vray[1].isectPosition
  else
    vdest = goody.gunpos + (shot * 8000)
  end if
  if string(goody.pweapon) = "lasergun" then
    tracer = script("tracer").new(goody.gunpos, goody.gunrot, "lasergun", vdest)
  else
    if random(3) = 1 then
      tracer = script("tracer").new(goody.gunpos, goody.gunrot, "gun", vdest)
    end if
  end if
  if (goody.pweapon = #mgun) or (goody.pweapon = #mgunx2) or (goody.pweapon = #lasergun) then
    muzzle = script("muzzle").new(me, goody.pweapon)
  end if
end

on rayshoot me, ndirn, nmax
  hitstuff = [#pos: pos + (ndirn * nmax), #pname: 0]
  gsmokes.removeFromWorld()
  ray = gmem.modelsUnderRay(goody.gunpos, ndirn, 1, #detailed)
  gsmokes.addToWorld()
  if ray.count <> 0 then
    ray = ray[1]
    if (ray.distance < nmax) or (nmax = 0) then
      hitstuff = [#pos: ray.isectPosition - (ndirn * goody.bsp * 0.5), #pname: ray.model.name, #norm: ray.isectNormal]
      repeat with bad in gplayers
        if bad.pmod.name = hitstuff.pname then
          hitstuff.pname = bad.pname
          exit repeat
        end if
      end repeat
    end if
  end if
  return hitstuff
end

on hurt me
end

on reloadwav me
  vsons = [#mgun: "repistol", #proximitymine: "repistol", #bgun: "reak47", #nook: "rerg6", #rocket: "rerg6", #speed: "rerg6", #flipper: "rerg6", #mgunx2: "repistol", #lasergun: "repistol", #rocketx4: "repistol", #remotemine: "repistol", #guidedmissile: "repistol", #mortar: "repistol"]
  vson = vsons.getaProp(goody.pweapon)
end
