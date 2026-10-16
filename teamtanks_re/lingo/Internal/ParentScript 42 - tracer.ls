property pmod, pSpeed, pos, pendpos
global gmem, gmodinc, gsmokes, goody

on new me, npos, nrot, ntyp, ndest
  pos = npos
  if voidp(ndest) then
    pendpos = npos + (angtovec(nrot) * 1000)
  else
    pendpos = ndest
  end if
  pSpeed = pendpos - pos
  pSpeed.normalize()
  pmod = recyclemodel(#box)
  if pmod = 0 then
    if voidp(gmem.modelResource("box")) then
      nmr = gmem.newModelResource("box", #box)
      nmr.width = 0.5
      nmr.length = 0.5
      nmr.height = 240
    else
      nmr = gmem.modelResource("box")
    end if
    gmodinc = gmodinc + 1
    pmod = gmem.newModel("box" & gmodinc, nmr)
  end if
  if string(ntyp) = "lasergun" then
    pmod.shaderList = shady("tracerlaser")
    pmod.shader.diffuse = rgb(5, 255, 45)
    pmod.shader.emissive = rgb(5, 255, 45)
    pmod.transform.scale.z = 3
    pos = pos + (pSpeed * 110)
    pSpeed = pSpeed * 300
  else
    pmod.shaderList = shady("tracergun")
    pmod.shader.diffuse = rgb(255, 255, 245)
    pmod.shader.emissive = rgb(255, 225, 240)
    pmod.transform.scale.z = 0.40000000000000002
    pos = pos + (pSpeed * 40)
    pSpeed = pSpeed * 100
  end if
  pmod.shader.blend = 90
  pmod.pointAtOrientation = [vector(0, -1, 0), vector(0, 0, 1)]
  pmod.transform.position = pos - (pSpeed * 0.001)
  pmod.pointAt(pos)
  pmod.parent = gsmokes
  (the actorList).add(me)
  return me
end

on stepFrame me
  if not checkgoody() then
    Remove(me)
  else
    pos = pos + pSpeed
    pmod.transform.position = pos
    if pos.distanceTo(pendpos) < pSpeed.magnitude then
      pos = pendpos
      Remove(me)
    end if
  end if
end

on Remove me
  storemodel(#box, pmod)
  (the actorList).deleteOne(me)
end
