property pmod, pos, bangtime
global gmem, goody, gsmokes

on new me, npos, nnor
  pmod = recyclemodel(#plane)
  if pmod = 0 then
    pmod = planemake()
  end if
  pmod.visibility = #front
  pmod.transform.scale = vector(1, 1, 1) * 2
  vs = shady("decal")
  pmod.shaderList = vs
  vs.texture.nearFiltering = 1
  vs.texture.renderFormat = #rgba8888
  vs.blend = 70
  vs.textureTransform.scale = vector(1, 1, 1)
  vs.textureTransform.position = vector(0, 0, 0)
  oldpos = npos
  pmod.transform.position = oldpos + nnor
  pmod.pointAt(oldpos)
  pmod.rotate(vector(180, 0, 0), #self)
  bangtime = 80
  pmod.parent = gsmokes
  (the actorList).add(me)
  return me
end

on stepFrame me
  pmod.addToWorld()
  if bangtime = 0 then
    storemodel(#plane, pmod)
    (the actorList).deleteOne(me)
  end if
  bangtime = bangtime - 1
end

on hurt me
end
