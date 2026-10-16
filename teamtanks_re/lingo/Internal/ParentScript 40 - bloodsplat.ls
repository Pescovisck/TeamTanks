property pmod, bangtime, pshad, pblend, pemissive
global gmem, goody, gplanemods, gsmokes

on new me, npos, nnor, nscale
  pmod = recyclemodel(#plane)
  if pmod = 0 then
    pmod = planemake()
  end if
  pmod.visibility = #front
  pmod.transform.scale = vector(1.39999999999999991, 1.39999999999999991, 1.39999999999999991) + (vector(1, 1, 1) * (nscale * 0.005))
  pshad = recycleshader("oilsplats")
  pmod.shader = pshad
  pmod.shader.texture.nearFiltering = 1
  pmod.shader.texture.renderFormat = #rgba8888
  pemissive = 40
  pshad.emissive = rgb(pemissive, pemissive, pemissive)
  pblend = 100 * (1 - (nscale / 500))
  vxqwe = random(3) - 1
  vyqwe = random(3) - 1
  pmod.shader.textureTransform.position = vector(vxqwe, -vyqwe, 0)
  pmod.shader.textureTransform.scale = vector(3, 3, 3)
  oldpos = npos
  pmod.transform.position = oldpos + nnor
  pmod.pointAt(oldpos)
  pmod.rotate(180, 0, 90, #self)
  pmod.parent = gsmokes
  (the actorList).add(me)
  return me
end

on stepFrame me
  if not voidp(goody) then
    pemissive = pemissive + ((255 - pemissive) * 0.01)
    pblend = pblend - 0.20000000000000001
    pshad.emissive = rgb(pemissive, pemissive, pemissive)
    pshad.blend = pblend
    if integer(pblend < 1) then
      storemodel(#plane, pmod)
      storeshader(pmod.shader)
      (the actorList).deleteOne(me)
    end if
    bangtime = bangtime - 1
  end if
end

on hurt me
end
