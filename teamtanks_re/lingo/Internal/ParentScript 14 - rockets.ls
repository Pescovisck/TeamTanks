property pos, speed, pmod, pdummy, hit, plifetime, pname, pteam, ptyp
global gmem, ghvk, nom, goody, grockmods, gmodinc, gplayers

on new me, npos, nrot, nam, nteam, nid, ntyp
  pteam = nteam
  pname = nam
  hit = 0
  rot = nrot
  pos = npos
  ptyp = ntyp
  speed = angtovec(rot)
  pos = pos + (speed * goody.bsp)
  speed = speed * 80
  pmod = recyclemodel(ntyp)
  if pmod = 0 then
    gmodinc = gmodinc + 1
    pmod = gmem.model(string(ptyp)).clone(string(ptyp) & gmodinc)
    pmod.removeFromWorld()
    pmod.transform.position = pos
    pmod.transform.rotation = rot
    pdummy = ghvk.make_rb(pmod, #convexshape, #dynamic)
    pdummy.mass = 100
    if not voidp(goody.pdummy) then
      goody.pphysx.DisableCollision(goody.pdummy, pdummy)
      goody.pphysx.DisableCollision(goody.pwfl, pdummy)
      goody.pphysx.DisableCollision(goody.pwfr, pdummy)
      goody.pphysx.DisableCollision(goody.pwbl, pdummy)
      goody.pphysx.DisableCollision(goody.pwbr, pdummy)
    end if
    pdummy.friction = 100
  else
    pdummy = ghvk.pphysx.getRigidBody(pmod.name)
    pdummy.isPinned = 0
    pmod.transform.position = pos
    pmod.transform.rotation = rot
    pdummy.orientation = pmod.transform.axisAngle
  end if
  if string(ptyp) = "rocketx4" then
    pmod.transform.scale = vector(1, 1, 1) * 4
    speed = speed * 0.40000000000000002
    playsound(pos, "reoffrock", 7)
  else
    pmod.transform.scale = vector(1, 1, 1) * 2
    playsound(pos, "rerocket2", 7)
  end if
  pmod.addToWorld()
  pdummy.position = pos
  pdummy.linearVelocity = speed
  pdummy.angularVelocity = vector(0, 0, 0)
  pmod.shaderList = shady(pteam & "rocket")
  plifetime = 0
  (the actorList).add(me)
  return me
end

on stepFrame me
  if not voidp(goody) then
    plifetime = plifetime + 1
    if (pdummy.linearVelocity.distanceTo(speed) > 10) and (plifetime > 5) then
      hit = 1
    end if
    if (pdummy.angularVelocity.magnitude > 1) and (plifetime > 5) then
      hit = 1
    end if
    pdummy.linearVelocity = speed
    pos = pdummy.position
    repeat with bad in gplayers
      if (bad.pos.distanceTo(pos) < goody.bsp) and (bad.pname <> pname) then
        hit = 1
        exit repeat
      end if
    end repeat
    puff(me, pos)
    if (hit = 1) or (plifetime > 200) or closetome(pos, 0.69999999999999996) then
      hurt(me)
    end if
  end if
end

on puff me, pos
  vp = script("puff").new(pmod.transform.position, ptyp)
end

on hurt me
  if string(ptyp) = "rocketx4" then
    bang = script("bangs").new(pos, "rocketx4", pname)
  else
    bang = script("bangs").new(pos, "rocket", pname)
  end if
  storemodel(ptyp, pmod)
  pdummy.position = vector(0, 0, -1000)
  pdummy.isPinned = 1
  (the actorList).deleteOne(me)
end

on die me
end
