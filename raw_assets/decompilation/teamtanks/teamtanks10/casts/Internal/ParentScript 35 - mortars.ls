property pos, speed, poldspeed, pmod, pdummy, hit, plifetime, pname, pteam
global gmem, ghvk, nom, goody, grockmods, gmodinc, gplayers

on new me, npos, nrot, nam, nteam, nid
  pteam = nteam
  pname = nam
  hit = 0
  rot = nrot
  pos = npos
  playsound(pos, "remortar", 7)
  speed = angtovec(rot)
  pos = pos + (speed * goody.bsp)
  speed = speed * 100
  pmod = recyclemodel(#mortar)
  if pmod = 0 then
    gmodinc = gmodinc + 1
    pmod = gmem.model("mortar").clone("mortar" & gmodinc)
    pmod.removeFromWorld()
    pmod.transform.position = pos
    pmod.transform.rotation = rot
    pmod.transform.scale = vector(1, 1, 1) * 2
    pdummy = ghvk.make_rb(pmod, #convexshape, #dynamic)
    if not voidp(goody.pdummy) then
      goody.pphysx.DisableCollision(goody.pdummy, pdummy)
      goody.pphysx.DisableCollision(goody.pwfl, pdummy)
      goody.pphysx.DisableCollision(goody.pwfr, pdummy)
      goody.pphysx.DisableCollision(goody.pwbl, pdummy)
      goody.pphysx.DisableCollision(goody.pwbr, pdummy)
    end if
    pdummy.mass = 1
    pdummy.friction = 0.40000000000000002
    pdummy.restitution = 0
  else
    pdummy = ghvk.pphysx.getRigidBody(pmod.name)
    pdummy.isPinned = 0
    pmod.transform.position = pos
    pmod.transform.rotation = rot
    pdummy.orientation = pmod.transform.axisAngle
  end if
  pmod.shaderList = shady(pteam & "rocket")
  pmod.addToWorld()
  pdummy.position = pos
  pdummy.angularVelocity = vector(0, 0, 0)
  plifetime = 1000
  pdummy.applyLinearImpulse(speed * 1)
  poldspeed = pdummy.linearVelocity
  pdummy.centerOfMass = vector(5, 20, 0)
  (the actorList).add(me)
  return me
end

on stepFrame me
  if not voidp(goody) then
    plifetime = plifetime - 1
    if plifetime < 997 then
      if pdummy.linearVelocity.distanceTo(poldspeed) > 5 then
        hit = 1
      end if
    end if
    pos = pdummy.position
    if (hit = 1) or (plifetime = 0) then
      hurt(me)
    end if
    poldspeed = pdummy.linearVelocity
  end if
end

on hurt me
  bang = script("bangs").new(pos, "mortar", pname)
  storemodel(#mortar, pmod)
  pdummy.position = vector(0, 0, -1000)
  pdummy.isPinned = 1
  (the actorList).deleteOne(me)
end

on die me
end

on hitobj me, collisiondetails
  hit = 1
end
