global gmem, goody, gscore, gteam, mousmov, gplayers, gredplayers, gblueplayers, gplanemods, grecmods, gshaders, gtextures, gworldgroups, voiceok, gmodinc, nom, goverlaysfixed, gisloggedin, gsession, gScreenDepth, gScreenRect

on getnormaltf nrot, norm
  vtf = transform()
  vtf.rotation = nrot
  vnormal = vtf * norm
  return vnormal
end

on getnormal modo, norm
  wtf = modo.getWorldTransform()
  wtf.scale = vector(1, 1, 1)
  wtf.position = vector(0, 0, 0)
  vnormal = wtf * norm
  return vnormal
end

on getaxis nrot
  vtf = transform()
  vtf.rotation = nrot
  return vtf.axisAngle
end

on writestats
  member("stats").text = "Score: " & gscore
  if not voidp(gmem) then
    if not voidp(gmem.texture("stats")) then
      gmem.texture("stats").member = member("stats")
    end if
  end if
end

on setscore sco
  if sco <> 0 then
    gscore = gscore + sco
  else
    gscore = 0
  end if
end

on getsafedate
  vdate = string(date())
  vcleandate = EMPTY
  repeat with i = 1 to vdate.length
    if ("1234567890" contains char i of vdate) <> 0 then
      vcleandate = vcleandate & char i of vdate
    end if
  end repeat
  return string(value(vcleandate))
end

on resetall
  mus = VOID
  resetactors()
  if not voidp(nom) then
    member("rooms").text = nom
  else
    member("rooms").text = EMPTY
  end if
  if not voidp(gteam) then
    member("talk").text = string(gteam)
  else
    member("talk").text = EMPTY
  end if
  nom = member("rooms").text
  if member("talk").text = EMPTY then
    gteam = #red
  else
    gteam = value("#" & member("talk").text)
  end if
end

on resetactors
  set the keyDownScript to EMPTY
  repeat with act in the actorList
    act = VOID
  end repeat
  the actorList = []
  grecmods = [:]
  gshaders = []
  gtextures = []
  gmodinc = 0
  gworldgroups = []
  gplayers = []
  gredplayers = []
  gblueplayers = []
  goverlaysfixed = []
  goody = VOID
end

on prepareMovie me
  resetall()
  member("3d").resetWorld()
end

on cosine3D rotsend
  bob = vector(0, 0, 0)
  bob.x = -(rotsend.z * PI / 180).sin * 1
  bob.y = (rotsend.z * PI / 180).cos * 1
  bob.z = (rotsend.x * PI / 180).sin * 1
  bob.x = (rotsend.x * PI / 180).cos * bob.x
  bob.y = (rotsend.x * PI / 180).cos * bob.y
  return bob
end

on playsound pos, what, chan
  mem = member(string(what))
  ear = goody.pcam.transform.position
  if pos = 0 then
    pos = ear
  end if
  numvol = 200 - integer(float(pos.distanceTo(ear)) * 0.03)
  if numvol > 1 then
    if voidp(chan) then
      repeat with chan = 1 to 8
        if not soundBusy(chan) then
          puppetSound(chan, 0)
          sound(chan).play([#member: mem, #loopCount: 1])
          sound(chan).volume = numvol
          exit repeat
        end if
      end repeat
    else
      puppetSound(chan, 0)
      sound(chan).play([#member: mem, #loopCount: 1])
      sound(chan).volume = numvol
    end if
  end if
  return 1
end

on checkgoody
  if (the actorList).getOne(goody) then
    return 1
  end if
  return 0
end

on shady nshadname, nfixed
  if voidp(nfixed) then
    nfixed = 0
  end if
  if voidp(gmem.shader(nshadname)) then
    shadster = gmem.newShader(nshadname, #standard)
  else
    shadster = gmem.shader(nshadname)
  end if
  if nfixed then
    shadster.texture = texyfixed(nshadname)
  else
    shadster.texture = texy(nshadname)
  end if
  shadster.emissive = rgb(70, 70, 70)
  shadster.specular = rgb(0, 0, 0)
  return shadster
end

on texy ntexname
  vmem = member(ntexname, "textures")
  if vmem = VOID then
    alert(ntexname & " aint there...")
    return gmem.texture[1]
  else
    if voidp(gmem.texture(ntexname)) then
      tex = gmem.newTexture(ntexname, #fromCastMember, vmem)
    else
      tex = gmem.texture(ntexname)
      tex.member = vmem
    end if
    tex.renderFormat = #rgba8888
    return tex
  end if
end

on texyfixed ntexname
  vmem = member(ntexname, "textures")
  if vmem = VOID then
    alert(ntexname & " aint there...")
    return gmem.texture[1]
  else
    if voidp(gmem.texture(ntexname)) then
      tex = gmem.newTexture(ntexname, #fromCastMember, vmem)
    else
      tex = gmem.texture(ntexname)
    end if
    tex.renderFormat = #rgba8888
    return tex
  end if
end

on texyflash ntexname, nframe
  m = member(ntexname, "textures")
  vtemp = member(m.duplicate(), m.castLibNum)
  vtemp.posterFrame = nframe
  m.posterFrame = nframe
  i = vtemp.image.duplicate()
  vtemp.erase()
  m.unload()
  if voidp(gmem.texture(ntexname)) then
    tex = gmem.newTexture(ntexname, #fromImageObject, i)
  else
    tex = gmem.texture(ntexname)
    tex.image = i
  end if
  tex.renderFormat = #rgba8888
  return tex
end

on shadynormal nam, nstatic
  if voidp(nstatic) then
    nstatic = 0
  end if
  if voidp(gmem.shader(nam)) then
    sha = gmem.newShader(nam, #normalMap)
  else
    sha = gmem.shader(nam)
  end if
  if nstatic then
    sha.textureList[1] = texynormal(nam)
    sha.textureList[2] = texystatic(nam)
  else
    sha.textureList[1] = texynormal(nam)
    sha.textureList[2] = texy(nam)
  end if
  sha.specular = rgb(0, 0, 0)
  return sha
end

on texynormal nam
  vmem = member(nam, "textures")
  if not voidp(vmem) then
    if voidp(gmem.texture(nam & "-b")) then
      vimg = bumpMapToNormalMap(member(nam).image, 2)
      tex = gmem.newTexture(nam & "-b", #fromImageObject, vimg)
    else
      tex = gmem.texture(nam & "-b")
    end if
    return tex
  else
    alert(nam & " aint there...")
    return gmem.texture[1]
  end if
end

on buildnormalshader me, mapname
  vshader = gmem.newShader(mapname, #normalMap)
  vimg = bumpMapToNormalMap(member(mapname & "_b").image, 1000)
  vshader.textureList[1] = gmem.newTexture(mapname & "_b", #fromImageObject, vimg)
  vshader.textureList[2] = gmem.newTexture(mapname & "_d", #fromCastMember, member(mapname & "_d"))
  vshader.textureList[3] = gmem.newTexture(mapname & "_s", #fromCastMember, member(mapname & "_s"))
  return vshader
end

on AdditiveShader shd
  shd.blend = 0.0
  shd.blendFunctionList[1] = #blend
  shd.blendConstantList[1] = 0
  shd.textureList[3] = shd.textureList[1]
  shd.blendFunctionList[3] = #add
  if (_movie.active3dRenderer = #directX7_0) or (_movie.active3dRenderer = #directX9) then
    shd.textureList[2] = shd.textureList[1]
    shd.blendFunctionList[2] = #blend
    shd.blendConstantList[2] = 0
  end if
end

on closetome vpos, diam
  if not voidp(goody) then
    if goody.pos.distanceTo(vpos) < (diam * goody.bsp) then
      return 1
    end if
  end if
  return 0
end

on planemake me
  if voidp(gmem.modelResource("plane")) then
    nmr = gmem.newModelResource("plane", #plane, #front)
    nmr.width = 50
    nmr.length = 50
  else
    nmr = gmem.modelResource("plane")
  end if
  gmodinc = gmodinc + 1
  p = gmem.newModel("plane" & gmodinc, nmr)
  return p
end

on angtovec rotsend
  wtf = transform()
  wtf.scale = vector(1, 1, 1)
  wtf.position = vector(0, 0, 0)
  wtf.rotation = rotsend
  vnormal = wtf * vector(0, 1, 0)
  return vnormal
end

on vectoang vpos1, vpos2
  delta = vpos1 - vpos2
  if delta.magnitude > 0 then
    rad = atan(delta.x, delta.y)
    ang1 = rad / (PI / 180)
    leng = vector(delta.x, delta.y, 0).magnitude
    rad = atan(delta.z, leng)
    ang2 = rad / (PI / 180)
    return vector(ang2, 0, ang1)
  else
    return vector(0, 0, 0)
  end if
end

on multvectors nvec, nvec2
  nvec.x = nvec.x * nvec2.x
  nvec.y = nvec.y * nvec2.y
  nvec.z = nvec.z * nvec2.z
  return nvec
end

on startMovie me
  set the exitLock to 1
  gScreenDepth = _system.colorDepth
  gScreenRect = (the desktopRectList)[1]
  if the runMode = "Projector" then
    (the stage).rect = (the desktopRectList)[1]
    (the stage).drawRect = (the desktopRectList)[1]
  end if
  if (the moviePath contains "http://www.gamevial.com") or (the moviePath contains "http://gamevial.com") then
  else
    if the runMode <> "Author" then
      if the runMode <> "Projector" then
        gotoNetPage("http://www.gamevial.com", "_parent")
      end if
    end if
  end if
  member("datacal").text = EMPTY
  member("datastats").text = EMPTY
  member("datamytank").text = EMPTY
  member("dataweapons").text = EMPTY
  member("datame").text = EMPTY
  member("loggedin").text = EMPTY
  gsession = EMPTY
  gisloggedin = 0
end

on creq
  ifuckoff()
  resetall()
  go(1)
end

on stopMovie me
  creq()
  clearGlobals()
end

on exitgame me
  set the exitLock to 0
  if the runMode = "Projector" then
    gotoNetPage("http://www.gamevial.com/downloads.php?update=teamtanks&display", "_parent")
    _player.quit()
  end if
end

on storemodel ntype, nmod
  vid = ntype
  vmods = grecmods.getaProp(ntype)
  if vmods = 0 then
    grecmods.addProp(ntype, [nmod])
  else
    vmods.add(nmod)
    grecmods.setaProp(ntype, vmods)
  end if
  nmod.removeFromWorld()
end

on recyclemodel ntype
  vwrong = [#inplane, #plane, #rocket, #rocketx4, #nook, #shell, #guidedmissile, #mortar, #bigbomb, #rcbomb, #rcbombme, "p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8", "p9", #box, #health, #rcrocket, #rcbomb, #thrust, #mfmgun, #mfmgunx2, #mflasergun, #proximitymine, #remotemine, #mortar, #airship]
  bummer = vwrong.getOne(ntype)
  vmods = grecmods.getaProp(ntype)
  if vmods = 0 then
    grecmods.addProp(ntype, [])
    if bummer then
      return 0
    else
      gmodinc = gmodinc + 1
      vmod = gmem.newModel(string(ntype) & gmodinc, gmem.model(string(ntype)).resource)
    end if
  else
    if vmods.count = 0 then
      if bummer then
        return 0
      else
        gmodinc = gmodinc + 1
        vmod = gmem.newModel(string(ntype) & gmodinc, gmem.model(string(ntype)).resource)
      end if
    else
      vmod = vmods[1]
      vmods.deleteOne(vmod)
      grecmods.setaProp(ntype, vmods)
    end if
  end if
  vmod.removeFromWorld()
  vmod.addToWorld()
  return vmod
end

on storeshader nsha
  gshaders.add(nsha)
end

on recycleshader nam, nfixed
  if voidp(nfixed) then
    nfixed = 0
  end if
  if gshaders.count = 0 then
    sha = gmem.newShader("shad" & gmodinc, #standard)
    sha.emissive = rgb(255, 255, 255)
    sha.shininess = 0
    gmodinc = gmodinc + 1
  else
    sha = gshaders[1]
    gshaders.deleteAt(1)
  end if
  if nfixed then
    sha.texture = texyfixed(nam)
  else
    sha.texture = texy(nam)
  end if
  sha.textureTransform.scale = vector(1, 1, 1)
  sha.textureTransform.position = vector(0, 0, 0)
  return sha
end

on storetexture ntex
  gtextures.add(ntex)
end

on recycletexture nam
  vmem = member(nam, "textures")
  if not voidp(vmem) then
    if gtextures.count = 0 then
      gmodinc = gmodinc + 1
      tex = gmem.newTexture(nam & gmodinc, #fromCastMember, vmem)
    else
      tex = gtextures[1]
      gtextures.deleteAt(1)
      tex.member = member(nam)
    end if
    tex.renderFormat = #rgba8888
    tex.nearFiltering = 0
  else
  end if
  return tex
end

on recyclegroups
  if gworldgroups.count = 0 then
    gmodinc = gmodinc + 1
    vgroup = gmem.newGroup("wheelgroup" & gmodinc)
  else
    vgroup = gworldgroups[1]
    gworldgroups.deleteAt(1)
  end if
  return vgroup
end

on storegroup ngroup
  ngroup.removeFromWorld()
  gworldgroups.add(ngroup)
end

on updateprogress txt, nline
  if nline = 1 then
    member("progress").text = member("progress").text & RETURN & txt
  else
    if nline = 0 then
      member("progress").text = member("progress").text & txt
    end if
  end if
end
