property pmod, pos, bangtime
global gmem, goody, gplayers, gsmokes

on new me, npos
  pmod = recyclemodel(#plane)
  if pmod = 0 then
    pmod = planemake()
  end if
  pmod.visibility = #back
  pmod.transform.scale = vector(1, 1, 1) * 2
  pmod.shaderList = shady("tblood")
  pmod.shader.texture.nearFiltering = 1
  pmod.shader.texture.renderFormat = #rgba8888
  pmod.shader.emissive = rgb(255, 255, 255)
  pmod.shader.blend = 100
  pmod.shader.textureTransform.scale = vector(2, 2, 2)
  vxqwe = random(2) - 1
  vyqwe = random(2) - 1
  pmod.shader.textureTransform.position = vector(vxqwe, -vyqwe, 0)
  pos = npos
  pmod.transform.position = pos
  bangtime = 3
  pmod.parent = gsmokes
  (the actorList).add(me)
  return me
end

on stepFrame me
  if not voidp(goody) then
    pmod.transform.rotation = goody.pcam.transform.rotation
    if bangtime < 1 then
      storemodel(#plane, pmod)
      (the actorList).deleteOne(me)
    end if
    bangtime = bangtime - 1
  end if
end

on hurt me
end
