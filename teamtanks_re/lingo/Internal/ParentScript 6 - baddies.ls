property pos, rot, pgunrot, speed, plives, bsp, bon, pmod, pturret, pgun, pback, pteam, pmussteps, pweapon, poldweapon, pname, tarpos, tarrot, pguntarrot, misses, aiming, pdummy, pmytag, pmyov, pOffset, phavoverlay, pwheelgroup, pparts, psuper, pspawnprotect, pscore, pweaplist, pstealth, pthrust, pthrustmod, premote, premotestate, pshad
global ghvk, gmem, gplayers, gredplayers, gblueplayers, goody, gmodinc, gsoldiers, gsmokes, govlist, gtaglist

on new me, data
  phavoverlay = 0
  misses = 0
  pname = data.senderid
  pweapon = data.content.pweapon
  poldweapon = pweapon
  pgunrot = data.content.pgunrot
  pguntarrot = pgunrot
  pteam = data.content.team
  pmod = recyclemodel(#tank)
  vs = shady("tank_" & string(pteam))
  pshad = vs
  vs.shininess = 90
  pmod.shaderList[1] = vs
  pmod.shaderList[2] = gmem.shader("blackshine")
  pweaplist = [#mgun, #bgun, #nook, #rocket, #proximitymine, #speed, #lasergun, #mgunx2, #rocketx4, #remotemine, #sonicgun, #guidedmissile, #thrusters, #mortar, #airstrike, #rcbomb, #rcrocket, #health, #stealth]
  pmod.removeFromWorld()
  pmod.addToWorld()
  pturret = recyclemodel(#turret)
  vs = shady("turret")
  pturret.shaderList = vs
  pturret.transform.position = vector(0, 0, 13)
  pgun = recyclemodel(#mgun)
  vs = shady("mgun")
  pgun.shaderList = vs
  vs.shininess = 90
  pgun.transform.position = vector(0, 0, 0)
  pback = recyclemodel(#speed)
  pback.transform.position = vector(0, 0, 0)
  vs = shady(string(pteam) & "speed")
  pback.shaderList = vs
  vs.shininess = 90
  vside = 22
  vforbac = 22
  vhig = -12
  oset = [vector(-vside, vforbac + 3, vhig), vector(vside, vforbac + 3, vhig), vector(-vside, -vforbac + 3, vhig), vector(vside, -vforbac + 3, vhig)]
  vparts = [#wfl, #wfr, #wbl, #wbr]
  pparts = []
  pwheelgroup = recyclegroups()
  repeat with i = 1 to vparts.count
    partmod = recyclemodel(vparts[i])
    partmod.shaderList = shady("wheels")
    partmod.transform.position = oset[i]
    partmod.transform.scale = vector(1, 1, 1) * 1.69999999999999996
    partmod.parent = pwheelgroup
    pparts.add(partmod)
  end repeat
  pturret.parent = pwheelgroup
  pgun.parent = pturret
  pback.parent = pwheelgroup
  speed = vector(0, 0, 0)
  bsp = pmod.boundingSphere[2] * 0.75
  psuper = 0
  pmussteps = 0
  pscore = 0
  pstealth = 0
  pthrust = 0
  pthrustmod = VOID
  gplayers.add(me)
  if string(pteam) = "red" then
    gredplayers.add(me)
  else
    gblueplayers.add(me)
  end if
  submitone(pname, [#subject: "findrank", #content: EMPTY])
  repos(me, data.content.pos, data.content.rot, "qwe")
  (the actorList).add(me)
  return me
end

on newstuff me, data
  pmussteps = 16
  tarpos = data.pos
  tarrot = data.rot
  pguntarrot = data.pgunrot
  pweapon = data.pweapon
  if pweapon <> poldweapon then
    reload(me, pweapon)
    poldweapon = pweapon
  end if
end

on stepFrame me
  if not voidp(goody) then
    if (goody.pstate = "play") or (goody.pstate = "repos") then
      if phavoverlay = 0 then
        maketag(me)
      else
        tag(me)
      end if
    end if
  end if
  if pthrust and (pthrustmod <> VOID) then
    vxqwe = random(2) - 1
    vyqwe = random(2) - 1
    pthrustmod.shader.textureTransform.position = vector(vxqwe, -vyqwe, 0)
  end if
  if pspawnprotect > 0 then
    pspawnprotect = pspawnprotect - 1
  end if
  if aiming > 0 then
    aiming = aiming - 1
  else
    if misses > 0 then
      shoot(me)
    end if
  end if
  if (goody.pstate = "play") or (goody.pstate = "repos") then
    pmussteps = pmussteps - 1
  end if
  if pmussteps > 0 then
    speed = (tarpos - pos) / pmussteps
    torq = rotinterp(rot, tarrot, pmussteps)
    pos = pos + speed
    rot = rot + torq
    vguntorq = rotinterp(pgunrot, pguntarrot, pmussteps)
    pgunrot = pgunrot + vguntorq
    vspd = speed.dot(getnormal(pmod, vector(0, -1, 0)))
    repeat with vwh = 1 to pparts.count
      pparts[vwh].rotate(vector(vspd * 2, 0, 0), #self)
    end repeat
  else
    pos = tarpos
    rot = tarrot
    speed = vector(0, 0, 0)
    if pmussteps = -450 then
      goody.feedback(pname & " disconnects")
      die(me)
    end if
  end if
  pmod.transform.position = pos
  pmod.transform.rotation = rot
  pgun.transform.rotation.x = pgunrot.x
  pturret.transform.rotation.z = pgunrot.z
  pwheelgroup.parent = pmod
end

on tag me
  if not (pmyov > goody.pcam.overlay.count) then
    p = goody.pcam.worldSpaceToSpriteSpace(pos) - pOffset
    if p <> 0 then
      goody.pcam.overlay[pmyov].loc = p
    else
      goody.pcam.overlay[pmyov].loc = point(-1000, 0)
    end if
  end if
end

on supercharge me
  psuper = 1
  vshad = shady(string("supercharge" & pteam))
  vshad.emissive = rgb(255, 255, 255)
  pmod.shaderList = vshad
  playsound(pos, "superpowerup")
end

on endsupercharge me
  psuper = 0
  pmod.shaderList[1] = pshad
  pmod.shaderList[2] = gmem.shader("blackshine")
  playsound(pos, "superpowerdown")
end

on sortstealth me, nstate
  if nstate = 1 then
    if (goody.pstate = "play") or (goody.pstate = "repos") then
      goody.pcam.overlay[pmyov].blend = 0
    end if
    pmod.visibility = #none
    repeat with i = 1 to pparts.count
      pparts[i].visibility = #none
      script("stealthsparkle").new(pmod.transform.position)
    end repeat
    pturret.visibility = #none
    pgun.visibility = #none
    pback.visibility = #none
  else
    if nstate = 0 then
      if (goody.pstate = "play") or (goody.pstate = "repos") then
        goody.pcam.overlay[pmyov].blend = 100
      end if
      pmod.visibility = #front
      repeat with i = 1 to pparts.count
        pparts[i].visibility = #front
      end repeat
      pturret.visibility = #front
      pgun.visibility = #front
      pback.visibility = #front
      script("stealthsparkle").new(pmod.transform.position)
      reload(pweapon)
    end if
  end if
  pstealth = nstate
end

on sortthrust me, nstate
  if nstate = 1 then
    if pthrustmod = VOID then
      pthrustmod = recyclemodel(#thrust)
      if pthrustmod = 0 then
        gmodinc = gmodinc + 1
        pthrustmod = gmem.model("thrust").clone("thrust" & gmodinc)
      end if
      pthrustmod.shaderList = shady("thrust")
      pthrustmod.visibility = #none
      pthrustmod.shader.texture.nearFiltering = 1
      pthrustmod.shader.texture.renderFormat = #rgba8888
      pthrustmod.shader.emissive = rgb(255, 255, 255)
      pthrustmod.shader.blend = 100
      pthrustmod.shader.textureTransform.scale = vector(1, 1, 1) * 2
      pthrustmod.parent = pmod
      pthrustmod.transform.position = vector(0, 0, 0)
    else
      pthrustmod.visibility = #both
    end if
  else
    if nstate = 0 then
      if pthrustmod <> VOID then
        pthrustmod.visibility = #none
      end if
    end if
  end if
  pthrust = nstate
end

on sortremote me, nstate, ndata
  vdata = ndata
  if nstate = 1 then
    if premote = VOID then
      premote = script("baddyremote").new(pos, rot, pname, pteam, pweapon, me)
    else
      premote.newstuff(vdata)
    end if
  else
    if nstate = 0 then
      if premote <> VOID then
        premote.detonate()
      end if
    end if
  end if
  premotestate = nstate
end

on hurt me, howbad
  playsound(pos, "crash")
end

on repos me, npos, nrot, nweap, nvelo, nango
  if nweap <> "qwe" then
    if voidp(nvelo) then
      nvelo = vector(0, 0, 0)
    end if
    if voidp(nango) then
      nango = vector(0, 0, 0)
    end if
    if (goody.pstate = "play") or (goody.pstate = "repos") then
      porkchop = script("porkchop", "parents").new(pos, rot, nvelo, nango)
    end if
  end if
  pos = npos
  hit = gmem.modelsUnderRay(pos, vector(0, 0, -1), 1, #detailed)
  if hit.count > 0 then
    pos = hit[1].isectPosition + vector(0, 0, bsp)
  end if
  pmod.transform.position = pos + vector(0, 0, 0)
  rot = nrot
  pmod.transform.rotation = rot
  tarpos = pos
  tarrot = rot
  pspawnprotect = 210
  pstealth = 0
  pthrust = 0
  if premote <> VOID then
    premote.detonate()
  end if
  if (phavoverlay = 1) and (pstealth = 1) then
    sortstealth(me, 0)
  end if
  reload(me, pweapon)
end

on shoot me
  misses = misses - 1
  aiming = 3
  if (pweapon = #mgun) or (pweapon = #mgunx2) or (pweapon = #lasergun) then
    muzzle = script("muzzle").new(me, pweapon)
  end if
  vgunrot = pgun.getWorldTransform().rotation
  vgunpos = pgun.getWorldTransform().position
  if string(pweapon) = "lasergun" then
    playsound(pos, "relaser", 5)
    tracer = script("tracer").new(vgunpos, vgunrot, "lasergun")
  else
    playsound(pos, "gunfire", 5)
    if random(3) = 1 then
      tracer = script("tracer").new(vgunpos, vgunrot, "mgun")
    end if
  end if
end

on reload me, nweap
  vgres = ["mgun", "bgun", "nooklauncher", "rocketlauncher", 0, 0, "lasergun", "mgunx2", "rocketlauncherx4", 0, "sonicgun", "guidedmissilelauncher", 0, "mortarlauncher", "airstrikelauncher", 0, "rcrocketlauncher", 0, 0]
  vtres = ["turret", "turret", "turret", "turretround", 0, 0, "laserturret", "turret", "turretround", 0, "turretround", "turretround", 0, "turretround", "turretround", "rcbomblauncher", "turretround", 0, 0]
  vbres = [0, 0, 0, 0, "minelauncher", "speed", 0, 0, 0, "minelauncher", 0, 0, "thrusters", 0, 0, 0, 0, "minelauncher", "stealth"]
  vtweap = pweaplist.getOne(nweap)
  if not vtweap then
    pgun.visibility = #none
    pturret.visibility = #none
    pback.visibility = #none
  else
    if vgres[vtweap] = 0 then
      pgun.visibility = #none
    else
      pgun.visibility = #front
      pgun.resource = gmem.model(vgres[vtweap]).resource
      if (vgres[vtweap] = "mgun") or (vgres[vtweap] = "mgunx2") or (vgres[vtweap] = "bgun") then
        vs = shady(string(vgres[vtweap]))
        pgun.shaderList = vs
        vs.shininess = 90
      else
        if vgres[vtweap] = "rcrocketlauncher" then
          pgun.shaderList[1] = shady(pteam & "rocketlauncher")
          pgun.shaderList[2] = shady(pteam & "rcrocket")
        else
          if vgres[vtweap] = "rocketlauncherx4" then
            pgun.shaderList[1] = shady(pteam & "rocketlauncher")
            pgun.shaderList[2] = shady(pteam & "rocket")
          else
            if vgres[vtweap] = "airstrikelauncher" then
              vs = shady(pteam & "rocketlauncher")
              pgun.shaderList = vs
            else
              vs = shady(pteam & string(vgres[vtweap]))
              pgun.shaderList = vs
            end if
          end if
        end if
      end if
    end if
    if vtres[vtweap] = 0 then
      pturret.visibility = #none
    else
      pturret.visibility = #front
      pturret.resource = gmem.model(vtres[vtweap]).resource
      if vtres[vtweap] = "rcbomblauncher" then
        pturret.shaderList[1] = shady(pteam & "rocketlauncher")
        pturret.shaderList[2] = shady(pteam & "rcbomb")
      else
        if vtres[vtweap] = "laserturret" then
          vs = shady(pteam & string("lasergun"))
          vs.shininess = 90
          pturret.shaderList = vs
        else
          if vtres[vtweap] = "turretround" then
            vs = shady(string("turret"))
            vs.shininess = 90
            pturret.shaderList = vs
          else
            vs = shady(string(vtres[vtweap]))
            vs.shininess = 90
            pturret.shaderList = vs
          end if
        end if
      end if
    end if
    if vbres[vtweap] = 0 then
      pback.visibility = #none
    else
      pback.visibility = #front
      pback.resource = gmem.model(vbres[vtweap]).resource
      vs = shady(pteam & string(vbres[vtweap]))
      vs.shininess = 90
      pback.shaderList = vs
    end if
  end if
  waitgun = 5
end

on maketag me
  phavoverlay = 1
  pcam = goody.pcam
  member("tag").text = EMPTY & pname
  if string(pteam) = "red" then
    vcol = rgb(217, 1, 0)
  else
    vcol = rgb(0, 1, 217)
  end if
  member("tag").color = vcol
  pOffset = point(member("tag").width / 2, 40)
  if voidp(govlist) then
    govlist = []
    gtaglist = []
    if voidp(gmem.texture("tag" & me)) then
      pmytag = gmem.newTexture("tag" & me, #fromCastMember, member("tag"))
    end if
    pmytag.renderFormat = #rgba8888
    pcam.addOverlay(pmytag, point(0, 0), 0)
    pmyov = pcam.overlay.count
  else
    if govlist.count = 0 then
      if voidp(gmem.texture("tag" & me)) then
        pmytag = gmem.newTexture("tag" & me, #fromCastMember, member("tag"))
      end if
      pmytag.renderFormat = #rgba8888
      pcam.addOverlay(pmytag, point(0, 0), 0)
      pmyov = pcam.overlay.count
    else
      pmyov = govlist[1]
      pmytag = gtaglist[1]
      govlist.deleteAt(1)
      gtaglist.deleteAt(1)
      pmytag.member = member("tag")
      pcam.overlay[pmyov].blend = 100
    end if
  end if
end

on sortranks me, nrank
  if voidp(nrank) then
    nrank = "Tank Private"
  end if
  vimg = new(#bitmap)
  vimg.image = member("tank_" & string(pteam)).image
  vranks = ["Tank Private", "Tank Gunner", "Tank Captain", "Tank Style Technician", "Tank Commander", "Chief Style Technician", "Corporal", "Sergeant", "Gunnery Sergeant", "Master Sergeant", "Master Gunnary Sergeant", "Master Chief", "Veteran", "Special Ops"]
  vfrm = vranks.getPos(nrank)
  member("achievements").image = member("achievements" & vfrm).image
  vimg.image.copyPixels(member("achievements").image, [point(95, 6), point(131, 6), point(131, 56), point(95, 56)], member("achievements").image.rect, [#blendLevel: 200, #dither: 1])
  vimg.image.copyPixels(member("achievements").image, [point(394, 390), point(436, 390), point(436, 448), point(394, 448)], member("achievements").image.rect, [#blendLevel: 200, #dither: 1])
  vimg.image.copyPixels(member("achievements").image, [point(276, 250), point(276, 196), point(313, 196), point(313, 250)], member("achievements").image.rect, [#blendLevel: 200, #dither: 1])
  if voidp(gmem.texture("tankskin" & pname)) then
    vtex = gmem.newTexture("tankskin" & pname, #fromImageObject, vimg.image)
    vtex.renderFormat = #rgba8888
    vtex.nearFiltering = 1
    vtex.quality = #high
  else
    gmem.texture("tankskin" & pname).image = vimg.image
    vtex = gmem.texture("tankskin" & pname)
  end if
  if voidp(gmem.shader("tankskin" & pname)) then
    pshad = gmem.newShader("tankskin" & pname, #standard)
    pshad.emissive = rgb(255, 255, 255)
    pshad.shininess = 0
  else
    pshad = gmem.shader("tankskin" & pname)
  end if
  pshad.texture = vtex
  pmod.shaderList[1] = pshad
  vimg.erase()
end

on die me
  storemodel(#tank, pmod)
  storemodel(#mgun, pgun)
  storemodel(#turret, pturret)
  storemodel(#speed, pback)
  if pthrustmod <> VOID then
    storemodel(#thrust, pthrustmod)
  end if
  storegroup(pwheelgroup)
  gmem.deleteTexture("tankskin" & pname)
  gmem.deleteShader("tankskin" & pname)
  vparts = [#wfl, #wfr, #wbl, #wbr]
  repeat with i = 1 to vparts.count
    storemodel(vparts[i], pparts[i])
  end repeat
  if not voidp(pmyov) then
    if goody.pcam.overlay.count >= pmyov then
      govlist.add(pmyov)
      gtaglist.add(pmytag)
      goody.pcam.overlay[pmyov].blend = 0
    end if
  end if
  gplayers.deleteOne(me)
  if string(pteam) = "red" then
    gredplayers.deleteOne(me)
  else
    gblueplayers.deleteOne(me)
  end if
  if premote <> VOID then
    premote.detonate()
  end if
  (the actorList).deleteOne(me)
end
