property pmod, pos, bangtime
global gmem, gsmokes, goody

on new me, npos
  pos = npos
  pmod = recyclemodel(#plane)
  if pmod = 0 then
    pmod = planemake()
  end if
  pmod.visibility = #back
  pmod.addToWorld()
  pmod.shaderList = recycleshader("stealth_sparkle")
  pmod.transform.position = pos
  ppower = 15
  pmod.transform.scale = vector(1, 1, 1) * 3 * 1.30000000000000004
  pmod.shader.emissive = rgb(255, 255, 255)
  pmod.shader.blend = 0
  pmod.shader.textureTransform.scale = vector(4, 4, 4)
  pmod.shader.textureTransform.position = vector(0, -3, 0)
  pmod.shader.blend = 80
  bangtime = 1
  pmod.addToWorld()
  pmod.parent = gsmokes
  (the actorList).add(me)
  return me
end

on stepFrame me
  if not voidp(goody) then
    pmod.transform.rotation = goody.pcam.transform.rotation
  end if
  bangtime = bangtime + 1
  pmod.shader.textureTransform.position.x = pmod.shader.textureTransform.position.x - 1
  if pmod.shader.textureTransform.position.x = -4 then
    pmod.shader.textureTransform.position.x = 0
    pmod.shader.textureTransform.position.y = pmod.shader.textureTransform.position.y + 1
  end if
  pmod.shader.blend = 100 - (bangtime * 6)
  if bangtime = 16 then
    storemodel(#plane, pmod)
    storeshader(pmod.shader)
    (the actorList).deleteOne(me)
  end if
end
