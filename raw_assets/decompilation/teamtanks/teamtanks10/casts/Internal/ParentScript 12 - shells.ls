property pos, speed, pmod, pdummy, hit, plifetime, pname, pteam
global gmem, ghvk, nom, goody, grockmods, gmodinc, gplayers

on new me, npos, nrot, nam, nteam, nid
  pteam = nteam
  pname = nam
  hit = 0
  rot = nrot
  pos = npos
  playsound(pos, "rebgun", 7)
  speed = angtovec(rot)
  pos = pos + (speed * goody.bsp)
  speed = speed * 171
  pmod = recyclemodel(#shell)
  if pmod = 0 then
    gmodinc = gmodinc + 1
    pmod = gmem.model("shell").clone("shell" & gmodinc)
    pmod.removeFromWorld()
    pmod.transform.position = pos
    pmod.transform.rotation = rot
    pmod.transform.scale = vector(1, 1, 1) * 4
    pdummy = ghvk.make_rb(pmod, #convexshape, #dynamic)
    if not voidp(goody.pdummy) then
      goody.pphysx.DisableCollision(goody.pdummy, pdummy)
      goody.pphysx.DisableCollision(goody.pwfl, pdummy)
      goody.pphysx.DisableCollision(goody.pwfr, pdummy)
      goody.pphysx.DisableCollision(goody.pwbl, pdummy)
      goody.pphysx.DisableCollision(goody.pwbr, pdummy)
    end if
    pdummy.mass = 100
  else
    pdummy = ghvk.pphysx.getRigidBody(pmod.name)
    pdummy.isPinned = 0
    pmod.transform.position = pos
    pmod.transform.rotation = rot
    pdummy.orientation = pmod.transform.axisAngle
  end if
  pmod.shaderList = shady(pteam & "shell")
  pmod.addToWorld()
  pdummy.position = pos
  pdummy.linearVelocity = speed
  pdummy.angularVelocity = vector(0, 0, 0)
  plifetime = 100
  (the actorList).add(me)
  return me
end

on stepFrame me
  if not voidp(goody) then
    plifetime = plifetime - 1
    if pdummy.linearVelocity.distanceTo(speed) > 20 then
      hit = 1
    end if
    pdummy.linearVelocity = speed
    pos = pdummy.position
    repeat with bad in gplayers
      if (bad.pos.distanceTo(pos) < (goody.bsp * 1)) and (bad.pname <> pname) then
        hit = 1
        exit repeat
      end if
    end repeat
    if (hit = 1) or (plifetime = 0) or closetome(pos, 0.69999999999999996) then
      hurt(me)
    end if
  end if
end

on hurt me
  bang = script("bangs").new(pos, "bgun", pname)
  storemodel(#shell, pmod)
  pdummy.position = vector(0, 0, -1000)
  pdummy.isPinned = 1
  (the actorList).deleteOne(me)
end

on die me
end

on hitobj me, collisiondetails
  hit = 1
end
