property pos, speed, bsp, pmod, pdummy, howlong, pname, pteam
global gmem, ghvk, goody, gmodinc

on new me, npos, nrot, nam, nteam, nid
  pteam = nteam
  pname = nam
  rot = nrot
  pos = npos
  playsound(pos, "regrenade", 7)
  howlong = 90
  speed = angtovec(rot) * 50
  pmod = recyclemodel(#nook)
  if pmod = 0 then
    gmodinc = gmodinc + 1
    pmod = gmem.model("nook").clone("nook" & gmodinc)
    pmod.removeFromWorld()
    pmod.transform.position = pos
    pmod.transform.rotation = rot
    pdummy = ghvk.make_rb(pmod, #convexshape, #dynamic)
    pdummy.mass = 100
    pdummy.friction = 1
    if not voidp(goody.pdummy) then
      goody.pphysx.DisableCollision(goody.pdummy, pdummy)
      goody.pphysx.DisableCollision(goody.pwfl, pdummy)
      goody.pphysx.DisableCollision(goody.pwfr, pdummy)
      goody.pphysx.DisableCollision(goody.pwbl, pdummy)
      goody.pphysx.DisableCollision(goody.pwbr, pdummy)
    end if
  else
    pdummy = ghvk.pphysx.getRigidBody(pmod.name)
    pdummy.isPinned = 0
    pmod.transform.position = pos
    pmod.transform.rotation = rot
    pdummy.orientation = pmod.transform.axisAngle
  end if
  pmod.shaderList = shady(pteam & "nook")
  pmod.addToWorld()
  pdummy.position = pos
  pdummy.angularVelocity = vector(0, 0, 0)
  pdummy.linearVelocity = speed
  pdummy.sleepMode = #linearVelocity
  pdummy.sleepThreshold = 10
  (the actorList).add(me)
  return me
end

on stepFrame me
  if pdummy.linearVelocity.distanceTo(speed) > 20 then
    pdummy.linearVelocity = pdummy.linearVelocity * 0.5
  end if
  speed = pdummy.linearVelocity
  howlong = howlong - 1
  pos = pmod.transform.position
  if howlong > 1 then
  else
    hurt(me)
  end if
end

on hurt me
  bang = script("bangs").new(pos, "nook", pname)
  storemodel(#nook, pmod)
  pdummy.position = vector(0, 0, -1000)
  pdummy.isPinned = 1
  (the actorList).deleteOne(me)
end
