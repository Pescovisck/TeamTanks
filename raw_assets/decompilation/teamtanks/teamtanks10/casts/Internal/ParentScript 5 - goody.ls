property pmod, pcam, pcpos, pos, rot, momentum, bsp, ponfloor, pjump, pSpeed, pmaxspeed, pweapon, weapons, chambers, weaponry, pname, pingserver, myhu, ptyping, ptext, plives, poldlives, pcheatflick, pcheattime, pphysx, pdummy, pwfl, pwfr, pwbl, pwbr, wtf, gunwtf, gunpos, gunrot, pgunrot, pgunmode, voldgunmode, pcamoffset, pturret, pgun, pback, pspeedo, phavwheels, oset, pminelist, pallmines, pspinchange, poldrot, ptricksize, ptrickkey, poldtrick, puber, psuper, pstate, inc, pospd, pkiller, ptime, pteam, vengspd, pspawnprotect, pfilmstar, pfilmtog, pfilmrot, poldmloc, oldmloc, prot, ptargetfocus, pmousedelta, paiminc, pray, paimmode, phrot, pfrontlock, ptouching, poldscore, pscore, pstartlook, pturn, pbackwheel, pgunmove, pdeadspot, pstats, prank, poldrank, prankfactor, pwillrank, pcapture, pstattimer, pstattimeron, pmix, pshifter, phealthlist, ptankshad, pchatabuser, pcursorlock, pmissilelock, pstereo, pRight, pLeft, pfxcam, pammoold, phealthold, puberold
global gteam, gredspawnpos, gbluespawnpos, ghvk, gteambalancer, gcappoints, gmem, goody, glevel, gsmokes, groompos, gplayers, gredplayers, gblueplayers, oldkey, nom, grecmods, gscore, goldscore, voiceok, govlist, gtaglist, gmousediff, ghelp, ggunmode, gshadows

on new me
  govlist = []
  gtaglist = []
  pcam = gmem.camera(1)
  pcam.fieldOfView = 50
  pfilmstar = 0
  prepcam(me)
  pos = vector(0, 0, 10000)
  rot = vector(0, 0, 0)
  bsp = 55
  pname = nom
  pspinchange = vector(0, 0, 0)
  pospd = vector(0, 0, 0)
  poldrot = transform()
  pstate = "notready"
  pminelist = [#proximity: [], #remote: []]
  pallmines = []
  phealthlist = []
  if (the actorList).getOne(me) = 0 then
    (the actorList).add(me)
  end if
  goody = me
  set the keyDownScript to "goody.keywalk()"
  psoundticks = 0
  prot = vector(-1.19999999999999996, 0, 0)
  pfrontlock = 0
  oldmloc = the mouseLoc
  ptargetfocus = 2000
  pmousedelta = 0.5
  pray = []
  pstats = script("stats").new()
  pchatabuser = 0
  pcursorlock = 1
  pmissilelock = []
  prank = "Tank Private"
  poldrank = EMPTY
  prankfactor = 1
  pwillrank = 0
  sortcar(me)
  pstereo = 0
  set the exitLock to 1
end

on prep me
  if not voidp(gteambalancer) then
    gteambalancer.destroy()
  end if
  pteam = string(gteam)
  gunpos = vector(0, 0, 0)
  gunrot = vector(0, 0, 0)
  ptankshad = shady("tank_" & pteam)
  ptankshad.shininess = 90
  pmod.shaderList[1] = ptankshad
  pmod.shaderList[2] = gmem.shader("blackshine")
  gmem.shader("blackshine").shininess = 200
  vs = shady("mgun")
  pgun.shaderList = vs
  vs.shininess = 90
  vs = shady("turret")
  pturret.shaderList = vs
  vs.shininess = 90
  vs = shady(string(pteam) & "speed")
  pback.shaderList = vs
  vs.shininess = 90
  submitmus([#subject: "helloworld", #content: EMPTY])
  ptouching = 0
  replay(me)
  if gplayers.getOne(me) = 0 then
    gplayers.add(me)
  end if
  if string(pteam) = "red" then
    if gredplayers.getOne(me) = 0 then
      gredplayers.add(me)
    end if
  else
    if gblueplayers.getOne(me) = 0 then
      gblueplayers.add(me)
    end if
  end if
end

on replay me
  pfilmtog = 1
  poldmloc = VOID
  pfilmrot = vector(0, 0, 0)
  ptime = 600
  gettime()
  vengspd = 0
  premotecontrol = 0
  weapons = [#mgun: 80]
  chambers = weapons.duplicate()
  pweapon = #mgun
  myhu = 0
  ptyping = 0
  pjump = 0
  pbacfor = 0
  pturn = 0
  pspeedo = 0
  ptrickkey = [0, 0]
  pgunmove = 0
  gscore = 0
  goldscore = 0
  pscore = 0
  pstats.resetstats()
  setscore(me, 0)
  pdeadspot = vector(0, 0, 0)
  pname = nom
  pammoold = 0
  phealthold = 0
  puberold = 0
  if voidp(weaponry) then
    weaponry = script("weaponry").new(me)
  end if
  weaponry.reload(pweapon)
  vd = weaponry.pweaplist.getOne(pweapon)
  if vd <> 0 then
    member("site").image = member("site_" & weaponry.pweapsites[vd]).image
  end if
  Keys = []
  pstartlook = 1
  pcapturing = 0
  pstattimer = 0
  pstattimeron = 0
  pmod.shaderList[2] = gmem.shader("blackshine")
  pkiller = VOID
  repos(me, pweapon)
  resetstats(me)
  buildui()
  if not voidp(_player.getPref("teamtanks_data")) then
    vprefs = value(_player.getPref("teamtanks_data"))
    vkillstoday = vprefs.kills_today
    vrankpos = integer(float(vkillstoday) / 10) + 1
    if vrankpos > 14 then
      vrankpos = 14
    end if
    if string(vprefs.date) <> getsafedate() then
      vrankpos = 1
    end if
    vranks = ["Tank Private", "Tank Gunner", "Tank Captain", "Tank Style Technician", "Tank Commander", "Chief Style Technician", "Corporal", "Sergeant", "Gunnery Sergeant", "Master Sergeant", "Master Gunnary Sergeant", "Master Chief", "Veteran", "Special Ops"]
    prank = vranks[vrankpos]
    prankfactor = vrankpos
  else
    prank = "Tank Private"
    prankfactor = 1
  end if
  if prank <> poldrank then
    pwillrank = 1
  end if
  paimmode = "normal"
  pstate = "play"
  _player.cursor(200)
end

on prepcam me
  pcam.transform.position = vector(0, -1000, 1000)
  pcam.pointAt(vector(0, 0, 0))
end

on sortcar me
  pmod = recyclemodel(#tank)
  pmod.parent = gsmokes
  pmod.transform.position = pos
  bsp = pmod.boundingSphere[2]
  pphysx = member("physx")
  pdummy = ghvk.make_rb(pmod, #convexshape, #dynamic)
  pdummy.friction = 1
  pdummy.mass = 160
  parts = ["wfl", "wfr", "wbl", "wbr"]
  vside = 22
  vforbac = 22
  vhig = -15
  oset = [vector(-vside, vforbac + 3, vhig), vector(vside, vforbac + 3, vhig), vector(-vside, -vforbac + 3, vhig), vector(vside, -vforbac + 3, vhig)]
  phavwheels = []
  vbeh = ["pwfl=", "pwfr=", "pwbl=", "pwbr="]
  repeat with i = 1 to parts.count
    partmod = recyclemodel(parts[i])
    if i = 3 then
      pbackwheel = partmod
    end if
    partmod.parent = gsmokes
    partmod.shaderList = shady("wheels")
    partmod.transform.position = pmod.transform.position + oset[i]
    partmod.transform.scale = vector(1, 1, 1) * 1.69999999999999996
    qwe = ghvk.make_rb(partmod, #convexshape, #dynamic)
    qwe.friction = 0.40000000000000002
    qwe.mass = 40
    qwe.restitution = 0
    pphysx.DisableCollision(qwe)
    ghvk.addsus(qwe, pdummy, partmod.name, oset[i], vector(0, 0, 0))
    phavwheels.add(qwe)
  end repeat
  pwfl = phavwheels[1]
  pwfr = phavwheels[2]
  pwbl = phavwheels[3]
  pwbr = phavwheels[4]
  pdummy.centerOfMass = vector(0, -0.5, -14)
  pdummy.linearVelocity = vector(0, 0, 0)
  pturret = recyclemodel(#turret)
  pturret.transform.position = vector(0, 0, 13)
  pturret.parent = pmod
  pgun = recyclemodel(#mgun)
  pgun.transform.position = pturret.transform.position
  pgun.parent = pmod
  pgun.pointAtOrientation = [vector(0.0, 1.0, 0.0), vector(0.0, 0.0, 1.0)]
  pgunmode = ggunmode
  _mouse.mouseLoc = point(400, 280)
  pback = recyclemodel(#speed)
  pback.transform.position = vector(0, 0, 0)
  pback.parent = pmod
  if voidp(gmem.model("carshad")) then
    nmr = gmem.newModelResource("dummy", #plane)
    nmr.width = 120
    nmr.length = 120
    vmod = gmem.newModel("carshad", nmr)
    vs = shady("carshad")
    vmod.shaderList = vs
    vmod.visibility = #front
    vmod.parent = gsmokes
    vmod.transform.position = vector(0, 0, 30000)
    vmod = gmem.newModel("airstriketarget", nmr)
    if string(pteam) = "red" then
      vs = shady("airstrike_target_red")
      vtarcol = rgb(255, 0, 0)
    else
      vs = shady("airstrike_target_blue")
      vtarcol = rgb(0, 0, 255)
    end if
    vmod.shaderList = vs
    vmod.shaderList.shininess = 0
    vmod.shader.shaderList.emissive = vtarcol
    vmod.shader.blend = 50
    vmod.visibility = #front
    vmod.parent = gsmokes
    vmod.transform.scale = vector(1, 1, 1) * 1
    vmod.transform.position = vector(0, 0, 30000)
  end if
  pdummy.position = vector(0, 0, -30000)
  pdummy.isPinned = 1
end

on collisionCallback me, collisionReport
  if collisionReport <> VOID then
    pstats.pscratch = pstats.pscratch + 0.10000000000000001
    pstattimer = _system.milliSeconds
    ptricksize = vector(0, 0, 0)
    poldtrick = pmod.transform.rotation
    puber = puber * 0.87
    if ptouching = 1 then
      vrate = -2 - (random(3) * 2)
      vvol = pdummy.linearVelocity.magnitude + 40
      if vvol > 100 then
        vvol = 100
      end if
      sound(8).play([#member: member(string("c" & random(3))), #rateShift: vrate])
      sound(8).volume = vvol
      ptouching = 0
    end if
  end if
end

on buildui me
  member("hints").text = EMPTY
  member("talk").text = EMPTY
  rec = sprite(1).rect
  mid = point(rec[1] + ((rec[3] - rec[1]) / 2), rec[2] + ((rec[4] - rec[2]) / 2))
  pcam.transform.position = pos
  pcam.addOverlay(texy("site_1"), point(336, 236), 0)
  pcam.overlay[1].scale = 0.5
  pcam.addOverlay(texy("ammo"), point(666, -5), 0)
  pcam.addOverlay(texy("uber"), point(10, 40), 0)
  pcam.addOverlay(texy("ammo_hud"), point(670, 15), 0)
  pcam.addOverlay(texy("health"), point(10, -5), 0)
  member("scores").text = "Points: " & gscore
  pcam.addOverlay(texy("scores"), point(345, 13), 0)
  member("talk").text = "TAB & ENTER to chat"
  pcam.addOverlay(texy("talk"), point(20, 460), 0)
  pcam.addOverlay(texy("hints"), point(20, 485), 0)
  if ghelp then
    if pgunmode then
      vimg = member("inhelp_pro").image.duplicate()
    else
      vimg = member("inhelp_casual").image.duplicate()
    end if
    member("inhelp").image = vimg
    pcam.addOverlay(texy("inhelp"), point(696, 190), 0)
  end if
  pcam.addOverlay(texy("hurtrot"), point(272, 172), 0)
  phrot = pcam.overlay.count
  pcam.overlay[phrot].blend = 0
  gmem.texture("hints").nearFiltering = 0
  gmem.texture("talk").nearFiltering = 0
  gmem.texture("ammo").nearFiltering = 0
  gmem.texture("uber").nearFiltering = 0
  gmem.texture("ammo_hud").nearFiltering = 0
  gmem.texture("health").nearFiltering = 0
  gmem.texture("scores").nearFiltering = 0
  img = member("cp_red").image.duplicate()
  img.copyPixels(member("cp_blue").image, rect(0, 0, 1.27000000000000002 * 50, 127), rect(0, 0, 1.27000000000000002 * 50, 127), [#useFastQuads: 1])
  member("cp").image = img
  repeat with i = 1 to gcappoints.count
    if voidp(gmem.texture("cp" & i)) then
      vt = gmem.newTexture("cp" & i, #fromCastMember, member("cp"))
      vt.renderFormat = #rgba8888
      vt.nearFiltering = 0
    else
      vt = gmem.texture("cp" & i)
      gmem.texture("cp" & i).member = member("cp")
    end if
    pcam.addOverlay(vt, point(794 - (68 * i), 532), 0)
    gcappoints[i].povtex = vt
    gcappoints[i].resetglows()
  end repeat
end

on stepFrame me
  if checkgoody() then
    if pstate = "notready" then
      pingserver = pingserver + 1
      if pingserver = 16 then
        getmus()
        pingserver = 0
      end if
      filmstar(me)
    else
      if pstate = "play" then
        if weaponry.premote = VOID then
          movecar(me)
          jump(me)
          docams(me)
        end if
        sortui(me)
        if pspawnprotect > 0 then
          if pstartlook = 1 then
            if pspawnprotect = 200 then
              _mouse.mouseLoc = point(400, 300)
              prot = vector(-1.19999999999999996, 0, 0)
              pstartlook = 0
            end if
          end if
          pspawnprotect = pspawnprotect - 1
          if (pspawnprotect = 1) and (pwillrank = 1) then
            if prankfactor > 1 then
              vfeed = script("ingamefeedback").new(goody.pos, member("medal"), 1)
              feedback(me, "You are now: " & prank)
              playsound(pos, "bugle", 8)
            end if
            sortranks(me, prank)
            poldrank = prank
            pwillrank = 0
          end if
        end if
        if psuper >= 1 then
          psuper = psuper - 1
          if psuper = 1 then
            puber = 0
            psuper = 0
            playsound(pos, "superpowerdown", 7)
            pmod.shaderList[1] = ptankshad
            pmod.shaderList[2] = gmem.shader("blackshine")
            submitmus([#subject: "endsuper", #content: EMPTY])
          end if
        end if
        if not voidp(pcam.overlay[phrot].blend) then
          if pcam.overlay[phrot].blend > 0 then
            pcam.overlay[phrot].blend = pcam.overlay[phrot].blend - 4
          end if
        end if
        goodmus(me)
        amiover(me)
        cheatfinder(me)
      else
        if pstate = "repos" then
          reposanim(me)
          amiover(me)
        else
          if pstate = "end" then
            filmstar(me)
          end if
        end if
      end if
    end if
    if pchatabuser > 0 then
      pchatabuser = pchatabuser - 1
    end if
  end if
end

on cheatfinder me
  if (poldlives = (plives - pcheatflick)) and (pcheatflick <> 0) then
    plives = plives - pcheatflick
  else
    creq()
  end if
  pcheatflick = -pcheatflick
  poldlives = plives
  plives = plives + pcheatflick
end

on amiover me
  if (the timer / 60) > ptime then
    defoover(me)
  end if
end

on defoover me
  pstate = "end"
  repeat with bad in gplayers
    bad.setaProp(#phavoverlay, 0)
  end repeat
  vcount = pcam.overlay.count
  repeat with i = 1 to vcount
    pcam.removeOverlay(1)
  end repeat
  govlist = []
  gtaglist = []
  repeat with i = 1 to pallmines.count
    pallmines[i].die()
  end repeat
  go("end")
end

on docams me
  gunwtf = pgun.getWorldTransform()
  gunpos = gunwtf.position
  gunrot = gunwtf.rotation
  gunwtf.rotation.x = gunwtf.rotation.x * 0.40000000000000002
  if pspinchange.distanceTo(pmod.transform.rotation) < 7 then
    poldrot.rotation = gunwtf.rotation
  end if
  if pspinchange.distanceTo(pmod.transform.rotation) > 50 then
    collisionCallback(me)
  end if
  pspinchange = pmod.transform.rotation
  if pgunmode then
    if pcursorlock then
      mousmov = oldmloc - the mouseLoc
      prot.z = prot.z + (mousmov.locH * pmousedelta * gmousediff)
      prot.x = prot.x + (mousmov.locV * pmousedelta * gmousediff)
      _mouse.mouseLoc = point(400, 300)
      oldmloc = the mouseLoc
    end if
    if prot.x > 70 then
      prot.x = 70
    else
      if prot.x < -30 then
        prot.x = -30
      end if
    end if
  else
    vgunangs = [#nook: 30, #mortar: 20, #rcrocket: 35, #rcrocket: 35, #rocket: 1, #guidedmissile: 1, #sonicgun: -1]
    if vgunangs.getaProp(pweapon) <> 0 then
      vfrontrot = vgunangs.getaProp(pweapon)
    else
      vfrontrot = -1.19999999999999996
    end if
    vnaebohs = [#speed, #thrusters, #health, #stealth, #remotemine, #proximitymine, #none]
    if vnaebohs.getOne(goody.pweapon) = 0 then
      vturn = ((keyPressed(123) or keyPressed("a") or keyPressed("A")) - (keyPressed(124) or keyPressed("d") or keyPressed("D"))) * 5
      vbacfor = (keyPressed(126) or keyPressed("w") or keyPressed("w")) - (keyPressed(125) or keyPressed("s") or keyPressed("S"))
    else
      vdiff = prot.z mod 360
      vtarrot = prot.z - vdiff
      if vdiff > 180 then
        vtarrot = vtarrot + 360
      end if
      vdelta = vector(vfrontrot, 0, vtarrot) - prot
      prot = prot + (vdelta * 0.10000000000000001)
    end if
    if (vturn <> 0) and (vbacfor = 0) then
      prot.z = prot.z + vturn
      pgunmove = 1
    else
      if vbacfor <> 0 then
        vdiff = prot.z mod 360
        vtarrot = prot.z - vdiff
        if vdiff > 180 then
          vtarrot = vtarrot + 360
        end if
        vdelta = vector(vfrontrot, 0, vtarrot) - prot
        prot = prot + (vdelta * 0.10000000000000001)
      end if
      pgunmove = 0
    end if
    if pcursorlock then
      _mouse.mouseLoc = point(400, 300)
    end if
  end if
  pgun.transform.rotation = prot
  vpog = pmod.transform.position
  if (pweapon = #airstrike) and not pgunmode then
    gsmokes.removeFromWorld()
    pray = gmem.modelsUnderRay(gunpos, angtovec(gunrot), [#maxNumberOfModels: 1, #levelOfDetail: #detailed])
    gsmokes.addToWorld()
    if pray.count > 0 then
      if weaponry.pairstrike = VOID then
        gmem.model("airstriketarget").transform.position = pray[1].isectPosition + (pray[1].isectNormal * 2)
        gmem.model("airstriketarget").pointAt(pray[1].isectPosition)
      end if
    end if
  end if
  if pweapon = #airstrike then
    gmem.model("airstriketarget").visibility = #front
  end if
  if the rightMouseDown and pgunmode then
    repeat with bad in gplayers
      if bad.getaProp(#pwheelgroup) <> 0 then
        bad.pwheelgroup.removeFromWorld()
      end if
    end repeat
    gsmokes.removeFromWorld()
    pray = gmem.modelsUnderRay(gunpos, angtovec(gunrot), [#maxNumberOfModels: 1, #levelOfDetail: #detailed])
    gsmokes.addToWorld()
    if pray.count > 0 then
      ptargetfocus = pray[1].distance
      if pweapon = #airstrike then
        if weaponry.pairstrike = VOID then
          gmem.model("airstriketarget").transform.position = pray[1].isectPosition + (pray[1].isectNormal * 2)
          gmem.model("airstriketarget").pointAt(pray[1].isectPosition)
        end if
      else
        gmem.model("airstriketarget").transform.position = vector(0, 0, -40000)
      end if
    else
      ptargetfocus = 8000
    end if
    vpog = gunpos + (angtovec(gunrot) * ptargetfocus)
    vloc = pcam.worldSpaceToSpriteSpace(vpog)
    if voidp(vloc) then
      pcam.overlay[1].loc = point(1000, 1000)
    else
      pcam.overlay[1].loc = vloc - point(64, 64)
    end if
    pmousedelta = 0.10000000000000001
    vnaebohs = [#speed, #thrusters, #health, #stealth, #remotemine, #proximitymine, #none]
    if vnaebohs.getOne(goody.pweapon) = 0 then
      vaimdepths = [35, 35, 45, 35, 50, 50, 25, 35, 35, 50, 35, 35, 50, 45, 40, 50, 50, 50, 50]
      vd = weaponry.pweaplist.getOne(pweapon)
      if weaponry.poldweapon <> pweapon then
        member("site").image = member("site_" & weaponry.pweapsites[vd]).image
        texy("site")
        weaponry.poldweapon = pweapon
      end if
      pcam.overlay[1].scale = 1
      if paiminc > vaimdepths[vd] then
        pcam.overlay[1].blend = 100
        paiminc = paiminc - 1
        pcam.fieldOfView = paiminc
      end if
    end if
  else
    pcam.overlay[1].blend = 0
    pmousedelta = 0.40000000000000002
    paiminc = 50
    pcam.fieldOfView = paiminc
  end if
  if the rightMouseDown and pgunmode then
    vrs = poldrot * vector(0, -1, 0)
    vrs.z = 0
    normalize(vrs)
    vrs.z = 1.5
    camtarpos = pdummy.position + (vrs * 20)
  else
    vrs = poldrot * vector(0, -1, 0)
    vrs.z = 0
    normalize(vrs)
    vrs.z = 0.20000000000000001
    camtarpos = pdummy.position + (vrs * 200)
  end if
  pcam.transform.position = pcam.transform.position + ((camtarpos - pcam.transform.position) * 0.33000000000000002)
  vdel = vpog - pcam.transform.position
  vang = -vectoang(vdel)
  vang.x = -vang.x
  pcam.transform.rotation = vang + vector(90, 0, 0)
  pturret.transform.rotation.z = pgun.transform.rotation.z
  pgunrot = vector(pgun.transform.rotation.x, 0, pturret.transform.rotation.z)
end

on autoaim me, naim
  vdir = angtovec(gunrot)
  vdist = 4000
  vscope = 0.20000000000000001
  vnearest = vscope
  voldnearest = vscope
  vplay = VOID
  if string(pteam) = "blue" then
    vlist = gredplayers
  else
    vlist = gblueplayers
  end if
  repeat with vbad in vlist
    if vbad <> me then
      vdelta = vbad.pos - pos
      if vdelta.magnitude < vdist then
        vnorm = vdelta
        vnorm.normalize()
        vnorm.z = 0
        vdir.z = 0
        vnearest = vdir.distanceTo(vnorm)
        if vnearest < (vscope * ((vdist - vdelta.magnitude) / vdist)) then
          if vnearest < voldnearest then
            voldnearest = vnearest
            vplay = vbad
          end if
        end if
      end if
    end if
  end repeat
  if vplay <> VOID then
    pgun.pointAt(vplay.pos, vector(0, 0, 1))
    prot = pgun.transform.rotation
    prot.x = prot.x + (random(4) - 2)
  end if
end

on movecar me
  vturn = ((keyPressed(123) or keyPressed("a") or keyPressed("A")) - (keyPressed(124) or keyPressed("d") or keyPressed("D"))) * 25
  if (vturn <> 0) and (pgunmove = 0) then
    pturn = pturn + ((vturn - pturn) * 0.10000000000000001)
  else
    pturn = pturn * 0.69999999999999996
  end if
  t = transform()
  t.rotation = pbackwheel.transform.rotation
  t.rotate(vector(0, 0, pturn))
  vaxang = t.axisAngle
  pwfl.orientation = vaxang
  pwfr.orientation = pwfl.orientation
  pospd = pdummy.linearVelocity
  pos = pmod.transform.position
  rot = pmod.transform.rotation
  wtf = transform()
  wtf.rotation = pmod.transform.rotation
  vdown = wtf * vector(0, 0, -1)
  ponfloor = 0
  if vdown.z < -0.5 then
    vpos = pos
  else
    vpos = pos + vector(0, 0, 15)
  end if
  dog = gmem.modelsUnderRay(vpos, vector(0.01, 0, -0.98999999999999999), [#maxNumberOfModels: 1, #levelOfDetail: #detailed, #modelList: gshadows, #maxDistance: bsp * 3])
  grav = vector(0, 0, -0.14999999999999999)
  if dog.count > 0 then
    vpos = dog[1].isectPosition + (dog[1].isectNormal * 2)
    gmem.model("carshad").transform.position = vpos
    vfac = 25 / dog[1].distance
    if vfac > 0 then
      gmem.model("carshad").transform.scale = vector(1, 1, 1) * vfac
      gmem.model("carshad").shader.blend = vfac * 200
    end if
    gmem.model("carshad").pointAt(dog[1].isectPosition)
    if (dog[1].distance < (bsp * 1)) and (vdown.z < -0.5) then
      ponfloor = 1
      grav = grav + (wtf * vector(0, 0, -1))
    end if
  end if
  if pjump > 0 then
    pjump = pjump - 1
  end if
  if ponfloor = 0 then
    ptricksize = ptricksize + trickrot(me, poldtrick, pmod.transform.rotation)
    if (pstattimeron = 0) and (pspawnprotect = 0) then
      pstattimer = _system.milliSeconds
      pstattimeron = 1
    end if
  else
    pstattimeron = 0
    if pstattimer > 0 then
      vtime = (float(_system.milliSeconds) - pstattimer) * 0.001
      if vtime > pstats.pairtime then
        pstats.pairtime = vtime
      end if
      pstattimer = 0
    end if
    if pspeedo = 1 then
      pSpeed = 300 + (prankfactor * 6)
      pmaxspeed = 100 + (prankfactor * 2)
    else
      pSpeed = 100 + (puber * 0.29999999999999999) + (prankfactor * 2)
      pmaxspeed = 20 + (puber * 0.20000000000000001) + (prankfactor * 1)
    end if
    push = vector(0, 0, 0)
    if ptyping = 0 then
      pmom = pdummy.linearVelocity
      bacfor = (keyPressed(126) or keyPressed("w") or keyPressed("w")) - (keyPressed(125) or keyPressed("s") or keyPressed("S"))
      if pdummy.linearVelocity.magnitude < pmaxspeed then
        push = wtf * vector(0, pSpeed * bacfor, 0)
      end if
      if pdummy.linearVelocity.magnitude > pstats.pSpeed then
        pstats.pSpeed = pdummy.linearVelocity.magnitude
      end if
      vcspeed = pmom.dot(wtf * vector(0, 1, 0))
      vturn = (keyPressed(123) or keyPressed("a") or keyPressed("A")) - (keyPressed(124) or keyPressed("d") or keyPressed("D"))
      if vcspeed < 0 then
        vturn = -vturn
      else
        if vcspeed = 0 then
          vturn = 0
        end if
      end if
      if pgunmove = 1 then
        vturn = 0
      end if
      pdummy.angularVelocity = wtf * vector(0, 0, vturn * 0.14999999999999999)
      pwfl.applyLinearImpulse(push)
      pwfr.applyLinearImpulse(push)
    end if
    pdummy.linearVelocity = pdummy.linearVelocity * 0.98999999999999999
    pdummy.angularVelocity = pdummy.angularVelocity * 0.80000000000000004
    calctrick(me, ptricksize)
    ptricksize = vector(0, 0, 0)
  end if
  poldtrick = pmod.transform.rotation
  pdummy.linearVelocity = pdummy.linearVelocity + grav
  vspd = pdummy.linearVelocity
  if vspd.distanceTo(pospd) > 1.15700000000000003 then
    ptouching = 1
  end if
  pospd = vspd
end

on jump me
  if ptyping = 0 then
    if keyPressed(SPACE) and (pjump = 0) then
      vrate = random(8) - 4
      sound(7).queue([#member: member("airblast"), #rateShift: vrate])
      sound(7).play()
      sound(7).volume = 30
      vfor = (keyPressed(126) or keyPressed("w") or keyPressed("w")) - (keyPressed(125) or keyPressed("s") or keyPressed("S"))
      vsid = (keyPressed(123) or keyPressed("a") or keyPressed("A")) - (keyPressed(124) or keyPressed("d") or keyPressed("D"))
      voff = 0
      vstr = vector(0, 1.30000000000000004, 0)
      ptrickkey = [2, 0]
      if vfor <> 0 then
        voff = 8
        if psuper = 0 then
          if vfor then
            vstr = vector(0, 4, 0)
          else
            vstr = vector(0, 3, 0)
          end if
        else
          if vfor then
            vstr = vector(0, 1.30000000000000004, 0)
          else
            vstr = vector(0, 2.5, 0)
          end if
        end if
        ptrickkey = [1, vfor]
      else
        if vsid <> 0 then
          voff = 6
          vstr = vector(0, 3, 0)
          ptrickkey = [0, vsid]
        end if
      end if
      vtf = wtf
      vpow = 5000
      if (wtf * vector(0, 0, 1)).z > 0.10000000000000001 then
      else
        vtf.rotation.x = vtf.rotation.x + 180
        vpow = vpow * 0.59999999999999998
      end if
      if psuper > 0 then
        vpow = (vpow * 1.60000000000000009) + (prankfactor * 500)
        voff = voff * 0.59999999999999998
      end if
      pdummy.applyLinearImpulse(vtf * vector(0, 0, 1) * vpow, (vector(vsid, vfor, 0) * voff) + vstr)
      pjump = 60
    end if
  end if
end

on trickrot me, rotfromb, rottob
  rotto = rottob
  rotfrom = rotfromb
  actuallyused = vector(0, 0, 0)
  dx = rotto.x - rotfrom.x
  ds = sqrt(dx * dx)
  if ds > 180 then
    if dx > 0 then
      actuallyused.x = dx - 360
    else
      actuallyused.x = dx + 360
    end if
  else
    actuallyused.x = dx
  end if
  dy = rotto.y - rotfrom.y
  ds = sqrt(dy * dy)
  if ds > 180 then
    if dy > 0 then
      actuallyused.y = dy - 360
    else
      actuallyused.y = dy + 360
    end if
  else
    actuallyused.y = dy
  end if
  dz = rotto.z - rotfrom.z
  ds = sqrt(dz * dz)
  if ds > 180 then
    if dz > 0 then
      actuallyused.z = dz - 360
    else
      actuallyused.z = dz + 360
    end if
  else
    actuallyused.z = dz
  end if
  return actuallyused
end

on calctrick me, ntrk
  vtricks = [0, "flip", "double flip", "triple flip", "quad flip", "insane"]
  vnam = EMPTY
  if ptrickkey[1] <> 2 then
    if ptrickkey[1] = 1 then
      if ptrickkey[2] > 0 then
        vnam = "Back"
      else
        vnam = "Front"
      end if
    else
      if ptrickkey[2] > 0 then
        vnam = "Frontside"
      else
        vnam = "Backside"
      end if
    end if
  end if
  if (puber > 100) and (psuper = 0) then
    psuper = 600
    vshad = shady(string("supercharge" & pteam))
    vshad.emissive = rgb(255, 255, 255)
    pmod.shaderList = vshad
    submitmus([#subject: "super", #content: EMPTY])
    playsound(pos, "superpowerup", 7)
    pstats.pubers = pstats.pubers + 1
  else
    vtrick = whattrick(me, integer(ntrk.magnitude / 180))
    pstats.pflips = pstats.pflips + vtrick
    if ntrk.magnitude > pstats.ptricksize then
      pstats.ptricksize = ntrk.magnitude
    end if
    if psuper = 0 then
      puber = puber + (vtrick * vtrick * 3)
    end if
    if vtrick > 0 then
      vtrick = vtricks[vtrick]
      if vtrick <> 0 then
        pstats.ptrickspulled = pstats.ptrickspulled + 1
        vfeed = script("ingamefeedback").new(goody.pos, vnam & " " & vtrick, 1)
      end if
    end if
  end if
end

on whattrick me, ndel
  if ndel = 0 then
    return 0
  else
    if ndel >= 8 then
      return 5
    else
      if ndel >= 6 then
        return 4
      else
        if ndel >= 4 then
          return 3
        else
          if ndel >= 2 then
            return 2
          else
            if ndel >= 1 then
              return 1
            end if
          end if
        end if
      end if
    end if
  end if
end

on sortui me
  if weapons.getaProp(pweapon) <> 0 then
    vpammo = 100 - integer(float(weapons.getaProp(pweapon)) / chambers.getaProp(pweapon) * 100) + 1
    if vpammo <> pammoold then
      pammoold = vpammo
      img = member("ammoempty").image.duplicate()
      img.copyPixels(member("ammofull").image, rect(0, 0, 127 - (1.27000000000000002 * vpammo), 127), rect(0, 0, 127 - (1.27000000000000002 * vpammo), 127), [#useFastQuads: 1])
      member("ammo").image = img
      texy("ammo")
    end if
  end if
  vhno = 100 - integer(plives - pcheatflick) + 1
  if vhno <> phealthold then
    phealthold = vhno
    img = member("healthfull").image.duplicate()
    img.copyPixels(member("healthempty").image, rect(0, 0, 1.27000000000000002 * vhno, 127), rect(0, 0, 1.27000000000000002 * vhno, 127), [#useFastQuads: 1])
    member("health").image = img
    texy("health")
  end if
  if (integer(puber) + 1) <> puberold then
    puberold = integer(puber) + 1
    img = member("uberempty").image.duplicate()
    if puberold >= 100 then
      img.copyPixels(member("ubercharged").image, rect(0, 0, 1.27000000000000002 * puberold, 127), rect(0, 0, 1.27000000000000002 * puberold, 127), [#useFastQuads: 1])
    else
      img.copyPixels(member("uberfull").image, rect(0, 0, 1.27000000000000002 * puberold, 127), rect(0, 0, 1.27000000000000002 * puberold, 127), [#useFastQuads: 1])
    end if
    member("uber").image = img
    texy("uber")
  end if
end

on reposanim me
  inc = inc + 1
  if inc < 101 then
    pcam.fieldOfView = pcam.fieldOfView * 0.97999999999999998
    vbad = getplayer(pkiller)
    if vbad <> 0 then
      if pkiller <> pname then
        pcam.pointAt(vbad.pos, vector(0, 0, 1))
      else
        pcam.pointAt(pdeadspot, vector(0, 0, 1))
      end if
    end if
  else
    pcam.fieldOfView = 50
    pstate = "play"
  end if
end

on filmstar me
  if gplayers.count > 0 then
    if the mouseUp and pfilmtog then
      pfilmstar = gplayers[random(gplayers.count)].pmod
      pfilmrot = vector(random(20), 0, random(360))
      pfilmtog = 0
    end if
    vfoo = random(90)
    if (vfoo = 12) or (pfilmstar = gmem.model("ground")) then
      pfilmstar = gplayers[random(gplayers.count)].pmod
      pfilmrot = vector(random(20), 0, random(360))
    end if
    vdist = 400
  else
    if pfilmstar = 0 then
      vinits = []
      repeat with i = 1 to gcappoints.count
        vinits.add(gcappoints[i].pmod.name)
      end repeat
      pfilmstar = gmem.model(vinits[random(vinits.count)])
      pfilmrot = vector(random(20), 0, random(360))
    end if
    vdist = 900
  end if
  if the mouseUp then
    roto = vector(0, 0, 0)
    vloc = the mouseLoc
    if voidp(poldmloc) then
      poldmloc = vloc
    else
      delta = vloc - poldmloc
      roto = vector(delta.locV, 0, -delta.locH) * 0.5
      camrotate(roto)
      poldmloc = vloc
    end if
  else
    pfilmtog = 1
    if not voidp(delta) then
      delta = delta * 0.84999999999999998
      roto = vector(delta.locV, 0, -delta.locH) * 0.5
      camrotate(roto)
    end if
    poldmloc = VOID
  end if
  if pfilmstar <> 0 then
    pcam.transform.position = pfilmstar.transform.position + (cosine3D(pfilmrot) * vdist)
    pcam.pointAt(pfilmstar.transform.position, vector(0, 0, 1))
  end if
end

on camrotate rots
  pfilmrot = pfilmrot + rots
  if pfilmrot.x > 80 then
    pfilmrot.x = 80
  else
    if pfilmrot.x < 1 then
      pfilmrot.x = 1
    end if
  end if
end

on keytalk me
  if keyPressed(RETURN) then
    set the keyDownScript to "goody.keywalk()"
    vstr = member("talk").text
    put EMPTY into char 1 of vstr
    if pchatabuser = 0 then
      submitmus([#subject: "talk", #content: vstr])
      pchatabuser = 30
    end if
    member("talk").text = "TAB & ENTER to chat, 1-8 HotKeys"
    ptyping = 0
    texy("talk")
  else
    if keyPressed(TAB) then
      set the keyDownScript to "goody.keywalk()"
      member("talk").text = "TAB & Enter to chat, 1-8 HotKeys"
      ptyping = 0
      texy("talk")
    else
      if keyPressed(BACKSPACE) then
        if member("talk").char.count > 3 then
          val = member("talk").text.char[1..member("talk").text.char.count - 1]
          member("talk").text = val
        end if
        texy("talk")
      else
        if the keyPressed <> 0 then
          if member("talk").char.count < (40 - nom.length) then
            member("talk").text = member("talk").text & the keyPressed
          end if
          texy("talk")
        end if
      end if
    end if
  end if
  if the keyCode = 53 then
    creq()
  end if
end

on keywalk me
  if keyPressed(TAB) then
    set the keyDownScript to "goody.keytalk()"
    member("talk").text = "> "
    texy("talk")
    ptyping = 1
  end if
  if not (the keyPressed = oldkey) then
    if keyPressed("v") or keyPressed("V") then
      pgunmode = not pgunmode
      if ghelp then
        if pgunmode then
          gmem.texture("inhelp").member = member("inhelp_pro")
        else
          gmem.texture("inhelp").member = member("inhelp_casual")
        end if
      end if
    else
      if keyPressed("r") or keyPressed("R") then
        if pspawnprotect = 0 then
          pstats.prespawns = pstats.prespawns + 1
          pkiller = "Re spawn"
          repos(me, pweapon)
          resetstats(me)
          setscore(me, -200)
        end if
      else
        if keyPressed("m") or keyPressed("M") then
          vtex = "Players: "
          repeat with bad in gplayers
            vtex = vtex & bad.pname & " "
          end repeat
          feedback(me, vtex)
        else
          if keyPressed("1") or keyPressed("2") or keyPressed("3") or keyPressed("4") or keyPressed("5") or keyPressed("6") or keyPressed("7") or keyPressed("8") then
            if pchatabuser = 0 then
              submitmus([#subject: "talk", #content: string(the keyPressed)])
              pchatabuser = 30
            end if
          else
            if keyPressed("e") or keyPressed("E") then
            end if
          end if
        end if
      end if
    end if
    if (the keyPressed <> "v") or (the keyPressed <> "V") then
      oldkey = the keyPressed
    end if
  end if
  if the keyCode = 53 then
    creq()
  end if
end

on hurt me, howbad, vnom, vtyp
  if voidp(vtyp) then
    vtyp = "gun"
  end if
  if puber > 0 then
    puber = puber - (0.10000000000000001 * howbad)
  end if
  if (psuper = 0) and (pspawnprotect = 0) and (pstate = "play") then
    vpla = getplayer(vnom)
    if vpla <> 0 then
      if vpla.pteam <> pteam then
        vang = (vectoang(pos, vpla.pos).z + gunrot.z) mod 360
        pcam.overlay[phrot].rotation = 180 + vang
        pcam.overlay[phrot].blend = 100
        playsound(pos, "crash", 2)
        pkiller = vnom
        setlives(me, -howbad, vnom, vtyp)
      else
        if vpla.pname = pname then
          playsound(pos, "crash", 2)
          pkiller = vnom
          setlives(me, -howbad, vnom, vtyp)
        end if
      end if
    end if
  end if
end

on setlives me, liv, vnom, vtyp
  plives = plives + liv
  poldlives = poldlives + liv
  if (plives + pcheatflick) < 0 then
    member("health").image = member("healthempty").image
    texy("health")
    porkchop = script("porkchop", "parents").new(pos, rot, pdummy.linearVelocity, pdummy.angularVelocity)
    pdeadspot = pos
    setscore(me, -100)
    repos(me, vtyp)
    resetstats(me)
    pcam.overlay[phrot].blend = 0
    pstate = "repos"
  else
    myhu = myhu + liv
  end if
end

on scorehurt me, howbad
  if howbad <> 0 then
    if psuper > 0 then
      howbad = howbad * 2
    end if
    vnaebohs = [#speed, #thrusters, #health, #stealth, #none]
    if vnaebohs.getOne(pweapon) = 0 then
      pstats.pshots_hit = pstats.pshots_hit + 1
      vfoo = integer(pstats.pweapaccuracy_hits.getaProp(pweapon)) + 1
      pstats.pweapaccuracy_hits.setaProp(pweapon, vfoo)
      vdam = integer(pstats.pdamage_to_enemy.getaProp(pweapon)) + howbad
      pstats.pdamage_to_enemy.setaProp(pweapon, vdam)
    end if
    vfeed = script("ingamefeedback").new(goody.pos, "*" & howbad & "*", 1)
    goody.setscore(howbad)
  end if
end

on goodmus me
  pingserver = pingserver + 1
  if pingserver = 16 then
    pingserver = 0
    content = [#pos: pos, #rot: rot, #pgunrot: pgunrot, #pweapon: pweapon, #team: pteam]
    if weaponry.shots > 0 then
      content.addProp(#shots, weaponry.shots)
      weaponry.shots = 0
    end if
    if myhu > 0 then
      content.addProp(#myhu, weaponry.myhu)
      myhu = 0
    end if
    if weaponry.hurts <> [:] then
      content.addProp(#hurts, weaponry.hurts)
      weaponry.hurts = [:]
    end if
    if gscore <> poldscore then
      content.addProp(#scores, gscore)
      poldscore = gscore
    end if
    if pcapture = 1 then
      vcap = 0
      repeat with i = 1 to gcappoints.count
        if gcappoints[i].pcapchange <> [] then
          vcap = vcap + 1
          content.addProp(#cap, gcappoints[i].pcapchange)
          gcappoints[i].pushglows(pteam, 2)
        end if
      end repeat
      if vcap = 0 then
        pcapture = 0
      end if
    end if
    if (pweapon = #stealth) and (weaponry.pstealth <> VOID) then
      content.addProp(#stealth, weaponry.pstealth.pActive)
    end if
    if (pweapon = #thrusters) and (weaponry.pthruster <> VOID) then
      content.addProp(#thrust, weaponry.pthruster.pActive)
    end if
    if weaponry.premote <> VOID then
      content.addProp(#rc, weaponry.premote.pmusdata)
    end if
    submitmus([#subject: "where", #content: content])
  else
    if pingserver = 8 then
      getmus()
    end if
  end if
end

on repos me, vtyp
  inc = 0
  if string(pteam) = "red" then
    vrep = gredspawnpos[random(gredspawnpos.count)]
  else
    vrep = gbluespawnpos[random(gbluespawnpos.count)]
  end if
  pphysx.RemoveCollisionCallback()
  pphysx.DisableCollisionCallback(pdummy)
  pphysx.DisableCollision(pdummy)
  pdummy.isPinned = 0
  gsmokes.removeFromWorld()
  vpos = gmem.model(vrep).transform.position + vector(0, 0, 8000)
  vray = gmem.modelsUnderRay(vpos, vector(0, 0, -1), [#maxNumberOfModels: 1, #levelOfDetail: #detailed])
  gsmokes.addToWorld()
  if vray.count > 0 then
    pdummy.position = vray[1].isectPosition + vector(0, 0, 100)
  end if
  vt = transform()
  vt.rotation = -vectoang(vector(0, 0, gmem.model(vrep).transform.position.z), gmem.model(vrep).transform.position)
  pdummy.orientation = vt.axisAngle
  pos = pdummy.position
  rot = gmem.model(vrep).transform.rotation
  if pkiller <> VOID then
    submitmus([#subject: "dead", #content: [#killer: pkiller, #pos: pos, #rot: rot, #velo: pdummy.linearVelocity, #vang: pdummy.angularVelocity, #typ: vtyp]])
  end if
  pphysx.EnableCollision(pdummy)
  pphysx.RegisterCollisionCallback(#collisionCallback, me)
  pphysx.EnableCollisionCallback(pdummy)
  pdummy.linearVelocity = vector(0, 0, 0)
  pdummy.angularVelocity = vector(0, 0, 0)
  pdummy.angularMomentum = vector(0, 0, 0)
  pdummy.linearMomentum = vector(0, 0, 0)
  repeat with i = 1 to phavwheels.count
    pphysx.DisableCollision(phavwheels[i])
    phavwheels[i].position = pdummy.position + oset[i]
    phavwheels[i].linearVelocity = vector(0, 0, 0)
    phavwheels[i].angularVelocity = vector(0, 0, 0)
    phavwheels[i].angularMomentum = vector(0, 0, 0)
    phavwheels[i].linearMomentum = vector(0, 0, 0)
    pphysx.EnableCollision(phavwheels[i])
    pphysx.DisableCollision(pdummy, phavwheels[i])
  end repeat
  pdummy.isPinned = 1
  pphysx.simulate()
  pdummy.isPinned = 0
  _mouse.mouseLoc = point(400, 200)
  prot = vector(-1.19999999999999996, 0, 0)
  poldtrick = pmod.transform.rotation
  pspawnprotect = 210
end

on resetstats me
  puber = 0
  psuper = 0
  myhu = 0
  plives = 102
  poldlives = 100
  pcheatflick = 2
  pcheattime = 0
  pkiller = VOID
end

on calcsettime me, nmin, nsec
  vmin = integer(nmin)
  vsec = integer(nsec)
  vtottime = 600 + (integer(groompos) * 20) + (vmin * 60) + vsec
  ptime = 600 - (vtottime mod 600)
  startTimer()
end

on setscore me, nscr
  if (gscore + nscr) >= 0 then
    gscore = gscore + nscr
    goldscore = goldscore + (nscr / 8.29564210000000024)
  else
    gscore = 0
  end if
  pscore = gscore
  pstats.pscore = pscore
  member("scores").text = "Points: " & RETURN & gscore
  texy("scores")
end

on feedback me, nnews, nteam, nname
  if (pstate = "play") or (pstate = "repos") then
    if not voidp(nnews) then
      repeat with i = 1 to 5
        member("hints").line[7 - i] = member("hints").line[6 - i]
        member("hints").line[7 - i].color = member("hints").line[6 - i].color
      end repeat
      if nnews.char.count = 1 then
        vhots = ["1. Help", "2. Thanks", "3. Incoming", "4. Attack", "5. Capture", "6. Defend", "7. Light Tower", "8. Spawn"]
        if nnews = "1" then
          nnews = vhots[1]
        else
          if nnews = "2" then
            nnews = vhots[2]
          else
            if nnews = "3" then
              nnews = vhots[3]
            else
              if nnews = "4" then
                nnews = vhots[4]
              else
                if nnews = "5" then
                  nnews = vhots[5]
                else
                  if nnews = "6" then
                    nnews = vhots[6]
                  else
                    if nnews = "7" then
                      nnews = vhots[7]
                    else
                      if nnews = "8" then
                        nnews = vhots[8]
                      end if
                    end if
                  end if
                end if
              end if
            end if
          end if
        end if
      end if
      if not voidp(nname) then
        member("hints").line[1] = nname & "> " & nnews
      else
        member("hints").line[1] = nnews
      end if
      if not voidp(nteam) then
        if string(nteam) = "red" then
          member("hints").line[1].color = rgb(255, 0, 0)
        else
          if string(nteam) = "blue" then
            member("hints").line[1].color = rgb(0, 0, 255)
          end if
        end if
      else
        if glevel.name = "artic" then
          member("hints").line[1].color = rgb(55, 55, 55)
        else
          member("hints").line[1].color = rgb(200, 200, 200)
        end if
      end if
    end if
    if not voidp(gmem) then
      if not voidp(gmem.texture("hints")) then
        texy("hints")
      end if
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
    ptankshad = gmem.newShader("tankskin" & pname, #standard)
    ptankshad.emissive = rgb(255, 255, 255)
    ptankshad.shininess = 0
  else
    ptankshad = gmem.shader("tankskin" & pname)
  end if
  ptankshad.texture = vtex
  pmod.shaderList = ptankshad
  vimg.erase()
  submitmus([#subject: "sortrank", #content: [#rank: prank]])
end

on render3D me
  pfxcam.transform.position = pcam.transform.position
  pfxcam.transform.rotation = pcam.transform.rotation
  pfxcam.fieldOfView = pcam.fieldOfView
  pfxcam.rotate(vector(0, 0, 180), #self)
  pfxcam.translate(vector(0, -2, 0), #self)
  gmem.sprite.renderToTexture(pfxcam, pLeft)
  pfxcam.translate(vector(0, 4, 0), #self)
  gmem.sprite.renderToTexture(pfxcam, pRight)
end

on dofx1 me
  if pstereo then
    if gmem.camera[1].ppEffectList.count > 0 then
      gmem.camera[1].ppEffectList.deleteAt(1)
    end if
  else
    _movie.stereoscopyParallaxDiff = 0
    pp = newppeffect(#ppblendtextures)
    mytexturelist = []
    mytexturelist.append(pLeft)
    mytexturelist.append(pRight)
    pp.textureList = mytexturelist
    myoperationlist = []
    myoperationlist.append("add")
    pp.oplist = myoperationlist
    ee = gmem.camera[1].ppEffectList
    ee.append(pp)
  end if
end

on dofx me
  if pstereo then
    if gmem.camera[1].ppEffectList.count > 0 then
      gmem.camera[1].ppEffectList.deleteAt(1)
    end if
    _movie.stereoscopyParallaxDiff = -2
  else
    _movie.stereoscopyParallaxDiff = 0
    myList = [1 / 9, 2 / 9, 1 / 9, 2 / 9, 4 / 9, 2 / 9, 1 / 9, 2 / 9, 1 / 9]
    myList = [1.0 / 16, 2.0 / 16, 1.0 / 16, 2.0 / 16, 4.0 / 16, 2.0 / 16, 1.0 / 16, 2.0 / 16, 1.0 / 16]
    myList = [0.25, 0, 0.25, 0, 0, 0, 0.25, 0, 0.25]
    myMatrix = newMatrix(3, 3, myList)
    pp = newppeffect(#ppconvolution)
    pp.convolutionmatrix = myMatrix
    pp2 = newppeffect(#ppbloom)
    pp2.bloomthreshold = 0.29999999999999999
    pp2.baseintensity = 1
    pp2.basesaturation = 1
    pp2.blurX = 5
    pp2.blurY = 5
    if glevel.name = "grass" then
      pp2.bloomintensity = 2
      pp2.bloomsaturation = 1
    else
      if glevel.name = "canyon" then
        pp2.bloomintensity = 2
        pp2.bloomsaturation = 0.80000000000000004
      else
        if glevel.name = "pyramids" then
          pp2.bloomintensity = 1
          pp2.bloomsaturation = 0.80000000000000004
        else
          if glevel.name = "artic" then
            pp2.bloomintensity = 0.5
            pp2.bloomsaturation = 2
          else
            if glevel.name = "techno" then
              pp2.bloomthreshold = 0.40000000000000002
              pp2.bloomintensity = 3
              pp2.bloomsaturation = 3
              pp2.blurX = 10
              pp2.blurY = 10
            else
              pp2.bloomintensity = 2
              pp2.bloomsaturation = 1
            end if
          end if
        end if
      end if
    end if
    e = gmem.camera[1].ppEffectList
    e.append(pp2)
  end if
end
