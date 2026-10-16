property ptimer, pchoplist, ppartlist, pbloodsequence, pbloodtimes, plifetime, pshowblood
global gmem, ghvk, goody, gsmokes, gmodinc

on new me, npos, nrot, nvelo, nvang
  ppartlist = ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8", "p9"]
  pchoplist = []
  nshot = 4 + random(4)
  repeat with i = 1 to nshot
    ppartlist.deleteAt(random(ppartlist.count))
  end repeat
  repeat with i = 1 to ppartlist.count
    vmod = recyclemodel(ppartlist[i])
    if vmod = 0 then
      gmodinc = gmodinc + 1
      vmod = gmem.model(ppartlist[i]).clone(string(ppartlist[i]) & gmodinc)
      vmod.transform.position = npos
      vmod.transform.rotation = nrot
      vmod.transform.scale = vector(1, 1, 1) * 1.5
      vdummy = ghvk.make_rb(vmod, #convexshape, #dynamic)
      vdummy.mass = 8
      vdummy.friction = 2
      vdummy.restitution = 0.01
      vmod.shaderList = shady("porkchoptex")
    else
      vdummy = ghvk.pphysx.getRigidBody(vmod.name)
      vdummy.isPinned = 0
      vmod.transform.position = npos
      vmod.transform.rotation = nrot
      vdummy.orientation = vmod.transform.axisAngle
    end if
    pchoplist.add(vmod)
    vmod.addToWorld()
    vmod.parent = gsmokes
    vdummy.position = npos
    vdummy.linearVelocity = nvelo
    vdummy.angularVelocity = nvang
    vdaforce = random(200) - 100
    vdummy.applyLinearImpulse(vector(vdaforce, vdaforce, vdaforce * 2))
  end repeat
  plifetime = 200 + random(200)
  pbloodsequence = [[5, 20, 60], [10, 40, 50], [50], [10, 30, 60], [12], [1], [30], [10, 23], [5, 60], [10, 40]]
  pbloodtimes = pbloodsequence[random(pbloodsequence.count)]
  pshowblood = 0
  if npos.distanceTo(goody.pos) < 2000 then
    pshowblood = 1
  end if
  playsound(npos, "redeath_explosion")
  (the actorList).add(me)
  return me
end

on stepFrame me
  ptimer = ptimer + 1
  if pshowblood then
    if pbloodtimes.getOne(ptimer) then
      dosplat(me)
    end if
  end if
  if ptimer > plifetime then
    die(me)
  end if
end

on dosplat me
  nmod = pchoplist[random(pchoplist.count)]
  gsmokes.removeFromWorld()
  vshoot = gmem.modelsUnderRay(nmod.transform.position, vector(0.01, 0, -0.98999999999999999), 1, #detailed)
  if vshoot <> [] then
    bloodsplat = script("bloodsplat").new(vshoot[1].isectPosition, vshoot[1].isectNormal, 100 + random(500))
  end if
  gsmokes.addToWorld()
end

on die me
  repeat with i = 1 to pchoplist.count
    vdummy = ghvk.pphysx.getRigidBody(pchoplist[i].name)
    vdummy.position = vector(0, 0, -1000)
    vdummy.isPinned = 1
    storemodel(ppartlist[i], pchoplist[i])
  end repeat
  (the actorList).deleteOne(me)
end
