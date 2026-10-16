property pos, pSpeed, pendpos, puffin, pname, pid, pwhogotit, plifetime, pteam, pdummy, pmod
global gmem, goody, gplayers, ghvk, gmodinc

on new me, nspos, nepos, nwhogotit, nam, nid, nteam
  if nwhogotit = goody.pname then
    pwhogotit = goody
    nepos = goody.pos
    if goody.pmissilelock.count = 0 then
      goody.feedback("Alert!! Missile Lock")
      playsound(goody.pos, "remissilelock")
    end if
    goody.pmissilelock.add(me)
  else
    repeat with vbad in gplayers
      if vbad.pname = nwhogotit then
        pwhogotit = vbad
        nepos = pwhogotit.pos
        exit repeat
        next repeat
      end if
      pwhogotit = "none"
    end repeat
  end if
  pendpos = nepos
  pid = nid
  pname = nam
  pos = nspos
  pteam = nteam
  pmod = recyclemodel(#guidedmissile)
  vtarang = -vectoang(pos, pendpos)
  vt = transform()
  vt.rotation = vtarang
  if pmod = 0 then
    gmodinc = gmodinc + 1
    pmod = gmem.model("guidedmissile").clone("guidedmissile" & gmodinc)
    pmod.removeFromWorld()
    pmod.transform.position = pos
    pmod.transform.rotation = vtarang
    pmod.transform.scale = vector(1, 1, 1) * 1
    pdummy = ghvk.make_rb(pmod, #convexshape, #dynamic)
    pdummy.mass = 0
    if not voidp(goody.pdummy) then
      goody.pphysx.DisableCollision(goody.pdummy, pdummy)
      goody.pphysx.DisableCollision(goody.pwfl, pdummy)
      goody.pphysx.DisableCollision(goody.pwfr, pdummy)
      goody.pphysx.DisableCollision(goody.pwbl, pdummy)
      goody.pphysx.DisableCollision(goody.pwbr, pdummy)
    end if
    pdummy.friction = 1
  else
    pdummy = ghvk.pphysx.getRigidBody(pmod.name)
    pdummy.isPinned = 0
    pmod.transform.position = pos
    pmod.transform.rotation = vtarang
    pdummy.orientation = pmod.transform.axisAngle
  end if
  pmod.addToWorld()
  pdummy.orientation = vt.axisAngle
  pdummy.position = nspos
  pdummy.angularVelocity = vector(0, 0, 0)
  pdummy.linearVelocity = vector(0, 0, 0)
  pmod.shaderList = shady(pteam & "rocket")
  plifetime = 0
  puffin = 1
  playsound(pos, "reoffrock", 7)
  (the actorList).add(me)
end

on stepFrame me
  if not checkgoody() then
    die(me)
  else
    if plifetime > 750 then
      die(me)
    else
      pSpeed = pdummy.linearVelocity
      if (gplayers.getOne(pwhogotit) <> 0) or (goody = pwhogotit) then
        pendpos = pwhogotit.pos
        if pwhogotit.pos.distanceTo(pdummy.position) < (goody.bsp * 1.60000000000000009) then
          die(me)
        end if
      else
        if pwhogotit = "none" then
        else
          die(me)
        end if
      end if
      puff(me, pdummy.position)
      vtarang = -vectoang(pdummy.position, pendpos)
      vt = transform()
      vt.rotation = vtarang + vector(0, 0, -180)
      pdummy.orientation = vt.axisAngle
      pdummy.linearVelocity = (angtovec(vtarang + vector(0, 0, 180)) * 25) + vector(0, 0, 1)
      if plifetime > 10 then
        if pdummy.linearVelocity.distanceTo(pSpeed) > 20 then
          die(me)
        end if
      end if
      plifetime = plifetime + 1
    end if
  end if
end

on puff me, npos
  puffin = not puffin
  if puffin = 1 then
    vp = script("puff").new(npos, "rocket")
  end if
end

on die me
  vget = goody.pmissilelock.getOne(me)
  if vget <> 0 then
    goody.pmissilelock.deleteAt(vget)
    if (goody.pmissilelock.count = 0) and (goody.pstate = "play") then
      goody.feedback("Missile Lock Clear")
    end if
  end if
  bang = script("bangs").new(pdummy.position, "guidedmissile", pname)
  storemodel(#guidedmissile, pmod)
  pdummy.position = vector(0, 0, -1000)
  pdummy.isPinned = 1
  (the actorList).deleteOne(me)
end
