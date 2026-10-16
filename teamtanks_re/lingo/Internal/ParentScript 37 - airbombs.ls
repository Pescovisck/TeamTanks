property pos, pmod, pdummy, hit, plifetime, poldspeed, pname, pteam, pid
global gmem, ghvk, goody, gmodinc

on new me, npos, nam, nteam, nid
  pteam = nteam
  pname = nam
  hit = 0
  pos = npos
  pmod = recyclemodel(#bigbomb)
  if pmod = 0 then
    gmodinc = gmodinc + 1
    pmod = gmem.model("bigbomb").clone("bigbomb" & gmodinc)
    pmod.removeFromWorld()
    pmod.transform.position = pos
    pmod.transform.rotation = vector(-90, 0, 0)
    pmod.transform.scale = vector(1, 1, 1) * 1
    pdummy = ghvk.make_rb(pmod, #convexshape, #dynamic)
    pdummy.mass = 100
  else
    pdummy = ghvk.pphysx.getRigidBody(pmod.name)
    pdummy.isPinned = 0
    pmod.transform.position = pos
    pmod.transform.rotation = vector(-90, 0, 0)
    pdummy.orientation = pmod.transform.axisAngle
  end if
  pmod.shaderList = shady(pteam & "bombtex")
  pmod.addToWorld()
  pdummy.position = pos
  pdummy.angularVelocity = vector(0, 0, 0)
  poldspeed = pdummy.linearVelocity
  plifetime = 100
  playsound(pos, "bombwhistle")
  (the actorList).add(me)
  return me
end

on stepFrame me
  if not voidp(goody) then
    plifetime = plifetime - 1
    if plifetime < 97 then
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
  bang = script("bangs").new(pos, "airstrike", pname)
  storemodel(#bigbomb, pmod)
  pdummy.position = vector(0, 0, -1000)
  pdummy.isPinned = 1
  (the actorList).deleteOne(me)
end

on die me
end

on hitobj me, collisiondetails
  hit = 1
end
